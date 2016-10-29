#!/usr/bin/env node

'use strict'

const debug = require('debug')('senate')
const dims = require('./lib/dims')
const fs = require('fs')
const loadStatesGeojson = require('./lib/loadStatesGeojson')
const pathDBuilder = require('./lib/pathDBuilder')
const SenateCartogram = require('./lib/SenateCartogram')
const StateLabels = require('./lib/StateLabels')

// TODO clean up duplicate code between senate.js and president.js
const LabeledRaces = [
  { index: 0, id: 'NH', label: 'N.H.' },
  { index: 1, id: 'VT', label: 'Vt.' },
  { index: 2, id: 'CT', label: 'Conn.' },
  { index: 3, id: 'MD', label: 'Md.' },
]

const LabelWidth = dims.Accuracy * 38
const LabelHeight = dims.Accuracy * 22
const LabelLeading = dims.Accuracy * 25
const LabelX0 = dims.Width - LabelWidth - 3
const LabelY0 = dims.Accuracy * 100

function stateFeatureToPathD(feature) {
  const geoPath = pathDBuilder.fromGeojson(feature.geometry)
  const labeledRace = LabeledRaces.find(lr => lr.id === feature.id)
  const labelPath = labeledRace ? `M${LabelX0},${LabelY0 + labeledRace.index * LabelLeading}h${LabelWidth}v${LabelHeight}h-${LabelWidth}Z` : ''
  return geoPath + labelPath
}

function stateLabelsToTexts() {
  return StateLabels.map(label => {
    return `<text x="${label.x}" y="${label.y}">${label.text}</text>`
  }).join('') + LabeledRaces.map((labeledRace, i) => {
    const x = Math.round(LabelX0 + LabelWidth / 2)
    const y = Math.round(LabelY0 + LabelLeading * labeledRace.index + LabelHeight / 2)
    return `<text x="${x}" y="${y}">${labeledRace.label}</text>`
  }).join('')
}

function writeSenateSvg(states) {
  debug('Generating senate SVG')

  const stateIdToPathD = states.features.features.reduce((h, feature) => {
    h[feature.id] = stateFeatureToPathD(feature)
    return h
  }, {})

  const out = [
    '<?xml version="1.0"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="', dims.Width, '" height="', dims.Height, '" viewBox="0 0 ', dims.Width, ' ', dims.Height, '">',
      '<g class="geography">',
        // We'll render each state twice. That way both of the state's seats will transition
        SenateCartogram.features.map(seat => `<path class="${seat.id}" d="${stateIdToPathD[seat.id.slice(0, 2)]}"/>`).join(''),
        '<path class="mesh" d="', pathDBuilder.fromGeojson(states.mesh), '"/>',
        stateLabelsToTexts(),
      '</g>',
      '<g class="cartogram">',
        SenateCartogram.features.map(seat => `<path class="${seat.id}" d="${seat.d}"/>`).join(''),
        '<path class="mesh" d="', SenateCartogram.meshD, '"/>',
        SenateCartogram.labels.map(label => `<text x="${label.x}" y="${label.y}">${label.text}</text>`).join(''),
      '</g>',
    '</svg>'
  ].join('')

  const outBuffer = Buffer.from(out, 'utf8')

  const outFile = `${__dirname}/../../assets/maps/senate.svg`
  debug(`Writing to ${outFile} (${outBuffer.length} bytes)`)
  fs.writeFileSync(outFile, outBuffer)
}

const states = loadStatesGeojson()
writeSenateSvg(states)
