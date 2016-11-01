var toolTip = (function() {

//element object and methods
  var element = {};

  element.init = function(targ) {
    this.tooltip = targ;
    this.stateName = targ.querySelector('.state-name');
    this.stateSummary = targ.querySelector('.state-summary');
    this.candidates = targ.querySelector('.candidates');

    this.northEast = ['NH','VT','MA','RI','CT','NJ','DE','MD','DC'];
    this.northEastLocs = {};

    this.positionTooltip = function(stateEl, stateId, isNE){
      var that = this;
      var isNE = isNE || false;
      var mapHeight = document.querySelector('.map').offsetHeight;
      var mapWidth = document.querySelector('.map').offsetWidth;
      var scaleDown = mapWidth / 1294;
      var boundBox = stateEl.getBBox();
      var width;
      var height;
      var offsetX;
      var offsetY;
      var xPos;
      var yPos;
      if (!isNE) {
        this.setText(stateEl, stateId, function(){
          that.tooltip.style.display = 'block'; //set display before getting h/w
          width = parseFloat(that.tooltip.offsetWidth);
          height = parseFloat(that.tooltip.offsetHeight);
          xPos = Math.floor((boundBox.x + boundBox.width / 2) * scaleDown);
          yPos = Math.floor((boundBox.y + boundBox.height / 4) * scaleDown);
          offsetX = width / 2;
          offsetY = height;
          that.tooltip.style.left = xPos - offsetX + 'px';
          that.tooltip.style.top = yPos - offsetY + 'px';
        })
      } else {
        this.setText(stateEl, stateId, function(){
          that.tooltip.style.display = 'block';
          width = parseFloat(that.tooltip.offsetWidth);
          height = parseFloat(that.tooltip.offsetHeight);
          xPos = Math.floor((boundBox.x + boundBox.width) * scaleDown);
          yPos = Math.floor((boundBox.y + boundBox.height) * scaleDown);
          offsetX = (width / 2) + 20;
          offsetY = height + 30;
          that.tooltip.style.left = xPos - offsetX + 'px';
          that.tooltip.style.top = yPos - offsetY + 'px';
        })
      }
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
      var testing = mapRef.querySelectorAll('[data-race-id]')
      var redirect = function(checkId) {
      }
      var stateId = targ.getAttribute('data-race-id').split(/ /, 1)[0];
      var bothCarto = mapRef.classList.contains('cartogram') &&
          targ.parentElement.classList.contains('cartogram');
      var bothGeo = mapRef.classList.contains('geography') &&
          targ.parentElement.classList.contains('geography');
      if (bothCarto) {
        highlight(stateId);
        this.positionTooltip(targ, stateId);
      } else if (bothGeo) {
        if (!this.northEast.includes(stateId)) {
          highlight(stateId);
          this.positionTooltip(targ, stateId);
        } else {
          highlight(stateId);
          this.positionTooltip(this.northEastLocs[stateId], stateId, true);
        }
      }
    }

    this.handleMouseout = function() {
      this.tooltip.style.display = 'none';
      resetHighlights();
    }

    setNortheast();
    setListeners();
  }

  function setNortheast() {
    setTimeout(function() {
      var regEx = /[a-zA-Z]/g
      for (var i = 0; i < element.northEast.length; i++) {
        var stateEls = document.getElementById('map').querySelectorAll('[data-race-id]');
        for (var j = 0; j < stateEls.length; j++) {
          var notBox = stateEls[j].getAttribute('d').match(regEx).length > 5;
          if (stateEls[j].getAttribute('data-race-id') === element.northEast[i] && notBox) {
            element.northEastLocs[element.northEast[i]] = stateEls[j];
          }
        }
      }
    }, 10) // this shouldn't require a timeout
  }

//  helping functions
  function hasClass (el, checkClass) {
    return !!el.className.match( checkClass ) //match returns null, return true/false;
  }

  function appendClass(el, className) {
    if (!hasClass(el, className)) el.className += " " + className;
  }

  function removeClass(el, className) {
    if (hasClass(el, className)) {
      var regEx = new RegExp('(\\s|^)' + className + '(\\s|$)')
      el.className = el.className.replace(regEx, ' ')
    }
  }

  function highlight(stateId) {
    var raceEls = document.getElementById('president-summary').querySelectorAll('li');
    for (var i = 0; i < raceEls.length; i++) {
      if (raceEls[i].getAttribute('data-race-id') == stateId) {
        appendClass(raceEls[i], 'active');
      }
    }
  }

  function resetHighlights() {
    var raceEls = document.querySelectorAll('li');
    for (var i = 0; i < raceEls.length; i++) {
      removeClass(raceEls[i], 'active');
    }
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
