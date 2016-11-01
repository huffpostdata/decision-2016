var formatInt = require('../common/formatInt');

function Summary(els) {
  this.els = els;

  this.raceIdToLi = {};
  var lis = els.races.childNodes;
  for (var i = 0; i < lis.length; i++) {
    var li = lis[i];
    this.raceIdToLi[li.getAttribute('data-race-id')] = li;
  }
}

Summary.prototype.refreshCounts = function(demScore, gopScore, demVotes, gopVotes) {
  this.els.demScore.textContent = formatInt(demScore);
  this.els.gopScore.textContent = formatInt(gopScore);
  this.els.demVotes.textContent = formatInt(demVotes);
  this.els.gopVotes.textContent = formatInt(gopVotes);
};

Summary.prototype.refreshRaces = function(races) {
  for (i = 0; i < races.length; i++) {
    var race = races[i];
    var li = this.raceIdToLi[race.id];

    li.className = race.className;

    // We'll _move_ <li>s instead of repainting them. That way, when somebody
    // hovers over a <li> during a refresh, and the refresh doesn't change
    // anything, the user stays hovering.
    li.style.order = i;
    li.style._webkitOrder = i;
  }
};

module.exports = Summary;
