'use strict'

const ChangelogEntry = require('../../assets/javascripts/dashboard/ChangelogEntry')

function findStarts(id1, date, apData1, apData2) {
  const UnstartedRaces = {}

  for (const race of apData1.presidentRaces()) {
    if (race.id.length > 2) continue // Ignore "NE1", "NE2", etc
    if (race.fractionReporting === 0) UnstartedRaces[race.id] = null
  }

  const ret = []
  let id = id1

  for (const race of apData2.presidentRaces()) {
    if (!UnstartedRaces.hasOwnProperty(race.id)) continue
    if (race.fractionReporting > 0) {
      ret.push(new ChangelogEntry({
        id: id,
        date: date,
        changeType: 'start',
        stateId: race.id.slice(0, 2)
      }))
      id += 1
    }
  }

  return ret
}

function raceIdToType(id) {
  if (id[2] === 'S') return 'senate'
  if (id.length === 4) return 'house'
  return 'president'
}

function findWins(id1, date, races1, races2) {
  const ClassNames1 = {}
  for (const race of races1) {
    ClassNames1[race.id] = race.className
  }

  const ret = []
  let id = id1

  for (const race of races2) {
    if (!(/-win/.test(race.className))) continue
    if (race.className !== ClassNames1[race.id]) {
      ret.push(new ChangelogEntry({
        id: id,
        date: date,
        changeType: 'win',
        stateId: race.id.slice(0, 2),
        raceType: raceIdToType(race.id),
        raceId: race.id,
        candidateName: race.candidates[0].name,
        partyId: race.candidates[0].partyId,
        fractionReporting: race.fractionReporting
      }))
    }
    id += 1
  }

  return ret
}

function findLeads(id1, date, races1, races2) {
  const ClassNames1 = {}
  const Quarters1 = {}
  for (const race of races1) {
    ClassNames1[race.id] = race.className
    Quarters1[race.id] = Math.floor(race.fractionReporting / 0.25)
  }

  const ret = []
  let id = id1

  for (const race of races2) {
    // Only report races that are "leading"
    if (!(/-lead/.test(race.className))) continue

    // Only report races that go from 9%->10%+
    const quarter = Math.floor(race.fractionReporting / 0.25)
    if (quarter === Quarters1[race.id] || quarter === 0) continue

    ret.push(new ChangelogEntry({
      id: id,
      date: date,
      changeType: 'lead',
      stateId: race.id.slice(0, 2),
      raceType: raceIdToType(race.id),
      raceId: race.id,
      candidateName: race.candidates[0].name,
      partyId: race.candidates[0].partyId,
      fractionReporting: race.fractionReporting
    }))
    id += 1
  }

  return ret
}

function allRaces(apData) {
  return apData.presidentRaces().concat(apData.senateRaces()).concat(apData.houseRaces())
}

module.exports = {
  diff(id1, date, apData1, apData2) {
    const entries = []

    const races1 = allRaces(apData1)
    const races2 = allRaces(apData2)

    findStarts(id1, date, apData1, apData2)
      .forEach(entry => entries.push(entry))

    findWins(id1 + entries.length, date, races1, races2)
      .forEach(entry => entries.push(entry))

    findLeads(id1 + entries.length, date, races1, races2)
      .forEach(entry => entries.push(entry))

    return entries
  }
};
