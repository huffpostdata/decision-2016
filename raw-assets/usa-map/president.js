#!/usr/bin/env node

'use strict'

const Canvas = require('canvas')
const debug = require('debug')('president')
const d3_geo = require('d3-geo')
const fs = require('fs')
const dims = require('./lib/dims')
const quantizeAndMesh = require('./lib/quantizeAndMesh')
const makeGeojsonValid = require('./lib/makeGeojsonValid')
const projectGeojson = require('./lib/projectGeojson')
const defaultProjection = require('./lib/defaultProjection')
const shpjs = require('shpjs')
const PresidentCartogramData = require('../../assets/javascripts/common/_cartogramData')

function loadStatesGeojson() {
  debug('Loading states')
  const shp = fs.readFileSync(`${__dirname}/input/statesp010g.shp`).buffer
  const dbf = fs.readFileSync(`${__dirname}/input/statesp010g.dbf`).buffer
  const geojson = shpjs.combine([ shpjs.parseShp(shp), shpjs.parseDbf(dbf) ])
  const validGeojson = makeGeojsonValid(geojson)
  return validGeojson
}

function calculateStatesGeodata() {
  debug('Calculating State geodata')
  const states = loadStatesGeojson()
  states.features = states.features
    .filter(f => f.properties.TYPE === 'Land')
    .filter(f => [ 'PR', 'GU', 'MP', 'VI', 'AS' ].indexOf(f.properties.STATE_ABBR) === -1)
    .map(f => projectGeojson(f, defaultProjection))
  return quantizeAndMesh(states)
}

function geometryToDSink() {
  const out = []

  let inPolygon = false
  let mustMove = true
  let lastX = null
  let lastY = null
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

    polygonStart() { inPolygon = true },
    polygonEnd() { inPolygon = false },
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
      if (inPolygon) out.push('Z')
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
  const x0 = axy.x * dims.Accuracy
  const y0 = axy.y * dims.Accuracy
  const s = Math.round(Math.sqrt(axy.a) * dims.Accuracy * 15)

  return [ 'M', x0, ',', y0, 'h', s, 'v', s, 'h', -s, 'Z' ].join('')
}

function stateSquaresToSvgPaths(stateSquares) {
  return Object.keys(stateSquares)
    .map(stateCode => '<path class="' + stateCode + '" d="' + squareD(stateSquares[stateCode]) + '"/>')
    .join('')
}

function writePresidentSvg() {
  debug('Generating president SVG')

  const out = [
    '<?xml version="1.0"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="', dims.Width, '" height="', dims.Height, '" viewBox="0 0 ', dims.Width, ' ', dims.Height, '">',
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
}

function drawGeometry(ctx, geom) {
  switch (geom.type) {
    case 'Polygon':
      geom.coordinates.forEach(points => {
        ctx.moveTo(points[0][0], points[0][1])
        points.slice(1).forEach(pt => {
          ctx.lineTo(pt[0], pt[1])
        })
        ctx.closePath()
      })
      break
    case 'MultiPolygon':
      geom.coordinates.forEach(c => drawGeometry(ctx, { type: 'Polygon', coordinates: c }))
      break
    case 'Feature':
      drawGeometry(ctx, geom.geometry)
      break
    case 'FeatureCollection':
      geom.features.forEach(f => drawGeometry(ctx, f))
      break
    default:
      throw new Error(`Unknown geometry: ${JSON.stringify(geom)}`)
  }
}

function writePresidentThumbnails(states) {
  debug('Generating president thumbnail PNGs')

  const canvas = new Canvas(dims.Width, dims.Height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'black'
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.beginPath()
  drawGeometry(ctx, states.features)
  ctx.fill()
  ctx.stroke()

  const thumbWidth = Math.ceil(dims.Width / dims.Accuracy / 2)
  const thumbHeight = Math.ceil(dims.Height / dims.Accuracy / 2)

  const canvas2 = new Canvas(thumbWidth, thumbHeight)
  const ctx2 = canvas2.getContext('2d')
  ctx2.drawImage(canvas, 0, 0, dims.Width, dims.Height, 0, 0, thumbWidth, thumbHeight)

  const buf = canvas2.toBuffer()
  fs.writeFileSync(`${__dirname}/../../assets/maps/president-usa-thumbnail.png`, buf)

  ctx2.clearRect(0, 0, thumbWidth, thumbHeight)
  ctx2.fillStyle = 'black'
  ctx2.beginPath()
  Object.keys(PresidentCartogramData).forEach(stateCode => {
    const square = PresidentCartogramData[stateCode]
    const s = Math.sqrt(square.a) * 15 / 2
    ctx2.rect(square.x / 2, square.y / 2, s, s)
  })
  ctx2.fill()

  const buf2 = canvas2.toBuffer()
  fs.writeFileSync(`${__dirname}/../../assets/maps/president-cartogram-thumbnail.png`, buf2)
}

const states = calculateStatesGeodata()
writePresidentSvg(states)
writePresidentThumbnails(states)
