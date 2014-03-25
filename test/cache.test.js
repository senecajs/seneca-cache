/* Copyright (c) 2014 Seamus D'Arcy */
/*global describe, it */
"use strict";

var seneca = require('seneca')();
seneca.use('..');

var assert = require('assert');

describe('cache', function() {

  var cache = seneca.pin({role: 'cache', cmd: '*'});

  it('set', function(cb) {
    cache.set({key: 'one', val: '1'}, function(err, out) {
      assert.equal(err, null);
      assert(out.key, 'a1');
      cb();
    });
  });

  it('get', function(cb) {
    cache.get({key: 'one'}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.val, '1');
      cb();
    });
  });

  it('add', function(cb) {
    cache.add({key: 'two', val: 2}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.key, 'two');
      cb();
    });
  });

  it('won\'t add exsting key', function(cb) {
    cache.add({key: 'two', val: '2a'}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.key, 'two');
      cache.get({key: 'two'}, function(err, out) {
        assert.equal(out.val, '2');
        cb();
      });
    });
  });

  it('incr', function(cb) {
    cache.incr({key: 'two'}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.val, 3);
      cb();
    });
  });

  it('decr', function(cb) {
    cache.decr({key: 'two'}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.val, 2);
      cb();
    });
  });

  it('peek', function(cb) {
    cache.peek({key: 'one'}, function(err, out) {
      assert.equal(err, null);
      assert.equal(out.val, '1');
      cb();
    });
  });

  it('has', function(cb) {
    cache.has({key: 'one'}, function(err, out) {
      assert.equal(err, null);
      assert(out.has);
      cb();
    });
  });

  it('keys', function(cb) {
    cache.keys({}, function(err, out) {
      assert.equal(err, null);
      assert.deepEqual(out.keys, ['two', 'one']);
      cb();
    });
  });

  it('values', function(cb) {
    cache.values({}, function(err, out) {
      assert.equal(err, null);
      assert.deepEqual(out.values, ['2', '1']);
      cb();
    });
  });

  it('delete', function(cb) {
    cache.delete({key: 'one'}, function(err, out) {
      assert.equal(err, null);
      assert(out.key, 'one');
      cache.has({key: 'one'}, function(err, out) {
        assert.equal(err, null);
        assert.equal(out.has, false);
        cb();
      });
    });
  });

})
