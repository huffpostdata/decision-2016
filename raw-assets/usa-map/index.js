#!/usr/bin/env node

'use strict'

const debug = require('debug')('index')
const d3_geo = require('d3-geo')
const fs = require('fs')
const shpjs = require('shpjs')
const topojson = require('topojson')
const PresidentCartogramData = require('../../assets/javascripts/common/_cartogramData')

const Accuracy = 2
const Width = 647 * Accuracy
const Height = 400 * Accuracy

function loadStatesGeojson() {
  debug('Loading states')
  const shp = fs.readFileSync(`${__dirname}/input/statesp010g.shp`).buffer
  const dbf = fs.readFileSync(`${__dirname}/input/statesp010g.dbf`).buffer
  return shpjs.combine([ shpjs.parseShp(shp), shpjs.parseDbf(dbf) ])
}

function loadGeojson(key, callback) {
  const KeyToFilename = {
    districts: 'tl_2016_us_cd115.zip',
    states: 'tl_2016_us_state.zip'
  }
  const filename = KeyToFilename[key]
  if (!filename) throw new Error(`No such key ${key}; must be one of ${Object.keys(KeyToFilename).join(', ')}`)

  const zipData = fs.readFileSync(`${__dirname}/input/${filename}`)
  return shpjs.parseZip(zipData)
}

function projectGeometry(geom, projection) {
  let coordinates

  switch (geom.type) {
    case 'Point':
      return { type: geom.type, coordinates: projection(geom.coordinates) }
    case 'MultiPoint':
    case 'LineString':
      return { type: geom.type, coordinates: geom.coordinates.map(projection) }
    case 'MultiLineString':
    case 'Polygon':
      coordinates = geom.coordinates.map(c => c.map(projection))
      if (coordinates[0][0] === null) throw new Error(`NULL?`)
      return { type: geom.type, coordinates: coordinates }
    case 'MultiPolygon':
      coordinates = geom.coordinates
        .map(polygon => {
          return polygon.map(line => {
            return line.map(projection)
          })
        })
      return { type: geom.type, coordinates: coordinates }
    case 'GeometryCollection':
      // recurse
      return { type: geom.type, geometries: geom.geometries.map(g => projectGeometry(g, projection)) }
    case 'Feature':
      const ret = { type: geom.type, geometry: projectGeometry(geom.geometry, projection), properties: geom.properties }
      if (geom.hasOwnProperty('id')) ret.id = geom.id
      return ret
    case 'FeatureCollection':
      return { type: geom.type, features: geom.features.map(f => projectGeometry(f, projection)) }
    default:
      throw new Error(`Unknown geometry type ${geom.type}`)
  }
}

//debug('Loading districts')
//const districts = loadGeojson('districts')

const projection = d3_geo.geoAlbersUsa()
const AlbersUsaUnderscaling = 0.9 // D3's AlbersUsa is too small
const AlbersUsaXError = -0.08 // D3's AlbersUsa shifts too far left
projection.scale(projection.scale() * Width / projection.translate()[0] / 2 / AlbersUsaUnderscaling)
projection.translate([ Width / 2 * (1 - AlbersUsaXError), Height / 2 ])

function quantizeAndMeshFeatureCollection(featureCollection) {
  debug('Building topology')
  const topo = topojson.topology({ features: featureCollection }, {
    quantization: Width,
    id: d => d.properties.STATE_ABBR,
    verbose: true
  })
  topojson.simplify(topo, {
    'minimum-area': 4 * Accuracy * Accuracy,
    'coordinate-system': 'cartesian',
    verbose: true
  })
  topojson.filter(topo, { 'coordinate-system': 'cartesian', verbose: true })

  debug('De-topojson-izing')
  const features2 = topojson.feature(topo, topo.objects.features)
  const mesh = topojson.feature(topo, topo.objects.features)

  return { features: features2, mesh: mesh }
}

