var Changelog = require('./dashboard/_changelog');
var Map = require('./dashboard/_map');
var nav = require('./dashboard/_nav');
var Tooltip = require('./dashboard/_tooltip');
var summary = require('./senate/_summary');
var refresh = require('./common/_refresh');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

var changelogEl = document.getElementById('changelog');
var changelog = new Changelog(changelogEl, initialJson);

var summaryEl = document.getElementById('senate-summary');
var updateSummary = summary(summaryEl);

var mapEl = document.getElementById('map');
var mapSwitcherEl = document.getElementById('map-switcher');
var map = new Map({
  el: mapEl,
  switchEl: mapSwitcherEl,
  racesJson: initialJson.races
});

var originalTitle = document.title;

var navEl = document.querySelector('nav');
var updateNav = nav(navEl);
updateNav(initialJson.summaries);

var tooltip = new Tooltip({
  el: document.getElementById('tooltip'),
  mapEl: mapEl,
  races: initialJson.races,
  raceType: 'senate',
  mapType: 'state'
});

function setTitleSummary(summary) {
  console.log(originalTitle);
  if(summary.totals.dem + summary.totals.gop > 0) {
    if(summary.className === "dem-win") {
      document.title = "✔DEM "+summary.totals.dem+" : "+summary.totals.gop+" REP | "+ originalTitle;
    } else if(summary.className === "gop-win") {
      document.title = "DEM "+summary.totals.dem+" : "+summary.totals.gop+" REP✔ | "+ originalTitle;
    } else {
      document.title = "DEM "+summary.totals.dem+" : "+summary.totals.gop+" REP | "+ originalTitle;
    }
  }
}

setTitleSummary(initialJson.summaries.senate);

function doRefresh(json) {
  setTitleSummary(json.summaries.senate);
  changelog.update(json);
  updateSummary(json);
  map.update(json.races);
  updateNav(json.summaries);
  tooltip.setData(json.races);
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/senate.json', doRefresh);
