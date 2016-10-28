var battlegrounds = require('./splash/battlegrounds');
var electionMap = require('./splash/election-map')
var electoral = require('./splash/electoral');
var seats = require('./splash/seats');
var refreshButton = require('./splash/refresh-element');
var refresh = require('./common/_refresh');

window.evupdate = function(c, t) {
  var w;
  if (c > 269) {
    w = 'clinton';
  }
  if (t > 269) {
    w = 'trump';
  }
  electoral.update({
    nClinton: 1000000,
    nClintonElectoralVotes: c,
    nTrump: 5000,
    nTrumpElectoralVotes: t,
    winner: w
  });
};

window.decision2016_init = function(data) {
  console.log("Sending data", data);
  refreshButton.render();
  // electoral.render(data.president);
  electoral.render({
    nClinton: data.president.nClinton,
    nClintonElectoralVotes: 0,
    nTrump: data.president.nTrump,
    nTrumpElectoralVotes: 0,
    winner: data.winner
  });
  electionMap.render(data);
  battlegrounds.render(data.battlegrounds);
  seats.renderHouse(data.house);
  seats.renderSenate(data.senate);

  function doRefresh(json) {
    // electoral.update(json.summaries.president);
    battlegrounds.update(data.battlegrounds);
    // TODO: update seats
  }

  var refreshEl = document.getElementById('election-splash-refresh');
  if (refreshEl) {
    refresh(refreshEl, presidentUrl, doRefresh);
  }
};

// Warning: this script runs before DOMContentLoaded.
