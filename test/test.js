const bikeshed = require('../bikeshed.js');

const assert = require('assert');
const fs = require('fs');

const datadir = __dirname + '/data/';
const inFileName = datadir + 'test.bs';
const outFileNameExpected = datadir + 'test.html';
const outputExpected = fs.readFileSync(datadir + 'test-expected.html', 'utf8');

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

describe('bikeshed utilities', function () {
  it('getTargetPath', function () {
    assert.equal(
      bikeshed.getTargetPath(inFileName),
      outFileNameExpected);
  });
});

runTests(bikeshed, '');

function runTests(bikeshed, suffix) {
  describe('bikeshed' + suffix, function () {
    it('Process to a file', function () {
      this.timeout(5000);
      return bikeshed(inFileName).then(outFileName => {
        assert.equal(outFileName, outFileNameExpected,
          'Output file name should be generated.');
        let output = fs.readFileSync(outFileName, 'utf8');
        assert.equal(
          takeFirstLines(output, 5),
          takeFirstLines(outputExpected, 5));
        fs.unlinkSync(outFileName);

        if (!suffix && !bikeshed.ignoreLocal) {
          runTests(bikeshed.online, ' (online)');
        }
      });
    });

    it('Process to a Buffer array', function () {
      this.timeout(5000);
      let buffers = [];
      return bikeshed(inFileName, buffers).then(result => {
        assert.equal(buffers, result, 'Should return the given array.');
        assert.notEqual(buffers.length, 0);
        for (let buffer of buffers)
          assert(Buffer.isBuffer(buffer));
        let output = Buffer.concat(buffers).toString('utf8');
        assert.equal(
          takeFirstLines(output, 5),
          takeFirstLines(outputExpected, 5));
      });
    });
  });
}
