function DistrictMap(options) {
  if (!options.svg) throw new Error('Must set svg, an SVGElement');
  this.svg = options.svg;
  if (!options.races) throw new Error('Must set races, an Array');
  this.races = options.races;

  this.raceIdToPath = {};

  var paths = this.svg.querySelectorAll('path[data-race-id]');
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var raceId = path.getAttribute('data-race-id');
    this.raceIdToPath[raceId] = path;
  }

  this.recolor();
}

DistrictMap.prototype.recolor = function() {
  for (var i = 0; i < this.races.length; i++) {
    var race = this.races[i];
    var path = this.raceIdToPath[race.id];
    if (!path) continue;
    path.setAttribute('class', race.className);
  }
};

DistrictMap.prototype.update = function(races) {
  this.races = races;
  this.recolor();
};

module.exports = DistrictMap;
