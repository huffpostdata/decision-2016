const read_config = require('../generator/read_config')
const GoogleSheets = require('../generator/GoogleSheets')

const google_sheets = new GoogleSheets(read_config('google-sheets'))

const StateCodeToState = {}
google_sheets.slug_to_array('regions').forEach(hash => StateCodeToState[hash.id] = hash.name)

class SenatePriorSeat {
  constructor(hash) {
    this.stateCode = hash.state
    this.seatClass = hash['class']
    this.stateName = StateCodeToState[this.stateCode]
    this.name = this.stateName
    this.id = `${this.stateCode}S${this.seatClass}`
    this.candidates = [
      { name: hash.label, fullName: hash.name, partyId: hash.party.toLowerCase() }
    ]
    // "winner" is the party the candidate _caucuses_ with
    this.winner = hash.party === 'GOP' ? 'gop' : 'dem'
    this.className = `${this.winner}-prior`
  }
}

const senateSeats = google_sheets.slug_to_objects('senateSeats', SenatePriorSeat)

module.exports = senateSeats
  .filter(seat => seat.seatClass !== '3')
