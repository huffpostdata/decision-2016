var Changelog = require('./dashboard/_changelog');
var Map = require('./common/Map');
var MapSwitcher = require('./common/MapSwitcher');
var nav = require('./dashboard/_nav');
var Tooltip = require('./common/Tooltip');
var TitleUpdater = require('./dashboard/TitleUpdater');
var refresh = require('./common/_refresh');
var Summary = require('./president/_summary');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

var summaryEl = document.getElementById('president-summary');
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

var titleUpdater = new TitleUpdater('C', 'T', 270);
function updateTitle(json) {
  var race = json.summaries.president;
  titleUpdater.update(race.className, race.nClintonElectoralVotes, race.nTrumpElectoralVotes);
}
updateTitle(initialJson);

function doRefresh(json) {
  if (map) map.update(json.races);
  if (tooltip) tooltip.setData(json.races);
  changelog.update(json);
  updateNav(json.summaries);
  summary.update(json);
  updateTitle(json);

  initialJson = json; // in case "map" and "tooltip" aren't loaded yet
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/president.json', doRefresh);
