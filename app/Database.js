'use strict'

const fs = require('fs')
const read_config = require('../generator/read_config')

const GoogleDocs = require('../generator/GoogleDocs')
const GoogleSheets = require('../generator/GoogleSheets')
const PageMetadata = require('../generator/PageMetadata')
const AppSplash = require('../generator/AppSplash')
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
    const appSplashTablet = new AppSplash(1400, 'tablet')
    const appSplashMobile = new AppSplash(600, 'mobile')
    const translations = invertTranslations(google_sheets.slug_to_array('translations'));
    const regionIdToName = google_sheets.slug_to_array('regions')
      .reduce(((s, r) => { s[r.id] = r.name; return s }), {})
    const apData = ap_fs.load()
    const changelog = ap_fs.loadChangelogEntries()

    const battlegrounds = 'FL NC MI WI PA'.split(' ');

    const summaries = {
      president: apData.presidentSummary(),
      senate: apData.senateSummary(),
      house: apData.houseSummary(),
    }

    const presidentRaces = apData.presidentRaces()
    const houseRaces = apData.houseRaces()
    const senateRaces = apData.senateRaces()

    const NChangeLogEntries = 10

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
      metadata: new PageMetadata('president', {
        title: '2016 Presidential Election',
        hed: '2016 Presidential Election Live Results',
        social_title: '2016 Presidential Election Live Results',
        dek: 'Track your candidate using our interactive, live election maps and infographics',
        twitter_author: '@huffpostdata',
        date_published: 'Monday, Nov. 8, 2016, 12:00 P.M. EST',
        suggested_tweet: 'Follow the 2016 election with live results and maps'
      }),
      summaries: summaries,
      races: presidentRaces,
      changelog: changelog.president.slice(0, NChangeLogEntries).map(e => e.toTsvLine()).join('\n')
    }

    this.senate = {
      metadata: new PageMetadata('senate', {
        title: '2016 Senate Election',
        hed: '2016 Senate Election Live Results',
        social_title: '2016 Senate Election Live Results',
        dek: 'Track your candidate using our interactive, live election maps and infographics',
        twitter_author: '@huffpostdata',
        date_published: 'Monday, Nov. 8, 2016, 12:00 P.M. EST',
        suggested_tweet: 'Follow the 2016 election with live results and maps'
      }),
      summaries: summaries,
      races: senateRaces,
      changelog: changelog.senate.slice(0, NChangeLogEntries).map(e => e.toTsvLine()).join('\n')
    }

    this.house = {
      metadata: new PageMetadata('house', {
        title: '2016 House Election',
        hed: '2016 House Election Live Results',
        social_title: '2016 House Election Live Results',
        dek: 'Track your candidate using our interactive, live election maps and infographics',
        twitter_author: '@huffpostdata',
        date_published: 'Monday, Nov. 8, 2016, 12:00 P.M. EST',
        suggested_tweet: 'Follow the 2016 election with live results and maps'
      }),
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

    this.appSplashTabletJpg = Buffer.from(appSplashTablet.renderImage(summaries.president, presidentRaces))
    this.appSplashMobileJpg = Buffer.from(appSplashMobile.renderImage(summaries.president))

    const regionIdToRaces = apData.allRaceDetails()
    this.regions = Object.keys(regionIdToRaces).map(regionId => {
      const name = regionIdToName[regionId]

      const metadata = new PageMetadata(`state/${regionId}`, {
        social_image: 'president-social.jpg',
        title: `${name} Election Results`,
        hed: `${name} Election Results`,
        dek: 'Track your candidate using our interactive, live election maps and infographics',
        twitter_author: '@huffpostdata',
        date_published: 'Monday, Nov. 8, 2016, 12:00 P.M. EST',
        social_title: `Who’s ahead in ${name}?`,
        suggested_tweet: `Follow the 2016 ${name} election with live results and maps`
      })
      metadata.url_route = [ 'state/:id', regionId ]

      return {
        id: regionId,
        name: name,
        metadata: metadata,
        summaries: summaries,
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
