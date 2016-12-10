const assert = require('assert');
const fs = require('fs');
const bikeshed = require('../bikeshed.js');

const inFileName = __dirname + '/data/test.bs';
const outFileNameExpected = __dirname + '/data/test.html';
const outputExpected = fs.readFileSync(__dirname + '/data/test-expected.html', 'utf8');

describe('Test utilities', function () {
  it('takeFirstLines', function () {
    assert.equal(
      takeFirstLines('1\n2\n3', 2),
      '1\n2');
  });
});

function takeFirstLines(text, count) {
  let lines = text.split('\n');
  return lines.slice(0, count).join('\n');
}

describe('bikeshed', function () {
  it('Process to file', function () {
    this.timeout(5000);
    return bikeshed(inFileName).then(outFileName => {
      let output = fs.readFileSync(outFileName, 'utf8');
      fs.unlinkSync(outFileName);
      assert.equal(outFileName, outFileNameExpected,
        'Output file name should be generated.');
      assert.equal(
        takeFirstLines(output, 5),
        takeFirstLines(outputExpected, 5));
    });
  });
});
