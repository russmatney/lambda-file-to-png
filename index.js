var Q = require('q');
var path = require('path');
var glob = require('glob');
var fs = require('fs');
var req = require('request');

var execute = require('lambduh-execute');
var validate = require('lambduh-validate');
var upload = require('lambduh-put-s3-object');

var downloadExternalFile = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  file.on('finish', function() {
    file.close(cb);  // close() is async, call cb after close completes.
  });
  file.on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
  req(url).pipe(file);
};

exports.handler = function(event, context) {
  //validate event
  validate(event, {
    "srcUrl": true,
    "destBucket": true,
    "pngsDir": true,
    "watermarkUrl": true
  })

  .then(function(event) {
    event.fileDownloadPath = "/tmp/downloads/" + path.basename(event.srcUrl);
    return event;
  })

  // create /tmp/downloads, /tmp/uploads
  .then(function(event) {
    return execute(event, {
      shell: 'mkdir -p /tmp/downloads; mkdir -p /tmp/uploads;',
      logOutput: true
    });
  })

  //download watermark to /tmp/watermark.png
  .then(function(event) {
    var def = Q.defer();
    downloadExternalFile(event.watermarkUrl, "/tmp/watermark.png", function(err) {
      if (err) {
        def.reject(err);
      } else {
        def.resolve(event);
      }
    });
    return def.promise;
  })

  //download file to /tmp/downloads/
  .then(function(event) {
    var def = Q.defer();
    downloadExternalFile(event.srcUrl, event.fileDownloadPath, function(err) {
      if (err) {
        def.reject(err);
      } else {
        def.resolve(event);
      }
    });
    return def.promise;
  })

  //convert file to png
  .then(function(event) {
    return execute(event, {
      bashScript: '/var/task/file-to-png',
      bashParams: [
        event.fileDownloadPath, //file to process
        "/tmp/uploads/" //processed file destination
      ],
      logOutput: true
    });
  })

  //add watermark
  .then(function(event) {
    return execute(event, {
      bashScript: '/var/task/watermark',
      bashParams: [
        "/tmp/uploads/*.png", //files to process
        "/tmp/watermark.png" //watermark location
      ],
      logOutput: true
    });
  })


  //upload files in /tmp/uploads/**.png to s3
  .then(function(event) {
    var def = Q.defer();
    glob("/tmp/uploads/**.png", function(err, files) {
      if(err) { def.reject(err) }
      else {
        var promises = [];
        files.forEach(function(file) {
          promises.push(upload(event, {
            dstBucket: event.destBucket,
            dstKey: event.pngsDir + "/" + path.basename(file),
            uploadFilepath: file
          }));
        });

        Q.all(promises)
          .then(function(results) {
            def.resolve(results[0]);
          })
          .fail(function(err) {
            def.reject(err);
          });;
      }
    });
    return def.promise;
  })

  .then(function(event) {
    context.done()
  }).fail(function(err) {
    if(err) {
      context.done(err)
    } else {
      context.done(new Error("Unspecifed fail."))
    }
  });

}

