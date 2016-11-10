
var formatInt = require('../common/formatInt');
var buildCandidateTableHTML = require('../common/buildCandidateTableHTML')

function hasClass (el, checkClass) {
  return !!el.className.match( checkClass ) //match returns null, return true/false;
}

function Tooltip(options) {
  if (!options.el) throw new Error('Must set options.el, an HTMLElement');
  if (!options.views) throw new Error('Must set options.views, an Array of Objects');
  if (!options.races) throw new Error('Must set options.races, the initial races JSON');

  this.views = options.views;
  this.el = options.el;
  this.mapType = options.mapType;
  this.i18n = options.i18n || null;
  this.urlTemplate = options.urlTemplate || null;

  var _this = this;

  function goToStatePage(stateCode, inNewWindow) {
    var url = _this.urlTemplate.replace('XX', stateCode);
    inNewWindow = inNewWindow || /^http:\/\//.test(url); //On splash? Open in a new tab, always
    if (inNewWindow) {
      var win = window.open(url, '_blank');
      win.focus();
    } else {
      window.top.location = url;
    }
  }

  function onMouseClick(_, raceId, inNewWindow) {
    goToStatePage(raceId.slice(0, 2), inNewWindow);
  }

  this.setData = function(data) {
    _this.raceData = {};
    for (var i = 0; i < data.length; i++) {
      _this.raceData[data[i].id] = data[i];
    }
  }

  function raceIdIsValid(raceId) {
    return _this.raceData.hasOwnProperty(raceId);
  }

  function canTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }

  function highlightRace(raceId, originView, ev) {
    for (var i = 0; i < _this.views.length; i++) {
      _this.views[i].highlightRace(raceId);
    }

    if (canTouch()) {
      _this.el.classList.add('on-touch-device');
    } else {
      _this.el.classList.remove('on-touch-device');
    }

    var race = _this.raceData[raceId];
    _this.el.innerHTML = '<div class="candidate-table"><a href="#" class="close only-touch">×</a>' + buildCandidateTableHTML(race, ev.target, { i18n: _this.i18n, urlTemplate: _this.urlTemplate }) + '</div>';

    _this.el.style.visibility = 'hidden';
    _this.el.style.display = 'block'; // so we can set position
    var position = originView.getDesiredTooltipPosition(raceId, _this.el, ev);
    _this.el.style.top = position.top + 'px';
    _this.el.style.left = position.left + 'px';
    _this.el.style.visibility = 'visible';
  }

  function unhighlightRace() {
    for (var i = 0; i < _this.views.length; i++) {
      _this.views[i].highlightRace(null);
    }
    _this.el.style.display = 'none';
  }

  this.setData(options.races);

  function isMouseoutReallyTouchstartOnTooltipA(ev) {
    // If we're touching a <a> within the tooltip, ignore the "Un-highlight"
    // event because we want the tooltip to stay up while we touch it.
    if (!canTouch()) return false;

    var node = ev.relatedTarget;
    console.log(ev, ev.relatedTarget, node.tagName);
    if (node.tagName !== 'A') return false;

    while (node !== null) {
      console.log(node);
      if (node === _this.el) return true;
      node = node.parentNode;
    }

    return false;
  }

  function onHover(view, raceIdOrNull, ev) {
    if (ev.type === 'mouseout' && isMouseoutReallyTouchstartOnTooltipA(ev)) {
      return;
    }

    if (!raceIdIsValid(raceIdOrNull)) raceIdOrNull = null;

    // Now adjust the actual tooltip
    if (raceIdOrNull) {
      highlightRace(raceIdOrNull, view, ev);
    } else {
      unhighlightRace();
    }
  }

  // Close the popup when touching "a.close"
  this.el.addEventListener('click', function(ev) {
    if (ev.target.tagName === 'A' && ev.target.classList.contains('close')) {
      ev.preventDefault();
      unhighlightRace();
    }
  });

  for (var i = 0; i < this.views.length; i++) {
    this.views[i].addHoverListener(onHover);

    if (this.urlTemplate) {
      this.views[i].addMouseClickListener(onMouseClick);
    }
  }
}

module.exports = Tooltip;
