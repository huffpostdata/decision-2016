#!/usr/bin/env node

'use strict'

const debug = require('debug')('house')
const dims = require('./lib/dims')
const fs = require('fs')
const loadDistrictsGeojson = require('./lib/loadDistrictsGeojson')
const loadStatesGeojson = require('./lib/loadStatesGeojson')
const pathDBuilder = require('./lib/pathDBuilder')

function featureCollectionToSvgPaths(featureCollection) {
  return featureCollection.features.map(feature => {
    return '<path fill="#f88" class="' + feature.id + '" d="' + pathDBuilder.fromGeojson(feature.geometry) + '"/>'
  }).join('')
}

function writeHouseSvg(districts, states) {
  debug('Generating house SVG')

  const out = [
    '<?xml version="1.0"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="', dims.Width, '" height="', dims.Height, '" viewBox="0 0 ', dims.Width, ' ', dims.Height, '">',
      '<g class="districts">',
        featureCollectionToSvgPaths(districts.features),
        '<path fill="none" stroke="black" class="mesh" d="', pathDBuilder.fromGeojson(districts.mesh), '"/>',
      '</g>',
      '<g class="house-cartogram">',
        //houseCartogramPaths(),
      '</g>',
    '</svg>'
  ].join('');

  const outBuffer = Buffer.from(out, 'utf8')

  const outFile = `${__dirname}/../../assets/maps/house.svg`
  debug(`Writing to ${outFile} (${outBuffer.length} bytes)`)
  fs.writeFileSync(outFile, outBuffer)
}

const districts = loadDistrictsGeojson()
const states = loadStatesGeojson()
writeHouseSvg(districts, states)
writeHouseThumbnails(districts, states)
