function setWidth(el, numerator, denominator) {
  el.style.width = (100 * numerator / denominator) + '%';
}

function refreshEls(els, summaries) {
  var bars;
  var summary;

  // TK images
  bars = els.president.bars;
  summary = summaries.president;
  setWidth(bars.clinton, summary.nClintonElectoralVotes, summary.nElectoralVotes);
  setWidth(bars.trump, summary.nTrumpElectoralVotes, summary.nElectoralVotes);
  setWidth(bars.tossup, summary.nTossupElectoralVotes, summary.nElectoralVotes);
  els.president.image.className = 'image ' + (
    summary.winner ? (summary.winner + '-win')
    : (summary.nClintonElectoralVotes > summary.nTrumpElectoralVotes ? 'clinton-lead'
      : (summary.nTrumpElectoralVotes > summary.nClintonElectoralVotes ? 'trump-lead' : '')));

  bars = els.senate.bars;
  summary = summaries.senate;
  setWidth(bars.dem, summary.totals.dem, summary.n);
  setWidth(bars.gop, summary.totals.gop, summary.n);
  setWidth(bars.tossup, summary.tossup, summary.n);
  els.senate.image.className = 'image ' + (
    summary.totals.dem > 50 ? 'dem-win'
    : (summary.totals.gop > 50 ? 'gop-win'
      : (summary.totals.dem > summary.totals.gop ? 'dem-lead'
        : (summary.totals.gop > summary.totals.dem ? 'gop-lead'
          : (summary.totals.dem === 50 ? 'tie' : 'tossup')))));

  bars = els.house.bars;
  summary = summaries.house;
  setWidth(bars.dem, summary.wins.dem, summary.total);
  setWidth(bars.gop, summary.wins.gop, summary.total);
  setWidth(bars.tossup, summary.tossup, summary.total);
  setWidth(bars.other, summary.total - summary.tossup - summary.wins.dem - summary.wins.gop, summary.total);
  var nWin = Math.ceil(summary.total / 2);
  els.house.image.className = 'image ' + (
    summary.wins.dem >= nWin ? 'dem-win'
    : (summary.wins.gop > nWin ? 'gop-win'
      : (summary.wins.dem > summary.wins.gop ? 'dem-lead'
        : (summary.wins.gop > summary.wins.dem ? 'gop-lead'
          : (summary.wins.tossup === 0 ? 'tie' : 'tossup')))));
}

/**
 * Returns a function to refresh the <nav> that's passed in as `el`.
 */
module.exports = function nav(el) {
  var els = {
    president: {
      bars: {
        clinton: el.querySelector('li.president .clinton'),
        trump: el.querySelector('li.president .trump'),
        tossup: el.querySelector('li.president .tossup')
      },
      image: el.querySelector('li.president .image')
    },
    senate: {
      bars: {
        dem: el.querySelector('li.senate .dem'),
        gop: el.querySelector('li.senate .gop'),
        tossup: el.querySelector('li.senate .tossup')
      },
      image: el.querySelector('li.senate .image')
    },
    house: {
      bars: {
        dem: el.querySelector('li.house .dem'),
        gop: el.querySelector('li.house .gop'),
        tossup: el.querySelector('li.house .tossup'),
        other: el.querySelector('li.house .other')
      },
      image: el.querySelector('li.house .image')
    }
  };

  return function(data) { return refreshEls(els, data); };
};
