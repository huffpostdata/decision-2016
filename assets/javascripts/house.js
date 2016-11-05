var Changelog = require('./dashboard/_changelog');
var Map = require('./dashboard/_map');
var nav = require('./dashboard/_nav');
var Tooltip = require('./dashboard/_tooltip');
var refresh = require('./common/_refresh');
var summary = require('./house/_summary');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

var changelogEl = document.getElementById('changelog');
var changelog = new Changelog(changelogEl, initialJson);

var summaryEl = document.getElementById('house-summary');
var updateSummary = summary(summaryEl);

var mapEl = document.getElementById('map');
var mapSwitcherEl = document.getElementById('map-switcher');
var map = new Map({
  el: mapEl,
  switchEl: mapSwitcherEl,
  racesJson: initialJson.races
});

var navEl = document.querySelector('nav');
var updateNav = nav(navEl);
updateNav(initialJson.summaries);

var tooltip = new Tooltip({
  el: document.getElementById('tooltip'),
  mapEl: mapEl,
  races: initialJson.races,
  raceType: 'house',
  mapType: 'state'
});

function doRefresh(json) {
  changelog.update(json);
  map.update(json.races);
  updateNav(json.summaries);
  updateSummary(json);
  tooltip.setData(json.races);
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/house.json', doRefresh);
