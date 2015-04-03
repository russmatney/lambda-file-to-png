var Q = require('q');
var path = require('path');
var execute = require('lambduh-execute');
var transformS3Event = require('lambduh-transform-s3-event');
var validate = require('lambduh-validate');
var download = require('lambduh-get-s3-object');

var pathToRenamePngs = './bin/rename-pngs.sh';
var pathToFileToPng = "./bin/file-to-png.sh";
var pathToFilesToPngs = "./bin/files-to-pngs.sh";

exports.handler = function(event, context) {
  // gif or jpg has just been uploaded - is specifed in event
  //
  // Create timelapse func will use these 3 steps as well:
  //   download all "pngs_for_timelapse_zip_[timestamp]" zips for the key
  //   unpack them all
  //   mv them all to shared folder (merge)
  //
  // convert gif/jpg into pngs
  // zip 'merge' folder
  // upload as new zip[timestamp]
  // delete whatever "zip_[timestamp]" were downloaded

  var start = new Date();
  var result = {};

  transformS3Event(result, event)

    .then(function(result) {
      console.log('Validating S3 event.');
      console.log(result);
      return validate(result, {
        "srcKey": {
          endsWith: "\\.(jpg|gif)",
          endsWithout: "_\\d+\\.gif",
          startsWith: "events/"
        }
      });
    })

    .then(function(result) {
      return execute(result, {
        shell: 'mkdir -p /tmp/downloaded; ',
        logOutput: true
      });
    })
    .then(function(result) {
      return download(result, {
        srcKey: result.srcKey,
        srcBucket: result.srcBucket,
        downloadFilepath: '/tmp/downloaded/' + path.basename(result.srcKey)
      });
    })

    .then(function(result) {
      //prep binary to be called (on lambda)
      if(!result.downloadFilepath) {
        throw new Error('result expected downloadFilepath');
      }
      return execute(result, {
        bashScript: pathToFileToPng,
        bashParams: [
          result.downloadFilepath
        ],
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

