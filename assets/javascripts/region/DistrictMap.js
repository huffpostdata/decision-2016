function DistrictMap(options) {
  if (!options.svg) throw new Error('Must set svg, an SVGElement');
  this.svg = options.svg;
  if (!options.races) throw new Error('Must set races, an Array');
  this.races = options.races;

  this.raceIdToPath = {};

  var paths = this.svg.querySelectorAll('path[class^=district-]');
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var raceId = window.location.pathname.slice(20, 22) + path.getAttribute('class').slice(11); // TK var raceId = path.getAttribute('data-race-id');
    this.raceIdToPath[raceId] = path;
    console.log(path, raceId)
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

module.exports = DistrictMap;
