var cartogramData = require('./_cartogramData');

function statePath(stateCode, axy) {
  var s = 15 * Math.sqrt(axy.a); // length of a side
  var d = 'M' + axy.x + ',' + axy.y + 'h' + s + 'v' + s + 'h-' + s + 'Z';

  return [
    '<g data-state-code="' + stateCode + '">',
      '<path class="square" d="' + d + '"/>',
      '<text class="label" x="', (axy.x + s / 2), '" y="', (axy.y + s / 2), '">', stateCode, '</text>',
    '</g>'
  ].join('');

  return '<path data-state-code="' + stateCode + '" d="' + d + '"/>';
}

function StateEl(stateCode, el) {
  this.stateCode = stateCode;
  this.el = el;
}

StateEl.prototype.setRaceData = function(data) {
  var className;
  if (data.winner) {
    className = data.winner + '-win';
  } else if (data.nVotesClinton > data.nVotesTrump) {
    className = 'clinton-lead';
  } else if (data.nVotesTrump > data.nVotesClinton) {
    className = 'trump-lead';
  } else {
    className = 'tossup';
  }

  this.el.setAttribute('class', className);
};

/**
 * Renders a cartogram in the given `el`, and returns a `refresh` function that
 * lets you insert new data.
 */
module.exports = function(el, data) {
  var statePaths = [];
  for (var stateCode in cartogramData) {
    if (cartogramData.hasOwnProperty(stateCode)) {
      statePaths.push(statePath(stateCode, cartogramData[stateCode]));
    }
  }

  el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 647 400">' + statePaths.join('') + '</svg>';

  /**
   * Returns mapping from state code to StateEl.
   */
  function getStateEls() {
    var ret = {};
    var els = el.querySelectorAll('g[data-state-code]');
    for (var i = 0; i < els.length; i++) {
      var g = els[i];
      var stateCode = g.getAttribute('data-state-code');
      ret[stateCode] = new StateEl(stateCode, g);
    }

    return ret;
  }

  var stateEls = getStateEls();

  function update(races) {
    for (var i = 0; i < races.length; i++) {
      var race = races[i];
      var stateEl = stateEls[race.id];
      if (!stateEl) {
        console.log("Not rendering race " + race.id);
        continue;
      }
      stateEl.setRaceData(race);
    }
  }

  return update;
};
