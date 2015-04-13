var Q = require('q');
var path = require('path');
var glob = require('glob');

var execute = require('lambduh-execute');
var validate = require('lambduh-validate');
var upload = require('lambduh-put-s3-object');
var downloadFile = require('lambduh-download-file');

exports.handler = function(event, context) {
  //validate event
  validate(event, {
    "srcUrl": true,
    "destBucket": true,
    "pngsDir": true
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
    if (event.watermarkUrl) {
      return downloadFile({
        filepath: "/tmp/watermark.png",
        url: event.watermarkUrl
      })
    } else {
      return event;
    }
  })

  //download file to /tmp/downloads/
  .then(function(event) {
    return downloadFile({
      url: event.srcUrl,
      filepath: event.fileDownloadPath,
    });
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
    if (event.watermarkUrl) {
      return execute(event, {
        bashScript: '/var/task/watermark',
        bashParams: [
          "/tmp/uploads/*.png", //files to process
          "/tmp/watermark.png" //watermark location
        ],
        logOutput: true
      });
    } else {
      return event;
    }
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

