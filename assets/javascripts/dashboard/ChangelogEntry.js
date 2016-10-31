function readInt(s) { return s === '' ? null : parseInt(s, 10); }
function writeInt(i) { return i === null ? '' : String(i); }
var IntType = { read: readInt, write: writeInt };

function writeDate(d) { return d.toISOString(); }
var DateType = { read: Date.parse, write: writeDate };

function readString(s) { return s === '' ? null : s; }
function writeString(s) { return s || ''; }
var StringType = { read: readString, write: writeString };

var Fields = [
  { key: 'id', type: IntType },
  { key: 'date', type: DateType },
  { key: 'changeType', type: StringType },
  { key: 'stateId', type: StringType },
  { key: 'raceType', type: StringType },
  { key: 'raceId', type: StringType },
  { key: 'candidateName', type: StringType },
  { key: 'partyId', type: StringType },
  { key: 'nPrecinctsReporting', type: IntType },
  { key: 'nPrecincts', type: IntType }
];

/**
 * Constructs a ChangelogEntry, from an Array or a Hash of parameters.
 */
function ChangelogEntry() {
  var i;

  if (Object.prototype.toString.apply(arguments[0]) === '[object Array]') {
    var arr = arguments[0];
    for (i = 0; i < Fields.length; i++) {
      const field = Fields[i];
      this[field.key] = field.type.read(arr[i]);
    }
  } else {
    var o = arguments[0];
    for (i = 0; i < Fields.length; i++) {
      const field = Fields[i];
      this[field.key] = o[field.key] || null;
    }
  }
}

ChangelogEntry.fromTsvLine = function(tsv) {
  return new ChangelogEntry(tsv.split(/\t/));
};

ChangelogEntry.toTsvLine = function() {
  var _this = this;
  return Fields
    .map(function(field) { return field.write(_this[field.key]); })
    .join(/\t/);
};

module.exports = ChangelogEntry;
