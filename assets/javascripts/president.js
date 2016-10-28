var Map = require('./dashboard/_map');
var nav = require('./dashboard/_nav');
var refresh = require('./common/_refresh');
var summary = require('./president/_summary');
var tooltip = require('./president/_tooltip');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

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

var summaryEl = document.getElementById('president-summary');
var updateSummary = summary(summaryEl);
updateSummary(initialJson);

var tooltipEl = document.getElementById('tooltip');
var toolTip = tooltip(tooltipEl);
toolTip.setData(initialJson.races);

function doRefresh(json) {
  map.update(json.races);
  updateNav(json.summaries);
  updateSummary(json);
  toolTip.setData(json.races);
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/president.json', doRefresh);
