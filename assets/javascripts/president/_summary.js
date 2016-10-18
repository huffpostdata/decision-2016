var formatInt = require('../common/formatInt');

function compareRaces(a, b) {
  return a.w
}

function refreshEls(els, summary, races) {
  var i, li, race;

  els.clintonNElectoralVotes.textContent = summary.nClintonElectoralVotes;
  els.trumpNElectoralVotes.textContent = summary.nTrumpElectoralVotes;
  els.clintonNVotes.textContent = formatInt(summary.nClinton);
  els.trumpNVotes.textContent = formatInt(summary.nTrump);

  // We'll _move_ <li>s instead of repainting them. That way, when somebody
  // hovers over a <li> during a refresh, and the refresh doesn't change
  // anything, the user stays hovering.

  var raceIdToRace = {};
  for (i = 0; i < races.length; i++) {
    race = races[i];
    raceIdToRace[race.id] = race;
  }

  var lis = els.races.childNodes;
  var li;
  var outOfOrderLis = [];
  var raceIdToLi = {};
  for (i = 0; i < lis.length; i++) {
    li = lis[i];
    var raceId = li.getAttribute('data-race-id');
    race = raceIdToRace[raceId];
    var className = race.winner || 'tossup';
    raceIdToLi[raceId] = { name: race.name, className: className, li: li };
    if (li.className !== className) { // the only change that can pull it out of order
      outOfOrderLis.push(raceIdToLi[raceId]);
      li.className = className;
      // Don't call els.races.removeChild() here -- it'll break iteration
    }
  }

  var Order = { clinton: 0, other: 1, tossup: 2, trump: 3 };
  function compare(a, b) {
    var aOrder = Order[a.className] || 1;
    var bOrder = Order[b.className] || 1;
    if (aOrder !== bOrder) return aOrder - bOrder;

    return a.name.localeCompare(b.name);
  }
  outOfOrderLis.sort(compare);

  // Remove <li>s we want to move...
  for (i = 0; i < outOfOrderLis.length; i++) {
    li = outOfOrderLis[i];
    els.races.removeChild(li.li);
  }

  // ... and then add them back in -- a merge.
  // "lis" is a NodeList.
  for (i = 0; i < lis.length && outOfOrderLis.length > 0; i++) {
    li = raceIdToLi[lis[i].getAttribute('data-race-id')];
    if (compare(outOfOrderLis[0], li) < 0) {
      els.races.insertBefore(lis[i], outOfOrderLis.shift().li);
    }
  }
  while (outOfOrderLis.length > 0) {
    els.races.appendChild(outOfOrderLis.shift().li);
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
