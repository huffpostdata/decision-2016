// TODO: Shouldn't be here
var battleground;
var tableBody;

function setUpTable(i18n) {
  var h2 = document.createElement("h2");
  var table = document.createElement("table");
  var tableHead = document.createElement("thead");
  tableBody = document.createElement("tbody");

  h2.textContent = i18n.t('h2.Battleground States')
  h2.setAttribute("class", "module__header");

  tableHead.appendChild(getHeader(i18n));

  table.appendChild(tableHead);
  table.appendChild(tableBody);

  battleground.setAttribute("class", "cell");

  battleground.appendChild(h2);
  battleground.appendChild(table);

}

function getHeader (i18n) {
  var tr = document.createElement("tr");
  var thBlurb = document.createElement("th");
  var thDemHeadshot = document.createElement("th");
  var thGopHeadshot = document.createElement("th");
  var thPrecincts = document.createElement("th");
  var demHeadshot = new Image();
  var gopHeadshot = new Image();

  thBlurb.setAttribute("colspan", 2);
  thBlurb.textContent = i18n.t('battleground.blurb');

  demHeadshot.src = battlegroundsImages.clinton;
  gopHeadshot.src = battlegroundsImages.trump;
  thDemHeadshot.appendChild(demHeadshot);
  thGopHeadshot.appendChild(gopHeadshot);

  thPrecincts.textContent = i18n.t('battleground.precincts');

  tr.appendChild(thBlurb);
  tr.appendChild(thDemHeadshot);
  tr.appendChild(thGopHeadshot);
  tr.appendChild(thPrecincts);

  return tr;
}

function paintRow(data, i18n, formatPercent) {
  // console.debug("painting a happy row", data);
  var row = document.createElement('tr');
  var stateIcon = document.createElement('td');
  var stateInfo = document.createElement('td');
  var stateName = document.createElement('span');
  var stateVotes = document.createElement('span');
  var demPercent = document.createElement('td');
  var gopPercent = document.createElement('td');
  var districtPercent = document.createElement('td');

  stateIcon.setAttribute("class", "state-icon");
  stateIcon.innerHTML = '<span class="state" data-state-id="'+data.abbr.toUpperCase()+'"></span>';

  stateName.setAttribute("class", "state-name");
  stateName.textContent = i18n.t('state.' + data.state);

  stateVotes.setAttribute("class", "votes gop");
  stateVotes.textContent = i18n.t('counts.n Electoral Votes', data.nElectoralVotes);

  stateInfo.appendChild(stateName);
  stateInfo.appendChild(stateVotes);

  demPercent.setAttribute("class", "percent");
  demPercent.textContent = formatPercent(data.demPercent/100);
  gopPercent.setAttribute("class", "percent");
  gopPercent.textContent = formatPercent(data.gopPercent/100);

  districtPercent.setAttribute("class", "percent percent--district");
  districtPercent.textContent = formatPercent(data.percentPrecinctsReporting/100);

  if (data.called && typeof data.winner != 'undefined') {
    row.setAttribute("class", data.winner);
    var winner;
    winner = (data.winner === "dem") ? demPercent : gopPercent;
    winner.className += " percent--winner";
  }

  row.appendChild(stateIcon);
  row.appendChild(stateInfo);
  row.appendChild(demPercent);
  row.appendChild(gopPercent);
  row.appendChild(districtPercent);

  return row;
}

module.exports = {
  update: function(data, i18n) {
    var formatPercent = new Intl.NumberFormat(i18n.local, { style: 'percent' }).format;
    tableBody.innerHTML = "";

    for(var i = 0; i < data.length; i++) {
      var row = paintRow(data[i], i18n, formatPercent);
      tableBody.appendChild(row);
    }
  },
  render: function(data, i18n) {
    battleground = window.document.getElementById('battlegrounds');

    if (battleground) {
      setUpTable(i18n);
      this.update(data, i18n);
    }
  }
};
