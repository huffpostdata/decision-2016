function Map(options) {
  if (!options.svg) throw new Error('Must set options.svg, an SVGElement');
  if (!options.races) throw new Error('Must set options.races, an Array');
  //if (!options.legendEl) throw new Error('Must set options.legendEl, an HTMLElement');
  if (!options.idAttribute) throw new Error('Must set options.idAttribute, a String like data-race-id');

  this.svg = options.svg;
  this.races = options.races;
  this.legendEl = options.legendEl;
  this.races = options.races;

  this.idToPath = {};
  var paths = this.svg.querySelectorAll('path[' + options.idAttribute + ']');
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var raceId = path.getAttribute(options.idAttribute);
    this.idToPath[raceId] = path;
  }

  this.updatePathClasses();
}

Map.prototype.updatePathClasses = function() {
  for (var i = 0; i < this.races.length; i++) {
    var race = this.races[i];
    var path = this.idToPath[race.id];
    if (!path) continue;
    path.setAttribute('class', race.className);
  }
};

Map.prototype.update = function(races) {
  this.races = races;
  this.updatePathClasses();
};

module.exports = Map;
