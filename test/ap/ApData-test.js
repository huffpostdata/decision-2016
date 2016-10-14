'use strict'

const expect = require('chai').expect

const ApData = require('../../app/ap/ApData')

describe('ApData', () => {
  describe('#presidentSummary', () => {
    describe('with sample data', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { last: 'Clinton', voteCount: 23456, electWon: 257, winner: '' },
            { last: 'Trump', voteCount: 12345, electWon: 182, winner: '' },
            { last: 'Johnson', voteCount: 123, electWon: 0, winner: '' }
          ]}]
        }}
      }, null)
      const summary = apData.presidentSummary()

      it('should count nClinton and nTrump', () => {
        expect(summary.nClinton).to.eq(23456)
        expect(summary.nTrump).to.eq(12345)
      })

      it('should set nElectoralVotes to 538', () => {
        expect(summary.nElectoralVotes).to.eq(538)
      })

      it('should count nClintonElectoralVotes, nTrumpElectoralVotes', () => {
        expect(summary.nClintonElectoralVotes).to.eq(257)
        expect(summary.nTrumpElectoralVotes).to.eq(182)
      })

      it('should count nTossupElectoralVotes', () => {
        expect(summary.nTossupElectoralVotes).to.eq(99)
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
      function build(winner) {
        return { reportingUnits: [ { candidates: [
          { last: 'SomeDem', party: 'Dem', winner: (winner === 'Dem' ? 'X' : '') },
          { last: 'SomeGop', party: 'GOP', winner: (winner === 'GOP' ? 'X' : '') },
          { last: 'SomeoneElse', party: 'Grn', winner: '' }
        ]}]}
      }
      const dems = new Array(8).fill(null).map((_, i) => build('Dem'))
      const gops = new Array(10).fill(null).map((_, i) => build('GOP'))
      const tossup = new Array(16).fill(null).map((_, i) => build())

      const apData = new ApData({
        findSenateRaces() {
          return dems.concat(...gops).concat(...tossup)
        }
      }, null)
      const summary = apData.senateSummary()

      it('should always have n=100', () => {
        expect(summary.n).to.eq(100)
      })

      it('should set priors correctly (Dem-36, GOP-30)', () => {
        expect(summary.priors).to.deep.eq({ dem: 36, gop: 30 })
      })

      it('should set wins correctly (according to races)', () => {
        expect(summary.wins).to.deep.eq({ dem: 8, gop: 10 })
      })

      it('should set totals correctly (according to races+static)', () => {
        expect(summary.totals).to.deep.eq({ dem: 44, gop: 40 })
      })
    }) // with sample data

    it('should throw if a non-Dem/GOP candidate wins', () => {
      function build(winner) {
        return { reportingUnits: [ { candidates: [
          { last: 'SomeDem', party: 'Dem', winner: (winner === 'Dem' ? 'X' : '') },
          { last: 'SomeGop', party: 'GOP', winner: (winner === 'GOP' ? 'X' : '') },
          { last: 'SomeoneElse', party: 'Grn', winner: '' }
        ]}]}
      }
      const dems = new Array(8).fill(null).map((_, i) => build('Dem'))
      const gops = new Array(10).fill(null).map((_, i) => build('GOP'))
      const tossup = new Array(16).fill(null).map((_, i) => build())
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
        return { reportingUnits: [ { candidates: [] } ] }
      })
      const apData = new ApData({
        findSenateRaces() { return races }
      })
      expect(() => apData.senateSummary()).to.throw(Error)
    })
  }) // #senateSummary

  describe('#houseSummary', () => {
    describe('with sample data', () => {
      function build(winner) {
        return { reportingUnits: [ { candidates: [
          { last: 'SomeDem', party: 'Dem', winner: (winner === 'Dem' ? 'X' : '') },
          { last: 'SomeGop', party: 'GOP', winner: (winner === 'GOP' ? 'X' : '') },
          { last: 'SomeoneElse', party: 'Grn', winner: '' }
        ]}]}
      }
      const dems = new Array(80).fill(null).map((_, i) => build('Dem'))
      const gops = new Array(100).fill(null).map((_, i) => build('GOP'))
      const tossup = new Array(255).fill(null).map((_, i) => build())

      const apData = new ApData({
        findHouseRaces() {
          return dems.concat(...gops).concat(...tossup)
        }
      }, null)
      const summary = apData.houseSummary()

      it('should always have total=435', () => {
        expect(summary.total).to.eq(435)
      })

      it('should set tossup correctly', () => {
        expect(summary.tossup).to.eq(255)
      })

      it('should set wins', () => {
        expect(summary.wins).to.deep.eq({ dem: 80, gop: 100 })
      })

      it('should report a GOP win', () => {
        tossup[10].reportingUnits[0].candidates[2].party = 'Lib'
        tossup[10].reportingUnits[0].candidates[2].winner = 'X'
        const summary = apData.houseSummary()
        expect(summary.wins).to.deep.eq({ dem: 80, gop: 100, lib: 1 })
        expect(summary.tossup).to.eq(254)
      })

      it('should throw if there are not 34 races', () => {
        const apData = new ApData({
          findHouseRaces() {
            const ret = dems.concat(...gops).concat(...tossup)
            ret.pop()
            return ret
          }
        }, null)

        expect(() => apData.houseSummary()).to.throw(Error)
      })
    }) // with sample data
  }) // #houseSummary
}) // ApData
