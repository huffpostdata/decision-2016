function drawGeojsonOntoCanvas(ctx, geojson) {
  switch (geojson.type) {
    case 'Polygon':
      geojson.coordinates.forEach(points => {
        ctx.moveTo(points[0][0], points[0][1])
        points.slice(1).forEach(pt => {
          ctx.lineTo(pt[0], pt[1])
        })
        ctx.closePath()
      })
      break
    case 'MultiPolygon':
      geojson.coordinates.forEach(c => drawGeojsonOntoCanvas(ctx, { type: 'Polygon', coordinates: c }))
      break
    case 'Feature':
      drawGeojsonOntoCanvas(ctx, geojson.geometry)
      break
    case 'FeatureCollection':
      geojson.features.forEach(f => drawGeojsonOntoCanvas(ctx, f.geometry))
      break
    default:
      throw new Error(`Unknown geojson type: ${JSON.stringify(geojson.type)}`)
  }
};

module.exports = drawGeojsonOntoCanvas;
