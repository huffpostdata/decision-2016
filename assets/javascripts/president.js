var Map = require('./president/_map');
var nav = require('./dashboard/_nav');
var refresh = require('./common/_refresh');
var summary = require('./president/_summary');
var tooltip = require('./president/_tooltip');

var mapEl = document.getElementById('map');
var map = new Map(mapEl);

var navEl = document.querySelector('nav');
var updateNav = nav(navEl);

var summaryEl = document.getElementById('president-summary');
var updateSummary = summary(summaryEl);

var tooltipEl = document.getElementById('tooltip');
var updateTooltip = tooltip(tooltipEl);

function doRefresh(json) {
  map.update(json.races);
  updateNav(json.summaries);
  updateSummary(json);
  updateTooltip(json);
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/president.json', doRefresh);

// TK move this elsewhere!
document.getElementById('map-switcher').addEventListener('click', function() {
  var classList = mapEl.classList;
  var geo = document.querySelector('#map').querySelector('.states');
  var carto = document.querySelector('#map').querySelector('.president-cartogram');
  var mesh = document.querySelector('#map').querySelector('.mesh');
  if (classList.contains('geography')) {
    map.showCartogram();
    geo.style.pointerEvents = 'none';
    carto.style.pointerEvents = 'all';
  } else if (classList.contains('cartogram')) {
    map.showGeography();
    geo.style.pointerEvents = 'all';
    mesh.style.pointerEvents = 'none';
    carto.style.pointerEvents = 'none';
  }
});

var initialJson = document.querySelector('script[data-json]').getAttribute('data-json');
doRefresh(JSON.parse(initialJson));
