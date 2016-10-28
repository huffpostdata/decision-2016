'use strict'

const fs = require('fs')
const debug = require('debug')('loadDistrictsGeojson')
const dims = require('./dims')
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

function featureCollectionToMultiPolygon(featureCollection) {
  const arr = []

  featureCollection.features.forEach(feature => {
    const geometry = feature.geometry

    switch (geometry.type) {
      case 'Polygon':
        arr.push([ geometry.coordinates ])
        break
      case 'MultiPolygon':
        arr.push(geometry.coordinates)
        break
      default:
        throw new Error(`Can't handle geometry ${JSON.stringify(geometry)}`)
    }
  })

  return {
    type: 'MultiPolygon',
    coordinates: Array.prototype.concat.apply([], arr)
  }
}

function bufferToArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function loadDistrictsGeojson() {
  debug('Loading nation')
  const nationShp = bufferToArrayBuffer(fs.readFileSync(`${__dirname}/../input/nationp010g.shp`))
  const nationDbf = bufferToArrayBuffer(fs.readFileSync(`${__dirname}/../input/nationp010g.dbf`))
  const nationGeojson = shpjs.combine([ shpjs.parseShp(nationShp), shpjs.parseDbf(nationDbf) ])
  nationGeojson.features = nationGeojson.features
    .filter(f => f.properties.NAME === 'United States of America' && f.properties.TYPE === 'Land')
  const nationGeometry = featureCollectionToMultiPolygon(nationGeojson)
  const projectedNationGeometry = projectGeojson(nationGeometry, defaultProjection)
  const nationJsts = geojsonToJsts(projectedNationGeometry)
  debug('Making nation valid')
  const validNation = nationJsts.buffer(0)

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
    const jstsGeometry = geojsonToJsts(feature.geometry).buffer(0) // buffer(0) means makeValid()
    const jstsIntersected = jstsGeometry.intersection(validNation)
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
