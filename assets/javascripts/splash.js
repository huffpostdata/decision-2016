var battlegrounds = require('./splash/battlegrounds');
var seats = require('./splash/seats');
var refreshButton = require('./splash/refresh-element');
var refresh = require('./common/_refresh');

window.decision2016_init = function(data) {
  console.log("Sending data", data);
  refreshButton.render();
  battlegrounds.render(data.battlegrounds);
  seats.renderHouse(data.house);
  seats.renderSenate(data.senate);

  function doRefresh(json) {
    seats.renderHouse(json.summaries.house);
    seats.renderSenate(json.summaries.senate);
  }

  var refreshEl = document.getElementById('election-splash-refresh');
  if (refreshEl) {
    debugger
    refresh(refreshEl, '/2016/results/president.json', doRefresh);
  }
};

// Warning: this script runs before DOMContentLoaded.
