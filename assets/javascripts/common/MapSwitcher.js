var TransitDuration = 200; // ms

/**
 * Allows toggling between "geography" and "cartogram" classes, with animation
 * in between.
 *
 * The transition, e.g. from "geography" to "cartogram", goes like this:
 *
 * 1. Change options.el class from "geography" to "cartogram".
 * 2. Animate one frame in a <canvas> we've inserted into options.mapContainerEl.
 * 3. Remove "geography" class from options.mapContainerEl.
 * 4. Animate all the other frames in the <canvas>.
 * 5. Add "cartogram" class to options.mapContainerEl.
 *
 * (This ordering is important if you're considering adding "transition" in
 * CSS -- which looks really cool.)
 *
 * During animation, we ignore all attempts to toggle.
 */
function MapSwitcher(options) {
  if (!options.map) throw new Error('Must set options.map, a Map');
  if (!options.el) throw new Error('Must set options.el, an HTMLElement');
  if (!options.mapContainerEl) throw new Error('Must set options.mapContainerEl, an HTMLElement');

  this.el = options.el;
  this.mapContainerEl = options.mapContainerEl;
  var map = options.map;

  // Add a <canvas> to animate switches
  var canvas = document.createElement('canvas');
  canvas.className = 'animation';
  var viewBox = map.svg.getAttribute('viewBox').split(/\s+/);
  canvas.setAttribute('width', viewBox[2]);
  canvas.setAttribute('height', viewBox[3]);
  this.mapContainerEl.insertBefore(canvas, map.svg);
  this.ctx = canvas.getContext('2d');

  var transits = [];
  var raceIds = Object.keys(map.idToPaths);
  for (var i = 0; i < raceIds.length; i++) {
    var raceId = raceIds[i];
    var paths = map.idToPaths[raceId];
    if (paths.length !== 2) continue; // ME1, NE2, etc: we don't animate
    var geographyD = paths[0].getAttribute('d');
    var cartogramD = paths[1].getAttribute('d');
    var transit = new Transit(geographyD, cartogramD, paths[1]);
    transits.push(transit);
  }

  this.transits = transits;

  var _this = this;
  this.el.addEventListener('click', function(ev) {
    ev.preventDefault();
    if (_this.el.classList.contains('geography')) {
      _this.transition('geography', 'cartogram');
    } else {
      _this.transition('cartogram', 'geography');
    }
  });
}

function Point(x, y, len) {
  this.x = x;
  this.y = y;
  this.len = len; // Euclidian distance along loop
}

/**
 * Returns the "best" Loop -- that is, the longest one.
 */
function bestLoop(d) {
  var loop = null;

  var re = /(M[^M]+)/g;
  var m;
  while ((m = re.exec(d)) !== null) {
    var loop2 = Loop.fromPathD(m[1]);
    if (loop === null || loop2.len > loop.len) {
      loop = loop2;
    }
  }

  return loop;
}

/**
 * Contains an Array of `points` that start and end at the same (x,y).
 */
function Loop(points) {
  this.points = points;
  this.len = points[points.length - 1].len;
}

Loop.fromPathD = function(d) {
  var len = 0;

  // IE<=11 regexes don't seem to greedy-match as much as they should. That's
  // why we're stuck with "pos" parsing.
  var pos = 0;
  var intRe = /[, ]*(-?\d+)[, ]*/g;
  function nextInt() {
    intRe.lastIndex = pos;
    var m = intRe.exec(d);
    pos += m[0].length;
    return parseInt(m[1], 10);
  }

  var x = null;
  var y = null;
  var m = null;
  var dx = null;
  var dy = null;
  var points = [];
  while (pos < d.length) {
    var op = d[pos];
    pos += 1;

    // Don't animate holes, multiple polygons, etc. It's not worth the effort.
    if (op === 'M' && x !== null) throw new Error('Called with more than a loop path description');
    switch (op) {
      case 'M':
        x = nextInt(); y = nextInt();
        points.push(new Point(x, y, len));
        break;
      case 'h':
        dx = nextInt();
        x += dx;
        len += Math.abs(dx);
        points.push(new Point(x, y, len));
        break;
      case 'v':
        dy = nextInt();
        y += dy;
        len += Math.abs(dy);
        points.push(new Point(x, y, len));
        break;
      case 'l':
        dx = nextInt(); dy = nextInt();
        x += dx;
        y += dy;
        len += Math.sqrt(dx * dx + dy * dy);
        points.push(new Point(x, y, len));
        break;
      case 'Z':
        dx = points[0].x - x;
        dy = points[0].y - y;
        x = points[0].x;
        y = points[0].y;
        len += Math.sqrt(dx * dx + dy * dy);
        points.push(new Point(x, y, len));
        break;
      default:
        throw new Error('Unexpected op "' + op + '" in <path> d="' + d + '"');
    }
    while (pos < d.length && d[pos] === ' ') pos++;
  }

  return new Loop(points);
}

