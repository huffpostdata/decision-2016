var toolTip = (function() {
  var element = {};

  element.init = function(targ) {
    this.tooltip = targ;
    this.stateName = targ.querySelector('.state-name');
    this.stateSummary = targ.querySelector('.state-summary');
    this.candidates = targ.querySelector('.candidates');

    this.positionTooltip = function(stateEl, stateId){
      var that = this
      this.setText(stateEl, stateId, function(){
        that.tooltip.style.display = 'block';
        var mapHeight = document.querySelector('.map').offsetHeight;
        var mapWidth = document.querySelector('.map').offsetWidth;
        var boundBox = stateEl.getBBox();
        var scaleDown = mapWidth > mapHeight ? mapWidth / 1294 : mapHeight / 800;
        var xPos = Math.floor((boundBox.x + boundBox.width / 2) * scaleDown);
        var yPos = Math.floor((boundBox.y + boundBox.height / 4) * scaleDown);
        var width = parseFloat(that.tooltip.offsetWidth);
        var height = parseFloat(that.tooltip.offsetHeight);
        var offsetX = width / 2;
        var offsetY = height;
        that.tooltip.style.left = xPos - offsetX + 'px';// - offsetX + 'px';
        that.tooltip.style.top = yPos - offsetY + 'px';
      })
    }

    this.setText = function(stateEl, stateId, callback) {
      var that = this
      this.buildTable(stateEl, stateId, function() {
        var dataRef = that.raceData[stateId];
        if (stateId !== 'mesh') {
          var stateName = dataRef.name;
          var nElVotes = dataRef.nElectoralVotes;
          that.stateName.textContent = stateName;
          that.stateSummary.textContent = 'The candidate that wins the popular vote will win all ' + nElVotes + ' of ' + stateName + '\'s electoral votes';
        }
      })
      callback();
    }


    this.buildTable = function(stateEl, stateId, callback) {
      var dataRef = this.raceData[stateId];
      if (stateId !== 'mesh') {
        var candidates = dataRef.candidates;
        var votesTotal = dataRef.nVotes;
        var table = this.tooltip.querySelector('.c-table');
        var iterLimit = candidates.length <= 5 ? candidates.length : 5;
        var htmlInject = ['<table>', '<thead>', '<tr>',
          '<th class="cd">President</th>',
          '<th class="vote-ct">Votes</th>',
          '<th class="vote-pct">Percent</th>',
          '</tr>', '</thead><tbody>']
        for (var i = 0; i < iterLimit; i++) {
          var name = candidates[i].name;
          var votes = candidates[i].n;
          var pct = (votes / votesTotal) * 100;
          var count = '' + candidates[i].n;
          tableStr =['<tr>',
            '<td class="name" style="width: 30%;">' + name + '</td>',
            '<td class="vote-bar" style="width: 50%;">',
              '<div class="vote-div">',
                '<div style="width: ' + pct + '%; background-color: blue; height: 10px;"></div>',
                '<span style="position: absolute; top: 0px; left: ' + (pct + 2) + '%;">' + count + '</span>',
              '</div>',
            '</td>',
            '<td class="vote-count" style="width: 20%;">' + Math.floor(pct) + '%</td>',
            '</tr>'];
          htmlInject = htmlInject.concat(tableStr);
        }
        resultStr = '';
        for (var i = 0; i < htmlInject.length; i++) {
          resultStr += htmlInject[i];
        }
        resultStr += '</tbody></table>';
        table.innerHTML = resultStr;
      }
      callback();
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
        this.positionTooltip(targ, stateId);
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
