var fs = require("fs");
var request = require('request');
var spawn = require('child_process').spawn;

var ignoreLocal = false;

function bikeshed() {
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
    spawn("bikeshed", [], {
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
    // gulp.watch() kicks in when pipe() creates the file,
    // so write to a temp file and move it.
    var tmpfile = "~Overview.html";
    request.post({
      url: "http://api.csswg.org/bikeshed/",
      formData: {
        file: fs.createReadStream("Overview.bs"),
      },
    }).on("error", function (err) {
      reject(err);
    }).pipe(fs.createWriteStream(tmpfile))
    .on("finish", function () {
      fs.rename(tmpfile, "Overview.html", function (err) {
        if (err)
          reject(err);
        else
          resolve();
      });
    });
  }
}

module.exports = bikeshed;
