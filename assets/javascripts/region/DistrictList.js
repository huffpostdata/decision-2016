function formatFraction(numerator, denominator) {
  return denominator ? formatPercent((numerator || 0) / denominator) : '';
}

function formatPercent(fraction) {
  return (100 * fraction).toFixed(0) + '%';
}

function setPercent(td, candidate, nVotes) {
  if (!candidate || !candidate.n) return; // e.g., no "dem" running, or no votes in
  if (td.childNodes.length === 0) td.innerHTML = '<div class="percent"></div>';
  td.childNodes[0].textContent = formatFraction(candidate.n, nVotes);
}

function DistrictList(options) {
  if (!options.el) throw new Error('Must pass options.el, an HTMLElement');

  this.raceIdToDom = {};
  var trs = options.el.querySelectorAll('tr[data-race-id]');
  for (var i = 0; i < trs.length; i++) {
    var tr = trs[i];
    this.raceIdToDom[tr.getAttribute('data-race-id')] = {
      tr: tr,
      dem: tr.querySelector('td.dem'),
      gop: tr.querySelector('td.gop'),
      third: tr.querySelector('td.third'), // it may or may not include a .percent
      fractionReporting: tr.querySelector('td.percent-reporting')
    };
  }
}

DistrictList.prototype.update = function(races) {
  for (var i = 0; i < races.length; i++) {
    var race = races[i];
    var dom = this.raceIdToDom[race.id];
    if (!dom) continue; // should never happen
    dom.tr.className = race.className;
    setPercent(dom.dem, race.dem, race.nVotes);
    setPercent(dom.gop, race.gop, race.nVotes);
    setPercent(dom.third, race.third, race.nVotes);
    dom.fractionReporting.textContent = formatPercent(race.fractionReporting);
  }
};

module.exports = DistrictList;
