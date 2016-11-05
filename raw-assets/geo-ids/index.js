#!/usr/bin/env node

'use strict'

const fs = require('fs')
const parsedbf = require('parsedbf')

const StateCodes = 'CT MA ME NH RI VT'.split(/ /);
const ValidStateCodes = StateCodes.reduce(((s, code) => { s[code] = null; return s }), {})

function normalizeApName(name) {
  const Fixes = {
    'Aroostook Cty Townships': 'central aroostook ut',
    'Saint Agatha': 'st. agatha',
    'Franklin Cty Townships': 'east central franklin ut',
    'Old Orchrd Bch': 'old orchard beach',
    'Oxford Cty Townships': 'north oxford ut',
    'Penobscot Cty Townships': 'north penobscot ut',
    'Penobscot Nation Vot Dst': 'penobscot indian island reservation',
    'Piscataquis Cty Townshps': 'northeast piscataquis ut',
    'Harts Location': "hart's location",
    'Washington Cty Townships': 'east central washington ut',
    "Wentworth's Location": 'wentworth location',
    "Swan's Island": 'swans island',
    "Owl's Head": 'owls head',
    'Verona': 'verona island',
  }

  if (Fixes.hasOwnProperty(name)) return Fixes[name]

  switch (name) {
    default: return name.toLowerCase()
      .replace(/ (town|valley|cty townships|plantation|plt\.?)$/, '')
      .replace(/burgh/, 'burg') // Ferrisburgh town is "Ferrisburg" per AP
  }
}

function normalizeGeoName(name) {
  const Fixes = {
    'Central Hancock UT': 'hancock',
    'Central Somerset UT': 'somerset',
    'Manchester-by-the-Sea town': 'manchester',
    'Passamaquoddy Pleasant Point Reservation': 'pleasant point votng dst',
    'Passamaquoddy Indian Township Reservation': 'indian township vtng dst',
    'Westport Island town': 'westport',
  }

  if (Fixes.hasOwnProperty(name)) return Fixes[name]

  return name.toLowerCase()
    .replace(/ (valley town|township|town city|town|city|cty townships|plt\.?|plantation)$/, '')
    .replace(/burgh/, 'burg') // Ferrisburgh town is "Ferrisburg" per AP
}

function compare(a, b) {
  return a.fipsCode.localeCompare(b.fipsCode) || a.normalizedName.localeCompare(b.normalizedName)
}

class ApReportingUnit {
  constructor(apJson) {
    this.id = apJson.reportingunitID
    this.fipsCode = apJson.fipsCode
    this.name = apJson.reportingunitName
    this.normalizedName = normalizeApName(this.name)
  }
}

class Geo {
  constructor(dbfRow) {
    this.id = dbfRow.GEOID
    this.fipsCode = `${dbfRow.STATEFP}${dbfRow.COUNTYFP}`
    this.name = dbfRow.NAMELSAD
    this.normalizedName = normalizeGeoName(this.name)
  }
}

class MergedGeo {
  constructor(ru, geo) {
    this.ru = ru
    this.geo = geo
  }
}

function loadApReportingUnits() {
  const ret = []

  const apJson = require('../../data/reportingUnit.json')
  for (const race of apJson.races) {
    if (race.officeID !== 'P') continue

    for (const ru of race.reportingUnits) {
      if (ru.level === 'subunit' && ValidStateCodes.hasOwnProperty(ru.statePostal)) {
        ret.push(new ApReportingUnit(ru))
      }
    }
  }

  return ret
}

function bufferToArrayBuffer(buf) {
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

function loadGeosFromFile(filename) {
  const buffer = fs.readFileSync(filename)
  const arrayBuffer = bufferToArrayBuffer(buffer)
  const rows = parsedbf(arrayBuffer)

  return rows.map(r => new Geo(r))
}

function loadGeos() {
  const geoArrays = []

  for (const filename of fs.readdirSync(`${__dirname}/input`)) {
    if (/\.dbf$/.test(filename)) {
      geoArrays.push(loadGeosFromFile(`${__dirname}/input/${filename}`))
    }
  }

  return Array.prototype.concat.apply([], geoArrays)
}

function mergeApReportingUnitsWithGeos(rus, geos) {
  rus = rus.slice(0).sort(compare)
  geos = geos.slice(0).sort(compare)

  const ret = []

  let i = 0, j = 0
  while (i < rus.length || j < geos.length) {
    const ru = rus[i]
    const geo = geos[j]

    const cmp = compare(ru, geo)

    if (cmp === 0) {
      ret.push(new MergedGeo(ru, geo))
      i += 1
      j += 1
    } else if (/00000$/.test(geo.id)) {
      j += 1 // "county subdivisions not defined"
    } else if (cmp < 0) {
      console.warn(`Missing Geo for AP ReportingUnit: ${JSON.stringify(ru)}`)
      i += 1
    } else if (cmp > 0) {
      console.warn(`Missing AP ReportingUnit for Geo: ${JSON.stringify(geo)}`)
      j += 1
    } else {
      throw new Error(`Stuck at (${i},${j}): ${JSON.stringify(ru)} <=> ${JSON.stringify(geo)}`)
    }
  }

  return ret
}

const rus = loadApReportingUnits()
const geos = loadGeos()

const merged = mergeApReportingUnitsWithGeos(rus, geos)

const tsv = merged
  .map(m => `${m.ru.id}\t${m.geo.id}`)
  .join('\n')

const filename = 'ap-id-to-geo-id.tsv'
console.log(`Writing ${filename}`)
fs.writeFileSync(filename, tsv)
