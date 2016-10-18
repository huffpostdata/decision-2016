'use strict'

/**
 * A rollup of all the data Associated Pres gives us.
 */
module.exports = class ApData {
  constructor(fipscodeElections, districtElections) {
    this.fipscodeElections = fipscodeElections
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
   * * nTossupElectoralVotes: 538 - nClintonElectoralVotes - nTrumpElectoralVotes
   * * winner: 'clinton', 'trump', or null
   */
  presidentSummary() {
    const NElectoralVotes = 538

    const race = this.fipscodeElections.findUSPresidentRace()
    const candidates = race.reportingUnits[0].candidates
    const clinton = candidates.find(c => c.last === 'Clinton')
    const trump = candidates.find(c => c.last === 'Trump')

    return {
      nClinton: clinton.voteCount,
      nTrump: trump.voteCount,
      nElectoralVotes: NElectoralVotes,
      nClintonElectoralVotes: clinton.electWon,
      nTrumpElectoralVotes: trump.electWon,
      nTossupElectoralVotes: NElectoralVotes - clinton.electWon - trump.electWon,
      winner: clinton.winner === 'X' ? 'clinton' : (trump.winner === 'X' ? 'trump' : null)
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
   *     nVotesOther: (uint nVotes - nVotesClinton - nVotesTrump)
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
      let winner = null

      let candidates = []
      for (const c of apCandidates) {
        n += c.voteCount
        if (c.last === 'Clinton') nClinton += c.voteCount
        if (c.last === 'Trump') nTrump += c.voteCount
        if (c.winner === 'X') winner = c.last.toLowerCase()
        candidates.push({
          name: c.last,
          fullName: `${c.first} ${c.last}`,
          partyId: c.party.toLowerCase(),
          n: c.voteCount,
          winner: (c.winner === 'X')
        })
      }

      race.nVotes = n
      race.nVotesClinton = nClinton
      race.nVotesTrump = nTrump
      race.nVotesOther = n - nClinton - nTrump
      race.candidates = candidates
      race.winner = winner
    }

    for (const apRace of this.fipscodeElections.findPresidentRaces()) {
      const state = apRace.reportingUnits[0]

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

    const wins = {}
    const totals = { dem: NDemPrior, gop: NGopPrior }

    const races = this.fipscodeElections.findSenateRaces()
    if (races.length != NRaces) {
      throw new Error(`URGENT: expected ${NRaces} Senate races; got ${races.length}`)
    }
    for (const race of races) {
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

    const races = this.fipscodeElections.findHouseRaces()
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
}
