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

  function setText(raceId) {
    var dataRef = _this.raceData[raceId];
    var stateName = dataRef.name;
    var nElVotes = dataRef.nElectoralVotes;
    _this.stateName.textContent = stateName;
    // TK better sentence (NE1 and ME1 have one vote)
    _this.stateSummary.textContent = 'The candidate who wins the popular vote will win all ' + nElVotes + ' of ' + stateName + '\'s electoral votes';
  }

  function buildTable(raceId) {
    setText(raceId);
    var dataRef = _this.raceData[raceId];
    var candidates = dataRef.candidates;
    var votesTotal = dataRef.nVotes;
    var table = _this.tooltip.querySelector('.c-table');
    var htmlInject = ['<table>', '<thead>', '<tr>',
      '<th class="cd">President</th>',
      '<th class="vote-ct">Votes</th>',
      '<th class="vote-pct">Percent</th>',
      '</tr>', '</thead><tbody>'];
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      var name = candidate.name;
      var votes = candidate.n;
      var pct = votesTotal === 0 ? 0 : 100 * (votes / votesTotal);
      var count = '' + candidate.n;
      htmlInject.push(['<tr>',
        '<td class="name" style="width: 30%;">' + name + '</td>',
        '<td class="vote-bar" style="width: 50%;">',
          '<div class="vote-div">',
            '<div style="width: ' + pct + '%; background-color: blue; height: 10px;"></div>',
            '<span style="position: absolute; top: 0px; left: ' + (pct + 2) + '%;">' + count + '</span>',
          '</div>',
        '</td>',
        '<td class="vote-count" style="width: 20%;">' + Math.round(pct) + '%</td>',
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
    if (ev.target.tagName !== 'path' || /mesh$/.test(ev.target.className)) return;

    var raceId = ev.target.getAttribute('data-race-id');
    highlight(raceId);
    buildTable(raceId);
    _this.tooltip.style.display = 'block'; //set display before getting h/w
    positionTooltip(ev);
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
