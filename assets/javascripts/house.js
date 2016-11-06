var Changelog = require('./dashboard/_changelog');
var Map = require('./common/Map');
var MapSwitcher = require('./common/MapSwitcher');
var nav = require('./dashboard/_nav');
var Tooltip = require('./dashboard/_tooltip');
var refresh = require('./common/_refresh');
var summary = require('./house/_summary');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

var changelogEl = document.getElementById('changelog');
var changelog = new Changelog(changelogEl, initialJson);

var summaryEl = document.getElementById('house-summary');
var updateSummary = summary(summaryEl);

var mapContainerEl = document.getElementById('map');
var map = null;
var tooltip = null;
Map.loadSvg({
  url: mapContainerEl.getAttribute('data-src'),
  idAttribute: 'data-race-id',
  idRegex: /^[A-Z][A-Z].?.?$/
}, function(err, svg) {
  if (err) throw err;

  mapContainerEl.appendChild(svg);

  map = new Map({
    svg: svg,
    idAttribute: 'data-race-id',
    races: initialJson.races,
    legendEl: document.querySelector('.map-legend')
  });

  tooltip = new Tooltip({
    el: document.getElementById('tooltip'),
    mapEl: mapContainerEl,
    races: initialJson.races,
    raceType: 'house',
    mapType: 'state'
  });

  new MapSwitcher({
    el: document.getElementById('map-switcher'),
    map: map,
    mapContainerEl: mapContainerEl
  });

  mapContainerEl.classList.remove('loading');
});

var originalTitle = document.title;

var navEl = document.querySelector('nav');
var updateNav = nav(navEl);
updateNav(initialJson.summaries);

function setTitleSummary(summary) {
  if(summary.wins.dem + summary.wins.gop > 0) {
    if(summary.className === "dem-win") {
      document.title = "✔DEM "+summary.wins.dem+" : "+summary.wins.gop+" REP | "+ originalTitle;
    } else if(summary.className === "gop-win") {
      document.title = "DEM "+summary.wins.dem+" : "+summary.wins.gop+" REP✔ | "+ originalTitle;
    } else {
      document.title = "DEM "+summary.wins.dem+" : "+summary.wins.gop+" REP | "+ originalTitle;
    }
  }
}

setTitleSummary(initialJson.summaries.house);

function doRefresh(json) {
  setTitleSummary(json.summaries.house);
  if (map) map.update(json.races);
  if (tooltip) tooltip.setData(json.races);
  changelog.update(json);
  updateNav(json.summaries);
  updateSummary(json);

  initialJson = json; // in case "map" and "tooltip" aren't loaded yet
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/house.json', doRefresh);
