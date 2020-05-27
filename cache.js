/* Copyright (c) 2014-2020 Richard Rodger, Seamus D'Arcy, and other contributors, MIT License. */
'use strict'

const LRU = require('lru-cache')
const Jsonic = require('jsonic')

const Micro = require('./lib/micro')

module.exports = cache

module.exports.defaults = {
  micro: {
    expiry: 11111, // 10-ish seconds
  },
}

module.exports.errors = {
  key_exists: 'Key <%=key%> exists.',
  op_failed_nan:
    'Operation <%=op%> failed for key <%=key%> as value is not a number: <%=oldVal%>.',
}

function cache(options) {
  var seneca = this
  var plugin = 'cache'

  options = seneca.util.deepextend(
    {
      lrucache: {
        max: 9999,
        maxAge: 1000 * 60 * 60,
        length: function (n) {
          return n.length
        },
      },
    },
    options
  )

  var cache = new LRU(options.lrucache)
  var micro = []

  // cache patterns
  seneca.add({ role: plugin, cmd: 'set' }, cmd_set)
  seneca.add({ role: plugin, cmd: 'get' }, cmd_get)
  seneca.add({ role: plugin, cmd: 'add' }, cmd_add)
  seneca.add({ role: plugin, cmd: 'delete' }, cmd_delete)
  seneca.add({ role: plugin, cmd: 'incr' }, incrdecr('incr'))
  seneca.add({ role: plugin, cmd: 'decr' }, incrdecr('decr'))
  seneca.add({ role: plugin, cmd: 'clear' }, cmd_clear)

  seneca.add({ role: plugin, get: 'native' }, get_native)

  seneca.add({ role: plugin, cmd: 'micro' }, cmd_micro)
  seneca.add({ role: plugin, cmd: 'micro', get: 'stats' }, get_micro_stats)

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
    return function (msg, reply) {
      var key = msg.key
      var val = msg.val

      var oldVal = cache.get(key)
      if (null == oldVal) return reply({ value: false })

      if (typeof oldVal !== 'number') {
        return this.fail('op_failed_nan', {
          op: kind,
          key: key,
          old_val: oldVal,
        })
      }

      if (typeof val !== 'number') {
        return this.fail('op_failed_nan', {
          op: kind,
          key: key,
          delta_val: val,
        })
      }

      var newVal = kind === 'decr' ? oldVal - val : oldVal + val

      cache.set(key, newVal)
      reply({ value: newVal })
    }
  }

  function cmd_clear(msg, reply) {
    cache.reset()
    reply()
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

  function cmd_micro(msg, reply) {
    var seneca = this
    var expiry = msg.expiry || options.micro.expiry
    // TODO: should be provided by Seneca.util
    var pins = msg.pin || msg.pins
    pins = Array.isArray(pins)
      ? pins
      : 'string' === typeof pins
      ? pins.split(';').map((pin) => Jsonic(pin))
      : [Object.assign({}, pins)]

    pins.forEach((pin) => {
      var m = Micro({ expiry: expiry })
      micro.push({ m: m, pin: seneca.util.pattern(pin) })
      seneca.root.wrap(pin, function micro_cache(msg, reply) {
        m.submit(
          (callback) => {
            this.prior(msg, callback)
          },
          (...res) => {
            reply(...res)
          }
        )
      })
    })

    reply({
      pins: pins,
    })
  }

  function get_micro_stats(msg, reply) {
    var stats = []
    micro.forEach((m) => {
      var s = Object.assign({ pin: m.pin }, m.m.stats())
      s.total = s.miss + s.hit
      s.hr = s.hit / s.total
      s.lr = s.live / s.total
      stats.push(s)
    })
    reply(stats)
  }
}
