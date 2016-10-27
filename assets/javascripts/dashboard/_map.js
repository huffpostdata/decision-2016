classNameForRace = {
  AllClassNames: [ 'dem-win', 'gop-win', 'dem-lead', 'gop-lead', 'tossup' ]
};

var TransitDuration = 200; // ms

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
  // A function mapping [0,1] to {x,y}
  var len = 0;
  var re = /([MlhvZ])(?:(-?\d+)(?:,(-?\d+))?)?/g;
  var x = null;
  var y = null;
  var m = null;
  var dx = null;
  var dy = null;
  var points = [];
  while ((m = re.exec(d)) !== null) {
    var op = m[1];
    // Don't animate holes, multiple polygons, etc. It's not worth the effort.
    if (op === 'M' && x !== null) throw new Error('Called with more than a loop path description');
    switch (op) {
      case 'M':
        x = +m[2];
        y = +m[3];
        points.push(new Point(x, y, len));
        break;
      case 'h':
        dx = +m[2];
        x += dx;
        len += Math.abs(dx);
        points.push(new Point(x, y, len));
        break;
      case 'v':
        dy = +m[2];
        y += dy;
        len += Math.abs(dy);
        points.push(new Point(x, y, len));
        break;
      case 'l':
        dx = +m[2];
        dy = +m[3];
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
  if (t - t0 > TransitDuration) return callback();
  var f = ease((t - t0) / TransitDuration);

  var fraction = isForward ? f : (1 - f);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (var i = 0; i < transits.length; i++) {
    var transit = transits[i];
    drawTransitAtFraction(ctx, transit, fraction);
  }

  window.requestAnimationFrame(function(t1) {
    drawFrame(ctx, isForward, transits, t0, t1, callback);
  });
};

function loadSvg(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onload = function() {
    if (xhr.status !== 200 && xhr.status !== 304) {
      return callback(new Error('Invalid XHR response code: ' + xhr.status));
    }
    return callback(null, xhr.responseXML);
  };
  xhr.send();
}

/**
 * Shows a map, and switches it between geography and cartogram.
 */
function Map(options) {
  if (!options.el) throw new Error('Missing "el", an HTMLElement');
  this.el = options.el;
  if (!options.switchEl) throw new Error('Missing "switchEl", an HTMLElement');
  this.switchEl = options.switchEl;
  if (!options.racesJson) throw new Error('Missing "racesJson", an Array');
  this.racesJson = options.racesJson;

  this.raceIdToPaths = null;

  if (!options.geographyClass) throw new Error('Missing "geographyClass", a String');
  if (!options.cartogramClass) throw new Error('Missing "cartogramClass", a String');
  this._loadSvg(options.geographyClass, options.cartogramClass);
}

Map.prototype._loadSvg = function(geographyClass, cartogramClass) {
  var _this = this;
  loadSvg(this.el.getAttribute('data-src'), function(err, xml) {
    if (err !== null) throw err; // it'll show an error in the console, that's all
    _this._setSvg(xml, geographyClass, cartogramClass);
  });
};

Map.prototype._setSvg = function(xml, geographyClass, cartogramClass) {
  var svg = this.svg = xml.documentElement;
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  this.el.appendChild(svg);

  this.gCartogram = svg.querySelector('g.' + cartogramClass);
  this.gGeography = svg.querySelector('g.' + geographyClass);

  var racePaths = {};
  var transits = [];
  var paths = this.gCartogram.querySelectorAll('path:not(.underlay)');
  var path, raceId, i;
  for (i = 0; i < paths.length; i++) {
    path = paths[i];
    raceId = path.getAttribute('class');
    racePaths[raceId] = [ path ];
  }

  paths = this.gGeography.querySelectorAll('path:not([class$=mesh])');
  for (i = 0; i < paths.length; i++) {
    path = paths[i];
    raceId = path.getAttribute('class');
    racePaths[raceId].push(path);

    var d1 = racePaths[raceId][0].getAttribute('d');
    var d2 = racePaths[raceId][1].getAttribute('d');
    var transit = new Transit(d2, d1, path); // icky reverse... oh well
    transits.push(transit);
  }

  // Add a <canvas> to animate switches
  var canvas = document.createElement('canvas');
  canvas.className = 'animation';
  var viewBox = svg.getAttribute('viewBox').split(/\s+/);
  canvas.setAttribute('width', viewBox[2]);
  canvas.setAttribute('height', viewBox[3]);
  this.el.insertBefore(canvas, svg);
  this.ctx = canvas.getContext('2d');

  this.transits = transits;
  this.raceIdToPaths = racePaths;

  this._recolor();

  this.el.classList.remove('loading');

  var _this = this;
  this.switchEl.addEventListener('click', function(ev) {
    ev.preventDefault();
    if (_this.el.classList.contains('geography')) {
      _this.showCartogram();
    } else if (_this.el.classList.contains('cartogram')) {
      _this.showGeography();
    } // otherwise do nothing
  });
};

Map.prototype.update = function(racesJson) {
  this.racesJson = racesJson;
  if (this.raceIdToPaths) this._recolor();
};

Map.prototype._recolor = function() {
  for (var i = 0; i < this.racesJson.length; i++) {
    var race = this.racesJson[i];
    var paths = this.raceIdToPaths[race.id] || [];
    for (var j = 0; j < paths.length; j++) {
      var path = paths[j];
      for (var k = 0; k < classNameForRace.AllClassNames.length; k++) {
        path.classList.remove(classNameForRace.AllClassNames[k]);
      }
      path.classList.add(race.className);
    }
  }
};

Map.prototype.transition = function(fromClass, toClass) {
  if (!this.el.classList.contains(fromClass)) return; // we're already animating

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

  var _this = this;
  window.requestAnimationFrame(function(t0) {
    drawFrame(_this.ctx, toClass === 'cartogram', _this.transits, t0, t0, function() {
      _this.el.classList.add(toClass);
    });
    _this.el.classList.remove(fromClass);
    _this.switchEl.classList.remove(fromClass);
    _this.switchEl.classList.add(toClass);
  });
}

Map.prototype.showCartogram = function() {
  this.transition('geography', 'cartogram');
};

Map.prototype.showGeography = function() {
  this.transition('cartogram', 'geography');
};

module.exports = Map