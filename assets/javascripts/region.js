var GeoMap = require('./region/GeoMap');
var DistrictMap = require('./region/DistrictMap');
var Tooltip = require('./dashboard/_tooltip');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

var presidentMap = new GeoMap({
  svg: document.querySelector('.president-map svg'),
  geos: initialJson.president.geos
});
var presTooltip = new Tooltip({
  el: document.getElementById('tooltip'),
  mapEl: document.querySelector('.president-map svg'),
  races: initialJson.president.geos,
  raceType: 'president',
  mapType: 'geo'
});

var senateSvg = document.querySelector('.senate-map svg');
if (senateSvg) {
  var senateMap = new GeoMap({
    svg: senateSvg,
    geos: initialJson.senate.geos
  });
}
var senateTooltip = new Tooltip({
  el: document.getElementById('tooltip'),
  mapEl: document.querySelector('.senate-map svg'),
  races: initialJson.senate.geos,
  raceType: 'senate',
  mapType: 'geo'
});

var houseMap = new DistrictMap({
  svg: document.querySelector('.house-map svg'),
  races: initialJson.house
});
