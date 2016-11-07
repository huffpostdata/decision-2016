var formatInt = require('../common/formatInt');

function Summary(els) {
  this.els = els;

  this.raceIdToLi = {};
  var lis = els.races.childNodes;
  for (var i = 0; i < lis.length; i++) {
    var li = lis[i];
    this.raceIdToLi[li.getAttribute('data-race-id')] = li;
  }

  this.highlightedRaceId = null;
}

Summary.prototype.refreshCounts = function(demScore, gopScore, demVotes, gopVotes) {
  this.els.demScore.textContent = formatInt(demScore);
  this.els.gopScore.textContent = formatInt(gopScore);
  this.els.demVotes.textContent = formatInt(demVotes);
  this.els.gopVotes.textContent = formatInt(gopVotes);
};

/**
 * Calls callback(this, raceId, ev) and callback(null), for all of time, depending
 * on user actions.
 *
 * The caller should be able to handle spurious calls with the same raceId (or
 * spurious `null` calls).
 */
Summary.prototype.addHoverListener = function(callback) {
  var _this = this;
  var ol = this.els.races;
  ol.addEventListener('mouseover', function(ev) {
    if (ev.target.hasAttribute('data-race-id')) {
      callback(_this, ev.target.getAttribute('data-race-id'), ev);
    }
  });
  ol.addEventListener('mouseout', function(ev) {
    callback(null);
  });
};

/**
 * Calls callback(this, raceId), depending on user actions.
 *
 * Does not call the callback on tap.
 */
Summary.prototype.addMouseClickListener = function(callback) {
  var _this = this;
  this.els.races.addEventListener('mousedown', function(ev) {
    if (ev.target.hasAttribute('data-race-id')) {
      callback(_this, ev.target.getAttribute('data-race-id'));
    }
  });
};

/**
 * Returns the {top,left} of where the top+left of the tooltip should go, in
 * document coordinates.
 *
 * In other words: `{top: 0, left: 0}` is the first pixel on the page.
 */
Summary.prototype.getDesiredTooltipPosition = function(raceId, el, ev) {
  return { top: 700, left: 500 };
};

Summary.prototype.highlightRace = function(raceIdOrNull) {
  if (!this.raceIdToLi.hasOwnProperty(raceIdOrNull)) raceId = null;
  if (raceIdOrNull === this.highlightedRaceId) return;
  if (this.highlightedRaceId) this.raceIdToLi[this.highlightedRaceId].classList.remove('highlight');
  this.highlightedRaceId = raceIdOrNull;
  if (this.highlightedRaceId) this.raceIdToLi[this.highlightedRaceId].classList.add('highlight');
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

Summary.prototype.highlightRace = function(raceIdOrNull) {
  if (!this.raceIdToLi.hasOwnProperty(raceIdOrNull)) raceIdOrNull = null;
  if (raceIdOrNull === this.highlightedRaceId) return;
  if (this.highlightedRaceId) this.raceIdToLi[this.highlightedRaceId].classList.remove('highlight');
  this.highlightedRaceId = raceIdOrNull;
  if (this.highlightedRaceId) this.raceIdToLi[this.highlightedRaceId].classList.add('highlight');
};

module.exports = Summary;
