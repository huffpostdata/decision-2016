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
            { party: 'Dem', last: 'Clinton', voteCount: 23456, electWon: 257 },
            { party: 'GOP', last: 'Trump', voteCount: 12345, electWon: 182 },
            { party: 'Lib', last: 'Johnson', voteCount: 123, electWon: 0 }
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
    }) // with sample data

    it('should set className=dem-win', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { party: 'Dem', last: 'Clinton', voteCount: 23456, electWon: 0, winner: 'X' },
            { party: 'GOP', last: 'Trump', voteCount: 12345, electWon: 0 },
            { party: 'Lib', last: 'Johnson', voteCount: 123, electWon: 0 }
          ]}]
        }}
      }, null)
      expect(apData.presidentSummary().className).to.eq('dem-win')
    })

    it('should set className=dem-lead', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { party: 'Dem', last: 'Clinton', voteCount: 23456, electWon: 100, winner: '' },
            { party: 'GOP', last: 'Trump', voteCount: 12345, electWon: 99, winner: '' },
            { party: 'Lib', last: 'Johnson', voteCount: 123, electWon: 0, winner: '' }
          ]}]
        }}
      }, null)
      expect(apData.presidentSummary().className).to.eq('dem-lead')
    })

    it('should set className=tossup', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { party: 'Dem', last: 'Clinton', voteCount: 23456, electWon: 100, winner: '' },
            { party: 'GOP', last: 'Trump', voteCount: 12345, electWon: 100, winner: '' },
            { party: 'Lib', last: 'Johnson', voteCount: 123, electWon: 0, winner: '' }
          ]}]
        }}
      }, null)
      expect(apData.presidentSummary().className).to.eq('tossup')
    })

    it('should set className=gop-lead', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { party: 'Dem', last: 'Clinton', voteCount: 23456, electWon: 99, winner: '' },
            { party: 'GOP', last: 'Trump', voteCount: 12345, electWon: 100, winner: '' },
            { party: 'Lib', last: 'Johnson', voteCount: 123, electWon: 0, winner: '' }
          ]}]
        }}
      }, null)
      expect(apData.presidentSummary().className).to.eq('gop-lead')
    })

    it('should call for Trump', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { party: 'Dem', last: 'Clinton', voteCount: 23456, electWon: 0, winner: '' },
            { party: 'GOP', last: 'Trump', voteCount: 12345, electWon: 0, winner: 'X' },
            { party: 'Lib', last: 'Johnson', voteCount: 123, electWon: 0, winner: '' }
          ]}]
        }}
      }, null)
      expect(apData.presidentSummary().className).to.eq('gop-win')
    })

    it('should set nOtherElectoralVotes', () => {
      const apData = new ApData({
        findUSPresidentRace() { return {
          reportingUnits: [ { candidates: [
            { party: 'Dem', last: 'Clinton', voteCount: 23456, electWon: 20, winner: '' },
            { party: 'GOP', last: 'Trump', voteCount: 12345, electWon: 10, winner: '' },
            { party: 'Lib', last: 'Johnson', voteCount: 123, electWon: 3, winner: '' }
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
          districtType: row[0].length === 2 ? 'AL' : 'CD',
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

      it('should sort by winner and then alphabetically', () => {
        const reportingUnitRaces2 = [ reportingUnitRaces[1], reportingUnitRaces[0] ].concat(reportingUnitRaces.slice(2))
        const races = go(reportingUnitRaces2, districtRaces)
        expect(races[13].name).to.eq('Alabama')
        expect(races[14].name).to.eq('Arizona')
      })

      it('should set nElectoralVotes', () => {
        expect(races.find(r => r.id === 'CA').nElectoralVotes).to.eq(55)
      })

      it('should split ME races properly', () => {
        const me = races.find(r => r.id === 'ME')
        expect(me.name).to.eq('Maine At Large')
        expect(me.stateName).to.eq('Maine')
        expect(me.nElectoralVotes).to.eq(2)

        const me1 = races.find(r => r.id === 'ME1')
        expect(me1.name).to.eq('Maine District 1')
        expect(me1.stateName).to.eq('Maine')
        expect(me1.nElectoralVotes).to.eq(1)
      })

      it('should count nVotes, nVotesClinton, nVotesTrump, nVotesThird', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2.find(r => r.reportingUnits[0].statePostal === 'CA')
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', last: 'Trump', voteCount: 2345 },
          { party: 'Lib', last: 'Johnson', voteCount: 3456 },
          { party: 'Oth', last: 'Other', voteCount: 123 }
        ]
        const race = go(reportingUnitRaces2, districtRaces).find(r => r.name === 'California')
        expect(race.nVotes).to.eq(1234+2345+3456+123)
        expect(race.nVotesClinton).to.eq(1234)
        expect(race.nVotesTrump).to.eq(2345)
        expect(race.nVotesThird).to.eq(3456)
      })

      it('should count fractionReporting', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        Object.assign(reportingUnitRaces2.find(r => r.reportingUnits[0].statePostal === 'CA').reportingUnits[0], {
          precinctsReporting: 106,
          precinctsTotal: 166
        })
        const race = go(reportingUnitRaces2, districtRaces).find(r => r.id === 'CA')
        expect(race.fractionReporting).to.eq(106/166)
      })

      it('should set winner based on electWon, _not_ winner', () => {
        const districtRaces2 = JSON.parse(JSON.stringify(districtRaces))

        const exampleJson = {"statePostal":"NE","reportingunitName":"District 3","reportingunitID":"28008","level":"district","districtType":"CD","electTotal":1,"lastUpdated":"2016-11-04T18:30:07.957Z","precinctsReporting":682,"precinctsTotal":693,"precinctsReportingPct":98.41,"candidates":[{"first":"Hillary","last":"Clinton","party":"Dem","candidateID":"31580","polID":"1746","ballotOrder":2,"polNum":"29890","voteCount":85160,"electWon":0,"winner":"X"},{"first":"Donald","last":"Trump","party":"GOP","candidateID":"31489","polID":"8639","ballotOrder":1,"polNum":"29907","voteCount":85167,"electWon":1},{"first":"Jill","last":"Stein","party":"PEC","candidateID":"31594","polID":"895","ballotOrder":4,"polNum":"29968","voteCount":16417,"electWon":0},{"first":"Gary","last":"Johnson","party":"Lib","candidateID":"31497","polID":"31708","ballotOrder":3,"polNum":"29749","voteCount":16254,"electWon":0}]}

        let apJson = null
        for (const apRace of districtRaces2) {
          for (const apRu of apRace.reportingUnits) {
            if (apRu.statePostal === 'NE' && apRu.reportingunitName === 'District 3') {
              apJson = apRu
            }
          }
        }

        Object.assign(apJson, exampleJson)
        const candidates = go(reportingUnitRaces, districtRaces2).find(r => r.id === 'NE3').candidates
        expect(candidates).to.deep.eq([
          { name: 'Trump', fullName: 'Donald Trump', n: 85167, partyId: 'gop', winner: true },
          { name: 'Clinton', fullName: 'Hillary Clinton', n: 85160, partyId: 'dem' },
          { name: 'Stein', fullName: 'Jill Stein', n: 16417, partyId: 'grn' },
          { name: 'Johnson', fullName: 'Gary Johnson', n: 16254, partyId: 'lib' },
        ])
      })

      it('should format candidates', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2.find(r => r.reportingUnits[0].statePostal === 'AL')
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', first: 'Hillary', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', first: 'Donald', last: 'Trump', voteCount: 2345 },
          { party: 'Lib', first: 'Gary', last: 'Johnson', voteCount: 3456, winner: 'X' },
          { party: 'Oth', first: 'Oth', last: 'Er', voteCount: 4567 }
        ]
        const candidates = go(reportingUnitRaces2, districtRaces).find(r => r.id === 'AL').candidates
        expect(candidates).to.deep.eq([
          { name: 'Johnson', fullName: 'Gary Johnson', n: 3456, partyId: 'lib', winner: true },
          { name: 'Trump', fullName: 'Donald Trump', n: 2345, partyId: 'gop' },
          { name: 'Clinton', fullName: 'Hillary Clinton', n: 1234, partyId: 'dem' },
          { name: 'Other', n: 4567, partyId: 'other' }
        ])
      })

      it('should set Johnson, Stein and McMullin to lib, grn, and bfa if they are "Una"', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2.find(r => r.reportingUnits[0].statePostal === 'UT')
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', first: 'Hillary', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', first: 'Donald', last: 'Trump', voteCount: 2345 },
          { party: 'Una', first: 'Gary', last: 'Johnson', voteCount: 3456 },
          { party: 'Una', first: 'Jill', last: 'Stein', voteCount: 3456 },
          { party: 'Una', first: 'Evan', last: 'McMullin', voteCount: 3456 },
          { party: 'Oth', first: 'Oth', last: 'Er', voteCount: 4567 }
        ]
        const candidates = go(reportingUnitRaces2, districtRaces).find(r => r.id === 'UT').candidates
        expect(candidates).to.deep.eq([
          { name: 'Johnson', fullName: 'Gary Johnson', n: 3456, partyId: 'lib' },
          { name: 'McMullin', fullName: 'Evan McMullin', n: 3456, partyId: 'bfa' },
          { name: 'Stein', fullName: 'Jill Stein', n: 3456, partyId: 'grn' },
          { name: 'Trump', fullName: 'Donald Trump', n: 2345, partyId: 'gop' },
          { name: 'Clinton', fullName: 'Hillary Clinton', n: 1234, partyId: 'dem' },
          { name: 'Other', n: 4567, partyId: 'other' }
        ])
      })

      it('should nix Evan McMullin in non-UT', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2.find(r => r.reportingUnits[0].statePostal === 'NM')
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', first: 'Hillary', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', first: 'Donald', last: 'Trump', voteCount: 2345 },
          { party: 'BFA', first: 'Evan', last: 'McMullin', voteCount: 3456 },
          { party: 'Oth', first: 'Oth', last: 'Er', voteCount: 4567 }
        ]
        const candidates = go(reportingUnitRaces2, districtRaces).find(r => r.id === 'NM').candidates
        expect(candidates).to.deep.eq([
          { name: 'Trump', fullName: 'Donald Trump', n: 2345, partyId: 'gop' },
          { name: 'Clinton', fullName: 'Hillary Clinton', n: 1234, partyId: 'dem' },
          { name: 'Other', n: 4567+3456, partyId: 'other' }
        ])
      })

      it('should nix Evan McMullin in non-UT by creating "Other" if it does not exist', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2.find(r => r.reportingUnits[0].statePostal === 'NM')
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', first: 'Hillary', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', first: 'Donald', last: 'Trump', voteCount: 2345 },
          { party: 'BFA', first: 'Evan', last: 'McMullin', voteCount: 3456 },
        ]
        const candidates = go(reportingUnitRaces2, districtRaces).find(r => r.id === 'NM').candidates
        expect(candidates).to.deep.eq([
          { name: 'Trump', fullName: 'Donald Trump', n: 2345, partyId: 'gop' },
          { name: 'Clinton', fullName: 'Hillary Clinton', n: 1234, partyId: 'dem' },
          { name: 'Other', n: 3456, partyId: 'other' }
        ])
      })

      it('should set the winner', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2.find(r => r.reportingUnits[0].statePostal === 'CA')
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', last: 'Trump', voteCount: 2345, winner: 'X' },
          { party: 'Lib', last: 'Johnson', voteCount: 3456 },
          { party: 'Oth', last: 'Other', voteCount: 4567 }
        ]
        const race = go(reportingUnitRaces2, districtRaces).find(r => r.name === 'California')
        expect(race.winner).to.eq('trump')
      })

      it('should set winner=null', () => {
        const reportingUnitRaces2 = JSON.parse(JSON.stringify(reportingUnitRaces))
        const apJson = reportingUnitRaces2.find(r => r.reportingUnits[0].statePostal === 'CA')
        apJson.reportingUnits[0].candidates = [
          { party: 'Dem', last: 'Clinton', voteCount: 1234 },
          { party: 'GOP', last: 'Trump', voteCount: 2345 },
          { party: 'Lib', last: 'Johnson', voteCount: 3456 },
          { party: 'Oth', last: 'Other', voteCount: 4567 }
        ]
        const race = go(reportingUnitRaces2, districtRaces).find(r => r.name === 'California')
        expect(race.winner).to.eq(null)
      })
    })
  }) // #presidentRaces

  describe('#senateSummary', () => {
    const races = new Array(100).fill(null)
      .map((_, i) => { return { id: 'AKS3', candidates: [ { partyId: 'dem', n: 10 }, { partyId: 'gop', n: 11 } ]} })
    for (const race of races.slice(0, 36)) race.className = 'dem-prior'
    for (const race of races.slice(36, 40)) race.className = 'dem-win'
    for (const race of races.slice(40, 47)) race.className = 'dem-lead'
    for (const race of races.slice(47, 52)) race.className = 'tossup'
    for (const race of races.slice(52, 58)) race.className = 'gop-lead'
    for (const race of races.slice(58, 70)) race.className = 'gop-win'
    for (const race of races.slice(70, 100)) race.className = 'gop-prior'

    function go(races, presidentClassName) {
      const apData = new ApData(null, null)
      apData.senateRaces = function() { return races }
      apData.presidentSummary = function() { return { className: presidentClassName } }
      return apData.senateSummary()
    }

    it('should always have n=100', () => {
      expect(go(races).n).to.eq(100)
    })

    it('should set priors correctly (Dem-36, GOP-30)', () => {
      expect(go(races).priors).to.deep.eq({ dem: 36, gop: 30 })
    })

    it('should set wins correctly (according to races)', () => {
      expect(go(races).wins).to.deep.eq({ dem: 4, gop: 12 })
    })

    it('should set totals correctly (according to races+static)', () => {
      expect(go(races).totals).to.deep.eq({ dem: 40, gop: 42 })
    })

    it('should set tossup correctly', () => {
      expect(go(races).tossup).to.eq(18)
    })

    it('should set popular votes', () => {
      expect(go(races).popular).to.deep.eq({ dem: 1000, gop: 1100 })
    })

    it('should set className=dem-win', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(40, 51)) race.className = 'dem-win'
      expect(go(races2).className).to.eq('dem-win')
    })

    it('should set className=dem-lead when dem-win > gop-win', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(40, 48)) race.className = 'dem-win'
      for (const race of races2.slice(56, 70)) race.className = 'gop-win'
      expect(go(races2).className).to.eq('dem-lead')
    })

    it('should set className=[prez className] when 50-50', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(40, 50)) race.className = 'dem-win'
      for (const race of races2.slice(50, 70)) race.className = 'gop-win'
      expect(go(races2, 'dem-win').className).to.eq('dem-win')
      expect(go(races2, 'dem-lead').className).to.eq('dem-lead')
      expect(go(races2, 'gop-lead').className).to.eq('gop-lead')
      expect(go(races2, 'gop-win').className).to.eq('gop-win')
    })

    it('should set className=gop-win', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(52, 70)) race.className = 'gop-win'
      expect(go(races2).className).to.eq('gop-lead')
    })

    it('should set className=gop-win', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(48, 70)) race.className = 'gop-win'
      expect(go(races2).className).to.eq('gop-win')
    })
  }) // #senateSummary

  describe('#houseSummary', () => {
    const races = new Array(435).fill(null)
      .map((_, i) => { return { id: 'AK01', candidates: [ { partyId: 'dem', n: 10 }, { partyId: 'gop', n: 11 } ]} })
    for (const race of races.slice(0, 100)) race.className = 'dem-win'
    for (const race of races.slice(100, 203)) race.className = 'dem-lead'
    for (const race of races.slice(203, 250)) race.className = 'tossup'
    for (const race of races.slice(250, 310)) race.className = 'gop-lead'
    for (const race of races.slice(310, 435)) race.className = 'gop-win'

    function go(races) {
      const apData = new ApData(null, null)
      apData.houseRaces = function() { return races }
      return apData.houseSummary()
    }

    it('should always have total=435', () => {
      expect(go(races).total).to.eq(435)
    })

    it('should set tossup correctly', () => {
      expect(go(races).tossup).to.eq(210)
    })

    it('should set wins', () => {
      expect(go(races).wins).to.deep.eq({ dem: 100, gop: 125 })
    })

    it('should ignore a "Lib" win', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      races2[203].className = 'lib-win'
      races2[204].className = 'grn-win'
      races2[205].className = 'bfa-win'
      races2[206].className = 'other-win'
      expect(go(races2).wins).to.deep.eq({ dem: 100, gop: 125 })
    })

    it('should throw if there are not 435 races', () => {
      const races2 = JSON.parse(JSON.stringify(races)).slice(1)
      expect(() => go(races2)).to.throw(Error)
    })

    it('should total the popular vote', () => {
      expect(go(races).popular).to.deep.eq({ dem: 4350, gop: 4785 })
    })

    it('should set className=dem-win if dems have 218 wins', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(0, 218)) race.className = 'dem-win'
      expect(go(races2).className).to.eq('dem-win')
      races2[217].className = 'dem-lead'
      expect(go(races2).className).to.eq('dem-lead')
    })

    it('should set className=dem-lead if dems have more wins', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(0, 200)) race.className = 'dem-win'
      for (const race of races2.slice(236, 435)) race.className = 'gop-win'
      expect(go(races2).className).to.eq('dem-lead')
    })

    it('should set className=tossup if nDem==nGop', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(0, 200)) race.className = 'dem-win'
      for (const race of races2.slice(235, 435)) race.className = 'gop-win'
      expect(go(races2).className).to.eq('tossup')
    })

    it('should set className=gop-lead if gops have more wins', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(0, 200)) race.className = 'dem-win'
      for (const race of races2.slice(234, 435)) race.className = 'gop-win'
      expect(go(races2).className).to.eq('gop-lead')
    })

    it('should set className=gop-win', () => {
      const races2 = JSON.parse(JSON.stringify(races))
      for (const race of races2.slice(217, 435)) race.className = 'gop-win'
      expect(go(races2).className).to.eq('gop-win')
      races2[217].className = 'gop-lead'
      expect(go(races2).className).to.eq('gop-lead')
    })
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
              { last: 'SomeGop', party: 'GOP', voteCount: 123, incumbent: true },
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

      it('should set fractionReporting', () => {
        const actual = go(races)
        expect(actual[50].fractionReporting).to.eq(12 / 34)

        // priors have no precinct counts
        expect(actual[0].hasOwnProperty('fractionReporting')).to.eq(false)
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

      it('should set className="dem-win" on CA race that has two Dem candidates', () => {
        const races2 = JSON.parse(JSON.stringify(races))
        races2[0].reportingUnits[0].statePostal = 'CA' // mark it so we can check we have the right one
        races2[0].reportingUnits[0].candidates.length = 2 // just two candidates
        races2[0].reportingUnits[0].candidates[1].party = 'Dem'

        const actual = go(races2)[36]
        expect(actual.id).to.eq('CAS3')
        expect(actual.winner).to.eq('dem')
        expect(actual.className).to.eq('dem-win')
      })

      describe('fiddling with LA', () => {
        function go2(laSenateRace) {
          const races2 = JSON.parse(JSON.stringify(races))
          races2[0] = laSenateRace
          return go(races2).find(r => r.id === 'LAS3')
        }

        it('should set className="gop-win" when runoff between two gop leaders', () => {
          // actual (truncated) AP_TEST=true data
          const actual = go2({ "test": true, "raceID": "19932", "raceType": "General", "raceTypeID": "G", "officeID": "S", "officeName": "U.S. Senate", "numRunoff": 2, "national": true, "reportingUnits": [ { "statePostal": "LA", "stateName": "Louisiana", "level": "state", "lastUpdated": "2016-11-04T18:26:50.623Z", "precinctsReporting": 3904, "precinctsTotal": 3904, "precinctsReportingPct": 100, "candidates": [ { "first": "John", "last": "Kennedy", "party": "GOP", "candidateID": "24373", "polID": "21684", "ballotOrder": 13, "polNum": "19841", "voteCount": 178718, "winner": "R" }, { "first": "John", "last": "Fleming", "party": "GOP", "candidateID": "24375", "polID": "59669", "ballotOrder": 10, "polNum": "21353", "voteCount": 171272, "winner": "R" }, { "first": "Foster", "last": "Campbell", "abbrv": "Campbll", "party": "Dem", "candidateID": "24379", "polID": "21219", "ballotOrder": 3, "polNum": "19024", "voteCount": 134039 }]}]})

          expect(actual.className).to.eq('gop-win')
        })

        it('should set className="gop-lead" when no runoff but two gop leaders', () => {
          // edited AP test data
          const actual = go2({ "test": true, "raceID": "19932", "raceType": "General", "raceTypeID": "G", "officeID": "S", "officeName": "U.S. Senate", "national": true, "reportingUnits": [ { "statePostal": "LA", "stateName": "Louisiana", "level": "state", "lastUpdated": "2016-11-04T18:26:50.623Z", "precinctsReporting": 3904, "precinctsTotal": 3904, "precinctsReportingPct": 100, "candidates": [ { "first": "John", "last": "Kennedy", "party": "GOP", "candidateID": "24373", "polID": "21684", "ballotOrder": 13, "polNum": "19841", "voteCount": 178718 }, { "first": "John", "last": "Fleming", "party": "GOP", "candidateID": "24375", "polID": "59669", "ballotOrder": 10, "polNum": "21353", "voteCount": 171272 }, { "first": "Foster", "last": "Campbell", "abbrv": "Campbll", "party": "Dem", "candidateID": "24379", "polID": "21219", "ballotOrder": 3, "polNum": "19024", "voteCount": 134039 }]}]})

          expect(actual.className).to.eq('gop-lead')
        })

        it('should set className="tossup" when runoff between gop and dem', () => {
          // edited AP_TEST=true data
          const actual = go2({ "test": true, "raceID": "19932", "raceType": "General", "raceTypeID": "G", "officeID": "S", "officeName": "U.S. Senate", "numRunoff": 2, "national": true, "reportingUnits": [ { "statePostal": "LA", "stateName": "Louisiana", "level": "state", "lastUpdated": "2016-11-04T18:26:50.623Z", "precinctsReporting": 3904, "precinctsTotal": 3904, "precinctsReportingPct": 100, "candidates": [ { "first": "John", "last": "Kennedy", "party": "GOP", "candidateID": "24373", "polID": "21684", "ballotOrder": 13, "polNum": "19841", "voteCount": 178718, "winner": "R" }, { "first": "John", "last": "Fleming", "party": "Dem", "candidateID": "24375", "polID": "59669", "ballotOrder": 10, "polNum": "21353", "voteCount": 171272, "winner": "R" }, { "first": "Foster", "last": "Campbell", "abbrv": "Campbll", "party": "Dem", "candidateID": "24379", "polID": "21219", "ballotOrder": 3, "polNum": "19024", "voteCount": 134039 }]}]})

          expect(actual.className).to.eq('tossup')
        })
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

      it('should set fractionReporting', () => {
        const newDems = JSON.parse(JSON.stringify(dems))
        newDems[0].seatNum = '1'
        newDems[0].reportingUnits[0].precinctsReporting = 12
        newDems[0].reportingUnits[0].precinctsTotal = 34
        const actual = houseRaces(newDems, gops, tossup)[0]

        expect(actual.fractionReporting).to.eq(12 / 34)
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
        expect(actual[0].candidates[0].winner === true).to.eq(false)
      })
    })
  })
}) // ApData
