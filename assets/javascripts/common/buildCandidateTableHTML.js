//  check race.id to decide which race we are dealing with
var isPresidentRace = /^[A-Z][A-Z][0-9]?$/;
var isSenateRace = /^[A-Z][A-Z]S[123]$/;
var isSeat3Race = /^[A-Z][A-Z]S3$/;
var isHouseRace = /^[A-Z][A-Z][0-9][0-9]$/;
var isSubcountyGeo = /^[0-9]{10}$/;
var isCountyGeo = /^[0-9]{5}$/;

var EnglishI18n = {
  locale: 'en',
  t: function(s, o) {
    switch (s) {
      case 'tooltip.n Electoral Votes':
        return o === 1 ? 'Winner gets 1 electoral vote' : ('Winner gets ' + o + ' electoral votes');
      case 'tooltip.clinton':
        return 'Clinton'
      case 'tooltip.trump':
        return 'Trump'
      case 'tooltip.mcmullin':
        return 'McMullin'
      case 'tooltip.Percent counted':
        return o.percent + ' of votes counted';
      default:
        if (/^state\./.test(s)) return s.slice(6);
        return s;
    }
  }
};

function getTitleFromGeoParentClasses(target) {
  pElements = []
  while (target) {
    pElements.push(target); //  push to go from the bottom up
    target = target.parentNode;
  }
  var ret = null;
  for (var i = 0; i < pElements.length; i++) {
    var elClasses = pElements[i].classList;
    if (elClasses.contains('president-map')) {
      ret = 'PRESIDENT';
      break;
    } else if (elClasses.contains('senate-map')) {
      ret = 'SENATOR';
      break;
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

var setText = function(race, target, i18n) {
  var parts = [
    '<div class="inner">',
    '<h3 class="state-name">' + i18n.t('state.' + race.name) + '</h3>',
  ];

  if (isPresidentRace.test(race.id) && !isSubcountyGeo.test(race.id)) {
    parts.push('<p class="state-summary">');
    parts.push(i18n.t('tooltip.n Electoral Votes', race.nElectoralVotes).replace(/\d+/, '<strong>$&</strong>'));
    parts.push('</p>');
  }

  parts.push('</div>');
  return parts;
}

var setFooterText = function(race, target, i18n, promptUrl) {
  var summaryFigure = race.fractionReporting;

  var formatPercent = typeof Intl === 'object' ? new Intl.NumberFormat(i18n.locale, { style: 'percent' }).format : formatPercentForIE10;

  var htmlInject = [
    '<p class="fraction-reporting">',
      i18n.t('tooltip.Percent counted', { percent: formatPercent(race.fractionReporting) }),
    '</p>'
  ];

  if (promptUrl) {
    htmlInject.push('<p class="state-click only-touch"><a href="' + promptUrl + '">Full results »</a></p>');
    htmlInject.push('<p class="state-click except-touch">Click state for full results</a></p>');
  }

  return htmlInject.join('');
}

function buildSingleCandidateRace(race) {
  var distName = race.name;
  var candidate = race.candidates[0];
  var partyIdToPartyString = {dem: 'Democrat', gop: 'Republican', ind: 'Independent'};
  var injectHtml = [
    '<h3>' + race.name + '</h3>',
    '<p>' + '<span class="' + candidate.partyId + '">' + partyIdToPartyString[candidate.partyId] + '</span> ' + candidate.fullName + ' was uncontested and will be the House Representative</p>'
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
    '<p>' + race.candidates[0].fullName + ' (' + partyIdToCaucusParticipant + '<strong class="' + race.className + '">' + partyIdToPartyString[race.winner] + '</strong>) has a term ending ' + seatPartyToYear[race.seatClass] + '</p>'
  ]
  return injectHtml.join('');
}

var buildTable = function(race, targetEl, options) {
  var i18n = options && options.i18n || EnglishI18n;
  var promptUrl = options && options.urlTemplate && options.urlTemplate.replace('XX', race.id.slice(0, 2)) || null;

  //  only summaries for tooltip tables. use targetEl(ev.target) to check.
  var textSummary = !targetEl ? [] : setText(race, targetEl, i18n);
  var textFooter = setFooterText(race, targetEl, i18n, promptUrl);
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
    '<th class="votes">VOTES</th>',
    '<th class="percent"></th>',
    '</tr>', '</thead><tbody>'];

  var numberFormat = typeof Intl === 'object' ? new Intl.NumberFormat(i18n.locale).format : String;

  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
    var candidateWon = candidate.winner ? 'winner' : '';
    var cdName = candidate.name;
    var i18nName = { 'Clinton': i18n.t('tooltip.clinton'), 'Trump': i18n.t('tooltip.trump'), 'McMullin': i18n.t('tooltip.mcmullin') }[cdName] || cdName;
    var incumbentSpan = candidate.incumbent === true ? ' <span class="incumbent">i</span>' : '';
    var cdVotes = candidate.n;
    var cdVotesPct = votesTotal === 0 ? 0 : 100 * (cdVotes / votesTotal)
    var voteBarWidth = votesTotal === 0 ? 0 : 100 * (cdVotes / leadingCount);
    htmlInject.push(['<tr class="', candidateWon, ' ', candidate.partyId, '">',
      '<td class="name">', i18nName, incumbentSpan,  '</td>',
      '<td class="vote-count">', numberFormat(cdVotes), '</td>',
      '<td class="votes">',
        '<div class="vote-bar ', candidate.partyId, '" style="width: ', voteBarWidth, '%;"></div>',
      '</td>',
      '<td class="percent">', Math.round(cdVotesPct), '%</td>',
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
