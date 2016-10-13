'use strict'

const fs = require('fs')
const read_config = require('../generator/read_config')

const GoogleDocs = require('../generator/GoogleDocs')
const GoogleSheets = require('../generator/GoogleSheets')
const ap_fs = require('./ap/ap-fs')

module.exports = class Database {
  constructor() {
    const google_docs = new GoogleDocs(read_config('google-docs'))
    const google_sheets = new GoogleSheets(read_config('google-sheets'))
    const apData = ap_fs.load()

    this.splash = {
      president: apData.presidentSummary(),
      senate: apData.senateSummary(),
      house: apData.houseSummary(),
      battlegrounds: [
        {}, {}, {}, {}, {}
      ]
    }

    // TODO name each splash page format, (so we can _test them all)
    this.splashFormats = [
      { format: 'full' }
    ]
  }
}
