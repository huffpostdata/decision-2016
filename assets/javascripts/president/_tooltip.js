function refreshEls(els, races) {

  dataById = {}
  for (var i = 0; i < races.length; i++) {
    dataById[races[i].id] = races[i];
  }

  var positionTooltip = function(stateEl){
    var mapHeight = document.querySelector('.map').offsetHeight;
    var mapWidth = document.querySelector('.map').offsetWidth;
    var boundBox = stateEl.getBBox();
    var scaleDown = mapWidth > mapHeight ? mapWidth / 1294 : mapHeight / 800;
    // var scaleDown = mapWidth / 1294;
    // var yRatio = mapWidth / 800;
    var xPos = (boundBox.x + boundBox.width / 2) * scaleDown;
    var yPos = (boundBox.y + boundBox.height / 2) * scaleDown;
    var width = parseFloat(els.tooltip.offsetWidth);
    var height = parseFloat(els.tooltip.offsetHeight);
    var offsetX = (xPos + width) > mapWidth ? ((xPos + width) - mapWidth) : 0;
    var offsetY = (yPos + height) > mapHeight ? ((yPos + height) - mapHeight) : 0;
    els.tooltip.style.left = xPos - offsetX + 'px';
    els.tooltip.style.top = yPos - offsetY + 'px';
  }

  var setText = function(stateEl) {
    var stateId = stateEl.getAttribute('class');
    var stateName = dataById[stateId].name;
    var nElVotes = dataById[stateId].nElectoralVotes;
    els.stateName.textContent = stateName;
    els.stateSummary.textContent = 'The candidate that wins the popular vote will win all ' + nElVotes + ' of ' + stateName + '\'s electoral votes';
  }

  var buildTable = function(stateEl) {
    var stateId = stateEl.getAttribute('class');
    var candidates = dataById[stateId].candidates;
    var votesTotal = dataById[stateId].nVotes;
    var table = els.tooltip.querySelector('.c-table');
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

  var handleMouseover = function(stateEl) {
    els.tooltip.style.display = 'block';
    positionTooltip(stateEl);
    setText(stateEl);
    buildTable(stateEl);
  }

  var handleMouseout = function() {
    els.tooltip.style.display = 'none';
  }

  function setListeners() {
    var maps = document.getElementById('map');
    var cartStates = maps.querySelector('.president-cartogram').querySelectorAll('path');
    var geoStates = maps.querySelector('.states').querySelectorAll('path');
    for (var i = 0; i < cartStates.length; i++) {
      cartStates[i].addEventListener('mouseover', function() {
        var that = this;
         handleMouseover(that);
       }, false);
      cartStates[i].addEventListener('mouseout', function() {
        handleMouseout();
      }, false);
    }
  }
  setListeners();
}

module.exports = function presidentByState(el) {
  var els = {
    'tooltip': el,
    'stateName': el.querySelector('.state-name'),
    'stateSummary': el.querySelector('.state-summary'),
    'candidates': el.querySelector('.candidates'),
  }
  return function(data) {
    return refreshEls(els, data.races);
  }
}
