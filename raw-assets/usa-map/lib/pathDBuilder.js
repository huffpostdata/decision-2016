'use strict'

const d3_geo = require('d3-geo')
const dims = require('./dims')

function geojsonToDSink() {
  const out = []

  let inPolygon = false
  let mustMove = true
  let lastX = null
  let lastY = null
  // Store the current "slope". This lets us compress multiple "l" operations.
  let lastDx = null
  let lastDy = null

  function outputLine(dx, dy) {
    if (dy === 0) {
      out.push('h' + dx)
    } else if (dx === 0) {
      out.push('v' + dy)
    } else {
      out.push('l' + dx + ',' + dy)
    }
  }

  return {
    d() {
      return out.join('')
    },

    polygonStart() { inPolygon = true },
    polygonEnd() { inPolygon = false },
    lineStart() {},

    point(x, y) {
      x = Math.round(x)
      y = Math.round(y)

      if (mustMove) {
        out.push('M' + x + ',' + y)
      } else {
        const dx = x - lastX
        const dy = y - lastY

        // Is this line parallel and in the same direction as the last line?
        // If so, we can merge the two to save bytes.
        // Test that "dx/dy = lastDx/lastDy" ==> "dx * lastDy = dy * lastDx"
        // Also test the vectors don't go in opposite directions.
        const canMerge = (lastDx !== null) && (dx * lastDy === dy * lastDx) && (dx * lastDx >= 0) && (dy * lastDy >= 0)

        if (canMerge) {
          // Don't output a line.
          lastDx += dx
          lastDy += dy
        } else {
          // Output the _previous_ point's line and start gathering this one
          if (lastDx !== null) outputLine(lastDx, lastDy)
          lastDx = dx
          lastDy = dy
        }
      }
      lastX = x
      lastY = y
      mustMove = false
    },

    lineEnd() {
      outputLine(lastDx, lastDy)
      if (inPolygon) out.push('Z')
      lastX = lastY = null // because we don't know where we are; need an M next
      lastDx = lastDy = null
      mustMove = true
    }
  }
}

function fromSquare(axy) {
  const x0 = axy.x * dims.Accuracy
  const y0 = axy.y * dims.Accuracy
  const s = Math.round(Math.sqrt(axy.a) * dims.Accuracy * 15)

  return [ 'M', x0, ',', y0, 'h', s, 'v', s, 'h', -s, 'Z' ].join('')
}

function fromGeojson(geojson) {
  const sink = geojsonToDSink()
  d3_geo.geoStream(geojson, sink)
  return sink.d()
}

// Builds a "d" string -- as in, the `d` of "<path d='...'/>"
module.exports = {
  fromSquare: fromSquare,
  fromGeojson: fromGeojson
}
