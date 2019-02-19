/* Copyright (c) 2014-2019 Richard Rodger, Seamus D'Arcy, and other contributors, MIT License. */
'use strict'

var LRU = require('lru-cache')

module.exports = cache
module.exports.errors = {
  key_exists: 'Key <%=key%> exists.',
  op_failed_nan:
    'Operation <%=op%> failed for key <%=key%> as value is not a number: <%=oldVal%>.'
}

function cache(options) {
  var seneca = this
  var plugin = 'cache'

  options = seneca.util.deepextend(
    {
      lrucache: {
        max: 9999,
        maxAge: 1000 * 60 * 60,
        length: function(n) {
          return n.length
        }
      }
    },
    options
  )

  var cache = new LRU(options.lrucache)

  // cache patterns
  seneca.add({ role: plugin, cmd: 'set' }, cmd_set)
  seneca.add({ role: plugin, cmd: 'get' }, cmd_get)
  seneca.add({ role: plugin, cmd: 'add' }, cmd_add)
  seneca.add({ role: plugin, cmd: 'delete' }, cmd_delete)
  seneca.add({ role: plugin, cmd: 'incr' }, incrdecr('incr'))
  seneca.add({ role: plugin, cmd: 'decr' }, incrdecr('decr'))

  seneca.add({ role: plugin, get: 'native' }, get_native)

  // lru-cache specific patterns
  seneca.add({ role: 'lrucache', cmd: 'peek' }, cmd_peek)
  seneca.add({ role: 'lrucache', cmd: 'reset' }, cmd_reset)
  seneca.add({ role: 'lrucache', cmd: 'has' }, cmd_has)
  seneca.add({ role: 'lrucache', cmd: 'keys' }, cmd_keys)
  seneca.add({ role: 'lrucache', cmd: 'values' }, cmd_values)

  function cmd_set(msg, reply) {
    var key = msg.key
    var val = msg.val
    cache.set(key, val)
    reply({ key: key })
  }

  function cmd_get(msg, reply) {
    var key = msg.key
    var val = cache.get(key)
    reply({ value: val })
  }

  function cmd_add(msg, reply) {
    var key = msg.key
    var val = msg.val
    if (!cache.has(key)) {
      cache.set(key, val)
    } else {
      return this.fail('key_exists', { key: key })
    }

    reply({ key: key })
  }

  function cmd_delete(msg, reply) {
    cache.del(msg.key)
    reply({ key: msg.key })
  }

  function incrdecr(kind) {
    return function(msg, reply) {
      var key = msg.key
      var val = msg.val

      if (typeof val !== 'number') {
        return this.fail('op_failed_nan', { op: op, key: key, val: oldVal })
      }

      var oldVal = cache.get(key)
      if (null == oldVal) return reply()

      if (typeof oldVal !== 'number') {
        return this.fail('op_failed_nan', { op: op, key: key, val: oldVal })
      }

      var newVal = kind === 'decr' ? oldVal - val : oldVal + val

      cache.set(key, newVal)
      reply({ value: newVal })
    }
  }

  function get_native(msg, reply) {
    reply(cache)
  }

  function cmd_peek(msg, reply) {
    var val = cache.peek(msg.key)
    reply({ value: val })
  }

  function cmd_reset(msg, reply) {
    cache.reset()
    reply()
  }

  function cmd_has(msg, reply) {
    var has = cache.has(msg.key)
    reply({ has: has })
  }

  function cmd_keys(msg, reply) {
    var keys = cache.keys()
    reply({ keys: keys })
  }

  function cmd_values(msg, reply) {
    var values = cache.values()
    reply({ values: values })
  }

  return { name: plugin }
}
