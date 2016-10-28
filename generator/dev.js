#!/usr/bin/env node

'use strict'

const chokidar = require('chokidar')
const read_config = require('./read_config')
const fork = require('child_process').fork

let need_rebuild = null
let child = null
let waitingConnections = null // null: the child is listening. Array: we're queueing

function queue_rebuild() {
  if (!need_rebuild) {
    need_rebuild = true
    setTimeout(rebuild, 100)
  }
}

chokidar.watch('app assets config data generator views'.split(' '), {
  ignored: /([\/\\]\.|.*.marko.js$)/
})
  .on('change', queue_rebuild)
  .on('add', queue_rebuild)
  .on('unlink', queue_rebuild)

function rebuild() {
  if (child) child.kill('SIGTERM') // move along; NodeJS will reap the child soon

  child = fork(`${__dirname}/serve.js`, [ '--child' ])
  waitingConnections = [] // we're waiting for the child to send "ready"

  child.on('message', m => {
    if (m !== 'ready') throw new Error(`Unexpected message from child: ${m}`)

    while (waitingConnections.length > 0) {
      child.send('socket', waitingConnections.shift())
    }
    waitingConnections = null
  })

  need_rebuild = false
}

const server = require('net').createServer({ pauseOnConnect: true })
server.listen(3001, () => {
  server.removeAllListeners('connection') // the child will handle them

  server.on('connection', socket => {
    if (waitingConnections !== null) {
      waitingConnections.push(socket)
    } else {
      child.send('socket', socket)
    }
  })

  console.log('Listening on http://localhost:3001')
  console.log('')
  console.log('If you change a file, all will be reloaded.')
  console.log('')
  console.log('Edit code in app/, assets/, config/ and views/')
  console.log('')
  console.log('Use Ctrl+C to kill the server.')
  console.log('')
})

rebuild()
