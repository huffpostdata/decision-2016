function GeoMap(options) {
  if (!options.svg) throw new Error('Must set svg, an SVGElement');
  this.svg = options.svg;
  if (!options.geos) throw new Error('Must set geos, an Array');
  this.geos = options.geos;

  this.geoIdToPath = {};

  var paths = this.svg.querySelectorAll('path[data-geo-id]');
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var geoId = path.getAttribute('data-geo-id');
    this.geoIdToPath[geoId] = path;
  }

  this.recolor();
}

GeoMap.prototype.recolor = function() {
  for (var i = 0; i < this.geos.length; i++) {
    var geo = this.geos[i];
    var path = this.geoIdToPath[geo.id];
    if (!path) continue;
    path.setAttribute('class', geo.className);
  }
};

GeoMap.prototype.update = function(geos) {
  this.geos = geos;
  this.recolor();
};

module.exports = GeoMap;
