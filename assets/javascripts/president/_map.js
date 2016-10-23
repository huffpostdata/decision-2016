var Color = {
  clinton: '#4c7de0',
  trump: '#e52426',
  tossup: '#ccc',
  other: '#dae086'
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
    el.insertBefore(canvas, _this.iframe);
    _this.ctx = canvas.getContext('2d');

    _this.recolorIfLoaded();

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

Map.prototype.showCartogram = function() {
};

Map.prototype.showGeography = function() {
};

module.exports = Map;
