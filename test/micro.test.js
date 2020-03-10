/* Copyright (c) 2012-2020 Richard Rodger, Seamus D'Arcy, and other contributors, MIT License */
'use strict'

const Util = require('util')

const FakeTimers = require("@sinonjs/fake-timers")
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const describe = lab.describe
const it = lab.it
 
const Micro = require('../lib/micro')
const Seneca = require('seneca')

describe('micro', function() {
  it('happy', async () =>{
    const clock = FakeTimers.install()

    return new Promise((r,j)=>{
      var log = []
      // expiry is from first reply
      var m0 = new Micro({expiry:20})
      
      // initial, will be called
      m0.submit(
        function a0(cb) {
          log.push('a')
          setTimeout(()=>cb(0,1,2,3),20)
        },
        function cb0(...res) {
          log.push('ar'+Date.now())
          //console.log('m0 res 1', res, m0)
          expect(res).equal([0,1,2,3])
          expect(m0).contains({
            _expiry: 20,
            _res: [ 0, 1, 2, 3 ],
            _running: false,
          })
          // cb1,cb2 waiting
          expect(m0._que.map(f=>f.name).join(',')).equals('cb1,cb2')
        }
      )
      
      //console.log('m0 A', m0)
      expect(m0).contains({
        _expiry: 20,
        _res: null,
        _running: true, // a0 running
      })

      // cb0 still waiting
      expect(m0._que.map(f=>f.name).join(',')).equals('cb0')
      
      setTimeout(()=>{
        expect(m0).contains({
          _expiry: 20,
          _res: null,
          _running: true, // a0 still running
        })
      },10)
            
      m0.submit(
        function a1(cb) {
          // should not be called
          log.push('b')
          Code.fail()
        },
        function cb1(...res) {
          log.push('br'+Date.now())
          expect(Date.now()).equal(20) // called immediately after cb0
          //console.log('m0 res cb1', res, m0)
          expect(res).equal([0,1,2,3])
          expect(m0).contains({
            _expiry: 20,
            _res: [ 0, 1, 2, 3 ],
            _running: false, // false as can only be called after running complete
          })
          // cb2 next
          expect(m0._que.map(f=>f.name).join(',')).equals('cb2')
        }
      )

      //console.log('m0 B', m0)
      expect(m0).contains({
        _expiry: 20,
        _res: null,
        _running: true, // a0 running
      })

      // cb0 still waiting, cb1 now also waiting
      expect(m0._que.map(f=>f.name).join(',')).equals('cb0,cb1')


      // within wait period of first call
      setTimeout(()=>{
        m0.submit(
          function a2(cb) {
            // should not be called
            log.push('c')
            Code.fail()
          },
          function cb2(...res) {
            log.push('cr'+Date.now())
            // console.log('m0 res cb2', res, m0)
            expect(res).equal([0,1,2,3])
            expect(m0).contains({
              _expiry: 20,
              _res: [ 0, 1, 2, 3 ],
              _running: false, // false as can only be called after running complete
            })
            expect(m0._que.map(f=>f.name).join(',')).equals('')
          }
        )
      },10)


      // after wait period of first call, but before expiry
      setTimeout(()=>{
        m0.submit(
          function a3(cb) {
            // should not be called
            log.push('d')
            Code.fail()
          },
          function cb3(...res) {
            log.push('dr'+Date.now())
            // console.log('m0 res cb2', res, m0)
            expect(res).equal([0,1,2,3])
            expect(m0).contains({
              _expiry: 20,
              _res: [ 0, 1, 2, 3 ],
              _running: false, // false as can only be called after running complete
            })
            expect(m0._que.map(f=>f.name).join(',')).equals('')
          }
        )
      },30)

      // after expiry
      setTimeout(()=>{
        m0.submit(
          function a4(cb) {
            // should be called
            log.push('e')
            setTimeout(()=>cb(4,5,6,7),20)
          },
          function cb4(...res) {
            log.push('er'+Date.now())
            // console.log('m0 res cb2', res, m0)
            expect(res).equal([4,5,6,7])
            expect(m0).contains({
              _expiry: 20,
              _res: [ 4, 5, 6, 7 ],
              _running: false, // false as can only be called after running complete
            })
            expect(m0._que.map(f=>f.name).join(',')).equals('cb5')
          }
        )

        m0.submit(
          function a5(cb) {
            // should not be called
            log.push('f')
            Code.fail()
          },
          function cb5(...res) {
            log.push('fr'+Date.now())
            expect(res).equal([ 4, 5, 6, 7 ])
            expect(m0).contains({
              _expiry: 20,
              _res: [ 4, 5, 6, 7 ],
              _running: false, // false as can only be called after running complete
            })
            // cb2 next
            expect(m0._que.map(f=>f.name).join(',')).equals('')
          }
        )
      },50)


      // after expiry, again
      setTimeout(()=>{
        m0.submit(
          function a6(cb) {
            // should be called
            log.push('g')
            setTimeout(()=>cb(),20)
          },
          function cb6(...res) {
            log.push('gr'+Date.now())
            expect(res).equal([])
            expect(m0).contains({
              _expiry: 20,
              _res: [],
              _running: false, // false as can only be called after running complete
            })
            expect(m0._que.map(f=>f.name).join(',')).equals('cb7')
          }
        )

        m0.submit(
          function a7(cb) {
            // should not be called
            log.push('h')
            Code.fail()
          },
          function cb7(...res) {
            log.push('hr'+Date.now())
            expect(res).equal([])
            expect(m0).contains({
              _expiry: 20,
              _res: [],
              _running: false, // false as can only be called after running complete
            })
            expect(m0._que.map(f=>f.name).join(',')).equals('')
          }
        )
      },90)


      // explicit nulls
      setTimeout(()=>{
        m0.submit(
          function a8(cb) {
            // should be called
            log.push('i')
            setTimeout(()=>cb(null,null),20)
          },
          function cb8(...res) {
            log.push('ir'+Date.now())
            expect(res).equal([null,null])
            expect(m0).contains({
              _expiry: 20,
              _res: [null,null],
              _running: false, // false as can only be called after running complete
            })
            expect(m0._que.map(f=>f.name).join(',')).equals('cb9')
          }
        )

        m0.submit(
          function a9(cb) {
            // should not be called
            log.push('j')
            Code.fail()
          },
          function cb9(...res) {
            log.push('ij'+Date.now())
            expect(res).equal([null,null])
            expect(m0).contains({
              _expiry: 20,
              _res: [null,null],
              _running: false, // false as can only be called after running complete
            })
            expect(m0._que.map(f=>f.name).join(',')).equals('')
          }
        )
      },130)



      for(var t = 0; t < 999; t++) {
        clock.nextAsync()
      }
      
      setTimeout(()=>{
        expect(log.join(','))
          .equal('a,ar20,br20,cr20,dr30,e,er70,fr70,g,gr110,hr110,i,ir150,ij150')

        expect(m0.stats()).equal({hit:6,miss:4,live:1})

        r()
        clock.uninstall()
      },999)
    })
  })


  it('action', async ()=>{
    var si = make_seneca()

    var aC = 0
    
    si.message('a:1', async function a1(msg) {
      return {a:1,d:Date.now(),c:aC++}
    })

    var m0 = await si.post('role:cache,cmd:micro', {
      pin: 'a:1', pins:'ignored', expiry:10
    })
    expect(m0.pins).equal([{a:1}])
    expect(si.find('a:1').priorpath).equals('a1_13;')

    var a1o0 = await si.post('a:1')
    //console.log(a1o0)
    expect(a1o0).contains({a:1,c:0})
    
    var a1o1 = await si.post('a:1')
    //console.log('AAA',a1o1)
    expect(a1o1).contains({a:1,c:0})
    expect(a1o1.mc$).string()

    setTimeout(async ()=>{
      var a1o2 = await si.post('a:1')
      // console.log(a1o1)
      expect(a1o2).contains({a:1,c:1}) // did not cache
      expect(a1o2.d-a1o1.d).above(20)
    },30)
    

    var m1 = await si.post('role:cache,cmd:micro', {
      pins: 'b:1;c:2'
    })
    expect(m1.pins).equal([{b:1},{c:2}])

    var m2 = await si.post('role:cache,cmd:micro', {
      pin: [{d:1},{e:2}]
    })
    expect(m2.pins).equal([{d:1},{e:2}])

    var m3 = await si.post('role:cache,cmd:micro', {
      pins: {f:2}
    })
    expect(m3.pins).equal([{f:2}])
    
    return new Promise(r=>setTimeout(async ()=>{
      var stats = await si.post('role:cache,cmd:micro,get:stats')

      // console.log(stats)
      expect(stats[0]).equal({
        pin: 'a:1',
        hit: 1,
        miss: 2,
        live: 1,
        total: 3,
        hr: 0.3333333333333333,
        lr: 0.3333333333333333
      })
      
      r()
    },222))
  })
})


function make_seneca() {
  return Seneca({legacy:false})
    .test()
    .use('promisify')
    .use('..')
}
