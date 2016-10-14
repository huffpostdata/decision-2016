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
   * Returns Senate counts.
   *
   * The output looks like this:
   *
   *   {
   *     n: 100,
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
   *     total: {
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
