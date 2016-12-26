'use strict';
const fs = require("fs");
const path = require('path');

function bikeshed(infile, outfile) {
  return new Bikeshed(infile, outfile).run();
}
function bikeshedOnline(infile, outfile) {
  return new Bikeshed(infile, outfile).runOnline();
}
bikeshed.ignoreLocal = false;
bikeshed.getTargetPath = getTargetPath;
bikeshed.online = bikeshedOnline;
bikeshed.debug = () => {};
bikeshed.log = () => {};
// bikeshed.log = bikeshed.debug = console.log.bind(console);

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
    if (bikeshed.ignoreLocal)
      return this.runOnline();
    return this.runLocal()
      .catch(error => {
        if (error.code === 'ENOENT') { // bikeshed not installed locally.
          bikeshed.log("Local bikeshed not found, using the online service.");
          bikeshed.ignoreLocal = true; // prefer online for future calls.
          return this.runOnline();
        }
        return Promise.reject(error);
      });
  }

  runLocal() {
    return new Promise((resolve, reject) => {
      const child_process = require('child_process');
      let args = ['spec', this.infile, this.outfile];
      if (!this.outfile)
        args[2] = '-';
      let child = child_process.spawnSync('bikeshed', args);
      bikeshed.debug(child);
      if (child.error) {
        bikeshed.log("Local bikeshed error:", child.error, child.stderr);
        reject(child.error);
        return;
      }
      if (child.status) {
        bikeshed.log("Local bikeshed returned non-zero status:", child.status, child.stdout.toString(), child.stderr.toString());
        let error = new Error(child.stdout.toString());
        error.status = child.status;
        reject(error);
        return;
      }
      if (this.outfile)
        return resolve(this.outfile);
      this.outbuffers.push(child.stdout);
      resolve(this.outbuffers);
    });
  }

  runOnline() {
    const request = require('request');
    bikeshed.debug("Requesting online api...", this);
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
  bikeshed.debug('streamToBuffers');
  buffers = buffers || [];
  return new Promise((resolve, reject) => {
    stream
      .on('data', data => {
        bikeshed.debug('readToEndAsync: data', data);
        buffers.push(data);
      }).on('error', error => {
        bikeshed.debug('readToEndAsync: error', error);
        reject(error);
      }).on('end', () => {
        bikeshed.debug('readToEndAsync: end');
        resolve(buffers);
      }).on('finish', () => {
        bikeshed.debug('readToEndAsync: finish');
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
