var Changelog = require('./dashboard/_changelog');
var Map = require('./dashboard/_map');
var nav = require('./dashboard/_nav');
var Tooltip = require('./dashboard/_tooltip');
var refresh = require('./common/_refresh');
var summary = require('./president/_summary');

var initialJson = JSON.parse(document.querySelector('script[data-json]').getAttribute('data-json'));

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

var changelogEl = document.getElementById('changelog');
var changelog = new Changelog(changelogEl, initialJson);

var summaryEl = document.getElementById('president-summary');
var updateSummary = summary(summaryEl);
updateSummary(initialJson);

var tooltip = new Tooltip({
  el: document.getElementById('tooltip'),
  mapEl: mapEl,
  races: initialJson.races,
  raceType: 'president',
  mapType: 'state'
});

function setTitleSummary(summary) {
  console.log(summary.nClintonElectoralVotes);
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
  map.update(json.races);
  changelog.update(json);
  updateNav(json.summaries);
  updateSummary(json);
  tooltip.setData(json.races);
}

var refreshEl = document.getElementById('refresh');
refresh(refreshEl, '/2016/results/president.json', doRefresh);
