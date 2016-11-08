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

function buildLi(entry, contents) {
  var li = document.createElement('li');
  li.setAttribute('id', 'change-' + entry.id);
  li.setAttribute('class', entry.partyId ? (entry.partyId + '-' + entry.changeType) : 'start');
  li.innerHTML = stateHtml(entry) + contents.join('') + dateHtml(entry.date);
  return li;
}

function startLi(entry) {
  return buildLi(entry, [ stateHtml(entry), entry.stateName, ' began counting votes' ]);
}

function leaderHtml(entry) {
  return '<span class="leader ' + entry.partyId + '-' + entry.changeType + '">' + entry.candidateName + '</span>';
}

function percentHtml(entry) {
  return Math.round(100 * entry.fractionReporting) + '%';
}

function leadLi(entry) {
  return buildLi(entry, [ leaderHtml(entry) + ' led ', raceHtml(entry) + ' after ', percentHtml(entry), ' of votes were counted' ]);
}

function winLi(entry) {
  return buildLi(entry, [ leaderHtml(entry) , ' <span class="won">won</span> ', raceHtml(entry) ]);
}

function entryLi(entry) {
  switch (entry.changeType) {
    case 'start': return startLi(entry);
    case 'lead': return leadLi(entry);
    case 'win': return winLi(entry);
  }
}

function jsonToChangelogEntries(json) {
  var i;

  var stateIdToName = {};
  var raceIdToName = {};
  for (i = 0; i < json.races.length; i++) {
    var race = json.races[i];
    stateIdToName[race.id.slice(0, 2)] = race.stateName;
    raceIdToName[race.id] = race.name;
  }

  var ret = ChangelogEntry.parseAll(json.changelog);
  for (i = 0; i < ret.length; i++) {
    var entry = ret[i];
    entry.stateName = stateIdToName[entry.stateId];
    if (entry.raceId) entry.raceName = raceIdToName[entry.raceId];
  }

  return ret;
}

function Changelog(el, initialJson) {
  this.el = el;
  this.ol = document.createElement('ol');

  var entries = jsonToChangelogEntries(initialJson);
  for (var i = 0; i < entries.length; i++) {
    this.ol.appendChild(entryLi(entries[i]));
  }

  this.topEntryId = entries.length > 0 ? entries[0].id : null;

  if (entries.length === 0) {
    this.ol.innerHTML = '<li class="placeholder">Come back at 7 p.m. EST for live updates.</li>';
  }

  el.appendChild(this.ol);
}

Changelog.prototype.update = function(json) {
  var entries = jsonToChangelogEntries(json);
  var i;
  if (entries.length === 0) return;

  this.maxNEntries = entries.length;

  var added = [];

  for (i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (this.topEntryId === entry.id) break;

    var li = entryLi(entry);
    li.classList.add('new-change');
    this.ol.insertBefore(li, this.ol.childNodes[0]);
    added.push(li);
  }

  for (i = this.ol.childNodes.length - 1; i >= this.maxNEntries; i--) {
    this.ol.removeChild(this.ol.childNodes[i]);
  }

  window.setTimeout(function() {
    for (var i = 0; i < added.length; i++) {
      added[i].classList.remove('new-change');
    }
  }, 100);

  this.topEntryId = entries[0].id;
};

module.exports = Changelog;
