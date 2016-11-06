var Map = require('../common/Map');

module.exports = function(options) {
  return new Map({
    svg: options.svg,
    races: options.races,
    legendEl: options.legendEl,
    idAttribute: 'data-geo-id'
  });
};
