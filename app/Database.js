'use strict'

const fs = require('fs')
const read_config = require('../generator/read_config')

const GoogleDocs = require('../generator/GoogleDocs')
const GoogleSheets = require('../generator/GoogleSheets')
const PageMetadata = require('../generator/PageMetadata')
const ap_fs = require('./ap/ap-fs')
const presidentClassNameForRace = require('../assets/javascripts/president/_classNameForRace')

function invertTranslations(translations) {
  const Locales = Object.keys(translations[0])
  Locales.splice(Locales.indexOf('id'), 1)
  Locales.splice(Locales.indexOf('notes'), 1)

  const Phrases = {}

  for (const locale of Locales) {
    Phrases[locale] = {}
  }

  for (const row of translations) {
    for (const locale of Locales) {
      Phrases[locale][row.id] = row[locale]
    }
  }

  // Now work on defaults for all rows
  for (const locale of Locales) {
    const phrases = Phrases[locale]

    // Fallback: "fr-CA" => "fr"
    if (locale.indexOf('-') !== -1) {
      const baseLocale = locale.slice(0, 2);

      if (Phrases.hasOwnProperty(baseLocale)) {
        for (const id of Object.keys(phrases)) {
          if (phrases[id] === '') phrases[id] = Phrases[baseLocale][id]
        }
      }
    }

    // Fallback: "fr" => "en"
    // Don't worry if we hit "fr-CA" first (which will fallback to "en") or if
    // we hit "fr" before "fr-CA" (in which case "fr-CA" will fallback to "fr").
    // The result is guaranteed to be equal.
    if (locale !== 'en') {
      for (const id of Object.keys(phrases)) {
        if (phrases[id] === '') phrases[id] = Phrases.en[id]
      }
    }
  }

  return Phrases;
}

module.exports = class Database {
  constructor() {
    const google_docs = new GoogleDocs(read_config('google-docs'))
    const google_sheets = new GoogleSheets(read_config('google-sheets'))
    const translations = invertTranslations(google_sheets.slug_to_array('translations'));
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

    const presidentRaces = apData.presidentRaces().sort(presidentClassNameForRace.compareRaces)
    presidentRaces.forEach(race => race.className = presidentClassNameForRace(race))

    const houseRaces = apData.houseRaces()

    this.splash = {
      president: summaries.president,
      races: presidentRaces,
      senate: summaries.senate,
      house: summaries.house,
      battlegrounds: battlegrounds,
      i18n: {
        locale: 'en',
        phrases: null // we set this later in this function
      }
    }

    // TODO name each splash page format, (so we can _test them all)
    this.splashFormats = [
      { format: 'full' }
    ]

    this.president = {
      metadata: new PageMetadata('president', {}), // TK
      summaries: summaries,
      races: presidentRaces
    }

    // TK get these up and running
    this.senate = JSON.parse(JSON.stringify(this.president)); this.senate.metadata.slug = 'senate'

    this.house = {
      metadata: new PageMetadata('house', {}), // TK
      summaries: summaries,
      races: houseRaces
    }

    this.presidentAsBuffer = Buffer.from(JSON.stringify({
      summaries: summaries,
      races: presidentRaces
    }));

    this.houseAsBuffer = Buffer.from(JSON.stringify({
      summaries: summaries,
      races: houseRaces
    }))

    this.translatedSplash = []
    Object.keys(translations).forEach(locale => {
      const localeObj = { locale: locale, phrases: translations[locale] }
      this.translatedSplash.push(Object.assign({}, this.splash, { locale: locale, i18n: localeObj }))

      if (locale === 'en') {
        this.splash.i18n.phrases = translations[locale]
      }
    })
  }
}
