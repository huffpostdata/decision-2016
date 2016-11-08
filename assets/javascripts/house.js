var Changelog = require('./dashboard/_changelog');
var Map = require('./common/Map');
var MapSwitcher = require('./common/MapSwitcher');
var nav = require('./dashboard/_nav');
var Tooltip = require('./common/Tooltip');
var TitleUpdater = require('./dashboard/TitleUpdater');
var refresh = require('./common/_refresh');
var Summary = require('./house/_summary');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

var changelogEl = document.getElementById('changelog');
var changelog = new Changelog(changelogEl, initialJson);

var summaryEl = document.getElementById('house-summary');
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

var titleUpdater = new TitleUpdater('DEM', 'GOP', 218);
function updateTitle(json) {
  var race = json.summaries.house;
  titleUpdater.update(race.className, race.wins.dem, race.wins.gop);
}
updateTitle(initialJson);

function doRefresh(json) {
  updateTitle(json);
  if (map) map.update(json.races);
  if (tooltip) tooltip.setData(json.races);
  changelog.update(json);
  updateNav(json.summaries);
  summary.update(json);

  initialJson = json; // in case "map" and "tooltip" aren't loaded yet
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/house.json', doRefresh);
