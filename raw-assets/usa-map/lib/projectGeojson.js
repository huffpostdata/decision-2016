'use strict'

function projectGeojson(geom, projection) {
  let coordinates

  switch (geom.type) {
    case 'Point':
      return { type: geom.type, coordinates: projection(geom.coordinates) }
    case 'MultiPoint':
    case 'LineString':
      return { type: geom.type, coordinates: geom.coordinates.map(projection) }
    case 'MultiLineString':
    case 'Polygon':
      coordinates = geom.coordinates.map(c => c.map(projection))
      if (coordinates[0][0] === null) throw new Error(`NULL?`)
      return { type: geom.type, coordinates: coordinates }
    case 'MultiPolygon':
      // Icky "filters" are because albersUsa() misses some TIGER2016 Hawaii
      // We'll assume those islands aren't, erm, important. That's probably okay
      // because this map is small-scale.
      coordinates = geom.coordinates
        .map(polygon => {
          return polygon
            .map(line => line.map(projection).filter(p => p !== null))
            .filter(line => line.length > 0)
            .map(line => {
              const begin = line[0]
              const end = line[line.length - 1]
              const closed = (begin[0] === end[0] && begin[1] === end[1])
              return closed ? line : line.concat([begin])
            })
        }).filter(polygon => polygon.length > 0)
      return { type: geom.type, coordinates: coordinates }
    case 'GeometryCollection':
      // recurse
      return { type: geom.type, geometries: geom.geometries.map(g => projectGeojson(g, projection)) }
    case 'Feature':
      const ret = { type: geom.type, geometry: projectGeojson(geom.geometry, projection), properties: geom.properties }
      if (geom.hasOwnProperty('id')) ret.id = geom.id
      return ret
    case 'FeatureCollection':
      return { type: geom.type, features: geom.features.map(f => projectGeojson(f, projection)) }
    default:
      throw new Error(`Unknown geometry type ${geom.type}`)
  }
}

module.exports = projectGeojson
