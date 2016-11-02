#!/usr/bin/env node

'use strict'

if (process.env.NODE_ICU_DATA !== 'node_modules/full-icu') {
  throw new Error("You must set NODE_ICU_DATA=node_modules/full-icu before starting Node because i18n won't work otherwise")
}

const withLockfile = require('./lockfile')

const App = require('./App')
const AWS = require('./AWS')

function exit(err) {
  if (err) throw err
}

withLockfile((err, freeLockfile) => {
  if (err) return exit(err)

  App.build_output_from_scratch((err, output) => {
    if (!err && output.error) err = output.error
    if (err) return freeLockfile(exit, err)

    AWS.upload_assets_and_pages(output.assets, output.pages)
      .then(
        () => freeLockfile(exit),
        (err) => freeLockfile(exit, err)
      )
  })
})
