#!/usr/bin/env node
const bikeshed = require('./bikeshed.js');
const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['debug', 'online', 'verbose'],
  alias: {
    v: 'verbose',
  },
});
if (argv.debug) bikeshed.debug = bikeshed.log = console.log.bind(console);
if (argv.verbose) bikeshed.log = console.log.bind(console);
if (argv.online) bikeshed.ignoreLocal = true;
let infile = argv._[0];
let outfile = argv._[1];
if (outfile == '-')
  outfile = [];
bikeshed(infile, outfile).then(
  file => {
    if (Array.isArray(file))
      file = Buffer.concat(file).toString('utf8');
    console.log('Resolved:\n', file);
  }, err => {
    console.log('Rejected:\n', err);
  });
