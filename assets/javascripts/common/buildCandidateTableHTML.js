var formatInt = require('./formatInt');

var setText = function(race, raceType){
  var summaryFigure = null;
  var htmlInject = null;

  switch(raceType) {
    case 'president':
      summaryFigure = race.nElectoralVotes;
      // TK better sentence (NE1 and ME1 have one vote)
      htmlInject = [
        '<div class="inner">',
        '<h3 class="state-name">' + race.name + '</h3>',
        '<p class="state-summary">The candidate who wins the popular vote ',
        'will win all ' + '<span class="electoralvotes">' + summaryFigure + '</span>' + ' of ' + 'TK' + '\'s electoral votes.</p>',
        '</div>'
      ]
      break;
    case 'senate':
      summaryFigure = race.fractionReporting;
      htmlInject = [
        '<div class="inner">',
        '<h3 class="state-name">' + race.name + '</h3>',
        '<p class="fraction-reporting">' + 100 * Math.round(summaryFigure) + '% of vote counted</p>',
        '</div>'
      ]
      break;
    case 'house':
      summaryFigure = race.fractionReporting;
      htmlInject = [
        '<div class="inner">',
        '<h3 class="state-name">' + race.name + '</h3>',
        '<p class="fraction-reporting">' + 100 * Math.round(summaryFigure) + '% of vote counted</p>',
        '</div>'
      ]
      break;
  }
  return htmlInject;
}

var buildTable = function(race, raceType, noText) {
  var textSummary = noText ? [] : setText(race, raceType);
  var candidates = race.candidates;
  var votesTotal = race.nVotes;

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
      cdType = 'CANDIDATE'
      break
  }

  var htmlInject = ['<table class="' + race.className + '">',
    '<thead>', '<tr>',
    '<th class="name">' + cdType + '</th>',
    '<th class="votes" colspan="2">VOTES</th>',
    '<th class="percent"></th>',
    '</tr>', '</thead><tbody>'];

  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
    var candidateWon = candidate.winner ? 'winner' : '';
    var cdName = candidate[cdNameAccessor];
    var incumbentSpan = candidate.incumbent === true ? ' <span class="incumbent">i</span>' : '';
    var cdVotes = candidate[cdVotesAccessor];
    var cdVotesPct = votesTotal === 0 ? 0 : 100 * (cdVotes / votesTotal)
    var voteBarWidth = votesTotal === 0 ? 0 : 100 * (cdVotes / leadingCount);
    htmlInject.push(['<tr class="' + candidateWon + '">',
      '<td class="name">' + cdName + incumbentSpan +  '</td>',
      '<td class="vote-count">' + formatInt(cdVotes) + '</td>',
      '<td class="votes">',
        '<div class="vote-bar ' + candidate.partyId + '" style="width: ' + voteBarWidth + '%;"></div>',
      '</td>',
      '<td class="percent">' + Math.round(cdVotesPct) + '%</td>',
      '</tr>'].join(''));
  }
  htmlInject.push('</tbody></table>');
  for (var i = 0; i < htmlInject.length; i++) {
    textSummary.push(htmlInject[i])
  }
  return textSummary.join('');
}

module.exports = buildTable;
