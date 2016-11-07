var Summary = require('../dashboard/Summary');

/**
 * Returns a function to refresh the <div#president-summary> that's passed
 * in as `el`.
 */
module.exports = function presidentSummary(el, initialJson) {
  var summary = new Summary({
    demScore: el.querySelector('.total-clinton strong'),
    gopScore: el.querySelector('.total-trump strong'),
    demVotes: el.querySelector('.clinton-popular-votes strong'),
    gopVotes: el.querySelector('.trump-popular-votes strong'),
    races: el.querySelector('ol.races')
  });

  summary.update = function(data) {
    var s = data.summaries.president;

    summary.refreshCounts(
      s.nClintonElectoralVotes,
      s.nTrumpElectoralVotes,
      s.nClinton,
      s.nTrump
    );
    summary.refreshRaces(data.races);
  };

  summary.update(initialJson);

  return summary;
};
