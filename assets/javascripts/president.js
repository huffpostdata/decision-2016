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

  var className = classList.contains('geography') ? 'cartogram' : 'geography';
  var removeName = className === 'geography' ? 'cartogram' : 'geography';

  classList.remove(removeName);
  classList.add(className);
});
