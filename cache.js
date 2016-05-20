'use strict'

var LRU = require('lru-cache')

module.exports = function (options) {
  var seneca = this
  var plugin = 'cache'

  options = seneca.util.deepextend({
    lrucache: {
      max: 9999,
      maxAge: 1000 * 60 * 60,
      length: function (n) { return n.length }
    }
  }, options)


  var cache = LRU(options.lrucache)


  // cache patterns
  seneca.add({role: plugin, cmd: 'set'}, cmd_set)
  seneca.add({role: plugin, cmd: 'get'}, cmd_get)
  seneca.add({role: plugin, cmd: 'add'}, cmd_add)
  seneca.add({role: plugin, cmd: 'delete'}, cmd_delete)
  seneca.add({role: plugin, cmd: 'incr'}, incrdecr('incr'))
  seneca.add({role: plugin, cmd: 'decr'}, incrdecr('decr'))

  seneca.add({role: plugin, get: 'native'}, get_native)

  // lru-cache specific patterns
  seneca.add({role: 'lrucache', cmd: 'peek'}, cmd_peek)
  seneca.add({role: 'lrucache', cmd: 'reset'}, cmd_reset)
  seneca.add({role: 'lrucache', cmd: 'has'}, cmd_has)
  seneca.add({role: 'lrucache', cmd: 'keys'}, cmd_keys)
  seneca.add({role: 'lrucache', cmd: 'values'}, cmd_values)


  function cmd_set (args, done) {
    var key = args.key
    var val = args.val
    cache.set(key, val)
    done(null, key)
  };

  function cmd_get (args, done) {
    var key = args.key
    var val = cache.get(key)
    done(null, val)
  };

  function cmd_add (args, done) {
    var key = args.key
    var val = args.val
    if (!cache.has(key)) {
      cache.set(key, val)
    }
    else return done(new Error('key exists: ' + key))

    done(null, key)
  };

  function cmd_delete (args, done) {
    cache.del(args.key)
    done(null, args.key)
  };


  function incrdecr (kind) {
    return function (args, done) {
      var key = args.key
      var val = args.val

      var oldVal = cache.get(key)
      if (null == oldVal) return done(null)
      if (typeof oldVal !== 'number') {
        return done(new Error(kind + ' failed - value for key ' + key + ' is not a number'))
      }
      var newVal = kind === 'decr' ? oldVal - val : oldVal + val

      cache.set(key, newVal)
      done(null, newVal)
    }
  }


  function get_native (args, done) {
    done(null, cache)
  }

  function cmd_peek (args, done) {
    var val = cache.peek(args.key)
    done(null, val)
  };

  function cmd_reset (args, done) {
    cache.reset()
    done(null)
  };

  function cmd_has (args, done) {
    var has = cache.has(args.key)
    done(null, has)
  };

  function cmd_keys (args, done) {
    var keys = cache.keys()
    done(null, keys)
  };

  function cmd_values (args, done) {
    var values = cache.values()
    done(null, values)
  };

  return {name: plugin}
}
