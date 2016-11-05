var GeoMap = require('./region/GeoMap');
var DistrictMap = require('./region/DistrictMap');
var Tooltip = require('./dashboard/_tooltip');
var refresh = require('./common/_refresh');

var script = document.querySelector('script[data-json]');

var initialJson = JSON.parse(script.getAttribute('data-json'));

var presidentMap = new GeoMap({
  svg: document.querySelector('.president-map svg'),
  geos: initialJson.president.geos
});
var presidentTooltip = new Tooltip({
  el: document.getElementById('tooltip'),
  mapEl: document.querySelector('.president-map svg'),
  races: initialJson.president.geos,
  raceType: 'president',
  mapType: 'geo'
});

var senateMap = null;
var senateTooltip = null;
var senateSvg = document.querySelector('.senate-map svg');
if (senateSvg) {
  senateMap = new GeoMap({
    svg: senateSvg,
    geos: initialJson.senate.geos
  });

  senateTooltip = new Tooltip({
    el: document.getElementById('tooltip'),
    mapEl: document.querySelector('.senate-map svg'),
    races: initialJson.senate.geos,
    raceType: 'senate',
    mapType: 'geo'
  });
}

var houseMap = new DistrictMap({
  svg: document.querySelector('.house-map svg'),
  races: initialJson.house
});

function doRefresh(json) {
  presidentMap.update(json.president);
  presidentTooltip.setData(json.president.geos);
  if (senateMap) {
    senateMap.update(json.senate);
    senateTooltip.setData(json.senate.geos);
  }
  houseMap.update(json.house);
  // TK houseTooltip-or-something.setData(json.house);
  // if (ballot...) TK ballot.update(...)
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, script.getAttribute('data-url'), doRefresh);
