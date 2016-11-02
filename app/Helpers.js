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

  partial(name) {
    return this.context.render_template(name, this.context)
  }

  formatInt(i) {
    return formatInt(i)
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

  regionMap(regionId) {
    return fs.readFileSync(`${__dirname}/../raw-assets/state-map-builder/output/${regionId}.svg`, 'utf8')
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
