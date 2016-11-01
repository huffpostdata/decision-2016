var Summary = require('../dashboard/Summary');

/**
 * Returns a function to refresh the <div#house-summary> that's passed
 * in as `el`.
 */
module.exports = function houseSummary(el) {
  var summary = new Summary({
    demScore: el.querySelector('.total-dem strong'),
    gopScore: el.querySelector('.total-gop strong'),
    demVotes: el.querySelector('.dem-popular-votes strong'),
    gopVotes: el.querySelector('.gop-popular-votes strong'),
    races: el.querySelector('ol.races')
  });

  return function(data) {
    var s = data.summaries.house;

    summary.refreshCounts(
      s.wins.dem,
      s.wins.gop,
      s.popular.dem,
      s.popular.gop
    );
    summary.refreshRaces(data.races);
  };
};
