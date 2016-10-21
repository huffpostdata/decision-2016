var formatInt = require('../common/formatInt');

function refreshEls(els, summary, races) {
  var i, li, race;

  els.clintonNElectoralVotes.textContent = summary.nClintonElectoralVotes;
  els.trumpNElectoralVotes.textContent = summary.nTrumpElectoralVotes;
  els.clintonNVotes.textContent = formatInt(summary.nClinton);
  els.trumpNVotes.textContent = formatInt(summary.nTrump);

  var raceIdToRace = {};
  for (i = 0; i < races.length; i++) {
    race = races[i];
    raceIdToRace[race.id] = race;
  }

  // We'll _move_ <li>s instead of repainting them. That way, when somebody
  // hovers over a <li> during a refresh, and the refresh doesn't change
  // anything, the user stays hovering.
  var lis = els.races.childNodes;
  var raceLis = [];
  for (i = 0; i < lis.length; i++) {
    li = lis[i];
    var raceId = li.getAttribute('data-race-id');
    raceLis.push({
      li: li,
      race: raceIdToRace[raceId]
    });
  }

  var Order = { clinton: 0, other: 1, tossup: 2, trump: 3 };
  function compare(a, b) {
    var aOrder = Order[a.race.winner] || 1;
    var bOrder = Order[b.race.winner] || 1;
    if (aOrder !== bOrder) return aOrder - bOrder;

    return a.race.name.localeCompare(b.race.name);
  }

  // Easiest way to move: change the 'order' style
  raceLis.sort(compare);

  for (i = 0; i < raceLis.length; i++) {
    li = raceLis[i].li;
    li.setAttribute('style', 'order: ' + i + '; -webkit-order: ' + i);
  }
}

/**
 * Returns a function to refresh the <div#president-summary> that's passed
 * in as `el`.
 */
module.exports = function presidentSummary(el) {
  var els = {
    clintonNElectoralVotes: el.querySelector('.total-clinton strong'),
    trumpNElectoralVotes: el.querySelector('.total-trump strong'),
    clintonNVotes: el.querySelector('.clinton-popular-votes strong'),
    trumpNVotes: el.querySelector('.trump-popular-votes strong'),
    races: el.querySelector('ol.races')
  };

  return function(data) { return refreshEls(els, data.summaries.president, data.races); };
};
