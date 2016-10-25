#!/usr/bin/env node

'use strict'

const debug = require('debug')('makeValid')
const jsts = require('jsts')

const GeoJSONReader = new jsts.io.GeoJSONReader()
const GeoJSONWriter = new jsts.io.GeoJSONWriter()
function makeGeojsonGeometryValid(geom) {
  const jstsGeom = GeoJSONReader.read(geom)
  const validJstsGeom = jstsGeom.buffer(0) // fixes all sorts of problems
  return GeoJSONWriter.write(validJstsGeom)
}

function makeGeojsonValid(geojson) {
  switch (geojson.type) {
    case 'Feature':
      return Object.assign({}, geojson, { geometry: makeGeojsonGeometryValid(geojson.geometry) })
    case 'FeatureCollection':
      return Object.assign({}, geojson, { features: geojson.features.map(makeGeojsonValid) })
    default:
      return makeGeojsonGeometryValid(geojson)
  }
}

module.exports = function(geojson) {
  debug(`Making ${JSON.stringify(geojson).length} bytes of GeoJSON valid...`)
  const ret = makeGeojsonValid(geojson)
  debug('done')
  return ret
}
