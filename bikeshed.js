'use strict';
const fs = require("fs");
const path = require('path');

let ignoreLocal = false;
let log = () => {};
let debug = () => {};
// log = debug = console.log.bind(console);

function bikeshed(infile, outfile) {
  if (ignoreLocal)
    return bikeshed_online(infile, outfile);
  return bikeshed_local(infile, outfile)
    .catch(error => {
      if (error.code === 'ENOENT') { // bikeshed not installed locally.
        log("Local bikeshed not found, using the online service.");
        ignoreLocal = true; // prefer online for future calls.
        return bikeshed_online(infile, outfile);
      }
      return Promise.reject(error);
    });
}

function bikeshed_local(infile, outfile) {
  return new Promise(function (resolve, reject) {
    infile = infile || 'Overview.bs';
    outfile = outfile || getTargetPath(infile);
    const spawn = require('child_process').spawn;
    let isRejected = false;
    let child = spawn("bikeshed", ['spec', infile, outfile], {
      stdio: [process.stdin, outfile == '-' ? 'pipe' : process.stdout, process.stderr],
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
      if (outfile == '-') {
        debug("Reading stdout...");
        return resolve(readToEndAsync(child.stdout));
      }
      return resolve(outfile, code);
    });
  });
}

function bikeshed_online(infile, outfile) {
  infile = infile || 'Overview.bs';
  outfile = outfile || getTargetPath(infile);
  const request = require('request');
  debug("Requesting online api...", infile, outfile);
  let res = request.post({
    url: "http://api.csswg.org/bikeshed/",
    formData: {
      file: fs.createReadStream(infile),
    },
  });
  return saveToFileAsync(res, outfile);
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

function readToEndAsync(stream) {
  debug('readToEndAsync');
  return new Promise(function (resolve, reject) {
    let buffer = [];
    stream
      .on('data', data => {
        debug('readToEndAsync: data', data);
        buffer.push(data);
      }).on('error', error => {
        debug('readToEndAsync: error', error);
        reject(error);
      }).on('end', () => {
        debug('readToEndAsync: end');
        resolve(buffer.join(''));
      }).on('finish', () => {
        debug('readToEndAsync: finish');
        resolve(buffer.join(''));
      });
  });
}

function saveToFileAsync(stream, outfile) {
  if (outfile == '-')
    return readToEndAsync(stream);

  return new Promise(function (resolve, reject) {
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
module.exports.ignoreLocal = ignoreLocal;
module.exports.log = log;
