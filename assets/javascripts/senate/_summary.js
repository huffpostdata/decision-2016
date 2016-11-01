var Summary = require('../dashboard/Summary');

/**
 * Returns a function to refresh the <div#senate-summary> that's passed
 * in as `el`.
 */
module.exports = function senateSummary(el) {
  var summary = new Summary({
    demScore: el.querySelector('.total-dem strong'),
    gopScore: el.querySelector('.total-gop strong'),
    demVotes: el.querySelector('.dem-popular-votes strong'),
    gopVotes: el.querySelector('.gop-popular-votes strong'),
    races: el.querySelector('ol.races')
  });

  return function(data) {
    var s = data.summaries.senate;
    console.log(s);

    summary.refreshCounts(
      s.totals.dem,
      s.totals.gop,
      s.popular.dem,
      s.popular.gop
    );
    summary.refreshRaces(data.races);
  };
};
