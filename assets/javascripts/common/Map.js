function Map(options) {
  if (!options.svg) throw new Error('Must set options.svg, an SVGElement');
  if (!options.races) throw new Error('Must set options.races, an Array');
  if (!options.legendEl) throw new Error('Must set options.legendEl, an HTMLElement');
  if (!options.idAttribute) throw new Error('Must set options.idAttribute, a String like data-race-id');

  this.svg = options.svg;
  this.races = options.races;
  this.legendEl = options.legendEl;
  this.races = options.races;
  this.highlightedRaceId = null;
  this.highlightPaths = []; // <path> elements we'll add to the document
  this.idAttribute = options.idAttribute;

  // Our President/Senate/House maps have two <path>s per race: a cartogram path
  // and a geo path. That's why this is an array.
  this.idToPaths = {};
  var paths = this.svg.querySelectorAll('path[' + options.idAttribute + ']');
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var raceId = path.getAttribute(options.idAttribute);
    if (!this.idToPaths.hasOwnProperty(raceId)) this.idToPaths[raceId] = [];
    this.idToPaths[raceId].push(path);
  }

  this.updatePathClasses();
  this.updateLegendClass();
}

Map.prototype.updatePathClasses = function() {
  for (var i = 0; i < this.races.length; i++) {
    var race = this.races[i];
    var paths = this.idToPaths[race.id];
    if (!paths) continue;
    for (var j = 0; j < paths.length; j++) {
      paths[j].setAttribute('class', race.className);
    }
  }
};

Map.prototype.updateLegendClass = function() {
  var classNames = { 'map-legend': null };
  for (var i = 0; i < this.races.length; i++) {
    classNames['has-' + this.races[i].className] = null;
  }

  this.legendEl.className = Object.keys(classNames).join(' ');
};

Map.prototype.update = function(races) {
  this.races = races;
  this.updatePathClasses();
  this.updateLegendClass();
};

/**
 * Calls callback(this, raceId, ev) and callback(null), for all of time, depending
 * on user actions.
 *
 * The caller should be able to handle spurious calls with the same raceId (or
 * spurious `null` calls).
 */
Map.prototype.addHoverListener = function(callback) {
  var _this = this;
  var idAttribute = this.idAttribute;
  this.svg.addEventListener('mouseover', function(ev) {
    if (ev.target.hasAttribute(idAttribute)) {
      callback(_this, ev.target.getAttribute(idAttribute), ev);
    }
  });
  this.svg.addEventListener('mouseout', function(ev) {
    callback(null);
  });
};

/**
 * Calls callback(this, raceId), depending on user actions.
 *
 * Does not call the callback on tap.
 */
Map.prototype.addMouseClickListener = function(callback) {
  var _this = this;
  var idAttribute = this.idAttribute;
  this.svg.addEventListener('mousedown', function(ev) {
    if (ev.target.hasAttribute(idAttribute)) {
      callback(_this, ev.target.getAttribute(idAttribute));
    }
  });
};

/**
 * Returns the {top,left} of where the top+left of the tooltip should go, in
 * document coordinates.
 *
 * In other words: `{top: 0, left: 0}` is the first pixel on the page.
 */
Map.prototype.getDesiredTooltipPosition = function(raceId, el, ev) {
  var tooltipBox = el.getBoundingClientRect();

  var pathBox = null;
  var paths = this.idToPaths[raceId] || [];
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (window.getComputedStyle(path.parentNode).opacity === '0') continue;
    pathBox = path.getBoundingClientRect();
  }

  if (!pathBox) return { top: 0, left: 0 }; // should never happen

  var top = window.pageYOffset + pathBox.top - tooltipBox.height - 15;
  var left = window.pageXOffset + pathBox.left + (pathBox.width / 2) - (tooltipBox.width / 2);

  var windowRight = document.documentElement.clientWidth;
  if (left < 0) left = 0;
  if (left + tooltipBox.width > windowRight) {
    left = windowRight - tooltipBox.width;
  }

  return { top: top, left: left };
};

function highlightPaths(paths) {
  var highlightPaths = this.highlightPaths = [];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var highlightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    highlightPath.setAttribute('class', 'highlight');
    highlightPath.setAttribute('d', path.getAttribute('d'));
    path.parentNode.appendChild(highlightPath);
    highlightPaths.push(highlightPath);
  }
}

function unhighlightPaths(paths) {
  var i;

  for (i = 0; i < this.highlightPaths.length; i++) {
    var path = this.highlightPaths[i];
    path.parentNode.removeChild(path);
  }

  this.highlightPaths = [];
}

Map.prototype.highlightRace = function(raceIdOrNull) {
  if (!this.idToPaths.hasOwnProperty(raceIdOrNull)) raceIdOrNull = null;
  if (raceIdOrNull === this.highlightedRaceId) return;
  if (this.highlightedRaceId) unhighlightPaths(this.idToPaths[this.highlightedRaceId]);
  this.highlightedRaceId = raceIdOrNull;
  if (this.highlightedRaceId) highlightPaths(this.idToPaths[this.highlightedRaceId]);
};

function loadXml(url, callback) {
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
 * Calls callback with an Error or an SVGSVGElement.
 *
 * SVG doesn't permit data- attributes, but our Map library needs them. The
 * workaround: put a "class" attribute in the SVG and then match it using
 * idRegex. When the server gives us the SVG, we'll search for all <path>
 * elements with a `class` that matches options.idRegex, and we'll change it
 * from `class` to `options.idAttribute`.
 */
Map.loadSvg = function(options, callback) {
  if (!options.url) throw new Error('Must set options.url, a String');
  if (!options.idAttribute) throw new Error('Must set options.idAttribute, a String like data-race-id');
  if (!options.idRegex) throw new Error('Must set options.idRegex, a RegExp that matches "class" attributes in the SVG');

  loadXml(options.url, function(err, xml) {
    if (err) return callback(err);

    var svg = xml.documentElement;
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    var paths = svg.querySelectorAll('path');
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var maybeRaceId = path.getAttribute('class');
      if (options.idRegex.test(maybeRaceId)) {
        path.setAttribute(options.idAttribute, maybeRaceId);
        path.removeAttribute('class');
      }
    }

    return callback(null, svg);
  });
};

module.exports = Map;
