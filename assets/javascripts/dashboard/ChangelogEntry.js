function readInt(s) { return s === '' ? null : parseInt(s, 10); }
function writeInt(i) { return i === null ? '' : String(i); }
var IntType = { read: readInt, write: writeInt };

function readDouble(s) { return s === '' ? null : parseFloat(s); }
function writeDouble(d) { return d === null ? '' : String(d); }
var DoubleType = { read: readDouble, write: writeDouble };

function readDate(s) { return new Date(Date.parse(s)); }
function writeDate(d) { return d.toISOString(); }
var DateType = { read: readDate, write: writeDate };

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
  { key: 'fractionReporting', type: DoubleType }
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

ChangelogEntry.parseAll = function(text) {
  return text
    .split(/\r?\n/)
    .filter(function(s) { return s.length > 0; })
    .map(ChangelogEntry.fromTsvLine);
};

ChangelogEntry.prototype.toTsvLine = function() {
  var _this = this;
  return Fields
    .map(function(field) { return field.type.write(_this[field.key]); })
    .join('\t');
};

module.exports = ChangelogEntry;
