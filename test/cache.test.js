/* Copyright (c) 2014 Seamus D'Arcy */
/*global describe, it */
"use strict";

var seneca = require('seneca')({log:'silent'});
seneca.use('..');

var assert = require('assert');

var standard = require('seneca-cache-test')

describe('cache', function() {

  it('basic',function(done){
    standard.basictest(seneca,done)
  })


  var cache = seneca.pin({role: 'cache', cmd: '*'});
  var lrucache = seneca.pin({role: 'lrucache', cmd: '*'});


  it('set', function(fin) {
    cache.set({key: 'x', val: '10'}, function(err, out) {
      if(err) return fin(err);

      cache.set({key: 'y', val: 20}, function(err, out) {
        fin(err);
      })
    })
  })


  it('peek', function(fin) {
    lrucache.peek({key: 'x'}, function(err, out) {
      if(err) return fin(err);
      assert.equal(out, '10');

      lrucache.peek({key: 'y'}, function(err, out) {
        if(err) return fin(err);
        assert.equal(out, 20);

        fin();
      });
    });
  });


  it('has', function(fin) {
    lrucache.has({key: 'x'}, function(err, out) {
      if(err) return fin(err);
      assert(out);
      fin();
    });
  });


  it('keys', function(fin) {
    lrucache.keys({}, function(err, out) {
      if(err) return fin(err);
      assert.deepEqual(out.sort(), ['x', 'y']);
      fin();
    });
  });


  it('values', function(fin) {
    lrucache.values({}, function(err, out) {
      if(err) return fin(err);
      assert.deepEqual(out.sort(), ['10', 20]);
      fin();
    });
  });

  it('reset', function(fin) {
    lrucache.reset({}, function(err, out) {
      if(err) return fin(err);
      lrucache.keys({}, function(err, out) {
        if(err) return fin(err);
        assert.equal(out.length, 0);
        fin();
      });
    });
  });


});
