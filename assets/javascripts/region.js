var GeoMap = require('./region/GeoMap');
var DistrictList = require('./region/DistrictList');
var SplitVoteDistricts = require('./region/SplitVoteDistricts');
var DistrictMap = require('./region/DistrictMap');
var BallotRaces = require('./region/BallotRaces');
var Tooltip = require('./common/Tooltip');
var refresh = require('./common/_refresh');
var buildCandidateTableHTML = require('./common/buildCandidateTableHTML');
var waitForFontThen = require('./region/wait_for_font_then');
var positionSvgCities = require('./region/position_svg_cities');

var script = document.querySelector('script[data-json]');

var initialJson = JSON.parse(script.getAttribute('data-json'));

var presidentMap = GeoMap({
  svg: document.querySelector('.president-map svg'),
  legendEl: document.querySelector('section#president .map-legend'),
  races: initialJson.president.geos
});
var presidentTooltip = new Tooltip({
  el: document.getElementById('tooltip'),
  views: [ presidentMap ],
  races: initialJson.president.geos,
  mapType: 'geo'
});
var presidentTableEl = document.querySelector('section#president .candidate-table');

var splitVoteDistricts = null;
var splitVoteDistrictsEl = document.querySelector('section#president .split-vote-districts');
if (splitVoteDistrictsEl) {
  splitVoteDistricts = new SplitVoteDistricts({ el: splitVoteDistrictsEl });
}

var senateMap = null;
var senateTooltip = null;
var senateTableEl = null;
var senateSvg = document.querySelector('.senate-map svg');
if (senateSvg) {
  senateMap = GeoMap({
    svg: senateSvg,
    legendEl: document.querySelector('section#senate .map-legend'),
    races: initialJson.senate.geos
  });

  senateTooltip = new Tooltip({
    el: document.getElementById('tooltip'),
    views: [ senateMap ],
    races: initialJson.senate.geos,
    mapType: 'geo'
  });

  senateTableEl = document.querySelector('section#senate .candidate-table');
}

var houseMap = null;
var districtList = null;
var houseTooltip = null;
var houseSvg = document.querySelector('.house-map svg');
if (houseSvg) {
  houseMap = DistrictMap({
    svg: document.querySelector('.house-map svg'),
    legendEl: document.querySelector('section#house .map-legend'),
    races: initialJson.house
  });

  districtList = new DistrictList({
    el: document.querySelector('.house-races')
  });

  houseTooltip = new Tooltip({
    el: document.getElementById('tooltip'),
    views: [ houseMap, districtList ],
    races: initialJson.house,
  });
}

var ballotDiv = document.querySelector('section#ballot .ballot-races');
var ballotRaces = null;
if (ballotDiv) {
  ballotRaces = new BallotRaces({
    el: ballotDiv,
    percentReportingEl: document.querySelector('section#ballot .percent-reporting')
  });
}

waitForFontThen('Source Sans Pro', function() {
  positionSvgCities(document.querySelectorAll('svg'))
});

function doRefresh(json) {
  presidentMap.update(json.president.geos);
  presidentTooltip.setData(json.president.geos);
  presidentTableEl.innerHTML = buildCandidateTableHTML(json.president.race);

  if (splitVoteDistricts) {
    splitVoteDistricts.update(json.president.districts);
  }

  if (senateMap) {
    senateMap.update(json.senate.geos);
    senateTooltip.setData(json.senate.geos);
    senateTableEl.innerHTML = buildCandidateTableHTML(json.senate.race);
  }
  if (houseMap) {
    houseMap.update(json.house);
    houseTooltip.setData(json.house);
    districtList.update(json.house);
  }
  if (ballotRaces) {
    ballotRaces.update(json.ballot);
  }
}

refresh(document.querySelectorAll('.section-inner div.refresh'), script.getAttribute('data-url'), doRefresh);
