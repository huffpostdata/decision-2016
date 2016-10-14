'use strict'

const expect = require('chai').expect

const fs = require('fs')

const elections = require('../../app/ap/elections')
const Elections = elections.Elections

describe('elections', () => {
  describe('Elections', () => {
    describe('#update', () => {
      it('should not add new races', () => {
        const oldElections = new Elections({
          races: [
            { raceID: '0', reportingUnits: [ { statePostal: 'US' } ] }
          ]
        })

        const newElections = oldElections.update({
          races: [
            { raceID: '0', reportingUnits: [ { statePostal: 'AA' } ] }
          ]
        })

        expect(newElections.json.races).to.deep.eq(oldElections.json.races)
      })

      it('should modify .nextrequest', () => {
        const oldElections = new Elections({
          races: [],
          nextrequest: 'http://foo'
        })

        const newElections = oldElections.update({
          races: [],
          nextrequest: 'http://bar'
        })

        expect(newElections.json.nextrequest).to.eq('http://bar')
      })

      it('should update a race', () => {
        const oldElections = new Elections({
          races: [
            { raceID: '0', reportingUnits: [ { statePostal: 'US' } ] }
          ]
        })

        const newElections = oldElections.update({
          races: [
            { raceID: '0', reportingUnits: [ { statePostal: 'US', foo: 'bar' } ] }
          ]
        })

        expect(newElections.json.races).to.deep.eq([
          { raceID: '0', reportingUnits: [ { statePostal: 'US', foo: 'bar' } ] }
        ])

      })

      it('should no-op when there is no new race', () => {
        const oldElections = new Elections({
          electionDate: 'foo',
          timestamp: 'bar',
          nextrequest: 'baz',
          races: [
            { raceID: '0', reportingUnits: [ { statePostal: 'US' } ] }
          ]
        })

        const newElections = oldElections.update({
          electionDate: 'foo',
          timestamp: 'bar',
          nextrequest: 'baz',
          races: []
        })

        expect(newElections.json).to.deep.eq(oldElections.json)
      })
    }) // #update

    describe('#findUSPresidentRace', () => {
      it('should ignore a non-P race', () => {
        const no1 = { officeID: 'S', reportingUnits: [ { statePostal: 'US' } ] }
        const yes = { officeID: 'P', reportingUnits: [ { statePostal: 'US' } ] }

        const elections = new Elections({ races: [ no1, yes ] })
        expect(elections.findUSPresidentRace()).to.eq(yes)
      })

      it('should ignore a non-US race', () => {
        const no1 = { officeID: 'P', reportingUnits: [ { statePostal: 'AL' } ] }
        const yes = { officeID: 'P', reportingUnits: [ { statePostal: 'US' } ] }

        const elections = new Elections({ races: [ no1, yes ] })
        expect(elections.findUSPresidentRace()).to.eq(yes)
      })

      it('should throw if not found', () => {
        const no1 = { officeID: 'P', reportingUnits: [ { statePostal: 'AL' } ] }
        const elections = new Elections({ races: [ no1 ] })

        expect(() => {
          elections.findUSPresidentRace()
        }).to.throw(Error)
      })
    })

    describe('#findPresidentRaces', () => {
      describe('with sample data', () => {
        const tsvData = fs.readFileSync(`${__dirname}/../../app/google-sheets/presidentRaces.tsv`, 'utf-8')
          .split(/\r?\n/g)
          .slice(1)                  // ignore header
          .filter(s => s.length > 0) // ignore trailing newlines
          .map(s => s.split(/\t/g))

        const fipscodeRaces = tsvData
          .filter(row => row[1].length === 0) // ignore district races
          .map(row => {
            return {
              officeID: 'P',
              reportingUnits: [ { statePostal: row[2] } ]
            }
          })

        const districtRaces = []
        for (const row of tsvData) {
          if (row[1].length === 0) continue // only district races
          if (districtRaces.length === 0 || districtRaces[districtRaces.length - 1].reportingUnits[0].statePostal !== row[2]) {
            // New district
            districtRaces.push({
              officeID: 'P',
              reportingUnits: [ { statePostal: row[2] } ]
            })
          }

          districtRaces[districtRaces.length - 1].reportingUnits.push({
            level: 'district',
            statePostal: row[2],
          })
        }

        describe('from fipscode.json', () => {
          const elections = new Elections({ races: fipscodeRaces })
          
          it('should find 49 races (48 states + DC)', () => {
            expect(elections.findPresidentRaces().length).to.eq(49)
          })

          it('should ignore the US race', () => {
            fipscodeRaces.unshift({ officeID: 'P', reportingUnits: [ { statePostal: 'US' } ] })
            expect(elections.findPresidentRaces().length).to.eq(49)
          })

          it('should ignore non-Presidential races', () => {
            fipscodeRaces.unshift({ officeID: 'H', reportingUnits: [ { statePostal: 'AL' } ] })
            fipscodeRaces.unshift({ officeID: 'S', reportingUnits: [ { statePostal: 'AL' } ] })
            fipscodeRaces.unshift({ officeID: 'G', reportingUnits: [ { statePostal: 'AL' } ] })
            expect(elections.findPresidentRaces().length).to.eq(49)
          })
        })

        describe('from district.json', () => {
          const elections = new Elections({ races: districtRaces })

          it('should find 2 races (ApData will expand)', () => {
            expect(elections.findPresidentRaces().length).to.eq(2)
          })
        })
      })
    })

    describe('#findSenateRaces', () => {
      it('should ignore a non-S race', () => {
        const no1 = { officeID: 'P', reportingUnits: [ { statePostal: 'CA' } ] }
        const yes = { officeID: 'S', reportingUnits: [ { statePostal: 'CA' } ] }

        const elections = new Elections({ races: [ no1, yes ] })
        expect(elections.findSenateRaces()).to.deep.eq([ yes ])
      })

      it('should return multiple races', () => {
        const yes1 = { officeID: 'S', reportingUnits: [ { statePostal: 'CA' } ] }
        const no1 = { officeID: 'P', reportingUnits: [ { statePostal: 'AL' } ] }
        const yes2 = { officeID: 'S', reportingUnits: [ { statePostal: 'CO' } ] }

        const elections = new Elections({ races: [ yes1, no1, yes2 ] })
        expect(elections.findSenateRaces()).to.deep.eq([ yes1, yes2 ])
      })
    }) // #findSenateRaces

    describe('#findHouseRaces', () => {
      it('should ignore a non-H race', () => {
        const no1 = { officeID: 'S', seatName: 'District 1' }
        const yes = { officeID: 'H', seatName: 'District 1' }

        const elections = new Elections({ races: [ no1, yes ] })
        expect(elections.findHouseRaces()).to.deep.eq([ yes ])
      })

      it('should return multiple races', () => {
        const yes1 = { officeID: 'H', seatName: 'District 1' }
        const no1 = { officeID: 'S', seatName: 'District 3' }
        const yes2 = { officeID: 'H', seatName: 'District 2' }

        const elections = new Elections({ races: [ yes1, no1, yes2 ] })
        expect(elections.findHouseRaces()).to.deep.eq([ yes1, yes2 ])
      })

      it('should skip special elections', () => {
        const no = { officeID: 'H', seatName: 'District 3 - special' }
        const yes = { officeID: 'H', seatName: 'District 2' }
        const elections = new Elections({ races: [ no, yes ] })
        expect(elections.findHouseRaces()).to.deep.eq([ yes ])
      })
    }) // #findHouseRaces
  }) // Elections
})
