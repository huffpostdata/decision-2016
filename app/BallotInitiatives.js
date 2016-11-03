const read_config = require('../generator/read_config')
const GoogleSheets = require('../generator/GoogleSheets')

const google_sheets = new GoogleSheets(read_config('google-sheets'))

const RaceIdToBallotInitiative = {}
for (const row of google_sheets.slug_to_array('ballotInitiatives')) {
  const id = row.raceId.replace(' ', '')
  const raceId = `${id.slice(0, 2)}B${id.slice(2)}`

  RaceIdToBallotInitiative[raceId] = {
    name: row.name,
    description: row.description,
    href: row.href
  }
}

module.exports = RaceIdToBallotInitiative
