var Q = require('q');
var execute = require('lambduh-execute');

var pathToRenamePngs = './bin/rename-pngs.sh';
var pathToFileToPng = "./bin/file-to-png.sh";
var pathToFilesToPngs = "./bin/files-to-pngs.sh";

exports.handler = function(event, context) {
  var start = new Date();

  var result = {};
  execute(result, {
    shell: 'echo "hi there"',
    logOutput: true
  }).then(function(result) {
    context.done()
  }).fail(function(err) {
    if(err) {
      context.done(err)
    } else {
      context.done(new Error("Unspecifed fail."))
    }
  });
}

