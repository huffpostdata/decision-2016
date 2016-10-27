'use strict'

const fs = require('fs')
const debug = require('debug')('loadStatesGeojson')
const defaultProjection = require('./defaultProjection')
const makeGeojsonValid = require('./makeGeojsonValid')
const quantizeAndMesh = require('./quantizeAndMesh')
const projectGeojson = require('./projectGeojson')
const shpjs = require('shpjs')

function loadStatesGeojson() {
  debug('Loading states')
  const shp = fs.readFileSync(`${__dirname}/../input/statesp010g.shp`).buffer
  const dbf = fs.readFileSync(`${__dirname}/../input/statesp010g.dbf`).buffer
  const geojson = shpjs.combine([ shpjs.parseShp(shp), shpjs.parseDbf(dbf) ])
  const validGeojson = makeGeojsonValid(geojson)
  return validGeojson
}

function calculateStatesGeodata() {
  const states = loadStatesGeojson()
  debug('Filtering and projecting')
  states.features = states.features
    .filter(f => f.properties.TYPE === 'Land')
    .filter(f => [ 'PR', 'GU', 'MP', 'VI', 'AS' ].indexOf(f.properties.STATE_ABBR) === -1)
    .map(f => {
      const ret = projectGeojson(f, defaultProjection)
      ret.id = f.properties.STATE_ABBR
      return ret
    })
  return quantizeAndMesh(states)
}

var memo = null
module.exports = function() {
  if (memo !== null) return memo
  return memo = calculateStatesGeodata()
}
