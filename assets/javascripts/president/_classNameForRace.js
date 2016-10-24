function classNameForRace(race) {
  if (race.winner === 'clinton') {
    return 'clinton-win';
  } else if (race.winner === 'trump') {
    return 'trump-win';
  } else if (race.winner !== null) {
    return 'other-win';
  } else {
    console.log(race);
    return 'tossup';
  }
};

classNameForRace.AllClassNames = [
  'clinton-win',
  'clinton-lead',
  'other-win',
  'other-lead',
  'tossup',
  'trump-lead',
  'trump-win'
];

classNameForRace.compareRaces = function(race1, race2) {
  var x = classNameForRace.compare(classNameForRace(race1), classNameForRace(race2));
  if (x !== 0) return x;

  return race1.name.localeCompare(race2.name);
}

classNameForRace.compare = function(name1, name2) {
  var i1 = classNameForRace.AllClassNames.indexOf(name1);
  var i2 = classNameForRace.AllClassNames.indexOf(name2);
  return i1 - i2;
}

module.exports = classNameForRace;
