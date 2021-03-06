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
 * Calls callback(this, raceId, ev) and callback(this, null, ev), for all of
 * time, depending on user actions.
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
    callback(_this, null, ev);
  });
};

/**
 * Calls callback(this, raceId, inNewWindow), depending on user actions.
 *
 * Does not call the callback on tap.
 */
Summary.prototype.addMouseClickListener = function(callback) {
  var _this = this;

  // A tap causes click, too, but we want to treat tap as hover, not click.
  // Solution: assume touchend comes before mousedown, and prevent mousedown
  // events that happen right after touchend.
  // ref: https://patrickhlauke.github.io/touch/tests/results/
  var lastTouchendDate = null;
  document.addEventListener('touchend', function(ev) {
    lastTouchendDate = new Date();
  });

  this.els.races.addEventListener('click', function(ev) {
    if (ev.button !== 0 && ev.button !== 1) return;
    if (new Date() - lastTouchendDate < 2000) return; // arbitrary number
    if (ev.target.hasAttribute('data-race-id')) {
      callback(_this, ev.target.getAttribute('data-race-id'), ev.button === 1 || ev.ctrlKey);
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
  var tooltipBox = el.getBoundingClientRect();
  var li = this.raceIdToLi[raceId] || this.els.races;
  var liBox = li.getBoundingClientRect();

  var top = window.pageYOffset + liBox.bottom + 10;
  var left = window.pageXOffset + liBox.left + (liBox.width / 2) - (tooltipBox.width / 2);

  var windowRight = document.documentElement.clientWidth;
  if (left < 0) left = 0;
  if (left + tooltipBox.width > windowRight) {
    left = windowRight - tooltipBox.width;
  }

  return { top: top, left: left };
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

    var highlighted = li.classList.contains('highlight');
    li.className = race.className;
    if (highlighted) li.classList.add('highlight');

    // We'll _move_ <li>s instead of repainting them. That way, when somebody
    // hovers over a <li> during a refresh, and the refresh doesn't change
    // anything, the user stays hovering.
    li.style.order = i;
    li.style._webkitOrder = i;
  }
};

module.exports = Summary;
