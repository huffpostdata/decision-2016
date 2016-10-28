#!/usr/bin/env node

'use strict'

const debug = require('debug')('house')
const dims = require('./lib/dims')
const fs = require('fs')
const loadDistrictsGeojson = require('./lib/loadDistrictsGeojson')
const loadHouseCartogram = require('./lib/loadHouseCartogram')
const loadStatesGeojson = require('./lib/loadStatesGeojson')
const pathDBuilder = require('./lib/pathDBuilder')

function featureCollectionToSvgPaths(featureCollection) {
  return featureCollection.features.map(feature => {
    return `<path class="${feature.id}" d="${pathDBuilder.fromGeojson(feature.geometry)}"/>`
  }).join('')
}

function writeHouseSvg(cartogram, districts, states) {
  debug('Generating house SVG')

  const out = [
    '<?xml version="1.0"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="', dims.Width, '" height="', dims.Height, '" viewBox="0 0 ', dims.Width, ' ', dims.Height, '">',
      '<g class="geography">',
        featureCollectionToSvgPaths(districts.features),
        '<path class="district-mesh" d="', pathDBuilder.fromGeojson(districts.mesh), '"/>',
        '<path class="state-mesh" d="', pathDBuilder.fromGeojson(states.mesh), '"/>',
      '</g>',
      '<g class="cartogram">',
        '<path class="underlay" d="', cartogram.underlay, '"/>',
        cartogram.text.map(t => `<text x="${t.x}" y="${t.y}">${t.text}</text>`).join(''),
        cartogram.districts.map(d => `<path class="${d.id}" d="${d.d}"/>`).join(''),
      '</g>',
    '</svg>'
  ].join('');

  const outBuffer = Buffer.from(out, 'utf8')

  const outFile = `${__dirname}/../../assets/maps/house.svg`
  debug(`Writing to ${outFile} (${outBuffer.length} bytes)`)
  fs.writeFileSync(outFile, outBuffer)
}

const cartogram = loadHouseCartogram()
const districts = loadDistrictsGeojson()
const states = loadStatesGeojson()
writeHouseSvg(cartogram, districts, states)
writeHouseThumbnails(districts, states)
