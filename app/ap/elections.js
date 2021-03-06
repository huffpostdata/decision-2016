'use strict'

/**
 * Produces a unique ID for a race based on AP's JSON.
 */
function apRaceToKey(apRaceJson) {
  // AP-assigned raceIDs are unique within a state.
  return `${apRaceToStateCode(apRaceJson)}:${apRaceJson.raceID}`
}

function apReportingUnitToKey(apRaceJson, apReportingUnit) {
  return `${apRaceToKey(apRaceJson)}-${apReportingUnit.level}-${apReportingUnit.reportingunitID}`
}

function apRaceToStateCode(apRaceJson) {
  return apRaceJson.statePostal || apRaceJson.reportingUnits[0].statePostal
}

/**
 * The AP elections response -- at least, the parts we care about.
 *
 * This relates to https://api.ap.org/v2/elections/2016-11-08?officeID=P,S,H,I
 *
 * We build two of these: one for FIPSCode and one for District-level results.
 */
class Elections {
  constructor(json) {
    this.json = json
  }

  /**
   * Returns a new Elections object with update data.
   *
   * The "update" data is what gets returned by AP's "nextrequest" query.
   * We update all fields except the "races" field, which we merge.
   */
  update(json) {
    const newJson = {}

    newJson.electionDate = json.electionDate
    newJson.timestamp = json.timestamp
    newJson.nextrequest = json.nextrequest

    const keyToNewRace = {}
    const keyToNewReportingUnit = {}
    for (const race of json.races) {
      keyToNewRace[apRaceToKey(race)] = race
      for (const reportingUnit of (race.reportingUnits || [])) {
        keyToNewReportingUnit[apReportingUnitToKey(race, reportingUnit)] = reportingUnit
      }
    }

    const usedKeys = {}
    newJson.races = this.json.races.map(oldRace => {
      const key = apRaceToKey(oldRace)
      usedKeys[key] = null
      if (keyToNewRace.hasOwnProperty(key)) {
        // Use oldRace.reportingUnits as a template, and overwrite the
        // _changed_ reportingUnits that AP just gave us.
        const newReportingUnits = oldRace.reportingUnits.map(ru => {
          const ruKey = apReportingUnitToKey(oldRace, ru)
          if (keyToNewReportingUnit.hasOwnProperty(ruKey)) {
            return keyToNewReportingUnit[ruKey]
          } else {
            // AP had no updates since oldReportingUnits.
            return ru
          }
        })
        return Object.assign({}, keyToNewRace[key], { reportingUnits: newReportingUnits })
      } else {
        return oldRace
      }
    })

    // Add races that weren't added before. (Was there some other bug that
    // made it _look_ like AP added new races the night of? Dunno.)
    for (const key in keyToNewRace) {
      if (keyToNewRace.hasOwnProperty(key) && !usedKeys.hasOwnProperty(key)) {
        newJson.races.push(keyToNewRace[key])
      }
    }

    return new Elections(newJson)
  }

  /**
   * Returns AP's summary JSON for the presidential race.
   */
  findUSPresidentRace() {
    for (const race of this.json.races) {
      if (race.officeID === 'P' && apRaceToStateCode(race) === 'US') {
        return race
      }
    }

    throw new Error('URGENT: We could not find the presidential race in this JSON file.')
  }

  /**
   * Returns AP's JSON for races in each state (or, in ME and NE, district/at-large)
   */
  findPresidentRaces() {
    let ret = []

    for (const race of this.json.races) {
      if (race.officeID === 'P' && apRaceToStateCode(race) !== 'US') {
        ret.push(race)
      }
    }

    return ret
  }

  /**
   * Returns AP's JSON for all senate races.
   */
  findSenateRaces() {
    const ret = []

    for (const race of this.json.races) {
      if (race.officeID === 'S') ret.push(race)
    }

    return ret
  }

  /**
   * Returns AP's JSON for house general-election races.
   *
   * Excludes special elections for the lame-duck session. We don't display
   * those anywhere.
   */
  findHouseRaces() {
    const ret = []

    for (const race of this.json.races) {
      if (race.officeID === 'H' && /^District \d+$/.test(race.seatName)) {
        ret.push(race)
      }
    }

    return ret
  }

  /**
   * Returns AP's JSON for ballot initiatives.
   */
  findBallotInitiativeRaces() {
    const ret = []

    for (const race of this.json.races) {
      if (race.officeID === 'I') ret.push(race)
    }

    return ret
  }
}

module.exports = {
  Elections: Elections
}
