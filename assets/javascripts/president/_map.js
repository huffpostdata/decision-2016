var TransitDuration = 200; // ms

var Color = {
  clinton: '#4c7de0',
  trump: '#e52426',
  tossup: '#ccc',
  other: '#dae086'
};

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
    var loop2 = new Loop(m[1]);
    if (loop === null || loop2.len > loop.len) {
      loop = loop2;
    }
  }

  return loop;
}

/**
 * Contains an Array of `points` that start and end at the same (x,y).
 */
function Loop(d) {
  // A function mapping [0,1] to {x,y}
  var len = 0;
  var re = /([MlhvZ])(-?\d+)(?:,(-?\d+))?/g;
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

  this.len = len;
  this.points = points;
}

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
  var loop1 = bestLoop(d1);
  var loop2 = bestLoop(d2);

  var points = zipLoops(loop1, loop2);
  this.points = points;
  this.path = path1;
}

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

function Map(el) {
  this.el = el;

  this.racesJson = null;

  this.svg = null;
  this.gPresidentCartogram = null;
  this.gStates = null;
  this.racePaths = null; // { race ID => Array of <path>s }
  this.ctx = null;

  var _this = this;
  loadSvg(el.getAttribute('data-src'), function(err, xml) {
    if (err !== null) throw err; // it'll show an error in the console, that's all

    var svg = _this.svg = xml.documentElement;
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    el.appendChild(svg);

    _this.gPresidentCartogram = svg.querySelector('g.president-cartogram');
    _this.gStates = svg.querySelector('g.states');
    var rp = _this.racePaths = {};
    var paths = svg.querySelectorAll('path');
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var stateCode = path.getAttribute('class');

      if (stateCode === 'mesh') {
        path.setAttribute('stroke', '#aaa');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
      } else {
        if (!rp.hasOwnProperty(stateCode)) rp[stateCode] = [];
        rp[stateCode].push(path);
      }
    }

    // Add a <canvas> to animate switches
    var canvas = document.createElement('canvas');
    canvas.className = 'animation';
    var viewBox = svg.getAttribute('viewBox').split(/\s+/);
    canvas.setAttribute('width', viewBox[2]);
    canvas.setAttribute('height', viewBox[3]);
    el.insertBefore(canvas, _this.iframe);
    _this.ctx = canvas.getContext('2d');

    _this.recolorIfLoaded();

    _this.funkyInit();

    el.classList.remove('loading');
  });
}

Map.prototype.update = function(racesJson) {
  this.racesJson = racesJson;
  this.recolorIfLoaded();
};

Map.prototype.recolorIfLoaded = function() {
  if (this.racesJson !== null && this.svg !== null) this.recolor();
};

Map.prototype.recolor = function() {
  for (var i = 0; i < this.racesJson.length; i++) {
    var race = this.racesJson[i];
    var color = race.winner === null ? Color.tossup : (Color[race.winner] || Color.other);
    var paths = this.racePaths[race.id] || [];
    for (var j = 0; j < paths.length; j++) {
      paths[j].setAttribute('fill', color);
    }
  }
};

Map.prototype.funkyInit = function() {
  this.transits = [];
  this.start = 0;
  this.end = 1;

  // Calculate enough about a state's <path>s for a transition
  for (var raceId in this.racePaths) {
    if (!this.racePaths.hasOwnProperty(raceId)) continue;

    var racePaths = this.racePaths[raceId];

    var d1 = racePaths[0].getAttribute('d');
    var d2 = racePaths[1].getAttribute('d');

    var transit = new Transit(d1, d2, racePaths[0]);
    this.transits.push(transit);
  }
};

function ease(t) {
  t *= 2;
  if (t < 1) return 1/2 * t * t * t;
  t -= 2;
  return 1/2 * t * t * t + 1;
}

function drawFrame(ctx, isForward, transits, t0, t, callback) {
  if (t - t0 > TransitDuration) return callback();
  var f = ease((t - t0) / TransitDuration);

  var f1, f2;
  if (isForward) {
    f1 = (1 - f);
    f2 = f;
  } else {
    f1 = f;
    f2 = (1 - f);
  }

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (var i = 0; i < transits.length; i++) {
    var transit = transits[i];
    var points = transit.points;
    ctx.fillStyle = transit.path.getAttribute('fill');
    ctx.beginPath();
    for (var j = 0; j < points.length; j += 1) {
      var pt = points[j];
      var x = pt.x1 * f1 + pt.x2 * f2;
      var y = pt.y1 * f1 + pt.y2 * f2;
      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  window.requestAnimationFrame(function(t1) {
    drawFrame(ctx, isForward, transits, t0, t1, callback);
  });
};

Map.prototype.transition = function(fromClass, toClass) {
  if (!this.el.classList.contains(fromClass)) return; // we're already animating

  var _this = this;
  window.requestAnimationFrame(function(t0) {
    drawFrame(_this.ctx, toClass === 'cartogram', _this.transits, t0, t0, function() {
      _this.el.classList.add(toClass);
    });
    _this.el.classList.remove(fromClass);
  });
}

Map.prototype.showCartogram = function() {
  this.transition('geography', 'cartogram');
};

Map.prototype.showGeography = function() {
  this.transition('cartogram', 'geography');
};

module.exports = Map;
