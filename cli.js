#!/usr/bin/env node
var bikeshed = require('./bikeshed.js');
const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['debug', 'online', 'verbose'],
  alias: {
    v: 'verbose',
  },
});
if (argv.debug) bikeshed.debug = bikeshed.log = console.log.bind(console);
if (argv.verbose) bikeshed.log = console.log.bind(console);
if (argv.online) bikeshed.ignoreLocal = true;
bikeshed.apply(bikeshed, argv._).then(
  file => console.log('Resolved:\n' + file),
  err => console.log('Rejected:\n' + err));
