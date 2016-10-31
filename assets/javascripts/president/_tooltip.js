var toolTip = (function() {
  var element = {};

  element.init = function(targ) {
    this.tooltip = targ;
    this.stateName = targ.querySelector('.state-name');
    this.stateSummary = targ.querySelector('.state-summary');
    this.candidates = targ.querySelector('.candidates');

    this.setText = function(stateEl, stateId) {
      var dataRef = this.raceData[stateId];
      if (stateId !== 'mesh') {
        var stateName = dataRef.name;
        var nElVotes = dataRef.nElectoralVotes;
        this.stateName.textContent = stateName;
        this.stateSummary.textContent = 'The candidate that wins the popular vote will win all ' + nElVotes + ' of ' + stateName + '\'s electoral votes';
      }
    }

    this.positionTooltip = function(stateEl){
      var mapHeight = document.querySelector('.map').offsetHeight;
      var mapWidth = document.querySelector('.map').offsetWidth;
      var boundBox = stateEl.getBBox();
      var scaleDown = mapWidth > mapHeight ? mapWidth / 1294 : mapHeight / 800;
      var xPos = Math.floor((boundBox.x + boundBox.width / 2) * scaleDown);
      var yPos = Math.floor((boundBox.y + boundBox.height / 2) * scaleDown);
      var width = parseFloat(this.tooltip.offsetWidth);
      var height = parseFloat(this.tooltip.offsetHeight);
      var offsetX = (xPos + width) > mapWidth ? ((xPos + width) - mapWidth) : 0;
      var offsetY = (yPos + height) > mapHeight ? ((yPos + height) - mapHeight) : 0;
      this.tooltip.style.left = xPos + 'px';// - offsetX + 'px';
      this.tooltip.style.top = yPos - offsetY + 'px';
    }

    this.buildTable = function(stateEl, stateId) {
      var dataRef = this.raceData[stateId];
      if (stateId !== 'mesh') {
        var candidates = dataRef.candidates;
        var votesTotal = dataRef.nVotes;
        var table = this.tooltip.querySelector('.c-table');
        var iterLimit = candidates.length <= 5 ? candidates.length : 5;
        var htmlInject = ['<table>', '<thead>', '<tr>', '<th></th>', '<th></th>', '<th></th>', '</tr>', '</thead><tbody>']
        for (var i = 0; i < iterLimit; i++) {
          var name = candidates[i].name;
          var votes = candidates[i].n;
          var pct = (votes / votesTotal) * 100;
          var count = '' + candidates[i].n;
          tableStr =['<tr>', '<td class="name" style="width: 25%;">' + name + '</td>', '<td class="vote-bar" style="width: 50%;">', '<div class="vote-div">', '<div style="width: ' + pct + '%; background-color: blue; height: 10px;"></div>', '</div>', '</td>', '<td class="vote-count" style="width: 25%;">' + count + '</td>', '</tr>'];
          htmlInject = htmlInject.concat(tableStr);
        }
        resultStr = '';
        for (var i = 0; i < htmlInject.length; i++) {
          resultStr += htmlInject[i];
        }
        resultStr += '</tbody></table>';
        table.innerHTML = resultStr;
      }
    }

    this.setData = function(data) {
      this.raceData = {};
      for (var i = 0; i < data.length; i++) {
        this.raceData[data[i].id] = data[i];
      }
    }

    this.handleMouseover = function(targ, mapRef) {
      var bothCarto = mapRef.classList.contains('cartogram') && targ.parentElement.classList.contains('cartogram');
      var bothGeo = mapRef.classList.contains('geography') && targ.parentElement.classList.contains('geography');
      if (bothCarto || bothGeo) {
        var stateId = targ.getAttribute('data-race-id').split(/ /, 1)[0];
        this.tooltip.style.display = 'block';
        this.positionTooltip(targ);
        this.setText(targ, stateId);
        this.buildTable(targ, stateId);
      }
    }

    this.handleMouseout = function() {
      this.tooltip.style.display = 'none';
    }
    setListeners();
  }

  function setListeners() {
    var mapDiv = document.getElementById('map');
    mapDiv.addEventListener('mouseover', checkTargetOver, false)
    mapDiv.addEventListener('mouseout', checkTargetOut, false)
  };

  function checkTargetOver(evt) {
    var mapDiv = document.getElementById('map');
    if (evt.target.tagName === 'path') {
      element.handleMouseover(evt.target, mapDiv);
    }
  }

  function checkTargetOut(evt) {
    var mapDiv = document.getElementById('map');
    if (evt.target.tagName === 'path') {
      element.handleMouseout(evt.target, mapDiv);
    }
  }

  return element;
})();

module.exports = function tooltipObject(el) {
  toolTip.init(el);
  return toolTip;
}
