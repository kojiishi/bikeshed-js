#!/usr/bin/env node
var bikeshed = require('../bikeshed.js');
const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['verbose'],
  alias: {
    v: 'verbose',
  },
});
if (argv.verbose) bikeshed.log = console.log.bind(console);
bikeshed.apply(bikeshed, argv._).then(
  file => console.log('Resolved: ' + file),
  err => console.log('Rejected: ' + err));
