var Map = require('../president/_map');
var i18n;

var mapEl;
var mapSwitcherEl;
var map;

module.exports = {
  render: function(data) {
    electionMap = window.document.getElementById('election_map');
    if(electionMap) {
      electionMap.innerHTML = markoMapSwitcher + markoMap;

      mapEl = document.getElementById('map');
      mapSwitcherEl = document.getElementById('map-switcher');
      map = new Map(mapEl, mapSwitcherEl);

      map.update(data);
    }
  },
  update: function(data) {
    electionMap = window.document.getElementById('election_map');
    if(electionMap) {
      map.update(data);
    }
  }
};
