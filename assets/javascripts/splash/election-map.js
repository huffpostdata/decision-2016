var Map = require('../common/Map');
var MapSwitcher = require('../common/MapSwitcher');

var races = null;
var map = null;

function translateLegend(el, i18n) {
  el.querySelector('dt.open').innerHTML = i18n.t('legend.No winner yet');
  el.querySelector('dt.dem-win').innerHTML = i18n.t('legend.Clinton win');
  el.querySelector('dt.gop-win').innerHTML = i18n.t('legend.Trump win');
  el.querySelector('.legend__header').innerHTML = i18n.t('legend.title');
  el.querySelector('.resultsTxt').innerHTML = i18n.t('linkout.See Full Results');
}

function translateMapSwitcher(el, i18n) {
  el.querySelector('.geography > .tab__link h5').innerHTML = i18n.t('h5.Geography');
  el.querySelector('.cartogram > .tab__link h5').innerHTML = i18n.t('h5.Cartogram');
  el.querySelector('.switch__message').innerHTML = i18n.t('map.switch message');
}

function translateMapSvg(svg, i18n) {
  var paths = svg.querySelectorAll("text");
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    path.textContent = !!path.textContent ? i18n.t('state-abbreviation.' + path.textContent) : '';
  }
}

module.exports = {
  render: function(_races, i18n) {
    var electionMap = document.getElementById('election_map');
    if (!electionMap) return;

    races = _races; // when the map loads, we'll color it

    electionMap.innerHTML = markoLegend + "<div class='map__wrapper'>" + markoMapSwitcher + markoMap + "</div>";

    translateLegend(electionMap, i18n);

    var mapSwitcherEl = electionMap.querySelector('#map-switcher');
    translateMapSwitcher(mapSwitcherEl, i18n);

    var mapContainerEl = electionMap.querySelector('div[data-src]');
    Map.loadSvg({
      url: mapContainerEl.getAttribute('data-src'),
      idAttribute: 'data-race-id',
      idRegex: /^[A-Z][A-Z]\d?$/
    }, function(err, svg) {
      if (err) throw err;

      translateMapSvg(svg, i18n);

      map = new Map({
        svg: svg,
        idAttribute: 'data-race-id',
        races: races,
        legendEl: document.createElement('div') // we don't use a dynamic legend on splash
      });

      mapContainerEl.appendChild(svg);
      mapContainerEl.classList.remove('loading');

      new MapSwitcher({ el: mapSwitcherEl, mapContainerEl: mapContainerEl, map: map });
    });
  },

  update: function(races) {
    if (map) map.update(races);
  }
};
