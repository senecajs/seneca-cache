/* Copyright (c) 2012-2019 Richard Rodger, Seamus D'Arcy, and other contributors, MIT License */
'use strict'

var Util = require('util')

var Lab = require('lab')
var Code = require('code')

var Seneca = require('seneca')
var assert = require('assert')
var standard = require('@seneca/cache-test')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = make_it(lab)
var expect = Code.expect

var seneca = Seneca()
  .test()
  .quiet()
  .use('..')

describe('cache', function() {
  it('basic', function(fin) {
    standard.basictest(seneca, fin)
  })

  //var cache = seneca.pin({role: 'cache', cmd: '*'});
  //var lrucache = seneca.pin({role: 'lrucache', cmd: '*'});

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
    seneca.act({role:'lrucache', cmd:'peek',  key: 'x' }, function(err, out) {
      if (err) return fin(err)
      assert.equal(out.value, '10')

      seneca.act({role:'lrucache', cmd:'peek',  key: 'y' }, function(err, out) {
        if (err) return fin(err)
        assert.equal(out.value, 20)

        fin()
      })
    })
  })

  it('has', function(fin) {
    seneca.act({role:'lrucache', cmd:'has',  key: 'x' }, function(err, out) {
      if (err) return fin(err)
      assert(out)
      fin()
    })
  })

  it('keys', function(fin) {
    seneca.act({role:'lrucache', cmd:'keys', }, function(err, out) {
      if (err) return fin(err)
      assert.deepEqual(out.keys.sort(), ['x', 'y'])
      fin()
    })
  })

  it('values', function(fin) {
    seneca.act({role:'lrucache', cmd:'values', }, function(err, out) {
      if (err) return fin(err)
      assert.deepEqual(out.values.sort(), ['10', 20])
      fin()
    })
  })

  it('reset', function(fin) {
    seneca.act({role:'lrucache', cmd:'reset', }, function(err, out) {
      if (err) return fin(err)
      seneca.act({role:'lrucache', cmd:'keys', }, function(err, out) {
        if (err) return fin(err)
        assert.equal(out.keys.length, 0)
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
