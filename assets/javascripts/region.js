var raceTypeSwitcher = require('./dashboard/_race-type-switcher');
var GeoMap = require('./region/GeoMap');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

raceTypeSwitcher(document.querySelector('select.race-type'), document.querySelector('section.region'));

var presidentMap = new GeoMap({
  svg: document.querySelector('.president-map svg'),
  geos: initialJson.president.geos
});

var senateSvg = document.querySelector('.senate-map svg');
if (senateSvg) {
  var senateMap = new GeoMap({
    svg: senateSvg,
    geos: initialJson.senate.geos
  });
}
