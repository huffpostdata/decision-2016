'use strict'

const fs = require('fs')

const elections = require('./elections')
const ApData = require('./ApData')

module.exports = {
  load() {
    const fipscodeJson = JSON.parse(fs.readFileSync(`${__dirname}/../../data/fipscode.json`))
    const districtJson = JSON.parse(fs.readFileSync(`${__dirname}/../../data/district.json`))

    return new ApData(
      new elections.Elections(fipscodeJson),
      new elections.Elections(districtJson)
    )
  }
}
