'use strict'

const expect = require('chai').expect
const ApDataDiff = require('../../app/ap/ApDataDiff')
const ChangelogEntry = require('../../assets/javascripts/dashboard/ChangelogEntry')

describe('ApDataDiff', () => {
  function abstractRace(raceId, percentReporting, className, leader) {
    return {
      id: raceId,
      regionId: raceId.slice(0, 2),
      fractionReporting: percentReporting / 100,
      className: className,
      candidates: [ leader ]
    };
  }

  function presidentRace(raceId, percentReporting, className, clintonOrTrump) {
    return abstractRace(raceId, percentReporting, className, {
      name: clintonOrTrump === 'clinton' ? 'Clinton' : 'Trump',
      partyId: clintonOrTrump === 'clinton' ? 'dem' : 'gop'
    })
  }

  function senateRace(raceId, percentReporting, className, leaderName, leaderPartyId) {
    return abstractRace(raceId, percentReporting, className, {
      name: leaderName,
      partyId: leaderPartyId
    })
  }

  function houseRace(raceId, percentReporting, className, leaderName, leaderPartyId) {
    return abstractRace(raceId, percentReporting, className, {
      name: leaderName,
      partyId: leaderPartyId
    })
  }

  function apData(presidentRaces, senateRaces, houseRaces) {
    return {
      presidentRaces() { return presidentRaces },
      senateRaces() { return senateRaces },
      houseRaces() { return houseRaces }
    }
  }

  const date1 = Date.parse('2016-10-31T16:33:58.563Z')
  const date2 = Date.parse('2016-10-31T16:34:15.955Z')

  it('should create entry for "state started counting"', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ presidentRace('NY', 0, 'tossup', 'clinton') ], [], []),
      apData([ presidentRace('NY', 1, 'dem-lead', 'clinton') ], [], [])
    )
    expect(d).to.deep.eq([new ChangelogEntry({
      id: 1,
      date: date1,
      changeType: 'start',
      stateId: 'NY'
    })])
  })

  it('should not create additional entries for "NE1" and "NE2", etc', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData(
        [ presidentRace('NE', 0, 'tossup', 'clinton'), presidentRace('NE1', 0, 'tossup', 'clinton') ],
        [],
        []
      ),
      apData(
        [ presidentRace('NE', 2, 'tossup', 'clinton'), presidentRace('NE1', 3, 'tossup', 'clinton') ],
        [],
        []
      )
    )
    expect(d.length).to.eq(1)
  })

  it('should increment IDs for "start" events', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData(
        [ presidentRace('NY', 0, 'tossup', 'clinton'), presidentRace('MT', 0, 'tossup', 'clinton') ],
        [],
        []
      ),
      apData(
        [ presidentRace('NY', 2, 'tossup', 'clinton'), presidentRace('MT', 3, 'tossup', 'clinton') ],
        [],
        []
      )
    )
    expect(d.map(e => e.id)).to.deep.eq([ 1, 2 ])
  })

  it('should not create entry for "state started counting" once it already started', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ presidentRace('NY', 1, 'tossup', 'clinton') ], [], []),
      apData([ presidentRace('NY', 2, 'dem-lead', 'clinton') ], [], [])
    )
    expect(d.length).to.eq(0)
  })

  it('should create entry for "president called"', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ presidentRace('NY', 1, 'dem-lead', 'clinton') ], [], []),
      apData([ presidentRace('NY', 2, 'dem-win', 'clinton') ], [], [])
    )
    expect(d).to.deep.eq([new ChangelogEntry({
      id: 1,
      date: date1,
      changeType: 'win',
      stateId: 'NY',
      raceType: 'president',
      raceId: 'NY',
      candidateName: 'Clinton',
      partyId: 'dem',
      fractionReporting: 0.02
    })])
  })

  it('should not create entry for "president called" when not called', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ presidentRace('NY', 1, 'dem-lead', 'clinton') ], [], []),
      apData([ presidentRace('NY', 2, 'dem-lead', 'clinton') ], [], [])
    )
    expect(d.length).to.eq(0)
  })

  it('should increment ID for "called" after "started"', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData(
        [ presidentRace('NY', 0, 'tossup', 'clinton'), presidentRace('MT', 2, 'dem-lead', 'clinton') ],
        [],
        []
      ),
      apData(
        [ presidentRace('NY', 2, 'tossup', 'clinton'), presidentRace('MT', 3, 'dem-win', 'clinton') ],
        [],
        []
      )
    )
    expect(d.map(e => e.id)).to.deep.eq([ 1, 2 ])
  })

  it('should not create entry for "president called" when it was called before', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ presidentRace('NY', 1, 'dem-win', 'clinton') ], [], []),
      apData([ presidentRace('NY', 2, 'dem-win', 'clinton') ], [], [])
    )
    expect(d.length).to.eq(0)
  })

  it('should create entry for "senate called"', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ senateRace('NYS3', 1, 'dem-lead', 'Smith', 'dem') ], [], []),
      apData([ senateRace('NYS3', 2, 'dem-win', 'Smith', 'dem') ], [], [])
    )
    expect(d).to.deep.eq([new ChangelogEntry({
      id: 1,
      date: date1,
      changeType: 'win',
      stateId: 'NY',
      raceType: 'senate',
      raceId: 'NYS3',
      candidateName: 'Smith',
      partyId: 'dem',
      fractionReporting: 0.02
    })])
  })

  it('should create entry for "house called"', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ houseRace('NY03', 1, 'dem-lead', 'Smith', 'dem') ], [], []),
      apData([ houseRace('NY03', 2, 'dem-win', 'Smith', 'dem') ], [], [])
    )
    expect(d).to.deep.eq([new ChangelogEntry({
      id: 1,
      date: date1,
      changeType: 'win',
      stateId: 'NY',
      raceType: 'house',
      raceId: 'NY03',
      candidateName: 'Smith',
      partyId: 'dem',
      fractionReporting: 0.02
    })])
  })

  it('should create entry for "25% precincts lead" for president', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ presidentRace('NY', 1, 'dem-lead', 'clinton') ], [], []),
      apData([ presidentRace('NY', 26, 'dem-lead', 'clinton') ], [], [])
    )
    expect(d).to.deep.eq([new ChangelogEntry({
      id: 1,
      date: date1,
      changeType: 'lead',
      stateId: 'NY',
      raceType: 'president',
      raceId: 'NY',
      candidateName: 'Clinton',
      partyId: 'dem',
      fractionReporting: 0.26
    })])
  })

  it('should not create extra entries between 26% and 49% lead', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ presidentRace('NY', 26, 'dem-lead', 'clinton') ], [], []),
      apData([ presidentRace('NY', 49, 'dem-lead', 'clinton') ], [], [])
    )
    expect(d.length).to.eq(0)
  })

  //it('should not create entry for "50% precincts lead" when same lead as "25%"')
  //it('should create entry for "50% precincts lead" when different from "25% precincts lead"')

  it('should not create entry for "25% precincts lead" when winner is called', () => {
    const d = ApDataDiff.diff(
      1, date1,
      apData([ presidentRace('NY', 1, 'dem-lead', 'clinton') ], [], []),
      apData([ presidentRace('NY', 11, 'dem-win', 'clinton') ], [], [])
    )
    expect(d.map(r => r.changeType)).to.deep.eq([ 'win' ])
  })

  it('should omit "start" events for Montana when asked for just Senate results')
})
