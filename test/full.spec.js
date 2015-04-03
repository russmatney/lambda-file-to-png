var index = require('../');
var expect = require('chai').expect;

describe('files-to-png-zip handler', function() {
  it('should exist', function() {
    expect(index).to.exist;
  });

  it('should have a handler', function() {
    expect(index.handler).to.be.a('function');
  });

  it('should fail when a bad event is handed in', function(done) {
    var event = {};
    var context = {
      done: function(err, message) {
        if (err || message) {
          done();
        } else {
          done(new Error('expected error message'));
        }
      }
    }
    index.handler(event, context);
  });

  it('should call .done(err) when things fail', function(done) {
    var event = {};//TODO: give bad data
    var context = {
      done: function(err, message) {
        if (err || message) {
          done();
        } else {
          done(new Error('expected error message'));
        }
      }
    }
    index.handler(event, context);
  });

  it.only('should call .done() when things go well', function(done) {
    this.timeout(15000);
    var event = require('./test-input.json')
    var context = {
      done: function(err, message) {
        if (err || message) {
          done(err || message);
        } else {
          done();
        }
      }
    }
    index.handler(event, context);
  });

});
