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
}
