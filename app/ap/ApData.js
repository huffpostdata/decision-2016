'use strict'

const fs = require('fs')
const SenatePriorSeats = require('../SenatePriorSeats')

const StateCodeToStateName = fs.readFileSync(`${__dirname}/../google-sheets/regions.tsv`, 'utf8')
  .split(/\r?\n/)
  .slice(1)
  .map(s => s.split(/\t/))
  .filter(arr => arr.length > 0)
  .reduce(((s, arr) => { s[arr[0]] = arr[1]; return s }), {})

function apRaceToStateCode(apRaceJson) {
  return apRaceJson.statePostal || apRaceJson.reportingUnits[0].statePostal
}

const ValidParties = {
  // The keys signify that we won't filter out candidates with these parties
  // The values determine the CSS classes we'll use
  Dem: 'dem',
  GOP: 'gop',
  Lib: 'lib',
  Grn: 'grn',
  BFA: 'bfa'
}
function validParty(apPartyId) {
  return ValidParties[apPartyId] || 'other'
}

function apCandidateToCandidate(apJson) {
  return {
    name: apJson.last,
    fullName: `${apJson.first} ${apJson.last}`,
    partyId: validParty(apJson.party),
    n: apJson.voteCount,
    winner: (apJson.winner === 'X'),
    incumbent: apJson.incumbent === true
  }
}

function compareCandidates(a, b) {
  // Winner comes first
  if (a.winner !== b.winner) return (a.winner ? 0 : 1) - (b.winner ? 0 : 1)

  return compareCandidatesIgnoreWinner(a, b)
}

function compareCandidatesIgnoreWinner(a, b) {
  // Then Person with most votes comes first
  if (a.n !== b.n) return b.n - a.n

  // Same vote counts? "dem" and "gop" come first
  if ((a.partyId === 'dem' || a.partyId === 'gop') !== (b.partyId === 'dem' || b.partyId === 'gop')) {
    return ((a.partyId === 'dem' || a.partyId === 'gop') ? 0 : 1) - ((b.partyId === 'dem' || b.partyId === 'gop') ? 0 : 1)
  }

  // Still tied? Sort by name
  return a.name.localeCompare(b.name)
}

const ClassNameSortOrder = {
  'dem-prior': 1, // Senate seats class 1, 2
  'dem-win': 2,
  'clinton-win': 2,
  'dem-lead': 3,
  'clinton-lead': 3,
  'lib-win': 4,
  'johnson-win': 4,
  'lib-lead': 5,
  'lib-win': 5,
  'grn-win': 6,
  'stein-win': 6,
  'grn-lead': 7,
  'stein-lead': 7,
  'bfa-win': 8,
  'mcmullin-win': 8,
  'bfa-lead': 9,
  'mcmullin-lead': 9,
  'other-win': 10,
  'other-lead': 11,
  'tossup': 12,
  'gop-lead': 13,
  'trump-lead': 13,
  'gop-win': 14,
  'trump-win': 14,
  'gop-prior': 15 // Senate seats class 1, 2
}
function compareRaces(a, b) {
  // 1. Sort by class name: dem-win on left, gop-win on right
  const aSort = ClassNameSortOrder[a.className] || ClassNameSortOrder.tossup
  const bSort = ClassNameSortOrder[b.className] || ClassNameSortOrder.tossup
  if (aSort !== bSort) return aSort - bSort

  // 2. Sort by state name
  if (a.stateName !== b.stateName) return a.stateName.localeCompare(b.stateName)

  // 3. Sort by race name ("Maine At Large" < "Maine District 2")
  if (a.name !== b.name) return a.name.localeCompare(b.name)

  // 4. Sort by seat number/class (be careful: "3" should come _after_ "20")
  return a.id.localeCompare(b.id)
}

function apCandidatesToCandidates(apCandidates) {
  const ret = []
  let nOther = 0
  for (const apCandidate of apCandidates) {
    if (ValidParties.hasOwnProperty(apCandidate.party)) {
      ret.push(apCandidateToCandidate(apCandidate))
    } else {
      nOther += apCandidate.voteCount
    }
  }
  ret.sort(compareCandidates)

  if (nOther !== 0) {
    // "Other" comes last, always. It can't be the leader.
    ret.push({ name: 'Other', partyId: 'other', n: nOther, winner: false, incumbent: false })
  }

  return ret
}

