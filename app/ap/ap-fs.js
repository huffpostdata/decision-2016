'use strict'

const fs = require('fs')

const elections = require('./elections')
const ApData = require('./ApData')

const FipscodePath = `${__dirname}/../../data/fipscode.json`
const DistrictPath = `${__dirname}/../../data/district.json`

module.exports = {
  fipscodePath: FipscodePath,
  districtPath: DistrictPath,

  load() {
    const fipscodeJson = JSON.parse(fs.readFileSync(FipscodePath))
    const districtJson = JSON.parse(fs.readFileSync(DistrictPath))

    return new ApData(
      new elections.Elections(fipscodeJson),
      new elections.Elections(districtJson)
    )
  }
}
