var battlegrounds = require('./splash/battlegrounds');
var electionMap = require('./splash/election-map')
var electoral = require('./splash/electoral');
var seats = require('./splash/seats');
var refreshButton = require('./splash/refresh-element');
var refresh = require('./common/_refresh');
var Polyglot = require('../../node_modules/node-polyglot/build/polyglot');

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

function buildI18n(options) {
  var numberFormat = typeof Intl === 'object' ? new Intl.NumberFormat(options.locale).format : String;
  return new Polyglot({
    phrases: options.phrases,
    locale: options.locale,
    numberFormat: numberFormat
  });
}

window.decision2016_init = function(data) {
  var i18n = buildI18n(data.i18n);

  refreshButton.render();
  // electoral.render(data.president, i18n);
  electoral.render({
    nClinton: data.president.nClinton,
    nClintonElectoralVotes: 0,
    nTrump: data.president.nTrump,
    nTrumpElectoralVotes: 0,
    winner: data.winner
  });
  electionMap.render(data, i18n);
  battlegrounds.render(data.battlegrounds, i18n);
  seats.renderHouse(data.house, i18n);
  seats.renderSenate(data.senate, i18n);

  function doRefresh(json) {
    // electoral.update(json.summaries.president);
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
