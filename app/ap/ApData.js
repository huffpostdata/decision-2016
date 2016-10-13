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
   * * nClintonElectoralVotes: uint electoral votes for Clinton, [0, 538]
   * * nTrumpElectoralVotes: uint electoral votes for Trump, [0, 538]
   * * winner: 'clinton', 'trump', or null
   */
  presidentSummary() {
    const race = this.fipscodeElections.findUSPresidentRace()
    const candidates = race.reportingUnits[0].candidates
    const clinton = candidates.find(c => c.last === 'Clinton')
    const trump = candidates.find(c => c.last === 'Trump')

    return {
      nClinton: clinton.voteCount,
      nTrump: trump.voteCount,
      nClintonElectoralVotes: clinton.electWon,
      nTrumpElectoralVotes: trump.electWon,
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
   *     static: {
   *       // Senate seats that are _not_ up for reelection
   *       nDem: uint number of senators who caucus with Democrats
   *       nGop: uint number of senators who caucus with Republicans
   *     },
   *     election: {
   *       // Senate seats that are up for reelection
   *       nDem: uint number of winning senators who say they'll caucus with Democrats
   *       nGop: uint number of winning senators who say they'll caucus with Republicans
   *     },
   *     total: {
   *       nDem: uint total number of senators who say they'll caucus with Democrats in 2017
   *       nGop: uint total number of senators who say they'll caucus with Republicans in 2017
   *     }
   *   }
   */
  senateSummary() {
    const NTotal = 100
    const NDemStatic = 36
    const NGopStatic = 30
    const NRaces = NTotal - NDemStatic - NGopStatic

    let nDem = 0
    let nGop = 0

    const races = this.fipscodeElections.findSenateRaces()
    if (races.length != NRaces) {
      throw new Error(`URGENT: expected ${NRaces} Senate races; got ${races.length}`)
    }
    for (const race of races) {
      for (const candidate of race.reportingUnits[0].candidates) {
        if (candidate.winner === 'X') {
          switch (candidate.party) {
            case 'Dem': nDem += 1; break
            case 'GOP': nGop += 1; break
            default: throw new Error(`URGENT: a Senate winner is from party ${candidate.party} but we only handle "Dem" and "GOP"`)
          }
        }
      }
    }

    return {
      n: NTotal,
      static: { nDem: NDemStatic, nGop: NGopStatic },
      election: { nDem: nDem, nGop: nGop },
      total: { nDem: NDemStatic + nDem, nGop: NGopStatic + nGop }
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
