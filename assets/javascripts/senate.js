var Map = require('./dashboard/_map');
var nav = require('./dashboard/_nav');
var refresh = require('./common/_refresh');

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

function doRefresh(json) {
  map.update(json.races);
  updateNav(json.summaries);
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/senate.json', doRefresh);
