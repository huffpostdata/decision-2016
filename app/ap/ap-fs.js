'use strict'

const fs = require('fs')

const elections = require('./elections')
const ApData = require('./ApData')

const FipscodePath = `${__dirname}/../../data/reportingUnit.json`
const DistrictPath = `${__dirname}/../../data/district.json`

module.exports = {
  reportingUnitPath: FipscodePath,
  districtPath: DistrictPath,

  load() {
    const reportingUnitJson = JSON.parse(fs.readFileSync(FipscodePath))
    const districtJson = JSON.parse(fs.readFileSync(DistrictPath))

    return new ApData(
      new elections.Elections(reportingUnitJson),
      new elections.Elections(districtJson)
    )
  }
}
