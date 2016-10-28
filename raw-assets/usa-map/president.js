#!/usr/bin/env node

'use strict'

const Canvas = require('canvas')
const debug = require('debug')('president')
const fs = require('fs')
const dims = require('./lib/dims')
const drawGeojsonOntoCanvas = require('./lib/drawGeojsonOntoCanvas')
const loadStatesGeojson = require('./lib/loadStatesGeojson')
const pathDBuilder = require('./lib/pathDBuilder')
const CartogramData = require('./lib/PresidentCartogram')
const StateLabels = require('./lib/StateLabels')

const LabeledRaces = [
  { index: 0, id: 'NH', label: 'N.H.' },
  { index: 1, id: 'VT', label: 'Vt.' },
  { index: 2, id: 'MA', label: 'Mass.' },
  { index: 3, id: 'RI', label: 'R.I.' },
  { index: 4, id: 'CT', label: 'Conn.' },
  { index: 5, id: 'NJ', label: 'N.J.' },
  { index: 6, id: 'DE', label: 'Del.' },
  { index: 7, id: 'MD', label: 'Md.' },
  { index: 8, id: 'DC', label: 'D.C.' }
]

const LabelWidth = dims.Accuracy * 38
const LabelHeight = dims.Accuracy * 22
const LabelLeading = dims.Accuracy * 25
const LabelX0 = dims.Width - LabelWidth - 3
const LabelY0 = dims.Accuracy * 78

function featureCollectionToSvgPaths(featureCollection) {
  return featureCollection.features.map(feature => {
    const geoPath = pathDBuilder.fromGeojson(feature.geometry)
    const labeledRace = LabeledRaces.find(lr => lr.id === feature.id)
    const labelPath = labeledRace ? `M${LabelX0},${LabelY0 + labeledRace.index * LabelLeading}h${LabelWidth}v${LabelHeight}h-${LabelWidth}Z` : ''
    return `<path class="${feature.id}" d="${geoPath}${labelPath}"/>`
  }).join('')
}

function stateSquaresToSvgPaths(stateSquares) {
  return Object.keys(stateSquares)
    .map(stateCode => `<path class="${stateCode}" d="${pathDBuilder.fromSquare(stateSquares[stateCode])}"/>`)
    .join('')
}

const StateCodeToAbbreviation = fs.readFileSync(`${__dirname}/../../app/google-sheets/regions.tsv`, 'utf8')
  .split(/\r?\n/)
  .slice(1)
  .map(s => s.split(/\t/))
  .filter(s => s.length === 4) // nix last row
  .reduce(((s, row) => { s[row[0]] = row[2]; return s }), {})

function stateSquaresToTexts(stateSquares) {
  function squareCX(axy) { // "center-X"
    return Math.round(dims.Accuracy * (axy.x + Math.sqrt(axy.a) * 15 / 2))
  }

  function squareCY(axy) { // "center-Y"
    return Math.round(dims.Accuracy * (axy.y + Math.sqrt(axy.a) * 15 / 2))
  }

  function text(raceId) {
    if (raceId.length === 2) {
      // "NY" => "N.Y."
      return StateCodeToAbbreviation[raceId]
    } else {
      // "ME1" => "1"
      return raceId.slice(2)
    }
  }

  return Object.keys(stateSquares)
    .map(raceId => {
      const square = stateSquares[raceId]
      return `<text x="${squareCX(square)}" y="${squareCY(square)}">${text(raceId)}</text>`
    })
    .join('')
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

function writePresidentSvg(states) {
  debug('Generating president SVG')

  const out = [
    '<?xml version="1.0"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="', dims.Width, '" height="', dims.Height, '" viewBox="0 0 ', dims.Width, ' ', dims.Height, '">',
      '<g class="geography">',
        featureCollectionToSvgPaths(states.features),
        '<path class="mesh" d="', pathDBuilder.fromGeojson(states.mesh), '"/>',
        stateLabelsToTexts(),
      '</g>',
      '<g class="cartogram">',
        stateSquaresToSvgPaths(CartogramData),
        stateSquaresToTexts(CartogramData),
      '</g>',
    '</svg>'
  ].join('')

  const outBuffer = Buffer.from(out, 'utf8')

  const outFile = `${__dirname}/../../assets/maps/president.svg`
  debug(`Writing to ${outFile} (${outBuffer.length} bytes)`)
  fs.writeFileSync(outFile, outBuffer)
}

function writePresidentThumbnails(states) {
  debug('Generating president thumbnail PNGs')

  const canvas = new Canvas(dims.Width, dims.Height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'black'
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.beginPath()
  drawGeojsonOntoCanvas(ctx, states.features)
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
  Object.keys(CartogramData).forEach(stateCode => {
    const square = CartogramData[stateCode]
    const s = Math.sqrt(square.a) * 15 / 2
    ctx2.rect(square.x / 2, square.y / 2, s, s)
  })
  ctx2.fill()

  const buf2 = canvas2.toBuffer()
  fs.writeFileSync(`${__dirname}/../../assets/maps/president-cartogram-thumbnail.png`, buf2)
}

const states = loadStatesGeojson()
writePresidentSvg(states)
writePresidentThumbnails(states)
