#!/usr/bin/env node

'use strict'

if (!process.env.AP_API_KEY) {
  throw new Error("You must set the AP_API_KEY environment variable")
}
const ApiKey = process.env.AP_API_KEY

const Timeout = 15000 // ms between refreshes

const debug = require('debug')('script/loop-update-and-upload')
const fs = require('fs')
const syncRequest = require('sync-request')

const App = require('../generator/App')
const AWS = require('../generator/AWS')
const withLockfile = require('../generator/lockfile')

const apFs = require('../app/ap/ap-fs')

/*
 * On a loop:
 *
 * 1. Backs up `data/fipscode.json` and `data/district.json`.
 * 2. Patches `data/fipscode.json` and `data/district.json` from AP's API.
 * 3. Generates all assets and pages.
 * 4. Uploads all assets and pages.
 * 5. Waits a few seconds before starting all over.
 *
 * The entire loop (except for waiting) happens with a lockfile acquired. That
 * makes it so that when somebody is deploying, the deploy won't happen while
 * we're messing with the `data/` directory.
 */

function exit(err) {
  if (err) throw err
}

/**
 * Writes a new "data/fipscode.json" or "data/district.json".
 *
 * @param apData Original ApData, from apFs.load()
 * @param fipscodeOrDistrict "fipscode" or "district"
 */
function update(apData, fipscodeOrDistrict) {
  if ([ 'fipscode', 'district' ].indexOf(fipscodeOrDistrict) === -1) {
    throw new Error(`fipscodeOrDistrict must be "fipscode" or "district"; got "${fipscodeOrDistrict}"`)
  }

  const timestamp = String(new Date() - 0)

  const path = apFs[`${fipscodeOrDistrict}Path`]
  fs.writeFileSync(`${path}-${timestamp}-pre`, fs.readFileSync(`${path}`))

  const elections = apData[`${fipscodeOrDistrict}Elections`]
  const url = `${elections.json.nextrequest}&apiKey=${ApiKey}`
  debug(`GET ${url}`)
  const result = syncRequest('GET', url)
  if (result.statusCode !== 200) {
    throw new Error(`GET ${url} returned status code ${result.statusCode}`)
  }
  fs.writeFileSync(`${path}-${timestamp}-update`, result.body)

  const body = result.body
  const json = JSON.parse(body.toString()) // or throw error
  const elections2 = elections.update(json)

  fs.writeFileSync(`${path}-${timestamp}-post`, JSON.stringify(elections2.json))
  fs.writeFileSync(path, JSON.stringify(elections2.json))
}

function tick(callback) {
  withLockfile((err, freeLockfile) => {
    if (err) return callback(err)

    const apData = apFs.load()

    update(apData, 'fipscode')
    update(apData, 'district')

    debug(`Building App…`)
    App.build_output_from_scratch((err, output) => {
      if (!err && output.error) err = output.error
      if (err) return freeLockfile(exit, err)

      if (process.env.S3_BUCKET === '_skip') {
        debug(`Skipping upload to AWS…`)
        freeLockfile(callback)
      } else {
        debug(`Uploading to AWS…`)
        AWS.upload_assets_and_pages(output.assets, output.pages)
          .then(
            () => freeLockfile(callback),
            (err) => freeLockfile(callback, err)
          )
      }
    })
  })
}

function doTick() {
  tick(err => {
    if (err) return exit(err)
    debug(`Will do it all again after ${Timeout / 1000}s…`)
    setTimeout(doTick, Timeout)
  })
}

doTick()
