'use strict'

const fs = require('fs')
const read_config = require('../generator/read_config')

const GoogleDocs = require('../generator/GoogleDocs')
const GoogleSheets = require('../generator/GoogleSheets')
const PageMetadata = require('../generator/PageMetadata')
const ap_fs = require('./ap/ap-fs')

module.exports = class Database {
  constructor() {
    const google_docs = new GoogleDocs(read_config('google-docs'))
    const google_sheets = new GoogleSheets(read_config('google-sheets'))
    const apData = ap_fs.load()

    const battlegrounds = [
      {"abbr":"mo","state":"Missouri","nElectoralVotes":10,"demPercent":41,"gopPercent":59,"percentPrecinctsReporting":87,"called":false,"winner":"gop"},
      {"abbr":"wa","state":"Washington","nElectoralVotes":12,"demPercent":11,"gopPercent":89,"percentPrecinctsReporting":93,"called":false,"winner":"gop"},
      {"abbr":"ca","state":"California","nElectoralVotes":55,"demPercent":47,"gopPercent":53,"percentPrecinctsReporting":46,"called":false,"winner":"gop"},
      {"abbr":"nh","state":"New Hampshire","nElectoralVotes":4,"demPercent":20,"gopPercent":80,"percentPrecinctsReporting":41,"called":true,"winner":"gop"},
      {"abbr":"ut","state":"Utah","nElectoralVotes":6,"demPercent":45,"gopPercent":55,"percentPrecinctsReporting":83,"called":false,"winner":"gop"}
    ]

    const summaries = {
      president: apData.presidentSummary(),
      senate: apData.senateSummary(),
      house: apData.houseSummary()
    }

    const presidentRaces = apData.presidentRaces()

    this.splash = {
      president: summaries.president,
      senate: summaries.senate,
      house: summaries.house,
      battlegrounds: battlegrounds
    }

    // TODO name each splash page format, (so we can _test them all)
    this.splashFormats = [
      { format: 'full' }
    ]

    this.president = {
      metadata: new PageMetadata('president', {}), // TK
      summaries: summaries,
      races: presidentRaces,
      byState: {},
      battlegrounds: battlegrounds
    }

    // TK get these up and running
    this.senate = JSON.parse(JSON.stringify(this.president)); this.senate.metadata.slug = 'senate'
    this.house = JSON.parse(JSON.stringify(this.president)); this.house.metadata.slug = 'house'

    this.presidentAsBuffer = Buffer.from(JSON.stringify({
      summaries: summaries,
      races: presidentRaces
    }));
  }
}
