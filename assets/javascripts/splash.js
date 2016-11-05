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
  document.body.setAttribute('locale', i18n.currentLocale);

  refreshButton.render();
  electoral.render(data.summaries.president, i18n);
  electionMap.render(data.races, i18n);
  if (showRightRail) {
    battlegrounds.render({ 'battlegrounds': data.battlegrounds, 'races': data.races }, i18n);
    seats.renderHouse(data.summaries.house, i18n);
    seats.renderSenate(data.summaries.senate, i18n);
  }

  function doRefresh(json) {
    electionMap.update(json.races, i18n);
    electoral.update(json.summaries.president, i18n);
    if (showRightRail) {
      battlegrounds.update({ 'battlegrounds': data.battlegrounds, 'races': json.races }, i18n);
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
