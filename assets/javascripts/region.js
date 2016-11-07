var GeoMap = require('./region/GeoMap');
var DistrictList = require('./region/DistrictList');
var DistrictMap = require('./region/DistrictMap');
var BallotRaces = require('./region/BallotRaces');
var Tooltip = require('./dashboard/_tooltip');
var refresh = require('./common/_refresh');

var script = document.querySelector('script[data-json]');

var initialJson = JSON.parse(script.getAttribute('data-json'));

var presidentMap = GeoMap({
  svg: document.querySelector('.president-map svg'),
  legendEl: document.querySelector('section.president .map-legend'),
  races: initialJson.president.geos
});
var presidentTooltip = new Tooltip({
  el: document.getElementById('tooltip'),
  mapEl: document.querySelector('.president-map svg'),
  races: initialJson.president.geos,
  mapType: 'geo'
});

var senateMap = null;
var senateTooltip = null;
var senateSvg = document.querySelector('.senate-map svg');
if (senateSvg) {
  senateMap = GeoMap({
    svg: senateSvg,
    legendEl: document.querySelector('section.senate .map-legend'),
    races: initialJson.senate.geos
  });

  senateTooltip = new Tooltip({
    el: document.getElementById('tooltip'),
    mapEl: document.querySelector('.senate-map svg'),
    races: initialJson.senate.geos,
    mapType: 'geo'
  });
}

var houseMap = DistrictMap({
  svg: document.querySelector('.house-map svg'),
  legendEl: document.querySelector('section.house .map-legend'),
  races: initialJson.house
});

var districtList = new DistrictList({
  el: document.querySelector('.house-races')
});

var ballotDiv = document.querySelector('.ballot-races');
var ballotRaces = null;
if (ballotDiv) {
  ballotRaces = new BallotRaces({ el: ballotDiv });
}

function doRefresh(json) {
  presidentMap.update(json.president.geos);
  presidentTooltip.setData(json.president.geos);
  if (senateMap) {
    senateMap.update(json.senate.geos);
    senateTooltip.setData(json.senate.geos);
  }
  houseMap.update(json.house);
  districtList.update(json.house);
  if (ballotRaces) {
    ballotRaces.update(json.ballot);
  }
}

refresh(document.querySelectorAll('.section-inner div.refresh'), script.getAttribute('data-url'), doRefresh);
