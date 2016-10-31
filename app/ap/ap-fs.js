'use strict'

const fs = require('fs')

const elections = require('./elections')
const ApData = require('./ApData')
const ChangelogEntry = require('../../assets/javascripts/dashboard/ChangelogEntry')

const ReportingUnitPath = `${__dirname}/../../data/reportingUnit.json`
const DistrictPath = `${__dirname}/../../data/district.json`
const ChangelogPath = `${__dirname}/../../data/changelog.tsv`

module.exports = {
  reportingUnitPath: ReportingUnitPath,
  districtPath: DistrictPath,
  changelogPath: ChangelogPath,

  load() {
    const reportingUnitJson = JSON.parse(fs.readFileSync(ReportingUnitPath))
    const districtJson = JSON.parse(fs.readFileSync(DistrictPath))

    return new ApData(
      new elections.Elections(reportingUnitJson),
      new elections.Elections(districtJson)
    )
  },

  loadChangelogEntries() {
    let text
    try {
      text = fs.readFileSync(ChangelogPath, 'utf8')
    } catch (e) {
      text = ''
    }

    const entries = text
      .split(/\r?\n/)
      .slice(1)
      .filter(s => s.length > 0)
      .map(ChangelogEntry.fromTsvLine)

    return {
      president: entries.filter(e => e.changeType === 'start' || e.raceType === 'president').reverse(),
      senate: entries.filter(e => e.changeType === 'start' || e.raceType === 'senate').reverse(),
      house: entries.filter(e => e.changeType === 'start' || e.raceType === 'house').reverse()
    }
  }
}
