'use strict'

const fs = require('fs')
const SenatePriorSeats = require('../SenatePriorSeats')
const BallotInitiatives = require('../BallotInitiatives')

const OverrideRaceWinner = {
  // Race ID primer:
  //
  // "AL", "AK", "DC", "ME": state-wide presidential races
  // "ME1", "ME2", "NE1", "NE2", "NE3": district presidential races (just 5)
  // "AKS3": senate race (always ends with "S3")
  // "NY02", "NY21": congressional races (always four characters)
  //
  // Override a winner here by writing the full name of the winner, or "[none]"
  // to override a call with a non-call. Index by race ID.
  // e.g.: { "ME3": "Donald Trump", "UT": "Evan McMullin", "CA03": "[none]" }
}

const ApIdToGeoId = fs.readFileSync(`${__dirname}/../ap-id-to-geo-id.tsv`, 'utf8')
  .split(/\r?\n/)
  .map(s => s.split(/\t/))
  .filter(arr => arr.length > 0 && arr[0].length > 0)
  .reduce(((s, arr) => { s[arr[0]] = arr[1]; return s }), {})

const ApIdToGeoIdStateCodes = 'CT MA ME NH RI VT' // TK add AK
  .split(/ /).reduce(((s, code) => { s[code] = null; return s }), {})

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

function apCandidateToCandidate(raceIdOrNull, apJson, options) {
  const fullName = `${apJson.first} ${apJson.last}`

  // Nudge AP towards "lib", "grn" and "una" -- even if candidates are "Una"
  // (for "unaffiliated").
  const partyId = {
    'Gary Johnson': 'lib',
    'Jill Stein': 'grn',
    'Evan McMullin': 'bfa',
  }[fullName] || validParty(apJson.party)

  const n = apJson.voteCount ? apJson.voteCount : 0

  const ret = {
    name: apJson.last,
    fullName: fullName,
    partyId: partyId,
    n: n,
  }

  if (apJson.incumbent === true) ret.incumbent = true

  if (!options || !options.hasOwnProperty('showWinner') || options.showWinner) {
    // add ".winner" and ".runoff" to the winner(s)
    const overrideRaceWinner = OverrideRaceWinner[raceIdOrNull]
    let winner
    if (overrideRaceWinner) {
      winner = overrideRaceWinner === ret.fullName
    } else {
      if (options && options.lookAtElectWonNotWinner) {
        winner = (apJson.electWon || 0) > 0
      } else {
        winner = apJson.winner === 'X'
      }
    }
    if (winner) ret.winner = true
    if (apJson.winner === 'R') ret.runoff = true
  }

  return ret
}