function raceWinner(race) {
  const candidates = race.candidates

  if (candidates[0].winner) return candidates[0].partyId

  let justOneParty = true
  const onlyPartyId = candidates[0].partyId
  for (const candidate of candidates) {
    if (candidate.partyId !== onlyPartyId) {
      justOneParty = false
      break
    }
  }
  if (justOneParty) {
    return onlyPartyId
  }

  return null
}

function presidentRaceClassName(race) {
  // Assume candidates are sorted
  const leader = race.candidates[0].name.toLowerCase()

  if (race.candidates[0].winner) return `${leader}-win`
  if (race.candidates[0].n !== race.candidates[1].n) return `${leader}-lead`
  return 'tossup'
}

function presidentGeoClassName(race) {
  if (race.candidates.length === 1) return `${race.candidates[0].partyId}-win`
  if (race.candidates[0].n === race.candidates[1].n) return 'tossup'
  if (race.fractionReporting === 1) return `${race.candidates[0].partyId}-win`
  return `${race.candidates[0].partyId}-lead`
}

function senateRaceClassName(race) {
  if (race.winner) return `${race.winner}-win`

  // Assume candidates are sorted
  if (race.candidates[0].n === race.candidates[1].n) {
    return 'tossup'
  } else {
    return `${race.candidates[0].partyId}-lead`
  }
}

const houseRaceClassName = senateRaceClassName

function postprocessPresidentRace(race) {
  let wroteThird = false
  for (const candidate of race.candidates) {
    race.nVotes += candidate.n

    switch (candidate.name) {
      case 'Clinton':
        race.nVotesClinton = candidate.n
        if (candidate.winner) race.winner = 'clinton'
        break
      case 'Trump':
        race.nVotesTrump = candidate.n
        if (candidate.winner) race.winner = 'trump'
        break
      default:
        if (!wroteThird) {
          // This is the leading third-party candidate, because candidates
          // are ordered.
          race.nVotesThird = candidate.n
          if (candidate.winner) race.winner = candidate.name.toLowerCase()
          wroteThird = true
        }
    }
  }
}

function countRaceVotes(race) {
  let ret = 0
  for (const candidate of race.candidates) {
    ret += candidate.n
  }
  return ret
}

function apRaceToPresidentRace(apRace) {
  const state = apRace.reportingUnits[0]
  const stateName = StateCodeToStateName[state.statePostal]
  const race = {
    id: state.statePostal,
    regionId: state.statePostal,
    name: stateName,
    stateName: stateName,
    nElectoralVotes: state.electTotal,
    fractionReporting: state.precinctsReporting === 0 ? 0 : state.precinctsReporting / state.precinctsTotal,
    candidates: apCandidatesToCandidates(state.candidates),
    nVotes: 0,
    winner: null
  }
  race.className = presidentRaceClassName(race)
  postprocessPresidentRace(race)


  return race
}

function apRaceToSenateRace(apRace) {
  const ru = apRace.reportingUnits[0]
  const stateName = StateCodeToStateName[ru.statePostal]

  const ret = {
    id: `${ru.statePostal}S3`,
    name: stateName,
    stateName: stateName,
    seatClass: '3',
    fractionReporting: ru.precinctsTotal === 0 ? 0 : ru.precinctsReporting / ru.precinctsTotal,
    candidates: apCandidatesToCandidates(ru.candidates)
  }
  ret.winner = raceWinner(ret)
  ret.className = senateRaceClassName(ret)
  ret.nVotes = countRaceVotes(ret)

  return ret
}

function apRaceToHouseRace(apRace) {
  const ru = apRace.reportingUnits[0]
  const stateName = StateCodeToStateName[ru.statePostal]

  const race = {
    id: `${ru.statePostal}${String(100 + +apRace.seatNum).slice(1)}`,
    stateName: stateName,
    name: / at large/i.test(apRace.description) ? `${stateName} At Large` : `${stateName} District ${apRace.seatNum}`,
    candidates: apCandidatesToCandidates(ru.candidates),
    fractionReporting: ru.precinctsTotal === 0 ? 1 : ru.precinctsReporting / ru.precinctsTotal
  }
  race.winner = raceWinner(race)
  race.className = houseRaceClassName(race)
  race.nVotes = countRaceVotes(race)

  race.dem = race.candidates.find(c => c.partyId === 'dem')
  race.gop = race.candidates.find(c => c.partyId === 'gop')
  race.third = race.candidates.find(c => c !== race.dem && c !== race.gop)

  return race
}

