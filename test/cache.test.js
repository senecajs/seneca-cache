'use strict'

var seneca = require('seneca')({log: 'silent'})
seneca.use('..')

var Lab = require('lab')
var Code = require('code')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var expect = Code.expect

var Standard = require('seneca-cache-test')

describe('cache', function () {
  it('basic', function (done) {
    Standard.basictest(seneca, done)
  })


  var cache = seneca.pin({role: 'cache', cmd: '*'})
  var lrucache = seneca.pin({role: 'lrucache', cmd: '*'})


  it('set', function (fin) {
    cache.set({key: 'x', val: '10'}, function (err, out) {
      if (err) return fin(err)

      cache.set({key: 'y', val: 20}, function (err, out) {
        fin(err)
      })
    })
  })


  it('peek', function (fin) {
    lrucache.peek({key: 'x'}, function (err, out) {
      if (err) return fin(err)
      expect(out).to.equal('10')

      lrucache.peek({key: 'y'}, function (err, out) {
        if (err) return fin(err)
        expect(out).to.equal(20)

        fin()
      })
    })
  })


  it('has', function (fin) {
    lrucache.has({key: 'x'}, function (err, out) {
      if (err) return fin(err)
      expect(out)
      fin()
    })
  })


  it('keys', function (fin) {
    lrucache.keys({}, function (err, out) {
      if (err) return fin(err)
      expect(out).to.include(['x', 'y'])
      expect(out).to.have.length(2)
      fin()
    })
  })


  it('values', function (fin) {
    lrucache.values({}, function (err, out) {
      if (err) return fin(err)
      expect(out).to.include(['10', 20])
      expect(out).to.have.length(2)
      fin()
    })
  })

  it('reset', function (fin) {
    lrucache.reset({}, function (err, out) {
      if (err) return fin(err)
      lrucache.keys({}, function (err, out) {
        if (err) return fin(err)
        expect(out.length).to.equal(0)
        fin()
      })
    })
  })
})
