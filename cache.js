/* Copyright (c) 2014 Seamus D'Arcy */
"use strict";

var LRU = require('lru-cache');

module.exports = function(options, register) {
  var seneca = this;

  options = seneca.util.deepextend({
    lrucache: {
      maxAge: 1000 * 60 * 60,
      length: function(n) { return n.length },
    }
  }, options);

  var cmds = {};
  var name = 'cache';
  var role = 'cache';

  var cache;

  cmds.set = function(args, cb) {
    var key = args.key;
    var val = args.val;
    cache.set(key, val);
    cb(null, key);
  };

  cmds.get = function(args, cb) {
    var key = args.key;
    var val = cache.get(key);
    cb(null, val);
  };

  cmds.add = function(args, cb) {
    var key = args.key;
    var val = args.val;
    if (!cache.has(key)) {
      cache.set(key, val);
    }
    cb(null, key);
  };

  cmds.delete = function(args, cb) {
    cache.del(args.key);
    cb(null, args.key);
  };

  function incrdecr(kind) {
    return function(args, cb) {
      var key = args.key;
      var val = args.val;

      var oldVal = cache.get(key);
      if (!oldVal) return cb(null);
      if (typeof oldVal !== 'number') {
        return cb(new Error(kind + ' failed - value for key ' + key + ' is not a number'));
      }
      var newVal = kind === 'decr' ? oldVal - val : oldVal + val;
      cache.set(key, newVal);
      cb(null, newVal);
    }
  }

  cmds.incr = incrdecr('incr');
  cmds.decr = incrdecr('decr');

  cmds.peek = function(args, cb) {
    var val = cache.peek(args.key);
    cb(null, val);
  };

  cmds.reset = function(cb) {
    cache.reset();
    cb(null);
  };

  cmds.has = function(args, cb) {
    var has = cache.has(args.key);
    cb(null, has);
  };

  cmds.keys = function(args, cb) {
    var keys = cache.keys();
    cb(null, keys);
  };

  cmds.values = function(args, cb) {
    var values = cache.values();
    cb(null, values);
  };

  // cache role
  seneca.add({role: role, cmd: 'set'}, cmds.set);
  seneca.add({role: role, cmd: 'get'}, cmds.get);
  seneca.add({role: role, cmd: 'add'}, cmds.add);
  seneca.add({role: role, cmd: 'delete'}, cmds.delete);
  seneca.add({role: role, cmd: 'incr'}, cmds.incr);
  seneca.add({role: role, cmd: 'decr'}, cmds.decr);

  // lru-cache specific
  seneca.add({role: role, cmd: 'peek'}, cmds.peek);
  seneca.add({role: role, cmd: 'reset'}, cmds.reset);
  seneca.add({role: role, cmd: 'has'}, cmds.has);
  seneca.add({role: role, cmd: 'keys'}, cmds.keys);
  seneca.add({role: role, cmd: 'values'}, cmds.values);

  seneca.add({init: name}, function(args, done) {
    cache = LRU(options.lrucache);
    done();
  });

  register(null, {name: name});

};
