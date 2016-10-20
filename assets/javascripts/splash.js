var battlegrounds = require('./splash/battlegrounds');
var electoral = require('./splash/electoral');
var seats = require('./splash/seats');
var refreshButton = require('./splash/refresh-element');
var refresh = require('./common/_refresh');

window.decision2016_init = function(data) {
  console.log("Sending data", data);
  refreshButton.render();
  electoral.render(data.president);
  battlegrounds.render(data.battlegrounds);
  seats.renderHouse(data.house);
  seats.renderSenate(data.senate);

  function doRefresh(json) {
    electoral.update(json.summaries.president);
    seats.renderHouse(json.summaries.house);
    seats.renderSenate(json.summaries.senate);
  }

  var refreshEl = document.getElementById('election-splash-refresh');
  if (refreshEl) {
    refresh(refreshEl, presidentUrl, doRefresh);
  }
};

// Warning: this script runs before DOMContentLoaded.
