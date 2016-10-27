'use strict'

const fs = require('fs')
const debug = require('debug')('loadDistrictsGeojson')
const defaultProjection = require('./defaultProjection')
const jsts = require('jsts')
const makeGeojsonValid = require('./makeGeojsonValid')
const quantizeAndMesh = require('./quantizeAndMesh')
const projectGeojson = require('./projectGeojson')
const shpjs = require('shpjs')
const loadStatesGeojson = require('./loadStatesGeojson')

const GeoJSONReader = new jsts.io.GeoJSONReader()
const GeoJSONWriter = new jsts.io.GeoJSONWriter()

const StateFpToStateId = {
  '01': 'AL',
  '02': 'AK',
  '04': 'AZ',
  '05': 'AR',
  '06': 'CA',
  '08': 'CO',
  '09': 'CT',
  '10': 'DE',
  '12': 'FL',
  '13': 'GA',
  '15': 'HI',
  '16': 'ID',
  '17': 'IL',
  '18': 'IN',
  '19': 'IA',
  '20': 'KS',
  '21': 'KY',
  '22': 'LA',
  '23': 'ME',
  '24': 'MD',
  '25': 'MA',
  '26': 'MI',
  '27': 'MN',
  '28': 'MS',
  '29': 'MO',
  '30': 'MT',
  '31': 'NE',
  '32': 'NV',
  '33': 'NH',
  '34': 'NJ',
  '35': 'NM',
  '36': 'NY',
  '37': 'NC',
  '38': 'ND',
  '39': 'OH',
  '40': 'OK',
  '41': 'OR',
  '42': 'PA',
  '44': 'RI',
  '45': 'SC',
  '46': 'SD',
  '47': 'TN',
  '48': 'TX',
  '49': 'UT',
  '50': 'VT',
  '51': 'VA',
  '53': 'WA',
  '54': 'WV',
  '55': 'WI',
  '56': 'WY'
}

function geojsonToJsts(geojson) {
  return GeoJSONReader.read(geojson)
}

function jstsToGeojsonGeometry(jstsGeometry) {
  return GeoJSONWriter.write(jstsGeometry)
}

function featureCollectionToMultiPolygon(collection) {
  const arrays = collection.features.map(feature => {
    switch (feature.type) {
      case 'MultiPolygon': return feature.coordinates
      case 'Polygon': return [ feature.coordinates ]
      default: throw new Error(`Unexpected feature type: ${feature.type}`)
    }
  })

  return { type: 'MultiPolygon', coordinates: [].concat(...arrays) }
}

function loadDistrictsGeojson() {
  debug('Loading states')
  const statesShp = fs.readFileSync(`${__dirname}/../input/statesp010g.shp`).buffer
  const statesDbf = fs.readFileSync(`${__dirname}/../input/statesp010g.dbf`).buffer
  const statesGeojson = shpjs.combine([ shpjs.parseShp(statesShp), shpjs.parseDbf(statesDbf) ])
  const validStatesGeojson = makeGeojsonValid(statesGeojson)
  debug('Organizing states')
  const idToJstsState = {}
  for (const state of validStatesGeojson.features) {
    if (state.properties.TYPE !== 'Land') continue

    const id = state.properties.STATE_ABBR
    if ([ 'PR', 'GU', 'MP', 'VI', 'AS' ].indexOf(id) !== -1) continue

    const projectedGeometry = projectGeojson(state.geometry, defaultProjection)
    const jstsGeometry = geojsonToJsts(projectedGeometry)
      .buffer(0.2) // buffer(0) means makeValid(). >0 makes the geometry simpler, and it's small so we won't go too far into the ocean
    idToJstsState[id] = jstsGeometry
  }

  debug('Loading districts')
  const districtsZip = fs.readFileSync(`${__dirname}/../input/tl_2016_us_cd115.zip`)
  const districtsGeojson = shpjs.parseZip(districtsZip)
  const validDistricts = makeGeojsonValid(districtsGeojson)
  validDistricts.features = validDistricts.features
    .filter(f => {
      const stateFp = f.properties.STATEFP // we'll filter out non-states
      const cdFp = f.properties.CD115FP    // we'll filter out "ZZ Congressional Districts not defined"
      return /[0-9][0-9]/.test(cdFp) && StateFpToStateId.hasOwnProperty(stateFp)
    })
    .map(f => {
      const ret = projectGeojson(f, defaultProjection)
      const stateId = StateFpToStateId[f.properties.STATEFP]
      const cdFp = f.properties.CD115FP
      ret.id = stateId === null ? null : `${stateId}${cdFp === '00' ? '01' : cdFp}`
      return ret
    })

  debug('Intersecting')
  const intersectedFeatures = validDistricts.features.map(feature => {
    debug(`${feature.id}...`)
    const stateId = feature.id.slice(0, 2)
    const jstsStateGeometry = idToJstsState[stateId]
    const jstsGeometry = geojsonToJsts(feature.geometry).buffer(0) // buffer(0) means makeValid()
    const jstsIntersected = jstsGeometry.intersection(jstsStateGeometry)
    const intersected = jstsToGeojsonGeometry(jstsIntersected)

    return {
      type: 'Feature',
      id: feature.id,
      geometry: intersected,
    }
  })

  validDistricts.features = intersectedFeatures

  const districts = quantizeAndMesh(validDistricts)
  districts.features.features.sort((a, b) => a.id.localeCompare(b.id))
  return districts
}

module.exports = function() {
  return loadDistrictsGeojson()
}