Loop.prototype.rotateSoTopLeftPointIsFirst = function() {
  // 1. Find top-left bounding box
  var i, point;
  var left = this.points[0].x;
  var top = this.points[0].y;
  for (i = 1; i < this.points.length; i++) {
    point = this.points[i];
    if (point.x < left) left = point.x;
    if (point.y < top) top = point.y;
  }

  // 2. Find closest point: smallest Euclidean distance
  var bestD2 = null;
  var bestI = null;
  for (i = 0; i < this.points.length; i++) {
    point = this.points[i];
    var dx = point.x - left;
    var dy = point.y - top;
    var d2 = dx * dx + dy * dy;
    if (bestD2 === null || d2 < bestD2) {
      bestD2 = d2;
      bestI = i;
    }
  }

  // 3. Fashion new Loop starting at this point.
  // 3a. top-left point to end of original loop
  var startLen = this.points[bestI].len;
  var points = [];
  for (i = bestI; i < this.points.length; i++) {
    point = this.points[i];
    points.push(new Point(point.x, point.y, point.len - startLen));
  }
  // the last point is at the same (x,y) as this.points[0].
  // 3b. all the points, ending at the top-left point we started at
  var lenAt0 = this.len - startLen;
  for (i = 1; i <= bestI; i++) {
    point = this.points[i];
    points.push(new Point(point.x, point.y, point.len + lenAt0));
  }

  return new Loop(points);
};

/**
 * Returns a Point between point1 and point2, with the given `len`.
 */
function interpolate(point1, point2, len) {
  if (len < point1.len || len > point2.len) throw new Error('Invalid input');
  var x1 = point1.x;
  var x2 = point2.x;
  var y1 = point1.y;
  var y2 = point2.y;

  var f = (len - point1.len) / (point2.len - point1.len);

  return new Point(
    x1 * (1 - f) + x2 * f,
    y1 * (1 - f) + y2 * f,
    len
  );
}

/**
 * Returns an Array of {x1,x2,y1,y2} Points for all the distinct `len` values
 * of the input Loops.
 *
 * In other words, x1 "aligns" along loop1 the same way x2 "aligns" along loop2.
 * We'll animate each point from (x1,y1) to (x2,y2).
 */
function zipLoops(loop1, loop2) {
  var Epsilon = 1e-6;

  var i = 0;
  var j = 0;
  var scale1 = 1 / loop1.len;
  var scale2 = 1 / loop2.len;
  var ret = [];
  while (i < loop1.points.length && j < loop2.points.length) {
    var p1 = loop1.points[i];
    var p2 = loop2.points[j];
    var f1 = p1.len * scale1; // fraction we are along loop1, [0,1]
    var f2 = p2.len * scale2; // fraction we are along loop2, [0,1]
    if (Math.abs(f1 - f2) < Epsilon) {
      // p1 and p2 are both aligned.
      i += 1;
      j += 1;
    } else {
      if (f1 < f2) {
        // p2 is too far ahead. Fake a p2 by interpolating.
        p2 = interpolate(loop2.points[j - 1], loop2.points[j], f1 * loop2.len);
        i += 1;
      } else {
        // p1 is too far ahead. Fake a p1 by interpolating.
        p1 = interpolate(loop1.points[i - 1], loop1.points[i], f2 * loop1.len);
        j += 1;
      }
    }
    ret.push({ x1: p1.x, x2: p2.x, y1: p1.y, y2: p2.y });
  }

  return ret;
}

function Transit(d1, d2, path1) {
  var loop1 = bestLoop(d1).rotateSoTopLeftPointIsFirst();
  var loop2 = bestLoop(d2).rotateSoTopLeftPointIsFirst();

  var points = zipLoops(loop1, loop2);
  this.points = points;
  this.path = path1;
}

function ease(t) {
  t *= 2;
  if (t < 1) return 1/2 * t * t * t;
  t -= 2;
  return 1/2 * t * t * t + 1;
}

function traceTransitPathAtFraction(ctx, transit, fraction) {
  ctx.beginPath();

  var points = transit.points;
  for (var i = 0; i < points.length; i++) {
    var pt = points[i];
    var x = pt.x1 * (1 - fraction) + pt.x2 * fraction;
    var y = pt.y1 * (1 - fraction) + pt.y2 * fraction;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
}

function drawTransitAtFraction(ctx, transit, fraction) {
  ctx.fillStyle = transit.fill;
  ctx.strokeStyle = transit.stroke;
  ctx.lineWidth = transit.strokeWidth;
  traceTransitPathAtFraction(ctx, transit, fraction);
  ctx.fill();
  ctx.stroke();
}

function drawFrame(ctx, isForward, transits, t0, t, callback) {
  var f = Math.min(1, ease((t - t0) / TransitDuration));

  var fraction = isForward ? f : (1 - f);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (var i = 0; i < transits.length; i++) {
    var transit = transits[i];
    drawTransitAtFraction(ctx, transit, fraction);
  }

  if (f === 1) return callback();

  window.requestAnimationFrame(function(t1) {
    drawFrame(ctx, isForward, transits, t0, t1, callback);
  });
};

MapSwitcher.prototype.transition = function(fromClass, toClass) {
  if (!this.mapContainerEl.classList.contains(fromClass)) return; // never double-animate

  for (var i = 0; i < this.transits.length; i++) {
    var transit = this.transits[i];
    var style = window.getComputedStyle(transit.path);
    transit.fill = style.fill;
    // TK programmatic way of pulling stroke from mesh?
    transit.stroke = 'white';
    // Set lineWidth halfway between 0 (what we want on coastline) and the
    // mesh width (what we want between states).
    transit.strokeWidth = 1.5;
  }

  this.el.classList.remove(fromClass);
  this.el.classList.add(toClass);

  var _this = this;
  window.requestAnimationFrame(function(t0) {
    // Draw first frame before removing the mapContainerEl's class. That way,
    // when the <g> goes display:none, there'll be a <canvas> underneath that
    // looks the same.
    drawFrame(_this.ctx, toClass === 'cartogram', _this.transits, t0, t0, function() {
      _this.mapContainerEl.classList.add(toClass);
    });
    _this.mapContainerEl.classList.remove(fromClass);
  });
}

module.exports = MapSwitcher;
