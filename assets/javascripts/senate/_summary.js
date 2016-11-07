var Summary = require('../dashboard/Summary');

/**
 * Returns a function to refresh the <div#senate-summary> that's passed
 * in as `el`.
 */
module.exports = function senateSummary(el, initialJson) {
  var summary = new Summary({
    demScore: el.querySelector('.total-dem strong'),
    gopScore: el.querySelector('.total-gop strong'),
    demVotes: el.querySelector('.dem-popular-votes strong'),
    gopVotes: el.querySelector('.gop-popular-votes strong'),
    races: el.querySelector('ol.races')
  });

  summary.update = function(data) {
    var s = data.summaries.senate;

    summary.refreshCounts(
      s.totals.dem,
      s.totals.gop,
      s.popular.dem,
      s.popular.gop
    );
    summary.refreshRaces(data.races);
  };

  summary.update(initialJson);

  return summary;
};
