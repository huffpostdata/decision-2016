function toolTip(options) {
  this.mapEl = options.mapEl;
  this.tooltip = options.el
  this.stateName = this.tooltip.querySelector('.state-name');
  this.precinctsReporting = this.tooltip.querySelector('.precincts-reporting');
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
    var stateName = dataRef.stateName;
    _this.stateName.textContent = stateName;
    _this.precinctsReporting.textContent = 'TK% of votes counted reporting'
  }

  function buildTable(raceId) {
    setText(raceId);
    var dataRef = _this.raceData[raceId];
    var candidates = dataRef.candidates;
    var table = _this.tooltip.querySelector('.c-table');
    var htmlInject = ['<table>', '<thead>', '<tr>',
      '<th class="cd">SENATOR</th>',
      '<th class="vote-ct">VOTES</th>',
      '<th class="vote-pct">PERCENT</th>',
      '</tr>', '</head><tbody>'];
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      var name = candidate.name;
      var votes = candidate.n;
      htmlInject.push(['<tr>',
        '<td class="name" style="width: 33%;">' + name + '</td>',
        '<td class="vote-count" style="width:33%;">' + votes + '</td>',
        '<td class="vote-pct" style="width:33%;">TK</td>',
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
    var raceId = ev.target.getAttribute('data-race-id');
    if (ev.target.tagName !== 'path' || /mesh$/.test(ev.target.className) ||
      _this.raceData[raceId].seatClass !== '3') return;

    highlight(raceId);
    buildTable(raceId);
    _this.tooltip.style.display = 'block';
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

module.exports = toolTip;
