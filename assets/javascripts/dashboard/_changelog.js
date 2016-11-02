var ChangelogEntry = require('./ChangelogEntry');

function getSystemTimeZoneAbbreviation() {
  var s = new Date().toString();
  var m = /\(([^)]+)\)/.exec(s);
  return m ? m[1] : '';
}

var tz = getSystemTimeZoneAbbreviation();

function dateHtml(date) {
  var h = date.getHours();
  var ampm;
  if (h < 12) {
    ampm = 'AM';
    h = h === 0 ? '12' : String(h);
  } else {
    ampm = 'PM';
    h = h === 12 ? '12' : String(h - 12);
  }
  var mm = String(100 + date.getMinutes()).slice(1);
  return '<time datetime="' + date.toISOString() + '">' + h + ':' + mm + ' ' + ampm + ' ' + tz + '</time>';
}

function raceHtml(entry) {
  return '<span class="race" data-race-id="' + entry.raceId + '">' + entry.raceName + '</span>';
}

function stateHtml(entry) {
  return '<span class="state" data-state-id="' + entry.stateId + '"></span>';
}

function liHtml(entry, contents) {
  return '<li id="change-' + entry.id + '" class="' + (entry.partyId ? (entry.partyId + '-' + entry.changeType) : 'start') + '">' + stateHtml(entry) + contents.join('') + dateHtml(entry.date) + '</li>';
}

function startHtml(entry) {
  return liHtml(entry, [ stateHtml(entry), entry.stateName, ' began counting votes' ]);
}

function leaderHtml(entry) {
  return '<span class="leader ' + entry.partyId + '-' + entry.changeType + '">' + entry.candidateName + '</span>';
}

function percentHtml(entry) {
  return Math.round(entry.nPrecinctsReporting / entry.nPrecincts * 100) + '%';
}

function leadHtml(entry) {
  return liHtml(entry, [ leaderHtml(entry) + ' led ', raceHtml(entry) + ' after ', percentHtml(entry), ' of votes were counted' ]);
}

function winHtml(entry) {
  return liHtml(entry, [ leaderHtml(entry) , ' <span class="won">won</span> ', raceHtml(entry) ]);
}

function entryHtml(entry) {
  switch (entry.changeType) {
    case 'start': return startHtml(entry);
    case 'lead': return leadHtml(entry);
    case 'win': return winHtml(entry);
  }
}

function Changelog(el, initialJson) {
  this.el = el;
  this.ol = document.createElement('ol');
  el.appendChild(this.ol);

  this.update(initialJson);
}

Changelog.prototype.update = function(json) {
  var changelog = ChangelogEntry.parseAll(json.changelog);

  var stateIdToName = {};
  var raceIdToName = {};
  for (var i = 0; i < json.races.length; i++) {
    var race = json.races[i];
    stateIdToName[race.id.slice(0, 2)] = race.stateName;
    raceIdToName[race.id] = race.name;
  }

  changelog.forEach(function(entry) {
    entry.stateName = stateIdToName[entry.stateId];
    if (entry.raceId) entry.raceName = raceIdToName[entry.raceId];
  });

  this.ol.innerHTML = changelog.map(entryHtml).join('');
}

module.exports = Changelog;
