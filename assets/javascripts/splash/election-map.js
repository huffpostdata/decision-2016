var Map = require('../dashboard/_map');
var i18n;

var mapEl;
var mapSwitcherEl;
var map;

module.exports = {
  render: function(data, _i18n) {
    var geographyTab = '.geography > .tab__link h5';
    var cartogramTab = '.cartogram > .tab__link h5';

    electionMap = window.document.getElementById('election_map');

    if(electionMap) {
      electionMap.innerHTML = markoMapSwitcher + markoMap;

      mapEl = document.getElementById('map');
      mapSwitcherEl = document.getElementById('map-switcher');

      mapSwitcherEl.querySelector(geographyTab).innerHTML = _i18n.t('h5.Geography');
      mapSwitcherEl.querySelector(cartogramTab).innerHTML = _i18n.t('h5.Cartogram');

      map = new Map({ el: mapEl, switchEl: mapSwitcherEl, racesJson: data });
    }
  },
  update: function(data, _i18n) {
    electionMap = window.document.getElementById('election_map');
    if(electionMap) {
      map.update(data);
    }
  }
};
