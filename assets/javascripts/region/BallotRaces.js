var formatFractionReporting = require('../dashboard/formatFractionReporting');

function formatFraction(numerator, denominator) {
  return denominator ? ((100 * (numerator || 0) / denominator).toFixed(0) + '%') : '';
}

function BallotRaces(options) {
  if (!options.el) throw new Error('Must set options.el, an HTMLElement');
  if (!options.percentReportingEl) throw new Error('Must set options.percentReportingEl, an HTMLPElement');

  this.percentReportingEl = options.percentReportingEl;

  this.raceIdToDom = {};
  var trs = options.el.querySelectorAll('tr[data-race-id]');
  for (var i = 0; i < trs.length; i++) {
    var tr = trs[i];
    this.raceIdToDom[tr.getAttribute('data-race-id')] = {
      tr: tr,
      yay: tr.querySelector('td.yay strong'),
      nay: tr.querySelector('td.nay strong')
    };
  }
}

BallotRaces.prototype.update = function(races) {
  var minFractionReporting = 0;

  for (var i = 0; i < races.length; i++) {
    var race = races[i];
    var dom = this.raceIdToDom[race.id];
    if (!dom) continue; // should never happen
    dom.tr.className = race.className;
    dom.yay.textContent = formatFraction(race.yay.n, race.nVotes);
    dom.nay.textContent = formatFraction(race.nay.n, race.nVotes);

    if (race.fractionReporting > minFractionReporting) {
      minFractionReporting = race.fractionReporting;
    }
  }

  this.percentReportingEl.textContent = formatFractionReporting(minFractionReporting) + ' of votes counted';
};

module.exports = BallotRaces;
