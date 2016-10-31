var battlegrounds = require('./splash/battlegrounds');
var electionMap = require('./splash/election-map')
var electoral = require('./splash/electoral');
var seats = require('./splash/seats');
var refreshButton = require('./splash/refresh-element');
var refresh = require('./common/_refresh');
var Polyglot = require('../../node_modules/node-polyglot/build/polyglot');

function buildI18n(options) {
  var numberFormat = typeof Intl === 'object' ? new Intl.NumberFormat(options.locale).format : String;
  return new Polyglot({
    phrases: options.phrases,
    locale: options.locale,
    numberFormat: numberFormat
  });
}

window.decision2016_init = function(data, showRightRail) {
  if (typeof showRightRail === "undefined") {
    showRightRail = true;
  }
  var i18n = buildI18n(data.i18n);

  refreshButton.render();
  electoral.render(data.president, i18n);
  electionMap.render(data.races, i18n);
  if (showRightRail) {
    battlegrounds.render(data.battlegrounds, i18n);
    seats.renderHouse(data.house, i18n);
    seats.renderSenate(data.senate, i18n);
  }

  function doRefresh(json) {
    electionMap.update(json.races, i18n);
    electoral.update(json.summaries.president, i18n);
    if (showRightRail) {
      battlegrounds.update(data.battlegrounds);
      seats.updateSenate(json.summaries.senate);
      seats.updateHouse(json.summaries.house);
    }
  }

  var refreshEl = document.getElementById('election-splash-refresh');
  if (refreshEl) {
    refresh(refreshEl, presidentUrl, doRefresh);
  }
};

// Warning: this script runs before DOMContentLoaded.
