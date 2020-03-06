/* Copyright (c) 2012-2020 Richard Rodger, Seamus D'Arcy, and other contributors, MIT License */
'use strict'

var Util = require('util')

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const PluginValidator = require('seneca-plugin-validator')
const Seneca = require('seneca')
const Plugin = require('..')

const Assert = require('assert')
var standard = require('@seneca/cache-test')

var describe = lab.describe
var it = make_it(lab)

var seneca = Seneca()
    .use('promisify')
    .test()
    .quiet()
    .use(Plugin)

lab.test(
  'validate',
  PluginValidator(Plugin, module)
)

describe('cache', function() {
  it('basic', function(fin) {
    standard.basictest(seneca, fin)
  })

  lab.it('errors', async () => {
    await seneca.post('role:cache,cmd:set,key:e0,val:0')
    
    try {
      await seneca.post('role:cache,cmd:incr,key:e0,incr:a')
      Code.fail()
    }
    catch(e) {
      expect(e.code).equals('op_failed_nan')
    }

    try {
      await seneca.post('role:cache,cmd:decr,key:e0,incr:a')
      Code.fail()
    }
    catch(e) {
      expect(e.code).equals('op_failed_nan')
    }


    await seneca.post('role:cache,cmd:set,key:e1,val:a')

    try {
      await seneca.post('role:cache,cmd:incr,key:e1',{val:2})
      Code.fail()
    }
    catch(e) {
      expect(e.code).equals('op_failed_nan')
    }
  })
  
  it('set', function(fin) {
    seneca.act({ role: 'cache', cmd: 'set', key: 'x', val: '10' }, function(
      err,
      out
    ) {
      if (err) return fin(err)

      seneca.act({ role: 'cache', cmd: 'set', key: 'y', val: 20 }, function(
        err,
        out
      ) {
        fin(err)
      })
    })
  })

  it('peek', function(fin) {
    seneca.act({ role: 'lrucache', cmd: 'peek', key: 'x' }, function(err, out) {
      if (err) return fin(err)
      Assert.equal(out.value, '10')

      seneca.act({ role: 'lrucache', cmd: 'peek', key: 'y' }, function(
        err,
        out
      ) {
        if (err) return fin(err)
        Assert.equal(out.value, 20)

        fin()
      })
    })
  })

  it('has', function(fin) {
    seneca.act({ role: 'lrucache', cmd: 'has', key: 'x' }, function(err, out) {
      if (err) return fin(err)
      Assert(out)
      fin()
    })
  })

  lab.it('keys', async () => {
    var out = await seneca.post({ role: 'lrucache', cmd: 'keys' })
    expect(out.keys.sort()).equal([ 'e0', 'e1', 'x', 'y' ])
  })

  lab.it('values', async () => {
    var out = await seneca.post({ role: 'lrucache', cmd: 'values' })
    expect(out.values.sort()).equal([ 0, '10', 20, 'a' ])
  })

  it('reset', function(fin) {
    seneca.act({ role: 'lrucache', cmd: 'reset' }, function(err, out) {
      if (err) return fin(err)
      seneca.act({ role: 'lrucache', cmd: 'keys' }, function(err, out) {
        if (err) return fin(err)
        Assert.equal(out.keys.length, 0)
        fin()
      })
    })
  })
})

function make_it(lab) {
  return function it(name, opts, func) {
    if ('function' === typeof opts) {
      func = opts
      opts = {}
    }

    lab.it(
      name,
      opts,
      Util.promisify(function(x, fin) {
        func(fin)
      })
    )
  }
}
