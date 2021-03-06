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

  tableHead.innerHTML = [
    '<tr>',
      '<th class="blurb" colspan="2">', i18n.t('battleground.blurb'), '</th>', // TK escapeHtml
      '<th class="clinton"></th>',
      '<th class="trump"></th>',
      '<th class="precincts">', i18n.t('battleground.precincts'), '</th>', // TK escapeHtml
    '</tr>'
  ].join('');

  table.appendChild(tableHead);
  table.appendChild(tableBody);

  battleground.setAttribute("class", "cell");

  battleground.appendChild(h2);
  battleground.appendChild(table);
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

  var votesClintonAsPercentage = data.nVotes ? data.nVotesClinton/data.nVotes : 0;
  var votesTrumpAsPercentage = data.nVotes ? data.nVotesTrump/data.nVotes : 0;

  stateIcon.setAttribute("class", "state-icon");
  stateIcon.innerHTML = '<span class="state" data-state-id="'+data.id+'"></span>';

  stateName.setAttribute("class", "state-name");
  stateName.textContent = i18n.t('state.' + data.name);

  stateVotes.setAttribute("class", "votes");
  stateVotes.textContent = i18n.t('counts.n Electoral Votes', data.nElectoralVotes);

  stateInfo.appendChild(stateName);
  stateInfo.appendChild(stateVotes);

  demPercent.setAttribute("class", "percent percent--clinton");
  gopPercent.setAttribute("class", "percent percent--trump");

  demPercent.textContent = formatPercent(votesClintonAsPercentage);
  gopPercent.textContent = formatPercent(votesTrumpAsPercentage);

  districtPercent.setAttribute("class", "percent percent--district");
  districtPercent.textContent = formatPercent(data.fractionReporting);

  row.setAttribute('class', data.className);

  row.appendChild(stateIcon);
  row.appendChild(stateInfo);
  row.appendChild(demPercent);
  row.appendChild(gopPercent);
  row.appendChild(districtPercent);

  return row;
}

function getBattlegroundData(data) {
  var idToRace = {}; 
  var battlegroundData = [];
  data.races.forEach(function(race) { 
    idToRace[race.id] = race; 
  });
  data.battlegrounds.forEach(function(state) {
    battlegroundData.push(idToRace[state]);
  });
  return battlegroundData;
}

function updateData(data, i18n) {
  function formatPercentForIE10(number) {
    return Math.round(number*100) + '%';
  }
  var formatPercent = typeof Intl === 'object' ? new Intl.NumberFormat(i18n.locale, { style: 'percent' }).format : formatPercentForIE10;
  tableBody.innerHTML = "";

  for(var i = 0; i < data.length; i++) {
    var row = paintRow(data[i], i18n, formatPercent);
    tableBody.appendChild(row);
  }
}

module.exports = {
  update: function(data, i18n) {
    var battlegroundData = getBattlegroundData(data);
    updateData(battlegroundData, i18n);
  },
  render: function(data, i18n) {
    battleground = window.document.getElementById('battlegrounds');
    var battlegroundData = getBattlegroundData(data);

    if (battleground) {
      setUpTable(i18n);
      updateData(battlegroundData, i18n);
    }
  }
};
