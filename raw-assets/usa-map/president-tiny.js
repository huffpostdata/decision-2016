#!/usr/bin/env node

'use strict'

const debug = require('debug')('president-tiny')
const fs = require('fs')
const dims = require('./lib/dims')
const loadStatesGeojson = require('./lib/loadStatesGeojson')
const pathDBuilder = require('./lib/pathDBuilder')

function featureCollectionToSvgPaths(featureCollection) {
  return featureCollection.features.map(feature => {
    const geoPath = pathDBuilder.fromGeojson(feature.geometry)
    return `<path class="${feature.id}" d="${geoPath}"/>`
  }).join('')
}

function writePresidentTinySvg(states) {
  debug('Generating president SVG')

  const out = [
    '<?xml version="1.0"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="', dims.Width, '" height="', dims.Height, '" viewBox="0 0 ', dims.Width, ' ', dims.Height, '">',
      featureCollectionToSvgPaths(states.features),
      '<path class="mesh" d="', pathDBuilder.fromGeojson(states.mesh), '"/>',
    '</svg>'
  ].join('')

  const outBuffer = Buffer.from(out, 'utf8')

  const outFile = `${__dirname}/president-tiny.svg`
  debug(`Writing to ${outFile} (${outBuffer.length} bytes)`)
  fs.writeFileSync(outFile, outBuffer)
}

const states = loadStatesGeojson()
writePresidentTinySvg(states)
