
var formatInt = require('../common/formatInt');
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
  var mapTypeSwitch = {
    geo: 'data-geo-id',
    state: 'data-race-id'
  }
  this.dataAttrAccessor = mapTypeSwitch[options.mapType];

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

  function setText(raceId, raceType) {
    var dataRef = _this.raceData[raceId];
    var textEl = _this.tooltip.querySelector('.inner');
    var name = null
    var summaryFigure = null;
    var htmlInject = null;

    switch(raceType) {
      case 'president':
        name = dataRef.stateName || dataRef.name;
        summaryFigure = dataRef.nElectoralVotes;
        // TK better sentence (NE1 and ME1 have one vote)
        htmlInject = [
          '<h3 class="state-name">' + name + '</h3>',
          '<p class="state-summary">The candidate who wins the popular vote ',
          'will win all ' + summaryFigure + ' of ' + name + '\'s electoral votes</p>',
        ]
        break;
      case 'senate':
        name = dataRef.stateName || dataRef.name;
        summaryFigure = dataRef.fractionReporting;
        htmlInject = [
          '<h3 class="state-name">' + name + '</h3>',
          '<p class="fraction-reporting">' + summaryFigure + '</p>'
        ]
        break;
      case 'house':
        name = dataRef.name;
        summaryFigure = dataRef.fractionReporting;
        htmlInject = [
          '<h3 class="state-name">' + name + '</h3>',
          '<p class="fraction-reporting">' + summaryFigure + '</p>'
        ]
        break;
    }
    textEl.innerHTML = htmlInject.join('');
  }

  function setSingleCandidateHouseRace(data) {
    var textEl = _this.tooltip.querySelector('.inner');
    var table = _this.tooltip.querySelector('.candidate-table');
    var candidate = data.candidates[0];
    var cdParty = candidate.partyId;
    var switchObj = {dem: 'Democrat', gop: 'Republican'};
    var distName = data.name;
    var name = candidate.fullName;
    var injectHtml = [
      '<h3>' + distName + '</h3>',
      '<p>' + switchObj[cdParty] + ' ' + name + ' won the race uncontested'
    ]
    table.innerHTML = '';
    textEl.innerHTML = injectHtml.join('');
  }

  function buildTable(raceId, raceType) {
    var dataRef = _this.raceData[raceId];

    if (raceType === 'house' && dataRef.candidates.length === 1) {
      setSingleCandidateHouseRace(dataRef);
      return
    }

    setText(raceId, raceType);
    var candidates = dataRef.candidates;
    var votesTotal = dataRef.nVotes;
    var table = _this.tooltip.querySelector('.candidate-table');
    if (table === null) return; // DELETEME TK I was getting crashes on staging

    var cdType = null;
    var cdVotesAccessor = 'n';
    var cdNameAccessor = 'name';

    var leadingCount = Math.max.apply(null, candidates.map(function(d) { return d[cdVotesAccessor]; }));

    switch(raceType) {
      case 'president':
        cdType = 'PRESIDENT';
        break
      case 'senate':
        cdType = 'SENATOR';
        break
      case 'house':
        cdType = 'HOUSE REP.'
        break
      case 'geoPresident':
        cdType = 'PRESIDENT'
      default:
        cdType = 'CANDIDATE'
        break
    }

    var htmlInject = ['<table class="' + dataRef.className + '">',
      '<thead>', '<tr>',
      '<th class="name">' + cdType + '</th>',
      '<th class="votes" colspan="2">VOTES</th>',
      '<th class="percent"></th>',
      '</tr>', '</thead><tbody>'];

    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      var candidateWon = candidate.winner ? 'winner' : '';
      var cdName = candidate[cdNameAccessor];
      var incumbentSpan = candidate.incumbent === true ? ' <span class="incumbent">i</span>' : '';
      var cdVotes = candidate[cdVotesAccessor];
      var cdVotesPct = votesTotal === 0 ? 0 : 100 * (cdVotes / votesTotal)
      var voteBarWidth = votesTotal === 0 ? 0 : 100 * (cdVotes / leadingCount);
      htmlInject.push(['<tr class="' + candidateWon + '">',
        '<td class="name">' + cdName + incumbentSpan +  '</td>',
        '<td class="vote-count">' + formatInt(cdVotes) + '</td>',
        '<td class="votes">',
          '<div class="vote-bar ' + candidate.partyId + '" style="width: ' + voteBarWidth + '%;"></div>',
        '</td>',
        '<td class="percent">' + Math.round(cdVotesPct) + '%</td>',
        '</tr>'].join(''));
    }
    htmlInject.push('</tbody></table>');
    table.innerHTML = htmlInject.join('');
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

  function onMouseOver(ev) {
    if (ev.target.tagName !== 'path' || /mesh$/.test(ev.target.getAttribute('class'))) {
      return;
    }
    var raceId = ev.target.getAttribute(_this.dataAttrAccessor);

    if (_this.mapType === 'geo') {
      buildTable(raceId, options.raceType);
      _this.tooltip.style.display = 'block';
      positionTooltip(ev);
    } else {
      if(!_this.raceData[raceId].seatClass || _this.raceData[raceId].seatClass === '3') {
        buildTable(raceId, options.raceType);
        _this.tooltip.style.display = 'block'; //set display before getting h/w
        positionTooltip(ev);
      }
    }
  }

  function onMouseOut(ev) {
    _this.tooltip.style.display = 'none';
    resetHighlights();
  }

  function onMouseMove(ev) {
    positionTooltip(ev);
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
}

module.exports = Tooltip;
