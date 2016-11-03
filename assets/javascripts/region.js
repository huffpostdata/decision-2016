var raceTypeSwitcher = require('./dashboard/_race-type-switcher');
var GeoMap = require('./region/GeoMap');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

raceTypeSwitcher(document.querySelector('select.race-type'), document.querySelector('section.region'));

var map = new GeoMap({
  svg: document.querySelector('.geo-map svg'),
  geos: initialJson.president.geos
});
