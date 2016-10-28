'use strict'

const dims = require('./dims')
const debug = require('debug')('quantizeAndMesh')
const topojson = require('topojson')

module.exports = function quantizeAndMesh(featureCollection) {
  debug(`Building topology from ${JSON.stringify(featureCollection).length} bytes of GeoJSON`)
  const topo = topojson.topology({ features: featureCollection }, {
    quantization: dims.Width,
    id: d => d.id,
    verbose: true
  })
  topojson.simplify(topo, {
    'minimum-area': 4 * dims.Accuracy * dims.Accuracy,
    'coordinate-system': 'cartesian',
    verbose: true
  })
  topojson.filter(topo, {
    'coordinate-system': 'cartesian',
    verbose: true
  })

  const features2 = topojson.feature(topo, topo.objects.features)
  const mesh = topojson.mesh(topo, topo.objects.features, (a, b) => a !== b)

  const ret = { features: features2, mesh: mesh }
  debug(`Returning ${JSON.stringify(ret).length} bytes of GeoJSON`)
  return ret
}
