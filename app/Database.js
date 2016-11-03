'use strict'

const fs = require('fs')
const read_config = require('../generator/read_config')

const GoogleDocs = require('../generator/GoogleDocs')
const GoogleSheets = require('../generator/GoogleSheets')
const PageMetadata = require('../generator/PageMetadata')
const ap_fs = require('./ap/ap-fs')

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

// This list is still up in the air?
const SHOW_RIGHT_RAIL = ['en', 'en-CA', 'fr-CA'];

module.exports = class Database {
  constructor() {
    const google_docs = new GoogleDocs(read_config('google-docs'))
    const google_sheets = new GoogleSheets(read_config('google-sheets'))
    const translations = invertTranslations(google_sheets.slug_to_array('translations'));
    const apData = ap_fs.load()
    const changelog = ap_fs.loadChangelogEntries()

    const battlegrounds = 'PA FL OH CO AZ'.split(' ');

    const summaries = {
      president: apData.presidentSummary(),
      senate: apData.senateSummary(),
      house: apData.houseSummary(),
    }

    const presidentRaces = apData.presidentRaces()
    const houseRaces = apData.houseRaces()
    const senateRaces = apData.senateRaces()

    const NChangeLogEntries = 5

    this.splash = {
      summaries: summaries,
      races: presidentRaces,
      senateRaces: senateRaces,
      houseRaces: houseRaces,
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
      races: presidentRaces,
      changelog: changelog.president.slice(0, NChangeLogEntries).map(e => e.toTsvLine()).join('\n')
    }

    this.senate = {
      metadata: new PageMetadata('senate', {}), // TK
      summaries: summaries,
      races: senateRaces,
      changelog: changelog.senate.slice(0, NChangeLogEntries).map(e => e.toTsvLine()).join('\n')
    }

    this.house = {
      metadata: new PageMetadata('house', {}), // TK
      summaries: summaries,
      races: houseRaces,
      changelog: changelog.house.slice(0, NChangeLogEntries).map(e => e.toTsvLine()).join('\n')
    }

    this.presidentAsBuffer = Buffer.from(JSON.stringify({
      summaries: summaries,
      races: presidentRaces,
      changelog: this.president.changelog
    }));

    this.senateAsBuffer = Buffer.from(JSON.stringify({
      summaries: summaries,
      races: senateRaces,
      changelog: this.senate.changelog
    }))

    this.houseAsBuffer = Buffer.from(JSON.stringify({
      summaries: summaries,
      races: houseRaces,
      changelog: this.house.changelog
    }))

    const regionIdToRaces = apData.allRaceDetails()
    this.regions = Object.keys(regionIdToRaces).map(regionId => {
      const metadata = new PageMetadata(`state/${regionId}`, {
        // TK
        social_image: 'president-social.jpg' // TK is this okay?
      })
      metadata.url_route = [ 'state/:id', regionId ]
      return {
        id: regionId,
        metadata: metadata,
        races: regionIdToRaces[regionId],
        jsonBuffer: Buffer.from(JSON.stringify(regionIdToRaces[regionId]), 'utf8')
      }
    })

    this.translatedSplash = []
    Object.keys(translations).forEach(locale => {
      const i18n = { locale: locale, phrases: translations[locale] }
      const showRightRail = { showRightRail: SHOW_RIGHT_RAIL.includes(locale) }
      this.translatedSplash.push(Object.assign({}, this.splash, showRightRail, { locale: locale, i18n: i18n }))

      if (locale === 'en') {
        this.splash.i18n.phrases = translations[locale]
      }
    })

    this.translatedSplashBar = this.translatedSplash.map(x => Object.assign({
      summaries: summaries,
      houseRaces: houseRaces,
      senateRaces: senateRaces,
      presidentRaces: presidentRaces
    }, x))
  }
}
