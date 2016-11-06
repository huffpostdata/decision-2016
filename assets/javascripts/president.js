var Changelog = require('./dashboard/_changelog');
var Map = require('./common/Map');
var MapSwitcher = require('./common/MapSwitcher');
var nav = require('./dashboard/_nav');
var Tooltip = require('./dashboard/_tooltip');
var refresh = require('./common/_refresh');
var summary = require('./president/_summary');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

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
    legendEl: document.createElement('div') // TK
  });

  tooltip = new Tooltip({
    el: document.getElementById('tooltip'),
    mapEl: mapContainerEl,
    races: initialJson.races,
    raceType: 'president',
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

var changelogEl = document.getElementById('changelog');
var changelog = new Changelog(changelogEl, initialJson);

var summaryEl = document.getElementById('president-summary');
var updateSummary = summary(summaryEl);
updateSummary(initialJson);

function setTitleSummary(summary) {
  if(summary.nClintonElectoralVotes + summary.nTrumpElectoralVotes > 0) {
    if(summary.className === "clinton-win") {
      document.title = "✔C "+summary.nClintonElectoralVotes+" : "+summary.nTrumpElectoralVotes+" T | "+ originalTitle;
    } else if(summary.className === "trump-win") {
      document.title = "C "+summary.nClintonElectoralVotes+" : "+summary.nTrumpElectoralVotes+" T✔ | "+ originalTitle;
    } else {
      document.title = "C "+summary.nClintonElectoralVotes+" : "+summary.nTrumpElectoralVotes+" T | "+ originalTitle;
    }
  }
}

setTitleSummary(initialJson.summaries.president);

function doRefresh(json) {
  setTitleSummary(json.summaries.president);
  if (map) map.update(json.races);
  if (tooltip) tooltip.setData(json.races);
  changelog.update(json);
  updateNav(json.summaries);
  updateSummary(json);

  initialJson = json; // in case "map" and "tooltip" aren't loaded yet
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/president.json', doRefresh);
