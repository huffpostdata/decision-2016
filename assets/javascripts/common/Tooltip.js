
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
  //  haven't figured out a way to get rid of this map type option yet...
  var mapTypeToDataAttribute = {
    geo: 'data-geo-id',
    state: 'data-race-id'
  }
  this.dataAttrAccessor = mapTypeToDataAttribute[options.mapType];

  var _this = this;

  function goToStatePage(stateCode) {
    window.top.location = _this.urlTemplate.replace('XX', stateCode);
  }

  function onMouseClick(_, raceId) {
    goToStatePage(raceId.slice(0, 2));
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
    _this.el.innerHTML = '<div class="candidate-table">' + buildCandidateTableHTML(race, ev.target, { i18n: _this.i18n, urlTemplate: _this.urlTemplate }) + '</div>';

    _this.el.style.visibility = 'hidden';
    _this.el.style.display = 'block'; // so we can set position
    var position = originView.getDesiredTooltipPosition(raceId, _this.el, ev);
    _this.el.style.top = position.top + 'px';
    _this.el.style.left = position.left + 'px';
    _this.el.style.visibility = 'visible';
  }

  function unhighlightRace() {
    _this.el.style.display = 'none';
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

    if (this.urlTemplate) {
      this.views[i].addMouseClickListener(onMouseClick);
    }
  }
}

module.exports = Tooltip;
