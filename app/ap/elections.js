'use strict'

/**
 * Produces a unique ID for a race based on AP's JSON.
 */
function apRaceToKey(apRaceJson) {
  // AP-assigned raceIDs are unique within a state.
  return `${apRaceJson.reportingUnits[0].statePostal}:${apRaceJson.raceID}`
}

/**
 * The AP elections response -- at least, the parts we care about.
 *
 * This relates to https://api.ap.org/v2/elections/2016-11-08?officeID=P,S,H,G
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
    for (const race of json.races) {
      keyToNewRace[apRaceToKey(race)] = race
    }

    newJson.races = this.json.races.map(oldRace => {
      const key = apRaceToKey(oldRace)
      return keyToNewRace.hasOwnProperty(key) ? keyToNewRace[key] : oldRace
    })

    return new Elections(newJson)
  }

  /**
   * Returns AP's JSON for the president's race.
   */
  findUSPresidentRace() {
    for (const race of this.json.races) {
      if (race.officeID === 'P' && race.reportingUnits[0].statePostal === 'US') {
        return race
      }
    }

    throw new Error('URGENT: We could not find the presidential race in this JSON file.')
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
}

module.exports = {
  Elections: Elections
}
