'use strict';
const fs = require("fs");
const path = require('path');

let ignoreLocal = false;
let log = () => {};
let debug = () => {};
// log = debug = console.log.bind(console);

function bikeshed(infile, outfile) {
  return new Bikeshed(infile, outfile).run();
}

class Bikeshed {
  constructor(infile, outfile) {
    this.infile = infile || 'Overview.bs';
    if (!outfile) {
      this.outfile = getTargetPath(infile);
    } else if (Array.isArray(outfile)) {
      this.outfile = null;
      this.outbuffers = outfile;
    } else {
      this.outfile = outfile;
    }
  }

  run() {
    if (ignoreLocal)
      return this.runOnline();
    return this.runLocal()
      .catch(error => {
        if (error.code === 'ENOENT') { // bikeshed not installed locally.
          log("Local bikeshed not found, using the online service.");
          ignoreLocal = true; // prefer online for future calls.
          return this.runOnline();
        }
        return Promise.reject(error);
      });
  }

  runLocal() {
    return new Promise((resolve, reject) => {
      const child_process = require('child_process');
      let isRejected = false;
      let child = child_process.spawn('bikeshed',
        ['spec', this.infile, this.outfile ? this.outfile : '-'], {
        stdio: [process.stdin,
          this.outfile ? process.stdout : 'pipe',
          process.stderr],
      }).on("error", function (e) {
        log("Local bikeshed error:", e);
        // ENOENT doesn't fire "close" and throws without on("error")
        isRejected = true;
        reject(e);
      }).on("close", function (code) {
        if (code) {
          log("Local bikeshed exited with code:", code);
          // No need to reject() because on("error") also fires.
          if (!isRejected)
            reject(code);
          return;
        }
        if (this.outfile)
          return resolve(this.outfile);
        return resolve(streamToBuffers(child.stdout, this.outbuffers));
      });
    });
  }

  runOnline() {
    const request = require('request');
    debug("Requesting online api...", this);
    let res = request.post({
      url: "http://api.csswg.org/bikeshed/",
      formData: {
        file: fs.createReadStream(this.infile),
      },
    });
    if (this.outfile)
      return saveToFileAsync(res, this.outfile);
    return streamToBuffers(res, this.outbuffers);
  }
}

function getTargetPath(file) {
  var parsed = path.parse(file);
  delete parsed.base;
  parsed.ext = '.html';
  return path.format(parsed);
}

function getTempFileName(file) {
  var parsed = path.parse(file);
  parsed.base = '~' + parsed.base;
  return path.format(parsed);
}

function streamToBuffers(stream, buffers) {
  debug('streamToBuffers');
  return new Promise((resolve, reject) => {
    stream
      .on('data', data => {
        debug('readToEndAsync: data', data);
        buffers.push(data);
      }).on('error', error => {
        debug('readToEndAsync: error', error);
        reject(error);
      }).on('end', () => {
        debug('readToEndAsync: end');
        resolve(buffers);
      }).on('finish', () => {
        debug('readToEndAsync: finish');
        resolve(buffers);
      });
  });
}

function saveToFileAsync(stream, outfile) {
  return new Promise((resolve, reject) => {
    // gulp.watch() kicks in when the file is created,
    // so write to a temp file and move it.
    let tmpfile = getTempFileName(outfile);
    stream.pipe(fs.createWriteStream(tmpfile))
      .on("error", function (err) {
        fs.unlinkSync(tmpfile);
        reject(err);
      }).on("finish", function () {
        fs.rename(tmpfile, outfile, function (err) {
          if (err)
            reject(err);
          else
            resolve(outfile);
        });
      });
  });
}

module.exports = bikeshed;
module.exports.debug = debug;
module.exports.getTargetPath = getTargetPath;
module.exports.log = log;
