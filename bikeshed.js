var ignoreLocal = false;

function bikeshed(infile, outfile) {
  infile = infile || 'Overview.bs';
  outfile = outfile || 'Overview.html';

  return new Promise(bikeshed_cb);

  function bikeshed_cb(resolve, reject) {
    if (ignoreLocal)
      return bikeshed_online_cb(resolve, reject);
    bikeshed_local_cb(resolve, function (e) {
      if (e.code == "ENOENT") { // bikeshed not installed locally.
        console.log("Local bikeshed not found, use the online service.");
        ignoreLocal = true; // prefer online for future calls.
        bikeshed_online_cb(resolve, reject);
        return;
      }
      reject(e);
    });
  }

  function bikeshed_local_cb(resolve, reject) {
    var spawn = require('child_process').spawn;
    spawn("bikeshed", ['spec', infile, outfile], {
      stdio: "inherit"
    }).on("error", function (e) {
      // ENOENT doesn't fire "close" and throws without on("error")
      reject(e);
    }).on("close", function (code) {
      if (code) {
        console.log("Local bikeshed exited with code:", code);
        // No need to reject() because on("error") also fires.
        return;
      }
      return resolve();
    });
  }

  function bikeshed_online_cb(resolve, reject) {
    var fs = require("fs");
    var request = require('request');
    // gulp.watch() kicks in when pipe() creates the file,
    // so write to a temp file and move it.
    var tmpfile = getTempFileName(outfile);
    request.post({
      url: "http://api.csswg.org/bikeshed/",
      formData: {
        file: fs.createReadStream(infile),
      },
    }).on("error", function (err) {
      fs.unlinkSync(tmpfile);
      reject(err);
    }).pipe(fs.createWriteStream(tmpfile))
    .on("finish", function () {
      fs.rename(tmpfile, outfile, function (err) {
        if (err)
          reject(err);
        else
          resolve();
      });
    });
  }

  function getTempFileName(file) {
    var path = require('path');
    var parsed = path.parse(file);
    parsed.base = '~' + parsed.base;
    return path.format(parsed);
  }
}

module.exports = bikeshed;
