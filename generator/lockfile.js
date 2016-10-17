'use strict'

const debug = require('debug')('generator/lockfile')
const lockfile = require('lockfile')

const LockfilePath = `${__dirname}/../data/lockfile.lock`
const LockfileOptions = {
  wait: 45000 // ms. We should never need to wait this long.
}

function freeLockfile(callback, err, ...args) {
  debug(`Unlocking ${LockfilePath}…`)
  lockfile.unlock(LockfilePath, err2 => {
    if (err2) {
      console.warn(`Error unlocking lockfile masks original error: ${err.stack}`)
      return callback(err2)
    }
    callback(err, ...args)
  })
}

/**
 * Uses the global lockfile, `data/lockfile.lock`, to ensure we don't deploy
 * twice by mistake.
 *
 * Usage:
 *
 *     const withLockfile = require('./lockfile')
 *
 *     function doSomethingAndThen(callback) {
 *       withLockfile((err, freeLockfile) => {
 *         if (err) return callback(err)
 *         doSomething((err, success) => {
 *           // If we fail to free the lockfile, that error will supercede your own
 *           freeLockfile(callback, err, success)
 *         })
 *       })
 */
module.exports = function withLockfile(callback) {
  debug(`Locking ${LockfilePath}…`)
  lockfile.lock(LockfilePath, LockfileOptions, (err) => {
    if (err) {
      debug(`Failed to lock ${LockfilePath}…: ${err}`)
    } else {
      debug(`Locked ${LockfilePath}…`)
    }
    callback(err, freeLockfile)
  })
}
