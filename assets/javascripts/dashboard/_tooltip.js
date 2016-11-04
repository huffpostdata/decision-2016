
function hasClass (el, checkClass) {
  return !!el.className.match( checkClass ) //match returns null, return true/false;
}

function Tooltip(options) {
  if (!options.el) throw new Error('Must set options.el, an HTMLElement');
  if (!options.mapEl) throw new Error('Must set options.mapEl, an HTMLElement');
  if (!options.races) throw new Error('Must set options.races, the initial races JSON');

  this.mapEl = options.mapEl;
  this.tooltip = options.el;
  this.stateName = this.tooltip.querySelector('.state-name');
  this.stateSummary = this.tooltip.querySelector('.state-summary');
  var _this = this;

  function positionTooltip(ev) {
    var mapWidth = _this.mapEl.offsetWidth;
    var width = parseFloat(_this.tooltip.offsetWidth);
    var height = parseFloat(_this.tooltip.offsetHeight);
    var xPos = Math.floor(ev.pageX - width / 2);
    var yPos = Math.floor(ev.pageY - height - 20);
    _this.tooltip.style.left = xPos + 'px';
    _this.tooltip.style.top = yPos + 'px';
  }

  function setText(raceId, raceType) {
    var dataRef = _this.raceData[raceId];
    var textEl = _this.tooltip.querySelector('.inner');
    var name = null
    var summaryFigure = null;
    var htmlInject = null;

    switch(raceType) {
      case 'president':
        name = dataRef.stateName;
        summaryFigure = dataRef.nElectoralVotes;
        // TK better sentence (NE1 and ME1 have one vote)
        htmlInject = [
          '<h3 class="state-name">' + name + '</h3>',
          '<p class="state-summary">The candidate who wins the popular vote ',
          'will win all ' + summaryFigure + ' of ' + name + '\'s electoral votes</p>',
        ]
        break;
      case 'senate':
        name = dataRef.stateName;
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
      default:
        'CANDIDATE'
        break
    }

    var htmlInject = ['<table>', '<thead>', '<tr>',
      '<th class="name">' + cdType + '</th>',
      '<th class="votes" colspan="2">VOTES</th>',
      '<th class="percent"></th>',
      '</tr>', '</thead><tbody>'];

    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      var cdName = candidate[cdNameAccessor];
      var cdVotes = candidate[cdVotesAccessor];
      var cdVotesPct = votesTotal === 0 ? 0 : 100 * (cdVotes / leadingCount);
      htmlInject.push(['<tr>',
        '<td class="name">' + cdName + '</td>',
        '<td class="vote-count">' + cdVotes + '</td>',
        '<td class="votes">',
          '<div class="vote-bar ' + candidate.partyId + '" style="width: ' + cdVotesPct + '%;"></div>',
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
    if (ev.target.tagName !== 'path' || /mesh$/.test(ev.target.className)) {
      return;
    }

    var raceId = ev.target.getAttribute('data-race-id');
    if(!_this.raceData[raceId].seatClass || _this.raceData[raceId].seatClass === '3') {
      highlight(raceId);
      buildTable(raceId, options.raceType);
      _this.tooltip.style.display = 'block'; //set display before getting h/w
      positionTooltip(ev);
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
