/* Copyright (c) 2014 Seamus D'Arcy */
"use strict";

var LRU = require('lru-cache');

module.exports = function(options, register) {
  var seneca = this;

  options = seneca.util.deepextend({
    cache: {
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
    cb(null, {key: key});
  };

  cmds.get = function(args, cb) {
    var key = args.key;
    var val = cache.get(key);
    cb(null, {val: val});
  };

  cmds.add = function(args, cb) {
    var key = args.key;
    var val = args.val;
    if (!cache.has(key)) {
      cache.set(key, val);
    }
    cb(null, {key: key});
  };

  cmds.delete = function(args, cb) {
    cache.del(args.key);
    cb(null, {key: args.key});
  };

  cmds.incr = function(args, cb) {
    var key = args.key;
    var val = args.val;

    if (!cache.has(key)) {
      return cb(new Error('incr failed - key ' + key + ' does not exist'));
    }

    var oldVal = cache.get(key);
    if (typeof oldVal !== 'number') {
      return cb(new Error('incr failed - value for key ' + key + ' is not a number'));
    }
    var newVal = oldVal + 1;
    cache.set(key, newVal);
    cb(null, {val: newVal});
  };

  cmds.decr = function(args, cb) {
    var key = args.key;
    var val = args.val;

    if (!cache.has(key)) {
      return cb(new Error('decr failed - key ' + key + ' does not exist'));
    }

    var oldVal = cache.get(key);
    if (typeof oldVal !== 'number') {
     return cb(new Error('decr failed - value for key ' + key + ' is not a number'));
    }
    var newVal = oldVal - 1;
    cache.set(key, newVal);
    cb(null, {val: newVal});
  };

  cmds.peek = function(args, cb) {
    var val = cache.peek(args.key);
    cb(null, {val: val});
  };

  cmds.reset = function(cb) {
    cache.reset();
    cb(null);
  };

  cmds.has = function(args, cb) {
    var has = cache.has(args.key);
    cb(null, {has: has});
  };

  cmds.keys = function(args, cb) {
    var keys = cache.keys();
    cb(null, {keys: keys});
  };

  cmds.values = function(args, cb) {
    var values = cache.values();
    cb(null, {values: values});
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
    cache = LRU(options.cache);
    done();
  });

  register(null, {name: name});

};