function apRaceToGeos(apRace) {
  const ret = []

  for (const ru of apRace.reportingUnits.slice(1)) {
    const geo = {
      id: ru.fipsCode, // TK New England states need apId (or whatever we did during primaries)
      name: ru.reportingunitName,
      fractionReporting: ru.precinctsReportingPct / 100,
      candidates: apCandidatesToCandidates(ru.candidates)
    }
    // AP's "winner" call propagates _down_ to each geo. That's fine, but we
    // shouldn't sort that way.
    geo.candidates.sort(compareCandidatesIgnoreWinner)

    geo.className = presidentGeoClassName(geo)

    ret.push(geo)
  }

  return ret
}

/**
 * A rollup of all the data Associated Pres gives us.
 */
module.exports = class ApData {
  constructor(reportingUnitElections, districtElections) {
    this.reportingUnitElections = reportingUnitElections
    this.districtElections = districtElections
  }

  /**
   * Returns a presidential summary.
   *
   * It has these properties:
   *
   * * nClinton: uint Popular vote for Clinton
   * * nTrump: uint Popular vote for Trump
   * * nElectoralVotes: 538
   * * nClintonElectoralVotes: uint electoral votes for Clinton, [0, 538]
   * * nTrumpElectoralVotes: uint electoral votes for Trump, [0, 538]
   * * nOtherElectoralVotes: uint electoral votes for (not Clinton or Trump), [0, 538]
   * * nTossupElectoralVotes: 538 - nClintonElectoralVotes - nTrumpElectoralVotes
   * * winner: 'clinton', 'trump', or null
   */
  presidentSummary() {
    const NElectoralVotes = 538

    const race = this.reportingUnitElections.findUSPresidentRace()

    let nClintonVotes = 0
    let nTrumpVotes = 0
    let nClinton = 0
    let nTrump = 0
    let nOther = 0
    let winner = null
    for (const candidate of race.reportingUnits[0].candidates) {
      switch (candidate.last) {
        case 'Clinton':
          nClintonVotes += candidate.voteCount
          nClinton += candidate.electWon
          break
        case 'Trump':
          nTrumpVotes += candidate.voteCount
          nTrump += candidate.electWon
          break
        default:
          nOther += candidate.electWon
          break
      }
      if (candidate.winner === 'X') winner = candidate.last.toLowerCase()
    }

    return {
      nClinton: nClintonVotes,
      nTrump: nTrumpVotes,
      nElectoralVotes: NElectoralVotes,
      nClintonElectoralVotes: nClinton,
      nTrumpElectoralVotes: nTrump,
      nOtherElectoralVotes: nOther,
      nTossupElectoralVotes: NElectoralVotes - nClinton - nTrump - nOther,
      winner: winner
    }
  }

  /**
   * Return President race data, as an Array of Objects.
   *
   * The output is sorted by state name and then
   * (at-large <  district 1 < district 2 < district 3).
   *
   * Most races look like this:
   *
   *   {
   *     id: 'CA',
   *     regionId: 'CA',
   *     name: 'California',
   *     stateName: 'California',
   *     nElectoralVotes: 55,
   *     fractionReporting: 0.32,
   *     winner: null, // or 'clinton' or 'trump' or 'mcmullin' or 'johnson'
   *     nVotes: 1234, // total votes cast
   *     nVotesClinton: 612,
   *     nVotesTrump: 612,
   *     nVotesThird: 2, // votes for top third-party candidate
   *     candidates: [
   *      { name: 'Clinton', partyId: 'dem', fullName: 'Hillary Clinton', n: 612, winner: false },
   *      { name: 'Trump', partyId: 'gop', fullName: 'Donald Trump', n: 612, winner: false },
   *      { name: 'Johnson', partyId: 'lib', fullName: 'Gary Johnson', n: 2, winner: false },
   *      ...
   *     ]
   *   }
   *
   * Maine and Nebraska have "At-Large" and "District" races that look like:
   *
   *   {
   *     id: 'ME1',
   *     regionId: 'ME',
   *     name: 'Maine District 1',
   *     stateName: 'Maine',
   *     nElectoralVotes: 1,
   *     ... (the rest is all the same)
   *   }
   */
  presidentRaces() {
    let ret = []

    for (const apRace of this.reportingUnitElections.findPresidentRaces()) {
      const race = apRaceToPresidentRace(apRace)
      if (race.id === 'ME' || race.id === 'NE') continue // because we'll handle them from "districts"
      ret.push(race)
    }

    for (const apState of this.districtElections.findPresidentRaces()) {
      const state = apState.reportingUnits[0]

      for (const ru of apState.reportingUnits.slice(1)) {
        const stateName = StateCodeToStateName[state.statePostal]
        const race = {
          // id: "ME", "ME1", "ME2", ...
          id: ru.statePostal + (ru.districtType === 'CD' ? ru.reportingunitName.slice('District '.length) : ''),
          regionId: ru.statePostal,
          name: `${stateName} ${ru.reportingunitName}`,
          stateName: stateName,
          nElectoralVotes: ru.electTotal,
          fractionReporting: state.precinctsReporting === 0 ? 0 : state.precinctsReporting / state.precinctsTotal,
          candidates: apCandidatesToCandidates(ru.candidates),
          nVotes: 0,
          winner: null
        }
        race.className = presidentRaceClassName(race)
        postprocessPresidentRace(race)

        ret.push(race)
      }
    }

    ret.sort(compareRaces)
    return ret
  }

  /**
   * Returns Senate counts.
   *
   * The output looks like this:
   *
   *   {
   *     n: 100,
   *     tossup: uint number of seats not yet won
   *     priors: {
   *       // Senate seats that are _not_ up for reelection
   *       dem: uint number of senators who caucus with Democrats
   *       gop: uint number of senators who caucus with Republicans
   *     },
   *     wins: {
   *       // Senate seats that are up for reelection
   *       dem: uint number of winning senators who say they'll caucus with Democrats
   *       gop: uint number of winning senators who say they'll caucus with Republicans
   *     },
   *     totals: {
   *       dem: uint total number of senators who say they'll caucus with Democrats in 2017
   *       gop: uint total number of senators who say they'll caucus with Republicans in 2017
   *     },
   *     popular: {
   *      dem: uint total number of votes for senators who say they'll caucus with Democrats in 2017
   *      gop: uint total number of votes for senators who say they'll caucus with Republicans in 2017
   *     }
   *   }
   *
   * We only ever return "dem" and "gop", because anybody who enters the Senate
   * will caucus with one or the other.
   */
  senateSummary() {
    const NTotal = 100
    const NDemPrior = 36
    const NGopPrior = 30
    const NRaces = NTotal - NDemPrior - NGopPrior

    const wins = { dem: 0, gop: 0 }
    const totals = { dem: NDemPrior, gop: NGopPrior }
    const popular = { dem: 0, gop: 0 }

    const races = this.reportingUnitElections.findSenateRaces()
    if (races.length != NRaces) {
      throw new Error(`URGENT: expected ${NRaces} Senate races; got ${races.length}`)
    }
    for (const race of races) {
      let foundWin = false

      if (race.reportingUnits && race.reportingUnits.length > 0) { // if AP is reporting votes
        for (const candidate of race.reportingUnits[0].candidates) {
          if (candidate.party === 'Dem') popular.dem += candidate.voteCount
          if (candidate.party === 'GOP') popular.gop += candidate.voteCount

          if (candidate.winner === 'X') {
            foundWin = true

            if (candidate.party !== 'Dem' && candidate.party !== 'GOP') {
              throw new Error(`URGENT: a Senate winner is from party ${candidate.party} but we only handle "Dem" and "GOP"`)
            }

            const partyId = candidate.party.toLowerCase()
            wins[partyId] += 1
            totals[partyId] += 1
          }
        }
      }

      if (!foundWin && apRaceToStateCode(race) === 'CA') {
        // CA is a race between a Democrat and a Democrat
        wins.dem += 1
        totals.dem += 1
      }
    }

    return {
      n: NTotal,
      tossup: NTotal - NDemPrior - NGopPrior - wins.dem - wins.gop,
      priors: { dem: NDemPrior, gop: NGopPrior },
      wins: wins,
      totals: totals,
      popular: popular
    }
  }

  /**
   * Returns House counts.
   *
   * The output looks like this:
   *
   *   {
   *     total: 435,
   *     tossup: 435 minus all the following values
   *     wins: {
   *       dem: uint number of Dem winners
   *       gop: uint number of Gop winners
   *       ... [ see parties.tsv for a list of what could happen ]
   *     },
   *     popular: {
   *      dem: uint number of votes for Democrats
   *      gop: uint number of votes for Republicans
   *     }
   *   }
   */
  houseSummary() {
    const NRaces = 435

    const races = this.reportingUnitElections.findHouseRaces()
    if (races.length != NRaces) {
      throw new Error(`URGENT: expected ${NRaces} Senate races; got ${races.length}`)
    }

    let nWins = 0
    const wins = {}
    const popular = { dem: 0, gop: 0 }

    for (const race of races) {
      for (const candidate of race.reportingUnits[0].candidates) {
        if (candidate.party === 'Dem') popular.dem += candidate.voteCount
        if (candidate.party === 'GOP') popular.gop += candidate.voteCount

        if (candidate.winner === 'X') {
          nWins += 1
          const partyId = candidate.party.toLowerCase()
          if (!wins.hasOwnProperty(partyId)) wins[partyId] = 0
          wins[partyId] += 1
        }
      }
    }

    return {
      total: NRaces,
      tossup: NRaces - nWins,
      wins: wins,
      popular: popular
    }
  }

  /**
   * Returns Senate races.
   *
   * The output looks like this:
   *
   *
   *   [
   *     {
   *       id: 'AKS3',
   *       name: 'Alaska',
   *       fractionReporting: 0.355,
   *       winner: 'dem',
   *       candidates: [
   *        { name: 'Smith', partyId: 'dem', n: 13001, winner: true },
   *        { name: 'Black', partyId: 'gop', n: 12111, winner: false },
   *        ...
   *       ]
   *     },
   *     ...
   *   ]
   */
  senateRaces() {
    const races = this.reportingUnitElections.findSenateRaces().map(apRaceToSenateRace)
    const priorRaces = SenatePriorSeats

    const ret = priorRaces.concat(races)
    ret.sort(compareRaces)

    return ret
  }

  /**
   * Returns House races.
   *
   * The output looks like this:
   *
   *   [
   *     {
   *       id: 'AK01',
   *       name: 'Alaska At Large',
   *       fractionReporting: 0.341,
   *       winner: 'dem',
   *       candidates: [
   *        { name: 'Smith', partyId: 'dem', n: 13001, winner: true },
   *        { name: 'Black', partyId: 'gop', n: 12111, winner: false },
   *        ...
   *       ]
   *     },
   *     ...
   *   ]
   */
  houseRaces() {
    const ret = this.reportingUnitElections.findHouseRaces().map(apRaceToHouseRace)
    ret.sort(compareRaces)
    return ret
  }

  /**
   * Returns:
   *
   *   { // regionId to everything
   *     AL: {
   *       president: {
   *         summary:
   *       },
   *     },
   *     CA: { ... },
   *     ...
   *   } // regionId to everything
   */
  allRaceDetails() {
    const ret = {}

    for (const apRace of this.reportingUnitElections.findPresidentRaces()) {
      // We're ignoring the "district" races: we want ME and NE reportingUnits
      const race = apRaceToPresidentRace(apRace)

      ret[race.id] = {
        president: {
          race: race,
          geos: apRaceToGeos(apRace)
        },
        house: [],
        ballot: []
      }
    }

    for (const apRace of this.reportingUnitElections.findSenateRaces()) {
      const race = apRaceToSenateRace(apRace)
      const stateId = race.id.slice(0, 2)

      ret[stateId].senate = {
        race: race,
        geos: apRaceToGeos(apRace)
      }
    }

    for (const apRace of this.reportingUnitElections.findHouseRaces()) {
      const race = apRaceToHouseRace(apRace)
      const stateId = race.id.slice(0, 2)
      ret[stateId].house.push(race)
    }

    for (const stateId of Object.keys(ret)) {
      ret[stateId].house.sort((a, b) => a.id.localeCompare(b.id))
      ret[stateId].ballot.sort((a, b) => a.id.localeCompare(b.id))
    }

    return ret
  }
}
