function SplitVoteDistricts(options) {
  if (!options.el) throw new Error('Must pass options.el, an HTMLElement');
  this.el = options.el;

  this.raceIdToDom = {};
  var trs = options.el.querySelectorAll('tr[data-race-id]');
  for (var i = 0; i < trs.length; i++) {
    var tr = trs[i];
    this.raceIdToDom[tr.getAttribute('data-race-id')] = {
      tr: tr,
      winner: tr.querySelector('td.winner')
    };
  }
}

SplitVoteDistricts.prototype.update = function(races) {
  for (var i = 0; i < races.length; i++) {
    var race = races[i];
    var dom = this.raceIdToDom[race.id];
    if (!dom) continue; // should never happen
    dom.tr.className = race.className;
    dom.winner.textContent = race.candidates[0].winner ? race.candidates[0].name : '';
  }
};

module.exports = SplitVoteDistricts;
