'use strict'

const dims = require('./dims')
const d3_geo = require('d3-geo')

const projection = d3_geo.geoAlbersUsa()
const AlbersUsaUnderscaling = 0.9 // D3's AlbersUsa is too small
const AlbersUsaXError = 0.08 // We need more space on the right, for labels
projection.scale(projection.scale() * dims.Width / projection.translate()[0] / 2 / AlbersUsaUnderscaling)
projection.translate([ dims.Width / 2 * (1 - AlbersUsaXError), dims.Height / 2 ])

module.exports = projection
