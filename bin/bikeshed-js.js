#!/usr/bin/env node
var bikeshed = require('../bikeshed.js');
bikeshed().then(
  file => console.log('Output: ' + file),
  err => console.log(err));
