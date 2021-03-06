var Changelog = require('./dashboard/_changelog');
var Map = require('./common/Map');
var MapSwitcher = require('./common/MapSwitcher');
var nav = require('./dashboard/_nav');
var Tooltip = require('./common/Tooltip');
var TitleUpdater = require('./dashboard/TitleUpdater');
var Summary = require('./senate/_summary');
var refresh = require('./common/_refresh');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

var changelogEl = document.getElementById('changelog');
var changelog = new Changelog(changelogEl, initialJson);

var summaryEl = document.getElementById('senate-summary');
var summary = Summary(summaryEl, initialJson);

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
    views: [ map, summary ],
    races: initialJson.races,
    urlTemplate: mapContainerEl.getAttribute('data-url-template'),
    raceType: 'senate',
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

var titleUpdater = new TitleUpdater('DEM', 'GOP', 50);
function updateTitle(json) {
  var race = json.summaries.senate;
  titleUpdater.update(race.className, race.totals.dem, race.totals.gop);
}
updateTitle(initialJson);

function doRefresh(json) {
  updateTitle(json);
  changelog.update(json);
  summary.update(json);
  if (map) map.update(json.races);
  if (tooltip) tooltip.setData(json.races);
  updateNav(json.summaries);

  initialJson = json; // in case "map" and "tooltip" aren't loaded yet
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/senate.json', doRefresh);
