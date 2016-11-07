
var formatInt = require('../common/formatInt');
var buildCandidateTableHTML = require('../common/buildCandidateTableHTML')

function hasClass (el, checkClass) {
  return !!el.className.match( checkClass ) //match returns null, return true/false;
}

function Tooltip(options) {
  if (!options.el) throw new Error('Must set options.el, an HTMLElement');
  if (!options.mapEl) throw new Error('Must set options.mapEl, an HTMLElement');
  if (!options.races) throw new Error('Must set options.races, the initial races JSON');

  this.mapEl = options.mapEl;
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

  function highlight(raceId) {
    var raceEls = document.querySelectorAll('li[data-race-id=' + raceId + ']');
    for (var i = 0; i < raceEls.length; i++) {
      raceEls[i].classList.add('active');
    }
  }

  function resetHighlights() {
    var raceEls = document.querySelectorAll('li.active');
    for (var i = 0; i < raceEls.length; i++) {
      raceEls[i].classList.remove('active');
    }
  }

  function goToStatePage(ev) {
    var raceId = ev.target.getAttribute(_this.dataAttrAccessor);
    if (raceId && /^[A-Z][A-Z]$/.test(raceId.slice(0,2))) {
      var stateAbbr = raceId.slice(0,2);
      window.top.location = 'state/' + stateAbbr;
    }
  }

  function onMouseOver(ev) {
    if (ev.target.tagName !== 'path') return;

    var raceId = ev.target.getAttribute(_this.dataAttrAccessor);
    var race = _this.raceData[raceId];
    if (!race) return;

    var table = _this.tooltip.querySelector('.candidate-table');
    var text = _this.tooltip.querySelector('.inner');

    text.innerHTML = '';
    table.innerHTML = '';
    table.innerHTML = buildCandidateTableHTML(race, ev.target);
    _this.tooltip.style.display = 'block';
    return
  }

  function onMouseOut(ev) {
    _this.tooltip.style.display = 'none';
    resetHighlights();
  }

  function onMouseMove(ev) {
    positionTooltip(ev);
  }

  function onMouseClick(ev) {
    goToStatePage(ev);
  }

  this.setData = function(data) {
    _this.raceData = {};
    for (var i = 0; i < data.length; i++) {
      _this.raceData[data[i].id] = data[i];
    }
  }

  this.setData(options.races);

  _this.mapEl.addEventListener('mouseover', onMouseOver);
  _this.mapEl.addEventListener('mouseout', onMouseOut);
  _this.mapEl.addEventListener('mousemove', onMouseMove);
  _this.mapEl.addEventListener('click', onMouseClick);
}

module.exports = Tooltip;
