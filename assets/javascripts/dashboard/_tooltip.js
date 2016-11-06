
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

  function setText(race, raceType) {
    var textEl = _this.tooltip.querySelector('.inner');
    var summaryFigure = null;
    var htmlInject = null;

    switch(raceType) {
      case 'president':
        summaryFigure = race.nElectoralVotes;
        // TK better sentence (NE1 and ME1 have one vote)
        htmlInject = [
          '<h3 class="state-name">' + race.name + '</h3>',
          '<p class="state-summary">The candidate who wins the popular vote ',
          'will win all ' + '<span class="electoralvotes">' + summaryFigure + '</span>' + ' of ' + name + '\'s electoral votes.</p>',
        ]
        break;
      case 'senate':
        summaryFigure = race.fractionReporting;
        htmlInject = [
          '<h3 class="state-name">' + race.name + '</h3>',
          '<p class="fraction-reporting">' + 100 * Math.round(summaryFigure) + '% of votes counted</p>'
        ]
        break;
      case 'house':
        summaryFigure = race.fractionReporting;
        htmlInject = [
          '<h3 class="state-name">' + race.name + '</h3>',
          '<p class="fraction-reporting">' + 100 * Math.round(summaryFigure) + '% of votes counted</p>'
        ]
        break;
    }
    textEl.innerHTML = htmlInject.join('');
  }

  function buildTable(race, raceType) {

    setText(race, raceType);
    var candidates = race.candidates;
    var votesTotal = race.nVotes;
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

    var htmlInject = ['<table class="' + race.className + '">',
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

  function buildSingleCandidateRace(race) {
    var distName = race.name;
    var textEl = _this.tooltip.querySelector('.inner');
    var table = _this.tooltip.querySelector('.candidate-table');
    var candidate = race.candidates[0];
    var cdParty = candidate.partyId;
    var switchObj = {dem: 'Democrat', gop: 'Republican'};
    var name = candidate.fullName;
    var injectHtml = [
      '<h3>' + race.name + '</h3>',
      '<p>' + switchObj[cdParty] + ' ' + name + ' was uncontested and remains the House Representative'
    ]
    table.innerHTML = '';
    textEl.innerHTML = injectHtml.join('');
  }

  function buildSenateNonRace(race) {
    var textEl = _this.tooltip.querySelector('.inner');
    var table = _this.tooltip.querySelector('.candidate-table');
    var candidate = race.candidates[0];
    var cdParty = candidate.partyId;
    var switchObj = {dem: 'Democrat', gop: 'Republican'};
    var name = candidate.fullName;
    var injectHtml = [
      '<h3>' + race.name + '</h3>',
      '<p>This seat is not up for reelection. ' + switchObj[cdParty] + ' ' + name + ' is the incumbent senator</p>'
    ]
    textEl.innerHTML = injectHtml.join('');
    table.innerHTML = '';
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
    if (ev.target.tagName !== 'path') return;

    var raceId = ev.target.getAttribute(_this.dataAttrAccessor);
    var race = _this.raceData[raceId];
    if (!race) return;

    var isPresidentRace = /^[A-Z][A-Z][0-9]?$/.test(race.id);
    var isSenateRace = /^[A-Z][A-Z]S[123]$/.test(race.id);
    var isSeat3Race = /^[A-Z][A-Z]S3$/.test(race.id);
    var isHouseRace = /^[A-Z][A-Z][0-9][0-9]$/.test(race.id);
    var isSingleCandidateRace = race.candidates.length === 1;

    if (isPresidentRace) {
      buildTable(race, 'president');
      _this.tooltip.style.display = 'block';
      positionTooltip(ev);
      return
    }

    if (isHouseRace) {
      if(isSingleCandidateRace) {
        buildSingleCandidateRace(race);
        _this.tooltip.style.display = 'block';
        positionTooltip(ev);
        return;
      } else {
        buildTable(race, 'house');
        _this.tooltip.style.display = 'block';
        positionTooltip(ev);
        return
      }
    }

    if (isSenateRace) {
      if(!isSeat3Race) {
        buildSenateNonRace(race);
        _this.tooltip.style.display = 'block';
        positionTooltip(ev);
        return;
      } else {
        buildTable(race, 'senate');
        _this.tooltip.style.display = 'block';
        positionTooltip(ev);
        return
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
