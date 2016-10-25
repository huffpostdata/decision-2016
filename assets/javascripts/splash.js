var battlegrounds = require('./splash/battlegrounds');
var electionMap = require('./splash/election-map')
var electoral = require('./splash/electoral');
var seats = require('./splash/seats');
var refreshButton = require('./splash/refresh-element');
var refresh = require('./common/_refresh');

function translationJSON() {
  var scripts = document.querySelectorAll('script');
  var script = scripts[scripts.length-1];
  return script.dataset.translations ? JSON.parse(script.dataset.translations) : {};
}
var translations = translationJSON();

window.decision2016_init = function(data) {
  console.log("Sending data", data);
  refreshButton.render();
  electoral.render(data.president, translations);
  electionMap.render(data, translations);
  battlegrounds.render(data.battlegrounds, translations);
  seats.renderHouse(data.house, translations);
  seats.renderSenate(data.senate, translations);

  function doRefresh(json) {
    electoral.update(json.summaries.president);
    battlegrounds.update(data.battlegrounds);
    // TODO: update seats
  }

  var refreshEl = document.getElementById('election-splash-refresh');
  if (refreshEl) {
    refresh(refreshEl, presidentUrl, doRefresh);
  }
};

// Warning: this script runs before DOMContentLoaded.
