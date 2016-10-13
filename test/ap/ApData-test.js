'use strict'

const expect = require('chai').expect

const ApData = require('../../app/ap/ApData')

describe('ApData', () => {
  describe('#presidentSummary', () => {
    describe('with sample data', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { last: 'Clinton', voteCount: 23456, electWon: 0, winner: '' },
            { last: 'Trump', voteCount: 12345, electWon: 0, winner: '' },
            { last: 'Johnson', voteCount: 123, electWon: 0, winner: '' }
          ]}]
        }}
      }, null)
      const summary = apData.presidentSummary()

      it('should count nClinton and nTrump', () => {
        expect(summary.nClinton).to.eq(23456)
        expect(summary.nTrump).to.eq(12345)
      })

      it('should count nClintonElectoralVotes, nTrumpElectoralVotes', () => {
        expect(summary.nClinton).to.eq(23456)
        expect(summary.nTrump).to.eq(12345)
      })

      it('should default to winner=null', () => {
        expect(summary.winner).to.eq(null)
      })
    }) // with sample data

    it('should call for Clinton', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { last: 'Clinton', voteCount: 23456, electWon: 0, winner: 'X' },
            { last: 'Trump', voteCount: 12345, electWon: 0, winner: '' },
            { last: 'Johnson', voteCount: 123, electWon: 0, winner: '' }
          ]}]
        }}
      }, null)
      expect(apData.presidentSummary().winner).to.eq('clinton')
    })

    it('should call for Trump', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { last: 'Clinton', voteCount: 23456, electWon: 0, winner: '' },
            { last: 'Trump', voteCount: 12345, electWon: 0, winner: 'X' },
            { last: 'Johnson', voteCount: 123, electWon: 0, winner: '' }
          ]}]
        }}
      }, null)
      expect(apData.presidentSummary().winner).to.eq('trump')
    })
  }) // #presidentSummary

  describe('#senateSummary', () => {
    describe('with sample data', () => {
      function build(stateName, winner) {
        return { stateName: stateName, reportingUnits: [ { candidates: [
          { last: 'SomeDem', party: 'Dem', winner: (winner === 'Dem' ? 'X' : '') },
          { last: 'SomeGop', party: 'GOP', winner: (winner === 'GOP' ? 'X' : '') },
          { last: 'SomeoneElse', party: 'Grn', winner: '' }
        ]}]}
      }
      const dems = new Array(8).fill(null).map((_, i) => build(`DState${i}`, 'Dem'))
      const gops = new Array(10).fill(null).map((_, i) => build(`GState${i}`, 'GOP'))
      const tossup = new Array(16).fill(null).map((_, i) => build(`TState${i}`))

      const apData = new ApData({
        findSenateRaces() {
          return dems.concat(...gops).concat(...tossup)
        }
      }, null)
      const summary = apData.senateSummary()

      it('should always have n=100', () => {
        expect(summary.n).to.eq(100)
      })

      it('should set static correctly (Dem-36, GOP-30)', () => {
        expect(summary.static).to.deep.eq({ nDem: 36, nGop: 30 })
      })

      it('should set election correctly (according to races)', () => {
        expect(summary.election).to.deep.eq({ nDem: 8, nGop: 10 })
      })

      it('should set total correctly (according to races+static)', () => {
        expect(summary.total).to.deep.eq({ nDem: 44, nGop: 40 })
      })
    }) // with sample data

    it('should throw if a non-Dem/GOP candidate wins', () => {
      function build(stateName, winner) {
        return { stateName: stateName, reportingUnits: [ { candidates: [
          { last: 'SomeDem', party: 'Dem', winner: (winner === 'Dem' ? 'X' : '') },
          { last: 'SomeGop', party: 'GOP', winner: (winner === 'GOP' ? 'X' : '') },
          { last: 'SomeoneElse', party: 'Grn', winner: '' }
        ]}]}
      }
      const dems = new Array(8).fill(null).map((_, i) => build(`DState${i}`, 'Dem'))
      const gops = new Array(10).fill(null).map((_, i) => build(`GState${i}`, 'GOP'))
      const tossup = new Array(16).fill(null).map((_, i) => build(`TState${i}`))
      tossup[3].reportingUnits[0].candidates[2].winner = 'X'

      const apData = new ApData({
        findSenateRaces() {
          return dems.concat(...gops).concat(...tossup)
        }
      }, null)
      expect(() => apData.senateSummary()).to.throw(Error)
    })

    it('should throw if there are not 34 races', () => {
      const races = new Array(33).fill(null).map((_, i) => {
        return { stateName: `State${i}`, reportingUnits: [ { candidates: [] } ] }
      })
      const apData = new ApData({
        findSenateRaces() { return races }
      })
      expect(() => apData.senateSummary()).to.throw(Error)
    })
  }) // #senateSummary
}) // ApData
