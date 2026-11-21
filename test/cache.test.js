/* Copyright (c) 2012-2026 Richard Rodger, Seamus D'Arcy, and other contributors, MIT License */
'use strict'

const { describe, it, after } = require('node:test')
const Assert = require('node:assert')

const Code = require('@hapi/code')
const expect = Code.expect

const PluginValidator = require('seneca-plugin-validator')
const Seneca = require('seneca')
const Plugin = require('..')

const standard = require('@seneca/cache-test')

const seneca = Seneca().test().quiet().use(Plugin)

after(() => seneca.close())

it('validate', PluginValidator(Plugin, module))

describe('cache', function () {
  it('basic', function (t, fin) {
    standard.basictest(seneca, fin)
  })

  it('errors', async () => {
    await seneca.post('role:cache,cmd:set,key:e0,val:0')

    try {
      await seneca.post('role:cache,cmd:incr,key:e0,incr:a')
      Code.fail()
    } catch (e) {
      expect(e.code).equals('op_failed_nan')
    }

    try {
      await seneca.post('role:cache,cmd:decr,key:e0,incr:a')
      Code.fail()
    } catch (e) {
      expect(e.code).equals('op_failed_nan')
    }

    await seneca.post('role:cache,cmd:set,key:e1,val:a')

    try {
      await seneca.post('role:cache,cmd:incr,key:e1', { val: 2 })
      Code.fail()
    } catch (e) {
      expect(e.code).equals('op_failed_nan')
    }
  })

  it('set', function (t, fin) {
    seneca.act(
      { role: 'cache', cmd: 'set', key: 'x', val: '10' },
      function (err, out) {
        if (err) return fin(err)

        seneca.act(
          { role: 'cache', cmd: 'set', key: 'y', val: 20 },
          function (err, out) {
            fin(err)
          }
        )
      }
    )
  })

  it('peek', function (t, fin) {
    seneca.act(
      { role: 'lrucache', cmd: 'peek', key: 'x' },
      function (err, out) {
        if (err) return fin(err)
        Assert.equal(out.value, '10')

        seneca.act(
          { role: 'lrucache', cmd: 'peek', key: 'y' },
          function (err, out) {
            if (err) return fin(err)
            Assert.equal(out.value, 20)

            fin()
          }
        )
      }
    )
  })

  it('has', function (t, fin) {
    seneca.act({ role: 'lrucache', cmd: 'has', key: 'x' }, function (err, out) {
      if (err) return fin(err)
      Assert(out)
      fin()
    })
  })

  it('keys', async () => {
    var out = await seneca.post({ role: 'lrucache', cmd: 'keys' })
    expect(out.keys.sort()).equal(['e0', 'e1', 'x', 'y'])
  })

  it('values', async () => {
    var out = await seneca.post({ role: 'lrucache', cmd: 'values' })
    expect(out.values.sort()).equal([0, '10', 20, 'a'])
  })

  it('reset', function (t, fin) {
    seneca.act({ role: 'lrucache', cmd: 'reset' }, function (err, out) {
      if (err) return fin(err)
      seneca.act({ role: 'lrucache', cmd: 'keys' }, function (err, out) {
        if (err) return fin(err)
        Assert.equal(out.keys.length, 0)
        fin()
      })
    })
  })
})

describe('options', function () {
  it('lrucache-defaults', async () => {
    const si = Seneca({ legacy: false }).test().quiet().use(Plugin)
    await si.ready()
    const lru = await si.post('role:cache,get:native')
    expect(lru.max).equal(9999)
    expect(lru.maxAge).equal(1000 * 60 * 60)
    await si.close()
  })

  // The lrucache option is passed to lru-cache as it is, so options that
  // the plugin defaults do not name are accepted too.
  it('lrucache-passthrough', async () => {
    const si = Seneca({ legacy: false })
      .test()
      .quiet()
      .use(Plugin, { lrucache: { max: 2, stale: true } })
    await si.ready()

    const lru = await si.post('role:cache,get:native')
    expect(lru.max).equal(2)
    expect(lru.allowStale).equal(true)
    expect(lru.maxAge).equal(1000 * 60 * 60)

    await si.post('role:cache,cmd:set,key:k0,val:a')
    await si.post('role:cache,cmd:set,key:k1,val:b')
    await si.post('role:cache,cmd:set,key:k2,val:c')

    // max is 2, so the least recently used key is evicted.
    const out = await si.post('role:lrucache,cmd:keys')
    expect(out.keys.sort()).equal(['k1', 'k2'])

    await si.close()
  })
})
