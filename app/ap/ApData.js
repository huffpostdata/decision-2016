'use strict'

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
    winner: (apJson.winner === 'X')
  }
}

function compareCandidates(a, b) {
  // Winner comes first
  if (a.winner !== b.winner) return (a.winner ? 0 : 1) - (b.winner ? 0 : 1)

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
  'dem-win': 1,
  'clinton-win': 1,
  'dem-lead': 2,
  'clinton-lead': 2,
  'lib-win': 3,
  'johnson-win': 3,
  'lib-lead': 4,
  'lib-win': 4,
  'grn-win': 5,
  'stein-win': 5,
  'grn-lead': 6,
  'stein-lead': 6,
  'bfa-win': 7,
  'mcmullin-win': 7,
  'bfa-lead': 8,
  'mcmullin-lead': 8,
  'other-win': 9,
  'other-lead': 10,
  'tossup': 11,
  'gop-lead': 12,
  'trump-lead': 12,
  'gop-win': 13,
  'trump-win': 13
}
function compareRaces(a, b) {
  // 1. Sort by class name: dem-win on left, gop-win on right
  const aSort = ClassNameSortOrder[a.className] || ClassNameSortOrder.tossup
  const bSort = ClassNameSortOrder[b.className] || ClassNameSortOrder.tossup
  if (aSort !== bSort) return aSort - bSort

  // 2. Sort by state name
  if (a.stateName !== b.stateName) return a.stateName.localeCompare(b.stateName)

  // 3. Sort by seat number (be careful: "3" should come _after_ "20")
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
  ret.push({ name: 'Other', party: 'other', n: nOther, winner: false })
  return ret
}

function houseRaceClassName(race) {
  if (race.winner) return `${race.winner}-win`

  // Assume candidates are sorted
  if (race.candidates[0].n === race.candidates[1].n) {
    return 'tossup'
  } else {
    return `${race.candidates[0].partyId}-lead`
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
   *     nPrecintsReporting: 102,
   *     nPrecincts: 243,
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

    function addCandidatesToRace(race, apCandidates) {
      let n = 0
      let nClinton = 0
      let nTrump = 0
      let nThird = 0
      let winner = null

      let candidates = []
      for (const c of apCandidates) {
        n += c.voteCount

        if (c.last === 'Clinton') {
          nClinton += c.voteCount
        } else if (c.last === 'Trump') {
          nTrump += c.voteCount
        } else if (c.voteCount > nThird) {
          nThird = c.voteCount
        }

        if (c.winner === 'X') winner = c.last.toLowerCase()

        candidates.push(apCandidateToCandidate(c))
      }

      race.nVotes = n
      race.nVotesClinton = nClinton
      race.nVotesTrump = nTrump
      race.nVotesThird = nThird
      race.candidates = candidates
      race.winner = winner
    }

    for (const apRace of this.reportingUnitElections.findPresidentRaces()) {
      const state = apRace.reportingUnits[0]
      if (state.statePostal === 'ME' || state.statePostal === 'NE') continue;

      const race = {
        id: state.statePostal,
        regionId: state.statePostal,
        name: state.stateName,
        regionName: state.stateName,
        nElectoralVotes: state.electTotal,
        nPrecinctsReporting: state.precinctsReporting,
        nPrecincts: state.precinctsTotal
      }

      addCandidatesToRace(race, state.candidates)
      ret.push(race)
    }

    for (const apState of this.districtElections.findPresidentRaces()) {
      const state = apState.reportingUnits[0]

      for (const ru of apState.reportingUnits.slice(1)) {
        const race = {
          // id: "ME", "ME1", "ME2", ...
          id: ru.statePostal + (ru.districtType === 'CD' ? ru.reportingunitName.slice('District '.length) : ''),
          regionId: ru.statePostal,
          name: `${state.stateName} ${ru.reportingunitName}`,
          regionName: state.stateName,
          nElectoralVotes: ru.electTotal,
          nPrecinctsReporting: ru.precinctsReporting,
          nPrecincts: ru.precinctsTotal
        }

        addCandidatesToRace(race, ru.candidates)
        ret.push(race)
      }
    }

    ret.sort((a, b) => a.name.localeCompare(b.name)) // it just so happens "At large" < "District 1"
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

    const races = this.reportingUnitElections.findSenateRaces()
    if (races.length != NRaces) {
      throw new Error(`URGENT: expected ${NRaces} Senate races; got ${races.length}`)
    }
    for (const race of races) {
      if (apRaceToStateCode(race) === 'CA') {
        // CA is a race between a Democrat and a Democrat
        wins.dem += 1
        totals.dem += 1
      } else {
        for (const candidate of race.reportingUnits[0].candidates) {
          if (candidate.winner === 'X') {
            if (candidate.party !== 'Dem' && candidate.party !== 'GOP') {
              throw new Error(`URGENT: a Senate winner is from party ${candidate.party} but we only handle "Dem" and "GOP"`)
            }

            const partyId = candidate.party.toLowerCase()
            if (!wins.hasOwnProperty(partyId)) wins[partyId] = 0
            if (!totals.hasOwnProperty(partyId)) totals[partyId] = 0
            wins[partyId] += 1
            totals[partyId] += 1
          }
        }
      }
    }

    return {
      n: NTotal,
      tossup: NTotal - NDemPrior - NGopPrior - wins.dem - wins.gop,
      priors: { dem: NDemPrior, gop: NGopPrior },
      wins: wins,
      totals: totals,
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
    let wins = {}

    for (const race of races) {
      for (const candidate of race.reportingUnits[0].candidates) {
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
      wins: wins
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
   *       nPrecinctsReporting: 102,
   *       nPrecincts: 243,
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
    // TK NEED UNIT TESTS
    return this.reportingUnitElections.findSenateRaces().map(race => {
      const ru = race.reportingUnits[0]

      return {
        id: `${ru.statePostal}S3`,
        name: ru.stateName,
        className: [ 'dem-win', 'gop-win', 'dem-lead', 'gop-lead', 'tossup' ][Math.floor(Math.random() * 5)], // TK
        winner: null, // TK
        candidates: ru.candidates
      }
    })
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
   *       nPrecinctsReporting: 102,
   *       nPrecincts: 243,
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
    // TK NEED UNIT TESTS
    const ret = this.reportingUnitElections.findHouseRaces().map(apRace => {
      const ru = apRace.reportingUnits[0]

      const race = {
        id: `${ru.statePostal}${String(100 + +apRace.seatNum).slice(1)}`,
        name: / at large/i.test(apRace.description) ? `${ru.stateName} At Large` : `${ru.stateName} District ${apRace.seatNum}`,
        candidates: apCandidatesToCandidates(ru.candidates),
        nPrecinctsReporting: apRace.precinctsReporting,
        nPrecincts: apRace.precinctsTotal
      }
      race.winner = race.candidates[0].winner ? race.candidates[0].partyId : null

      race.className = houseRaceClassName(race)

      return race
    })

    ret.sort(compareRaces)

    return ret
  }
}
