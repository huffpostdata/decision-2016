#!/usr/bin/env node

'use strict'

const debug = require('debug')('index')
const d3_geo = require('d3-geo')
const fs = require('fs')
const shpjs = require('shpjs')
const topojson = require('topojson')

const Accuracy = 2
const Width = 647 * Accuracy
const Height = 400 * Accuracy

function loadGeojson(key) {
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
      // Icky "filters" are because albersUsa() misses some TIGER2016 Hawaii
      // We'll assume those islands aren't, erm, important. That's probably okay
      // because this map is small-scale.
      coordinates = geom.coordinates
        .map(polygon => {
          return polygon.map(line => {
            return line.map(projection).filter(p => p !== null)
          }).filter(line => line.length > 0)
        }).filter(polygon => polygon.length > 0)
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
debug('Loading states')
const states = loadGeojson('states')
states.features = states.features
  .filter(f => [ 'PR', 'GU', 'MP', 'VI', 'AS' ].indexOf(f.properties.STUSPS) === -1)

const projection = d3_geo.geoAlbersUsa()
const AlbersUsaUnderscaling = 0.9 // D3's AlbersUsa is too small
const AlbersUsaXError = -0.08 // D3's AlbersUsa shifts too far left
projection.scale(projection.scale() * Width / projection.translate()[0] / 2 / AlbersUsaUnderscaling)
projection.translate([ Width / 2 * (1 - AlbersUsaXError), Height / 2 ])

states.features = states.features.map(f => projectGeometry(f, projection))

debug('Building topology')
const topo = topojson.topology({ states: states},{//, districts: districts }, {
  quantization: Width,
  id: d => d.properties.STUSPS,
  verbose: true
})
//topojson.simplify(topo, {
//  'retain-proportion': 0.75,
//  'coordinate-system': 'cartesian',
//  verbose: true
//})
topojson.filter(topo, { 'coordinate-system': 'cartesian', verbose: true })

debug('Processing')

const stateFeatures = topojson.feature(topo, topo.objects.states)
const stateMesh = topojson.feature(topo, topo.objects.states)

debug('Generating SVG')

const out = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="', Width, '" height="', Height, '" viewBox="0 0 ', Width, ' ', Height, '">',
  '<g class="states">'
]

function geometryToDSink() {
  let lastX = 0
  let lastY = 0
  let mustMove = true
  let out = []

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
      const dx = x - lastX
      const dy = y - lastY
      if (dx !== 0 && dy !== 0) {
        const op = mustMove ? 'M' : 'l'
        out.push(op + dx + ',' + dy)
        lastX = x
        lastY = y
      }
      mustMove = false
    },

    lineEnd() {
      out.push('Z')
      lastX = lastY = 0 // because we don't know where we are; need an M next
      mustMove = true
    }
  }
}

function geometryToD(geometry) {
  const sink = geometryToDSink()
  d3_geo.geoStream(geometry, sink)
  return sink.d()
}

const path = d3_geo.geoPath()
stateFeatures.features.forEach(feature => {
  out.push('<path description="' + feature.id + '" d="' + geometryToD(feature.geometry) + '"/>')
})
out.push('<path description="mesh" d="' + geometryToD(stateMesh) + '"/>')

out.push('</g>') // g.states
out.push('</svg>')

const outFile = `${__dirname}/../../assets/maps/usa.svg`
debug(`Writing to ${outFile}`)
fs.writeFileSync(outFile, out.join(''))
