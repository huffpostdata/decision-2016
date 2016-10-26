'use strict'

const expect = require('chai').expect

const fs = require('fs')

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

    it('should set nOtherElectoralVotes', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { last: 'Clinton', voteCount: 23456, electWon: 20, winner: '' },
            { last: 'Trump', voteCount: 12345, electWon: 10, winner: '' },
            { last: 'Johnson', voteCount: 123, electWon: 3, winner: '' }
          ]}]
        }}
      }, null)
      const summary = apData.presidentSummary()
      expect(summary.nOtherElectoralVotes).to.eq(3)
      expect(summary.nTossupElectoralVotes).to.eq(538 - 33)
    })
  }) // #presidentSummary

  describe('#presidentRaces', () => {
    describe('with sample data', () => {
      // We use a similar pattern in elections-test.js
      const tsvData = fs.readFileSync(`${__dirname}/../../app/google-sheets/presidentRaces.tsv`, 'utf-8')
        .split(/\r?\n/g)
        .slice(1)                  // ignore header
        .filter(s => s.length > 0) // ignore trailing newlines
        .map(s => s.split(/\t/g))

      const reportingUnitRaces = tsvData
        .map(row => {
          return {
            officeID: 'P',
            reportingUnits: [ {
              statePostal: row[2],
              stateName: row[4],
              electTotal: +row[3],
              candidates: [
                // Funny "winner" pick: 0-8 votes: Trump, 11+ votes: Clinton; rest: tossup
                { first: 'Hillary', last: 'Clinton', party: 'Dem', winner: (+row[3] > 11 ? 'X' : '') },
                { first: 'Donald', last: 'Trump', party: 'GOP', winner: (+row[3] <= 8 ? 'X' : '') },
                { first: 'Oth', last: 'er', party: 'Ind', winner: '' }
              ]
            } ]
          }
        })

      const districtRaces = []
      for (const row of tsvData) {
        if (row[1].length === 0) continue // only district races
        if (districtRaces.length === 0 || districtRaces[districtRaces.length - 1].reportingUnits[0].statePostal !== row[2]) {
          // New district
          districtRaces.push({
            officeID: 'P',
            reportingUnits: [ {
              level: 'state',
              statePostal: row[2],
              stateName: row[4],
              statePostal: row[2],
              electTotal: (row[2] === 'ME' ? 4 : 5),
            } ]
          })
        }

        districtRaces[districtRaces.length - 1].reportingUnits.push({
          level: 'district',
          stateName: row[4],
          statePostal: row[2],
          // no stateName
          electTotal: +row[3],
          reportingunitID: row[1].slice(2),
          reportingunitName: row[0].length === 2 ? 'At Large' : `District ${row[0].slice(2)}`,
          candidates: [
            { first: 'Hillary', last: 'Clinton', party: 'Dem', winner: ([ 'ME', 'ME1', 'NE2' ].indexOf(row[0] === -1) ? '' : 'X') },
            { first: 'Donald', last: 'Trump', party: 'GOP', winner: ([ 'ME2', 'NE', 'NE2' ].indexOf(row[0] === -1) ? '' : 'X') },
            { first: 'Oth', last: 'er', party: 'Ind', winner: '' }
          ]
        })
      }

      function go(reportingUnitRaces, districtRaces) {
        const apData = new ApData({
          findPresidentRaces() { return reportingUnitRaces }
        }, {
          findPresidentRaces() { return districtRaces }
        })
        return apData.presidentRaces()
      }

      const races = go(reportingUnitRaces, districtRaces)

      it('should find 56 races (50 states + DC + 2 ME + 3 NE)', () => {
        expect(races.length).to.eq(56)
      })

      it('should sort alphabetically', () => {
        const reportingUnitRaces2 = [ reportingUnitRaces[1], reportingUnitRaces[0] ].concat(reportingUnitRaces.slice(2))
        const races = go(reportingUnitRaces2, districtRaces)
        expect(races[0].name).to.eq('Alabama')
        expect(races[1].name).to.eq('Alaska')
      })

      it('should set nElectoralVotes', () => {
        expect(races[0].nElectoralVotes).to.eq(9)
      })

      it('should split ME races properly', () => {
        const me = races[19]
        expect(me.name).to.eq('Maine At Large')
        expect(me.regionName).to.eq('Maine')
        expect(me.nElectoralVotes).to.eq(2)

        const me1 = races[20]
        expect(me1.name).to.eq('Maine District 1')
        expect(me1.regionName).to.eq('Maine')
        expect(me1.nElectoralVotes).to.eq(1)
      })

      it('should count nVotes, nVotesClinton, nVotesTrump, nVotesOther', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2[0]
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', last: 'Trump', voteCount: 2345 },
          { party: 'Lib', last: 'Johnson', voteCount: 3456 },
          { party: 'Oth', last: 'Other', voteCount: 4567 }
        ]
        const race = go(reportingUnitRaces2, districtRaces)[0]
        expect(race.nVotes).to.eq(1234+2345+3456+4567)
        expect(race.nVotesClinton).to.eq(1234)
        expect(race.nVotesTrump).to.eq(2345)
        expect(race.nVotesOther).to.eq(3456+4567)
      })

      it('should count nPrecincts and nPrecinctsReporting', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        Object.assign(reportingUnitRaces2[0].reportingUnits[0], {
          precinctsReporting: 106,
          precinctsTotal: 166
        })
        const race = go(reportingUnitRaces2, districtRaces)[0]
        expect(race.nPrecincts).to.eq(166)
        expect(race.nPrecinctsReporting).to.eq(106)
      })

      it('should format candidates', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2[0]
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', first: 'Hillary', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', first: 'Donald', last: 'Trump', voteCount: 2345, winner: 'X' },
          { party: 'Lib', first: 'Gary', last: 'Johnson', voteCount: 3456 },
          { party: 'Oth', first: 'Oth', last: 'Er', voteCount: 4567 }
        ]
        const candidates = go(reportingUnitRaces2, districtRaces)[0].candidates
        expect(candidates).to.deep.eq([
          { name: 'Clinton', fullName: 'Hillary Clinton', n: 1234, partyId: 'dem', winner: false },
          { name: 'Trump', fullName: 'Donald Trump', n: 2345, partyId: 'gop', winner: true },
          { name: 'Johnson', fullName: 'Gary Johnson', n: 3456, partyId: 'lib', winner: false },
          { name: 'Er', fullName: 'Oth Er', n: 4567, partyId: 'oth', winner: false }
        ])
      })

      it('should set the winner', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2[0]
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', last: 'Trump', voteCount: 2345, winner: 'X' },
          { party: 'Lib', last: 'Johnson', voteCount: 3456 },
          { party: 'Oth', last: 'Other', voteCount: 4567 }
        ]
        const race = go(reportingUnitRaces2, districtRaces)[0]
        expect(race.winner).to.eq('trump')
      })

      it('should set winner=null', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2[0]
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', last: 'Trump', voteCount: 2345 },
          { party: 'Lib', last: 'Johnson', voteCount: 3456 },
          { party: 'Oth', last: 'Other', voteCount: 4567 }
        ]
        const race = go(reportingUnitRaces2, districtRaces)[0]
        expect(race.winner).to.eq(null)
      })
    })
  }) // #presidentRaces

  describe('#senateSummary', () => {
    describe('with sample data', () => {
      function build(winner) {
        return { reportingUnits: [ { statePostal: 'AK', candidates: [
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

      it('should set wins correctly when a party has 0', () => {
        const apData = new ApData({
          findSenateRaces() {
            return dems.concat(...new Array(26).fill(null).map(build))
          }
        }, null)
        const summary = apData.senateSummary()
        expect(summary.wins.gop).to.eq(0)
        expect(summary.totals.gop).to.eq(30)
        expect(summary.tossup).to.eq(26)
      })

      it('should set wins correctly (according to races)', () => {
        expect(summary.wins).to.deep.eq({ dem: 8, gop: 10 })
      })

      it('should set totals correctly (according to races+static)', () => {
        expect(summary.totals).to.deep.eq({ dem: 44, gop: 40 })
      })

      it('should set tossup correctly', () => {
        expect(summary.tossup).to.eq(16)
      })

      describe('fiddling with CA', () => {
        const tossup2 = JSON.parse(JSON.stringify(tossup))
        tossup2[0].reportingUnits[0].statePostal = 'CA'

        const apData = new ApData({
          findSenateRaces() {
            return dems.concat(...gops).concat(...tossup2)
          }
        }, null)

        it('should mark CA as a win for Dem before AP calls the race', () => {
          // CA's two Senate candidates are both Democrats. That means a
          // democrat is guaranteed to win, even before AP calls it
          const summary = apData.senateSummary()
          expect(summary.wins).to.deep.eq({ dem: 9, gop: 10 })
        })

        it('should not double-count CA for Dem after AP calls the race', () => {
          tossup2[0].reportingUnits[0].candidates[0].winner = 'X' // candidates[0] is SomeDem
          const summary = apData.senateSummary()
          expect(summary.wins).to.deep.eq({ dem: 9, gop: 10 })
        })
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