function compareCandidates(a, b) {
  // Winner comes first
  if (a.winner !== b.winner) return (a.winner ? 0 : 1) - (b.winner ? 0 : 1)

  // Runoff-ers come first
  if (a.runoff !== b.runoff) return (a.runoff ? 0 : 1) - (b.runoff ? 0 : 1)

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
  'dem-lead': 3,
  'lib-win': 4,
  'lib-lead': 5,
  'grn-win': 6,
  'grn-lead': 7,
  'bfa-win': 8,
  'bfa-lead': 9,
  'other-win': 10,
  'other-lead': 11,
  'tossup': 12,
  'gop-lead': 13,
  'gop-win': 14,
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

function apCandidatesToCandidates(raceIdOrNull, apCandidates, options) {
  const ret = []
  let nOther = 0
  for (const apCandidate of apCandidates) {
    const candidate = apCandidateToCandidate(raceIdOrNull, apCandidate, options)
    if (candidate.partyId !== 'other') {
      ret.push(candidate)
    } else {
      nOther += apCandidate.voteCount
    }
  }
  ret.sort(compareCandidates)

  if (nOther !== 0) {
    // "Other" comes last, always. It can't be the leader.
    ret.push({ name: 'Other', partyId: 'other', n: nOther })
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

/**
 * Returns 'dem-win', 'dem-lead', 'tossup', etc.
 */
function presidentRaceClassName(race) {
  // Assume candidates are sorted
  const leader = race.candidates[0].partyId

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
  // Assume candidates are sorted
  if (race.winner) return `${race.winner}-win`

  const candidates = race.candidates
  if (candidates[0].runoff && candidates[1].runoff) {
    if (candidates[0].partyId === candidates[1].partyId) {
      return `${candidates[0].partyId}-win`
    } else {
      return 'tossup'
    }
  }

  if (candidates[0].n === candidates[1].n) {
    return 'tossup'
  } else {
    return `${candidates[0].partyId}-lead`
  }
}

const houseRaceClassName = senateRaceClassName

function postprocessPresidentRace(race) {
  // Nix Evan McMullin in non-UT
  if (race.id !== 'UT') {
    const idx = race.candidates.findIndex(c => c.partyId === 'bfa')
    const mcmullin = race.candidates[idx]
    if (idx !== -1) {
      const maybeOther = race.candidates[race.candidates.length - 1]
      race.candidates.splice(idx, 1)

      if (maybeOther.partyId === 'other') {
        race.candidates[race.candidates.length - 1].n += mcmullin.n
      } else {
        race.candidates.push({ name: 'Other', partyId: 'other', n: mcmullin.n })
      }
    }
  }

  // set race.nVotesClinton, race.nVotesTrump, race.nVotesThird
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
  const id = state.statePostal
  const race = {
    id: id,
    regionId: state.statePostal,
    name: stateName,
    stateName: stateName,
    nElectoralVotes: state.electTotal,
    fractionReporting: state.precinctsReporting === 0 ? 0 : state.precinctsReporting / state.precinctsTotal,
    candidates: apCandidatesToCandidates(id, state.candidates),
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
  const id = `${ru.statePostal}S3`
  const ret = {
    id: id,
    name: stateName,
    stateName: stateName,
    seatClass: '3',
    fractionReporting: ru.precinctsTotal === 0 ? 0 : ru.precinctsReporting / ru.precinctsTotal,
    candidates: apCandidatesToCandidates(id, ru.candidates)
  }
  ret.winner = raceWinner(ret)
  ret.className = senateRaceClassName(ret)
  ret.nVotes = countRaceVotes(ret)

  return ret
}

function apRaceToHouseRace(apRace) {
  const ru = apRace.reportingUnits[0]
  const stateName = StateCodeToStateName[ru.statePostal]
  const id = `${ru.statePostal}${String(100 + +apRace.seatNum).slice(1)}`

  const race = {
    id: id,
    stateName: stateName,
    name: / at large/i.test(apRace.description) ? `${stateName} At Large` : `${stateName} District ${apRace.seatNum}`,
    candidates: apCandidatesToCandidates(id, ru.candidates),
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

  const stateCode = apRaceToStateCode(apRace)
  const useFips = !ApIdToGeoIdStateCodes.hasOwnProperty(stateCode)

  for (const ru of apRace.reportingUnits.slice(1)) {
    const id = useFips ? ru.fipsCode : ApIdToGeoId[ru.reportingunitID]
    if (!id) throw new Error(`Could not find geo ID for ${JSON.stringify(ru)}; found "${JSON.stringify(id)}"`)

    const geo = {
      id: id,
      name: ru.reportingunitName,
      fractionReporting: ru.precinctsReportingPct / 100,
      candidates: apCandidatesToCandidates(null, ru.candidates, { showWinner: false })
    }
    geo.nVotes = countRaceVotes(geo)
    geo.className = presidentGeoClassName(geo)
    if (/-win$/.test(geo.className)) geo.candidates[0].winner = true

    ret.push(geo)
  }

  return ret
}

function apRaceToBallotInitiativeRace(apRace) {
  const state = apRace.reportingUnits[0]
  const id = `${state.statePostal}B${apRace.raceID}`

  if (!BallotInitiatives.hasOwnProperty(id)) return null
  const ballotInitiative = BallotInitiatives[id]

  const apYay = state.candidates.find(c => c.party === 'Yes')
  const apNay = state.candidates.find(c => c.party === 'No')

  let nVotes = 0
  for (const apCandidate of state.candidates) nVotes += apCandidate.voteCount

  return {
    id: id,
    fractionReporting: state.precinctsReporting === 0 ? 0 : state.precinctsReporting / state.precinctsTotal,
    nVotes: nVotes,
    name: ballotInitiative.name,
    description: ballotInitiative.description,
    href: ballotInitiative.href,
    yay: {
      name: apYay.last,
      winner: apYay.winner === 'X',
      n: apYay.voteCount
    },
    nay: {
      name: apNay.last,
      winner: apNay.winner === 'X',
      n: apNay.voteCount
    },
    className: apYay.winner === 'X' ? 'yay-win' : (apNay.winner === 'X' ? 'nay-win' : 'tossup')
  }
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
   * * className: 'dem-win', 'gop-lead', 'tossup', etc.
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
      if (candidate.winner === 'X') winner = candidate.party.toLowerCase()
    }

    // AP had an error in one test, so let's double-set this...
    if (nClinton >= 270) winner = 'dem'
    if (nTrump >= 270) winner = 'gop'

    const className = winner ? `${winner}-win`
      : (nClinton > nTrump ? 'dem-lead' : (nTrump > nClinton ? 'gop-lead' : 'tossup'));

    return {
      nClinton: nClintonVotes,
      nTrump: nTrumpVotes,
      nElectoralVotes: NElectoralVotes,
      nClintonElectoralVotes: nClinton,
      nTrumpElectoralVotes: nTrump,
      nOtherElectoralVotes: nOther,
      nTossupElectoralVotes: NElectoralVotes - nClinton - nTrump - nOther,
      className: className
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
   *      { name: 'Clinton', partyId: 'dem', fullName: 'Hillary Clinton', n: 612 },
   *      { name: 'Trump', partyId: 'gop', fullName: 'Donald Trump', n: 612 },
   *      { name: 'Johnson', partyId: 'lib', fullName: 'Gary Johnson', n: 2 },
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
   *
   * We set party IDs based on the candidate's name, NOT AP data (which often
   * shows "Una" -- as in, "unaffiliated"). 'UT' gets an Evan McMullin (party
   * ID 'bfa'). Other than that, we filter for Donald Trump ('gop'), Hillary
   * Clinton ('dem'), Gary Johnson ('lib') and Jill Stein ('grn').
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
        // id: "ME", "ME1", "ME2", ...
        const id = ru.statePostal + (ru.districtType === 'CD' ? ru.reportingunitName.slice('District '.length) : '')
        const race = {
          id: id,
          regionId: ru.statePostal,
          name: `${stateName} ${ru.reportingunitName}`,
          stateName: stateName,
          nElectoralVotes: ru.electTotal,
          fractionReporting: state.precinctsReporting === 0 ? 0 : state.precinctsReporting / state.precinctsTotal,
          // second-guess AP: it's NE/ME candidates are called state-wide, not
          // per-district. electWon is set per-district.
          candidates: apCandidatesToCandidates(id, ru.candidates, { lookAtElectWonNotWinner: true }),
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
   *     },
   *     className: one of 'dem-lead', 'dem-lead', 'tossup', 'gop-lead', 'gop-win'
   *   }
   *
   * We only ever return "dem" and "gop", because anybody who enters the Senate
   * will caucus with one or the other.
   */
  senateSummary() {
    let n = 0
    const popular = { dem: 0, gop: 0 }
    const totals = { dem: 0, gop: 0 }
    const wins = { dem: 0, gop: 0 }
    const priors = { dem: 0, gop: 0 }

    for (const race of this.senateRaces()) {
      n += 1

      if (/^..S3$/.test(race.id)) { // ignore prior races
        for (const candidate of race.candidates) {
          if (popular.hasOwnProperty(candidate.partyId)) {
            popular[candidate.partyId] += candidate.n
          }
        }
      }

      switch (race.className) {
        case 'dem-prior':
          totals.dem += 1
          priors.dem += 1
          break
        case 'gop-prior':
          totals.gop += 1
          priors.gop += 1
          break
        case 'dem-win':
          totals.dem += 1
          wins.dem += 1
          break
        case 'gop-win':
          totals.gop += 1
          wins.gop += 1
          break
        case 'dem-lead':
        case 'gop-lead':
        case 'tossup':
          break
      }
    }

    if (n != 100) throw new Error(`URGENT: expected 100 Senate races; got ${n}`)

    const className = totals.dem > 50 ? 'dem-win'
      : (totals.gop > 50 ? 'gop-win'
        : (totals.dem > totals.gop ? 'dem-lead'
          : (totals.gop > totals.dem ? 'gop-lead' : this.presidentSummary().className)))

    return {
      n: n,
      tossup: n - totals.dem - totals.gop,
      priors: priors,
      wins: wins,
      totals: totals,
      popular: popular,
      className: className
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
   *       [ ... no other parties ]
   *     },
   *     popular: {
   *      dem: uint number of votes for Democrats
   *      gop: uint number of votes for Republicans
   *     },
   *     className: one of 'dem-win', 'dem-lead', 'tossup', 'gop-lead', 'gop-win'
   *   }
   */
  houseSummary() {
    let n = 0
    const popular = { dem: 0, gop: 0 }
    const wins = { dem: 0, gop: 0 }

    for (const race of this.houseRaces()) {
      n += 1

      for (const candidate of race.candidates) {
        if (popular.hasOwnProperty(candidate.partyId)) {
          popular[candidate.partyId] += candidate.n
        }
      }

      switch (race.className) {
        case 'dem-win':
          wins.dem += 1
          break
        case 'gop-win':
          wins.gop += 1
          break
        default: break
      }
    }

    if (n != 435) throw new Error(`URGENT: expected 435 House races; got ${n}`)

    var nWin = Math.ceil(n / 2);
    const className = wins.dem >= nWin ? 'dem-win'
      : (wins.gop >= nWin ? 'gop-win'
        : (wins.dem > wins.gop ? 'dem-lead'
          : (wins.gop > wins.dem ? 'gop-lead' : 'tossup')));

    return {
      total: n,
      tossup: n - wins.dem - wins.gop,
      wins: wins,
      popular: popular,
      className: className
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
   *        { name: 'Black', partyId: 'gop', n: 12111 },
   *        ...
   *       ]
   *     },
   *     ...
   *   ]
   */
  senateRaces() {
    const races = this.reportingUnitElections.findSenateRaces().map(apRaceToSenateRace)
    const priorRaces = SenatePriorSeats
      .filter(seat => seat.seatClass !== '3')

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
   *        { name: 'Black', partyId: 'gop', n: 12111 },
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
        senate: {
          seats: SenatePriorSeats.filter(s => s.id.slice(0, 2) === race.id).sort((a, b) => a.id.localeCompare(b.id)),
        },
        house: [],
        ballot: []
      }
    }

    // Pick Add "district" races
    ret.ME.president.districts = []
    ret.NE.president.districts = []
    const districtRaces = this.presidentRaces().filter(r => r.id.length === 3).sort((a, b) => a.id.localeCompare(b.id))
    for (const districtRace of districtRaces) {
      ret[districtRace.id.slice(0, 2)].president.districts.push(districtRace)
    }

    for (const apRace of this.reportingUnitElections.findSenateRaces()) {
      const race = apRaceToSenateRace(apRace)
      const stateId = race.id.slice(0, 2)

      ret[stateId].senate.race = race
      ret[stateId].senate.geos = apRaceToGeos(apRace)
    }

    for (const apRace of this.reportingUnitElections.findHouseRaces()) {
      const race = apRaceToHouseRace(apRace)
      const stateId = race.id.slice(0, 2)
      ret[stateId].house.push(race)
    }

    for (const apRace of this.reportingUnitElections.findBallotInitiativeRaces()) {
      const race = apRaceToBallotInitiativeRace(apRace)
      if (!race) continue // we aren't covering this one
      const stateId = race.id.slice(0, 2)
      ret[stateId].ballot.push(race)
    }

    for (const stateId of Object.keys(ret)) {
      ret[stateId].house.sort((a, b) => a.id.localeCompare(b.id))
      ret[stateId].ballot.sort((a, b) => a.id.localeCompare(b.id))
    }

    return ret
  }
}
