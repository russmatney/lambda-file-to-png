var Q = require('q');
var path = require('path');
var glob = require('glob');

var execute = require('lambduh-execute');
var validate = require('lambduh-validate');
var download = require('lambduh-get-s3-object');
var upload = require('lambduh-put-s3-object');

exports.handler = function(event, context) {
  var result = event;

  //validate event
  //TODO: stricter validation
  validate(result, {
    "srcKey": {
      endsWith: "\\.(jpg|gif)",
    },
    "srcBucket": true,
    "dstBucket": true,
    "dstKeyDir": true,
    "watermarkKey": true
  })

  // create /tmp/downloads, /tmp/uploads
  .then(function(result) {
    return execute(result, {
      shell: 'mkdir -p /tmp/downloads; mkdir -p /tmp/uploads;',
      logOutput: true
    });
  })

  //download file to /tmp/downloads/
  .then(function(result) {
    return download(result, {
      srcKey: result.srcKey,
      srcBucket: result.srcBucket,
      downloadFilepath: '/tmp/downloads/' + path.basename(result.srcKey)
    });
  })

  //download watermark to /tmp/watermark.png
  .then(function(result) {
    return download(result, {
      srcKey: result.watermarkKey,
      srcBucket: result.srcBucket,
      downloadFilepath: '/tmp/watermark.png'
    });
  })

  //convert file to png, add watermark
  .then(function(result) {
    if(!result.downloadFilepath) {
      throw new Error('result expected downloadFilepath');
    }
    return execute(result, {
      bashScript: '/var/task/file-to-png',
      bashParams: [
        //TODO: param, code in script for watermark
        result.downloadFilepath, //file to process
        "/tmp/uploads/" //processed file destination
      ],
      logOutput: true
    });
  })

  //upload files in /tmp/uploads/**.png to s3
  .then(function(result) {
    var def = Q.defer();
    glob("/tmp/uploads/**.png", function(err, files) {
      if(err) { def.reject(err) }
      else {
        var promises = [];
        files.forEach(function(file) {
          promises.push(upload(result, {
            dstBucket: result.srcBucket,
            dstKey: result.dstKeyDir + path.basename(file),
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

  // clean up
  .then(function(result) {
    return execute(result, {
      shell: "rm /tmp/downloads/*; rm /tmp/uploads/*",
      logOutput: true
    });
  })

  .then(function(result) {
    context.done()
  }).fail(function(err) {
    if(err) {
      context.done(err)
    } else {
      context.done(new Error("Unspecifed fail."))
    }
  });

}

