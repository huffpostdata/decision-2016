// TODO: Shouldn't be here
var battleground;
var tableBody;

function setUpTable () {
  var h2 = document.createElement("h2");
  var table = document.createElement("table");
  var tableHead = document.createElement("thead");
  tableBody = document.createElement("tbody");

  h2.innerHTML = "Battleground States";

  tableHead.appendChild(getHeader());

  table.appendChild(tableHead);
  table.appendChild(tableBody);

  battleground.setAttribute("class", "cell");

  battleground.appendChild(h2);
  battleground.appendChild(table);

}

function getHeader () {
  var tr = document.createElement("tr");
  var thBlurb = document.createElement("th");
  var thDemHeadshot = document.createElement("th");
  var thGopHeadshot = document.createElement("th");
  var thPrecincts = document.createElement("th");
  var demHeadshot = new Image(50, 50);
  var gopHeadshot = new Image(50, 50);

  thBlurb.setAttribute("colspan", 2);
  thBlurb.innerHTML = "States win which no single candidate or party has a guarantee in securing the majority of electoral votes";

  demHeadshot.src = "http://www.placekitten.com/50/50";
  gopHeadshot.src = "https://www.placecage.com/50/50";
  thDemHeadshot.appendChild(demHeadshot);
  thGopHeadshot.appendChild(gopHeadshot);

  thPrecincts.innerHTML = "Precincts Reporting";

  tr.appendChild(thBlurb);
  tr.appendChild(thDemHeadshot);
  tr.appendChild(thGopHeadshot);
  tr.appendChild(thPrecincts);

  return tr;
}

function paintRow(data) {
  // console.debug("painting a happy row", data);
  var imgIcon = document.createElement('img');
  var row = document.createElement('tr');
  var stateIcon = document.createElement('td');
  var stateInfo = document.createElement('td');
  var stateName = document.createElement('span');
  var stateVotes = document.createElement('span');
  var demPercent = document.createElement('td');
  var gopPercent = document.createElement('td');
  var districtPercent = document.createElement('td');

  imgIcon.src = "https://unsplash.it/40/?random";
  stateIcon.setAttribute("class", "state-icon");

  stateName.setAttribute("class", "state");
  stateName.innerHTML = data.state;

  stateVotes.setAttribute("class", "votes gop");
  stateVotes.innerHTML = data.nElectoralVotes + " Electoral Votes";


  stateIcon.appendChild(imgIcon);
  stateInfo.appendChild(stateName);
  stateInfo.appendChild(stateVotes);

  demPercent.setAttribute("class", "percent");
  demPercent.innerHTML = data.demPercent + "%";
  gopPercent.setAttribute("class", "percent");
  gopPercent.innerHTML = data.gopPercent + "%";

  districtPercent.setAttribute("class", "percent");
  districtPercent.innerHTML = data.percentPrecinctsReporting + "%";

  row.setAttribute("data-state", data.abbr);

  if (data.called && typeof data.winner != 'undefined') {
    row.setAttribute("class", data.winner);
    var winner;
    winner = (data.winner === "dem") ? demPercent : gopPercent;
    winner.className += "--winner";
  }

  row.appendChild(stateIcon);
  row.appendChild(stateInfo);
  row.appendChild(demPercent);
  row.appendChild(gopPercent);
  row.appendChild(districtPercent);

  return row;
}

module.exports = {
  render: function(data) {
    battleground = window.document.getElementById('battlegrounds');

    if (battleground) {
      setUpTable();
      tableBody.innerHTML = "";

      for(var i = 0; i < data.length; i++) {
        var row = paintRow(data[i]);
        tableBody.appendChild(row);
      }
    }
  }
};
