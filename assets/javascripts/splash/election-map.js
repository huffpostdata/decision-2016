var Map = require('../dashboard/_map');

var mapEl;
var mapSwitcherEl;
var map;
var legend;

module.exports = {
  render: function(data, _i18n) {
    electionMap = document.getElementById('election_map');

    if(electionMap) {
      electionMap.innerHTML = markoLegend +
                              "<div class='map__wrapper'>" +
                              markoMapSwitcher + markoMap
                              "</div>";

      mapEl = electionMap.querySelector('div[data-src]');
      mapSwitcherEl = electionMap.querySelector('#map-switcher');

      mapSwitcherEl.querySelector('.geography > .tab__link h5').innerHTML = _i18n.t('h5.Geography');
      mapSwitcherEl.querySelector('.cartogram > .tab__link h5').innerHTML = _i18n.t('h5.Cartogram');
      mapSwitcherEl.querySelector('.switch__message').innerHTML = _i18n.t('map.switch message');

      electionMap.querySelector('dt.open').innerHTML = _i18n.t('legend.No winner yet');
      electionMap.querySelector('dt.dem-win').innerHTML = _i18n.t('legend.Clinton win');
      electionMap.querySelector('dt.gop-win').innerHTML = _i18n.t('legend.Trump win');
      electionMap.querySelector('.legend__header').innerHTML = _i18n.t('legend.title');
      electionMap.querySelector('.resultsTxt').innerHTML = _i18n.t('linkout.See Full Results');

      map = new Map({ el: mapEl, switchEl: mapSwitcherEl, racesJson: data, onLoad: function () {
        var paths = mapEl.querySelectorAll("text");
        for (i = 0; i < paths.length; i++) {
          var path = paths[i];
          path.textContent = !!path.textContent ? _i18n.t('state-abbreviation.' + path.textContent) : '';
        }
      }});
    }
  },
  update: function(data, _i18n) {
    electionMap = window.document.getElementById('election_map');
    if(electionMap) {
      map.update(data);
    }
  }
};
