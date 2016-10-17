#!/usr/bin/env node

'use strict'

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
