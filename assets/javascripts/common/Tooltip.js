
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
  this.tooltip = options.el;
  this.mapType = options.mapType;
  //  haven't figured out a way to get rid of this map type option yet...
  var mapTypeToDataAttribute = {
    geo: 'data-geo-id',
    state: 'data-race-id'
  }
  this.dataAttrAccessor = mapTypeToDataAttribute[options.mapType];

  this.stateName = this.tooltip.querySelector('.state-name');
  this.stateSummary = this.tooltip.querySelector('.state-summary');
  var _this = this;

  function positionTooltip(ev) {
    var width = parseFloat(_this.tooltip.offsetWidth);
    var height = parseFloat(_this.tooltip.offsetHeight);
    var winY = window.pageYOffset;
    var winWidth = window.innerWidth;
    var xPos = Math.floor(ev.pageX - width / 2);
    var yPos = Math.floor(ev.pageY - height - 20);
    var beyondTop = yPos < winY;
    var beyondLeft = xPos < 0;
    var beyondRight = xPos + width > winWidth;
    var offsetX = 0;
    if (beyondLeft) {
      offsetX = -(xPos);
    } else if (beyondRight) {
      offsetX = (winWidth - (xPos + width));
    }
    if (beyondTop) {
      _this.tooltip.style.top = winY + 'px';
    } else {
      _this.tooltip.style.top = yPos + 'px'
    }
    _this.tooltip.style.left = (xPos + offsetX) + 'px';
  }

  function goToStatePage(stateCode) {
    window.top.location = 'state/' + stateCode;
  }

  function onMouseClick(_, raceId) {
    if (/^[A-Z][A-Z]/.test(raceId) && raceId.length <= 4) {
      goToStatePage(raceId.slice(0, 2));
    }
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

  function highlightRace(raceId, originView, ev) {
    var race = _this.raceData[raceId];
    var table = _this.tooltip.querySelector('.candidate-table');
    var text = _this.tooltip.querySelector('.inner');
    text.innerHTML = '';
    table.innerHTML = '';
    table.innerHTML = buildCandidateTableHTML(race, ev.target);

    _this.tooltip.style.visibility = 'hidden';
    _this.tooltip.style.display = 'block'; // so we can set position
    var position = originView.getDesiredTooltipPosition(raceId, _this.tooltip, ev);
    _this.tooltip.style.top = position.top + 'px';
    _this.tooltip.style.left = position.left + 'px';
    _this.tooltip.style.visibility = 'visible';
  }

  function unhighlightRace() {
    _this.tooltip.style.display = 'none';
  }

  this.setData(options.races);

  function onHover(view, raceIdOrNull, ev) {
    if (!raceIdIsValid(raceIdOrNull)) raceIdOrNull = null;

    // Both highlight _and_ un-highlight the views
    for (var i = 0; i < _this.views.length; i++) {
      _this.views[i].highlightRace(raceIdOrNull);
    }

    // Now adjust the actual tooltip
    if (raceIdOrNull) {
      highlightRace(raceIdOrNull, view, ev);
    } else {
      unhighlightRace();
    }
  }

  for (var i = 0; i < this.views.length; i++) {
    this.views[i].addHoverListener(onHover);
    this.views[i].addMouseClickListener(onMouseClick);
  }
}

module.exports = Tooltip;
