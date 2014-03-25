/* Copyright (c) 2014 Seamus D'Arcy */
/*global describe, it */
"use strict";

var seneca = require('seneca')();
seneca.use('..');

var assert = require('assert');

describe('cache', function() {

  var cache = seneca.pin({role: 'cache', cmd: '*'});

  it('set', function(cb) {
    cache.set({key: 'a', val: '1'}, function(err, out) {
      assert.equal(err, null);
      assert(out.key, 'a');
      cb();
    });
  });

  it('get', function(cb) {
    cache.get({key: 'a'}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.val, '1');
      cb();
    });
  });

  it('add', function(cb) {
    cache.add({key: 'b', val: 1}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.key, 'b');
      cb();
    });
  });

  it('won\'t add exsting key', function(cb) {
    cache.add({key: 'b', val: 'something'}, function(err, out) {
      assert(err);
      cache.get({key: 'b'}, function(err, out) {
        assert.equal(out.val, 1);
        cb();
      });
    });
  });

  it('incr', function(cb) {
    cache.incr({key: 'b', val: 4}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.val, 5);
      cb();
    });
  });

  it('decr', function(cb) {
    cache.decr({key: 'b', val: 3}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.val, 2);
      cb();
    });
  });

  it('won\'t incr unless value is an integer', function(cb) {
    cache.incr({key: 'a', val: 1}, function(err, out) {
      assert(err);
      cb();
    });
  });


  it('won\'t decr if value is not an integer', function(cb) {
    cache.decr({key: 'a', val: 1}, function(err, out) {
      assert(err);
      cb();
    });
  });

  it('peek', function(cb) {
    cache.peek({key: 'a'}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.val, '1');
      cb();
    });
  });

  it('has', function(cb) {
    cache.has({key: 'a'}, function(err, out) {
      assert.equal(err, null);
      assert(out.has);
      cb();
    });
  });

  it('keys', function(cb) {
    cache.keys({}, function(err, out) {
      assert.equal(err, null);
      assert.deepEqual(out.keys, ['a', 'b']);
      cb();
    });
  });

  it('values', function(cb) {
    cache.values({}, function(err, out) {
      assert.equal(err, null);
      assert.deepEqual(out.values, ['1', 2]);
      cb();
    });
  });

  it('delete', function(cb) {
    cache.delete({key: 'a'}, function(err, out) {
      assert.equal(err, null);
      assert(out.key, 'a');
      cache.has({key: 'a'}, function(err, out) {
        assert.equal(err, null);
        assert.equal(out.has, false);
        cb();
      });
    });
  });

})
