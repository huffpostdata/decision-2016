function BallotRaces(options) {
  if (!options.el) throw new Error('Must set options.el, an HTMLElement');
  this.el = options.el;

  this.raceIdToDom = {};
  var trs = this.el.querySelectorAll('tr[data-race-id]');
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
  for (var i = 0; i < races.length; i++) {
    var race = races[i];
    var dom = this.raceIdToDom[race.id];
    if (!dom) continue; // should never happen
    dom.tr.className = race.className;
    dom.yay.textContent = race.nVotes === 0 ? '' : ((100 * race.yay.n / race.nVotes).toFixed(0) + '%');
    dom.nay.textContent = race.nVotes === 0 ? '' : ((100 * race.nay.n / race.nVotes).toFixed(0) + '%');
  }
};

module.exports = BallotRaces;
