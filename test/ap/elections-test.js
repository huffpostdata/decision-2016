const expect = require('chai').expect

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
