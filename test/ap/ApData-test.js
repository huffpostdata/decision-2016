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
              statePostal: row[2],
              electTotal: (row[2] === 'ME' ? 4 : 5),
            } ]
          })
        }

        districtRaces[districtRaces.length - 1].reportingUnits.push({
          level: 'district',
          statePostal: row[2],
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
        expect(me.stateName).to.eq('Maine')
        expect(me.nElectoralVotes).to.eq(2)

        const me1 = races[20]
        expect(me1.name).to.eq('Maine District 1')
        expect(me1.stateName).to.eq('Maine')
        expect(me1.nElectoralVotes).to.eq(1)
      })

      it('should count nVotes, nVotesClinton, nVotesTrump, nVotesThird', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2[0]
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', last: 'Trump', voteCount: 2345 },
          { party: 'Lib', last: 'Johnson', voteCount: 3456 },
          { party: 'Oth', last: 'Other', voteCount: 123 }
        ]
        const race = go(reportingUnitRaces2, districtRaces)[0]
        expect(race.nVotes).to.eq(1234+2345+3456+123)
        expect(race.nVotesClinton).to.eq(1234)
        expect(race.nVotesTrump).to.eq(2345)
        expect(race.nVotesThird).to.eq(3456)
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
          { name: 'Er', fullName: 'Oth Er', n: 4567, partyId: 'other', winner: false }
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
          { voteCount: 123, last: 'SomeDem', party: 'Dem', winner: (winner === 'Dem' ? 'X' : '') },
          { voteCount: 123, last: 'SomeGop', party: 'GOP', winner: (winner === 'GOP' ? 'X' : '') },
          { voteCount: 123, last: 'SomeoneElse', party: 'Grn', winner: '' }
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

        it('should mark CA as a win before any votes are cast', () => {
          const tossup3 = JSON.parse(JSON.stringify(tossup2))
          delete tossup3[0].reportingUnits
          tossup3[0].statePostal = 'CA'

          const apData = new ApData({
            findSenateRaces() {
              return dems.concat(...gops).concat(...tossup3)
            }
          }, null)
          const summary = apData.senateSummary()
          expect(summary.wins).to.deep.eq({ dem: 9, gop: 10 })
        })

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

    it('should total popular votes', () => {
      const races = new Array(34).fill(null).map((_, i) => {
        return { reportingUnits: [ { candidates: [
          { last: 'SomeDem', party: 'Dem', voteCount: i * 3 },
          { last: 'SomeGop', party: 'GOP', voteCount: i * 4 },
          { last: 'Other', party: 'Oth', voteCount: 111 }
        ]}]}
      })

      const apData = new ApData({
        findSenateRaces() { return races }
      }, null)
      const summary = apData.senateSummary()

      expect(summary.popular).to.deep.eq({
        dem: 561 * 3,
        gop: 561 * 4
      })
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

  describe('#senateRaces', () => {
    describe('with sample data', () => {
      const races = new Array(34).fill(null).map(() => Object.assign({}, {
        reportingUnits: [
          {
            statePostal: 'AK',
            precinctsReporting: 12,
            precinctsTotal: 34,
            candidates: [
              { last: 'SomeDem', party: 'Dem', voteCount: 123 },
              { last: 'SomeGop', party: 'GOP', voteCount: 123 },
              { last: 'SomeoneElse', party: 'Grn', voteCount: 123 }
            ]
          }
        ]
      }))

      function go(apRaces) {
        const apData = new ApData({
          findSenateRaces() { return apRaces }
        }, null)
        return apData.senateRaces()
      }

      it('should have n=100', () => {
        expect(go(races).length).to.eq(100)
      })

      it('should set seatClass on prior races', () => {
        expect(go(races)[0].seatClass).to.eq('1')
      })

      it('should set seatClass=3 on current races', () => {
        expect(go(races)[50].seatClass).to.eq('3')
      })

      it('should have 34 non-prior races', () => {
        const actual = go(races).filter(r => r.className !== 'dem-prior' && r.className !== 'gop-prior')
        expect(actual.length).to.eq(34)
      })

      it('should have race IDs like "AKS3", etc.', () => {
        const actual = go(races)
        expect(actual[0].id).to.eq('CAS1') // a prior race
        expect(actual[50].id).to.eq('AKS3') // a current race -- all our mock races are Alaska :)
      })

      it('should set name to the state name', () => {
        const actual = go(races)
        expect(actual[0].name).to.eq('California') // a prior race
        expect(actual[50].name).to.eq('Alaska') // a current race
      })

      it('should set nPrecincts and nPrecinctsReporting', () => {
        const actual = go(races)
        expect(actual[50].nPrecincts).to.eq(34)
        expect(actual[50].nPrecinctsReporting).to.eq(12)

        // priors have no precinct counts
        expect(actual[0].hasOwnProperty('nPrecincts')).to.eq(false)
        expect(actual[0].hasOwnProperty('nPrecinctsReporting')).to.eq(false)
      })

      it('should set className=dem-prior, sorted first', () => {
        const actual = go(races)[35]
        expect(actual.winner).to.eq('dem')
        expect(actual.className).to.eq('dem-prior')
      })

      it('should set className=dem-win, sorted second', () => {
        const races2 = JSON.parse(JSON.stringify(races))
        races2[0].reportingUnits[0].candidates[0].winner = 'X'
        const actual = go(races2)[36]
        expect(actual.winner).to.eq('dem')
        expect(actual.className).to.eq('dem-win')
      })

      it('should set className=dem-lead, sorted third', () => {
        const races2 = JSON.parse(JSON.stringify(races))
        races2[0].reportingUnits[0].candidates[0].winner = 'X' // this race should appear _before_ ours
        races2[1].reportingUnits[0].candidates[0].voteCount = 124 // top count
        const actual = go(races2)[37]
        expect(actual.winner).to.eq(null)
        expect(actual.className).to.eq('dem-lead')
      })

      it('should set className=tossup', () => {
        const actual = go(races)[36]
        expect(actual.winner).to.eq(null)
        expect(actual.className).to.eq('tossup')
      })

      it('should set className=gop-lead', () => {
        const races2 = JSON.parse(JSON.stringify(races))
        races2[0].reportingUnits[0].candidates[1].voteCount = 124 // top count
        races2[1].reportingUnits[0].candidates[1].winner = 'X' // this should appear _after_ ours
        const actual = go(races2)[68]
        expect(actual.winner).to.eq(null)
        expect(actual.className).to.eq('gop-lead')
      })

      it('should set className=gop-win', () => {
        const races2 = JSON.parse(JSON.stringify(races))
        races2[0].reportingUnits[0].candidates[1].winner = 'X'
        const actual = go(races2)[69]
        expect(actual.winner).to.eq('gop')
        expect(actual.className).to.eq('gop-win')
      })

      it('should set className=gop-prior', () => {
        const actual = go(races)[70]
        expect(actual.winner).to.eq('gop')
        expect(actual.className).to.eq('gop-prior')
      })

      it('should have one candidate as "winner" on prior races', () => {
        expect(go(races)[70].candidates).to.deep.eq([{
          fullName: 'Jeff Sessions',
          name: 'Sessions',
          partyId: 'gop'
        }])
      })

      it('should set Bernie Sanders to party="ind" and className="dem-prior"', () => {
        const actual = go(races)[30]
        expect(actual.id).to.eq('VTS1') // Making sure we're on the right one
        expect(actual.winner).to.eq('dem')
        expect(actual.candidates[0].partyId).to.eq('ind')
      })

      it('should set winner="dem" and className="dem-win" on CA race that has two Dem candidates', () => {
        const races2 = JSON.parse(JSON.stringify(races))
        races2[0].reportingUnits[0].statePostal = 'CA' // mark it so we can check we have the right one
        races2[0].reportingUnits[0].candidates.length = 2 // just two candidates
        races2[0].reportingUnits[0].candidates[1].party = 'Dem'

        const actual = go(races2)[36]
        expect(actual.id).to.eq('CAS3')
        expect(actual.winner).to.eq('dem')
        expect(actual.className).to.eq('dem-win')
      })
    })
  })

  describe('#houseRaces', () => {
    describe('with sample data', () => {
      function build(winner) {
        return {
          seatNum: '2',
          reportingUnits: [
            {
              statePostal: 'AK',
              candidates: [
                { last: 'SomeDem', party: 'Dem', voteCount: 123, winner: (winner === 'Dem' ? 'X' : '') },
                { last: 'SomeGop', party: 'GOP', voteCount: 123, winner: (winner === 'GOP' ? 'X' : '') },
                { last: 'SomeoneElse', party: 'Grn', voteCount: 123, winner: '' }
              ]
            }
          ]
        }
      }
      const dems = new Array(80).fill(null).map((_, i) => build('Dem'))
      const gops = new Array(100).fill(null).map((_, i) => build('GOP'))
      const tossup = new Array(255).fill(null).map((_, i) => build())

      function houseRaces(dems, gops, tossup) {
        const apData = new ApData({
          findHouseRaces() {
            return dems.concat(...gops).concat(...tossup)
          }
        }, null)
        return apData.houseRaces()
      }

      it('should have n=435', () => {
        expect(houseRaces(dems, gops, tossup).length).to.eq(435)
      })

      it('should set className=dem-win, sorted first', () => {
        // We're testing two things: the sort and the class name
        // That's because the sort order depends on the class name
        const newDems = JSON.parse(JSON.stringify(dems))
        newDems[3].seatNum = '1' // another sort-order helper
        newDems[3].reportingUnits[0].candidates[0] = {
          last: 'SomeDem', party: 'Dem', voteCount: 2001, winner: 'X'
        }
        expect(houseRaces(newDems, gops, tossup)[0].className).to.eq('dem-win')
      })

      it('should set className=gop-win, sorted last', () => {
        const newGops = JSON.parse(JSON.stringify(gops))
        newGops[1].seatNum = '3' // another sort-order helper
        newGops[1].reportingUnits[0].candidates[1] = {
          last: 'SomeGop', party: 'GOP', voteCount: 2002, winner: 'X'
        }

        expect(houseRaces(dems, newGops, tossup)[434].className).to.eq('gop-win')
      })

      it('should set className=dem-lead, sorted after dem-win', () => {
        const newDems = JSON.parse(JSON.stringify(dems))
        for (const dem of newDems) {
          dem.reportingUnits[0].candidates[0].winner = 'X'
        }
        newDems[3].reportingUnits[0].candidates[0].voteCount = 124 // everyone else has 123
        newDems[3].reportingUnits[0].candidates[0].winner = ''
        newDems[3].seatNum = '12'

        const actual = houseRaces(newDems, gops, tossup)[newDems.length - 1]
        expect(actual.id).to.eq('AK12')
        expect(actual.className).to.eq('dem-lead')
      })

      it('should set className=gop-lead, sorted before gop-win', () => {
        const newGops = JSON.parse(JSON.stringify(gops))
        for (const gop of newGops) {
          gop.reportingUnits[0].candidates[1].winner = 'X'
        }
        newGops[3].reportingUnits[0].candidates[1].voteCount = 124 // everyone else has 123
        newGops[3].reportingUnits[0].candidates[1].winner = ''
        newGops[3].seatNum = '1'

        const actual = houseRaces(dems, newGops, tossup)[435 - newGops.length]
        expect(actual.id).to.eq('AK01')
        expect(actual.className).to.eq('gop-lead')
      })

      it('should set a name based on seatNum', () => {
        const newDems = JSON.parse(JSON.stringify(dems))
        newDems[0].seatNum = '1'
        expect(houseRaces(newDems, gops, tossup)[0].name).to.eq('Alaska District 1')
      })

      it('should set a name of "At Large"', () => {
        const newDems = JSON.parse(JSON.stringify(dems))
        newDems[0].description = 'Alaska at large'
        newDems[0].seatNum = '1'
        expect(houseRaces(newDems, gops, tossup)[0].name).to.eq('Alaska At Large')
      })

      it('should set nPrecincts and nPrecinctsReporting', () => {
        const newDems = JSON.parse(JSON.stringify(dems))
        newDems[0].seatNum = '1'
        newDems[0].reportingUnits[0].precinctsReporting = 12
        newDems[0].reportingUnits[0].precinctsTotal = 34
        const actual = houseRaces(newDems, gops, tossup)[0]

        expect(actual.nPrecincts).to.eq(34)
        expect(actual.nPrecinctsReporting).to.eq(12)
      })

      it('should set winner="dem" on race that has two Dem candidates', () => {
        const newDems = JSON.parse(JSON.stringify(dems))
        newDems[0].reportingUnits[0].statePostal = 'AL' // so it sorts first
        newDems[0].reportingUnits[0].candidates.length = 2
        newDems[0].reportingUnits[0].candidates[0].winner = ''
        newDems[0].reportingUnits[0].candidates[1].party = 'Dem'
        const actual = houseRaces(newDems, gops, tossup)
        expect(actual[0].winner).to.eq('dem')
        expect(actual[0].className).to.eq('dem-win')
        expect(actual[0].candidates[0].winner).to.eq(false)
      })
    })
  })
}) // ApData
