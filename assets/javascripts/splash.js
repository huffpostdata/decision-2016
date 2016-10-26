var battlegrounds = require('./splash/battlegrounds');
var electionMap = require('./splash/election-map')
var electoral = require('./splash/electoral');
var seats = require('./splash/seats');
var refreshButton = require('./splash/refresh-element');
var refresh = require('./common/_refresh');

// window.evupdate = function(c, t, w) {
//   electoral.update({
//     nClinton: 0,
//     nClintonElectoralVotes: c,
//     nTrump: 0,
//     nTrumpElectoralVotes: t,
//     winner: w
//   });
// };

window.decision2016_init = function(data) {
  refreshButton.render();
  electoral.render(data.president);
  electionMap.render(data);
  battlegrounds.render(data.battlegrounds);
  seats.renderHouse(data.house);
  seats.renderSenate(data.senate);

  function doRefresh(json) {
    electoral.update(json.summaries.president);
    battlegrounds.update(data.battlegrounds);
    seats.updateSenate(json.summaries.senate);
    seats.updateHouse(json.summaries.house);
  }

  var refreshEl = document.getElementById('election-splash-refresh');
  if (refreshEl) {
    refresh(refreshEl, presidentUrl, doRefresh);
  }
};

// Warning: this script runs before DOMContentLoaded.
