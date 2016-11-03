'use strict'

const fs = require('fs')
const Polyglot = require('node-polyglot')
const formatInt = require('../assets/javascripts/common/formatInt')
const PageContext = require('../generator/PageContext')

function extend_context(context, locals) {
  const new_locals = Object.assign({}, context.locals, locals)
  return new PageContext(context.compiler, new_locals)
}

class Helpers {
  constructor(context) {
    this.context = context
  }

  partial(name, newModel) {
    let newContext = this.context
    if (newModel) newContext = extend_context(this.context, { model: newModel })
    return this.context.render_template(name, newContext)
  }

  formatInt(i) {
    return formatInt(i)
  }

  /**
   * 1 => "1st", 2 => "2nd".
   *
   * Works for anything below 1,000.
   */
  formatOrdinal(i) {
    if (i >= 4 && i < 20) return `${i}th`
    switch (i % 10) {
      case 1: return `${i}st`
      case 2: return `${i}nd`
      case 3: return `${i}rd`
      default: return `${i}th`
    }
  }

  /**
   * Returns the fraction as a percantage.
   *
   * Watch out. This is a bit "custom" -- if you're going to change the logic,
   * make sure the current clients can keep things the way they've always been.
   */
  formatPercent(numerator, denominator) {
    if (numerator === 0 || denominator === 0) return '';

    return (100 * numerator / denominator).toFixed(0) + '%';
  }

  formatFractionReporting(fraction) {
    if (fraction === 0) return '0%'
    if (fraction === 1) return '100%'
    if (fraction < 0.01) return '<1%'
    if (fraction > 0.99) return '>99%'
    return `${Math.round(fraction * 100)}%`
  }

  buildTranslateFunction(i18n) {
    const polyglot = new Polyglot({
      phrases: i18n.phrases,
      locale: i18n.locale,
      numberFormat: new Intl.NumberFormat(i18n.locale).format
    })
    return (...args) => polyglot.t(...args)
  }

  tinyPresidentMap(presidentRaces) {
    const idToClass = {}
    for (const race of presidentRaces) {
      idToClass[race.id] = race.className
    }

    return fs.readFileSync(`${__dirname}/../raw-assets/usa-map/president-tiny.svg`, 'utf-8')
      .replace(/class="(\w\w)"/g, (_, id) => `class="${idToClass[id]}"`)
  }

  geoSvg(regionId) {
    return fs.readFileSync(`${__dirname}/../raw-assets/state-map-builder/output/geo-maps/${regionId}.svg`, 'utf8')
  }

  districtSvg(regionId) {
    return fs.readFileSync(`${__dirname}/../raw-assets/state-map-builder/output/district-maps/${regionId}.svg`, 'utf8')
  }

  // Changes 'Written by [Adam Hooper]' to 'Written by <a href="..."></a>'
  format_authors(author) {
    function name_to_href(name) {
      // No idea if this permalinking function is correct.
      const slug = name.toLowerCase().replace(/[^\w]+/g, '-')
      return `//www.huffingtonpost.com/${slug}`
    }

    // Not HTML-safe. That should be fine.
    return author
      .replace(/\[([^\]]+)\]/g, (_, name) => `<a rel="author" href="${name_to_href(name)}">${name}</a>`)
  }
}

module.exports = Helpers
