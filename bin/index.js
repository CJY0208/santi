#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2)

const scriptIndex = args.findIndex(
  x => x === 'build' || x === 'serve' || x === 'start'
)
const script = scriptIndex === -1 ? args[0] : args[scriptIndex]

const run = require(`../scripts/${script}`)

if (!script || typeof run !== 'function') {
  throw new Error(`[Invaild Command]: ${script}`)
} else {
  run()
}
