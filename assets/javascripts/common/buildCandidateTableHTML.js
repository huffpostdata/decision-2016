var formatInt = require('./formatInt');

//  check race.id to decide which race we are dealing with
var isPresidentRace = /^[A-Z][A-Z][0-9]?$/;
var isSenateRace = /^[A-Z][A-Z]S[123]$/;
var isSeat3Race = /^[A-Z][A-Z]S3$/;
var isHouseRace = /^[A-Z][A-Z][0-9][0-9]$/;
var isSubcountyGeo = /^[0-9]{10}$/;
var isCountyGeo = /^[0-9]{5}$/;

function getTitleFromGeoParentClasses(target) {
  pElements = []
  while (target) {
    pElements.push(target); //  push to go from the bottom up
    target = target.parentNode;
  }
  var ret = null;
  for (var i = 0; i < pElements.length; i++) {
    var elClass = pElements[i].className;
    if (elClass === 'president') {
      ret = elClass.toUpperCase();
      break;
    } else if (elClass === 'senate') {
      ret = 'SENATOR';
    }
  }
  return ret;
}

function raceIdToCandidateType(raceId, target) {
  if (isHouseRace.test(raceId)) return 'HOUSE REP.';
  if (isPresidentRace.test(raceId)) return 'PRESIDENT';
  if (isSenateRace.test(raceId)) return 'SENATOR';
  if (isSubcountyGeo.test(raceId) || isCountyGeo.test(raceId)) return getTitleFromGeoParentClasses(target);
  return
}

var setText = function(race, target){
  var summaryFigure = null;
  var summaryLine = null;
  var htmlInject = [];

  if (isPresidentRace.test(race.id) && !isSubcountyGeo.test(race.id)) {
    var baseLine = [
      '<div class="inner">',
      '<h3 class="state-name">' + race.name + '</h3>',
    ];
    var votePlurality = race.nElectoralVotes > 1 ? 'votes' : 'vote';
    var pluralModifier = race.nElectoralVotes > 1 ? 'all ' : 'the';
    summaryFigure = race.nElectoralVotes;
    summaryLine = [
      //  the candidate who wins the popular vote will win New Hampshire's 1 available electoral vote
      //  the candidate who wins the popular vote will win all of 1 possible electoral vote in New Hampshire
      //  the candidate who wins the popular vote will win /all 20 electoral votes/the 1 electoral vote/ in ____
      '<p class="state-summary">The candidate who wins the popular vote ',
      'will win ' + pluralModifier + ' <span class="electoralvotes">' + summaryFigure + '</span> electoral ' + votePlurality + ' in ' + race.name + '</p>',
      '</div>'
    ];
    htmlInject = baseLine.concat(summaryLine);
  }
  return htmlInject;
}

var setFooterText = function(race, target) {
  var htmlInject = null;
  var summaryFigure = race.fractionReporting;
  //  TK a better check for region map tables vs dashboard map tables
  if (!isSubcountyGeo.test(race.id) && !isCountyGeo.test(race.id) && target ) {
    if(isPresidentRace.test(race.id)) {
      htmlInject = [
        '<div class="footer">',
          '<p class="fraction-reporting">' + Math.round(summaryFigure) * 100 + '% of votes counted</p>',
          '<p class="state-click">Click state to view full results</p>',
        '</div>'
      ]
    } else {
      htmlInject = [
        '<div class="footer">',
          '<p class="fraction-reporting">' + Math.round(summaryFigure) * 100 + '% of votes counted</p>',
          '<p class="state-click">Click state to view full results</p>',
        '</div>'
      ]
    }
  } else {
    htmlInject = [
      '<div class="footer">',
        '<p class="fraction-reporting">' + Math.round(summaryFigure) * 100 + '% of votes counted</p>',
      '</div>'
    ];
  }
  return htmlInject.join('');
}

function buildSingleCandidateRace(race) {
  var distName = race.name;
  var candidate = race.candidates[0];
  var partyIdToPartyString = {dem: 'Democrat', gop: 'Republican', ind: 'Independent'};
  var injectHtml = [
    '<h3>' + race.name + '</h3>',
    '<p>' + partyIdToPartyString[candidate.partyId] + ' ' + '<span class="electoralvotes">' + candidate.fullName + '</span>' + ' was uncontested and remains the House Representative'
  ]
  return injectHtml.join('');
}

function buildSenateNonRace(race) {
  var candidate = race.candidates[0];
  var partyIdToPartyString = {dem: 'Democrat', gop: 'Republican', ind: 'Independent'};
  var seatPartyToYear = {3: 'this year:', 1: 'in 2018.', 2: 'in 2020.'};
  var partyIdToCaucusParticipant = race.candidates[0].partyId === 'ind' ? 'Independent, caucuses as a ' : '';
  var injectHtml = [
    '<h3>' + race.name + '</h3>',
    '<p>' + race.candidates[0].fullName + ' (' + partyIdToCaucusParticipant + '<strong class="' + race.className + '">' + partyIdToPartyString[race.winner] + '</strong>) has a term ending' + seatPartyToYear[race.seatClass] + '</p>'
  ]
  return injectHtml.join('');
}

var buildTable = function(race, targetEl) {
  //  only summaries for tooltip tables. use targetEl(ev.target) to check.
  var textSummary = !targetEl ? [] : setText(race, targetEl);
  var textFooter = setFooterText(race, targetEl);
  var candidates = race.candidates;
  var votesTotal = race.nVotes;

  if (isHouseRace.test(race.id) && candidates.length === 1) {
    return buildSingleCandidateRace(race);
  }

  if (isSenateRace.test(race.id) && !isSeat3Race.test(race.id)) {
    return buildSenateNonRace(race);
  }

  var cdType = raceIdToCandidateType(race.id, targetEl);
  var leadingCount = Math.max.apply(null, candidates.map(function(d) { return d.n; }));

  var htmlInject = ['<table class="' + race.className + '">',
    '<thead>', '<tr>',
    '<th class="name">' + cdType + '</th>',
    '<th class="votes" colspan="2">VOTES</th>',
    '<th class="percent"></th>',
    '</tr>', '</thead><tbody>'];

  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
    var candidateWon = candidate.winner ? 'winner' : '';
    var cdName = candidate.name;
    var incumbentSpan = candidate.incumbent === true ? ' <span class="incumbent">i</span>' : '';
    var cdVotes = candidate.n;
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
  textSummary.push(textFooter);
  return textSummary.join('');
}

module.exports = buildTable;