function calculateStatesGeodata() {
  debug('Calculating State geodata')
  const states = loadStatesGeojson()
  states.features = states.features
    .filter(f => f.properties.TYPE === 'Land')
    .filter(f => [ 'PR', 'GU', 'MP', 'VI', 'AS' ].indexOf(f.properties.STATE_ABBR) === -1)
    .map(f => projectGeometry(f, projection))
  return quantizeAndMeshFeatureCollection(states)
}

function geometryToDSink() {
  let lastX = 0
  let lastY = 0
  let mustMove = true
  let out = []

  // Store the current "slope". This lets us compress multiple "l" operations.
  let lastDx = null
  let lastDy = null

  function outputLine(dx, dy) {
    if (dy === 0) {
      out.push('h' + dx)
    } else if (dx === 0) {
      out.push('v' + dy)
    } else {
      out.push('l' + dx + ',' + dy)
    }
  }

  return {
    d() {
      return out.join('')
    },

    polygonStart() {},
    polygonEnd() {},
    lineStart() {},

    point(x, y) {
      x = Math.round(x)
      y = Math.round(y)

      if (mustMove) {
        out.push('M' + x + ',' + y)
      } else {
        const dx = x - lastX
        const dy = y - lastY

        // Is this line parallel and in the same direction as the last line?
        // If so, we can merge the two to save bytes.
        // Test that "dx/dy = lastDx/lastDy" ==> "dx * lastDy = dy * lastDx"
        // Also test the vectors don't go in opposite directions.
        const canMerge = (lastDx !== null) && (dx * lastDy === dy * lastDx) && (dx * lastDx >= 0) && (dy * lastDy >= 0)

        if (canMerge) {
          // Don't output a line.
          lastDx += dx
          lastDy += dy
        } else {
          // Output the _previous_ point's line and start gathering this one
          if (lastDx !== null) outputLine(lastDx, lastDy)
          lastDx = dx
          lastDy = dy
        }
      }
      lastX = x
      lastY = y
      mustMove = false
    },

    lineEnd() {
      outputLine(lastDx, lastDy)
      out.push('Z')
      lastX = lastY = null // because we don't know where we are; need an M next
      lastDx = lastDy = null
      mustMove = true
    }
  }
}

function geometryToD(geometry) {
  const sink = geometryToDSink()
  d3_geo.geoStream(geometry, sink)
  return sink.d()
}

function featureCollectionToSvgPaths(featureCollection) {
  return featureCollection.features.map(feature => {
    return '<path class="' + feature.id + '" d="' + geometryToD(feature.geometry) + '"/>'
  }).join('')
}

function squareD(axy) {
  const x0 = axy.x * Accuracy
  const y0 = axy.y * Accuracy
  const s = Math.round(Math.sqrt(axy.a) * Accuracy * 15)

  return [ 'M', x0, ',', y0, 'h', s, 'v', s, 'h', -s, 'Z' ].join('')
}

function stateSquaresToSvgPaths(stateSquares) {
  return Object.keys(stateSquares)
    .map(stateCode => '<path class="' + stateCode + '" d="' + squareD(stateSquares[stateCode]) + '"/>')
    .join('')
}

debug('Generating SVG')

const states = calculateStatesGeodata()

const out = [
  '<?xml version="1.0"?>',
  '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
  '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="', Width, '" height="', Height, '" viewBox="0 0 ', Width, ' ', Height, '">',
    '<g class="states">',
      featureCollectionToSvgPaths(states.features),
      '<path class="mesh" d="', geometryToD(states.mesh), '"/>',
    '</g>',
    '<g class="president-cartogram">',
      stateSquaresToSvgPaths(PresidentCartogramData),
    '</g>',
  '</svg>'
].join('')

const outBuffer = Buffer.from(out, 'utf8')

const outFile = `${__dirname}/../../assets/maps/usa.svg`
debug(`Writing to ${outFile} (${outBuffer.length} bytes)`)
fs.writeFileSync(outFile, outBuffer)
