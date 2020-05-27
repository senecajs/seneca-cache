module.exports = Micro

function Micro(opts) {
  var self = {}

  self._expiry = opts.expiry
  self._que = []
  self._last = 0
  self._start = 0
  self._res = null
  self._running = false
  self._stats = {
    hit: 0,
    miss: 0,
    live: 0,
  }

  self.stats = function () {
    return Object.assign(self._stats)
  }

  self.submit = function (action, callback) {
    var now = Date.now()

    // live result
    if (self._res && now - self._last < self._expiry) {
      self._stats.hit++
      self._stats.live++
      annotate(self._res)
      return callback(...self._res)
    }

    // wait for a result
    else if (self._running) {
      self._que.push(callback)
    }

    // execute
    else {
      self._res = null
      self._running = true
      self._start = Date.now()
      self._stats.miss++
      self._que.push(callback)
      action(function (...out) {
        //console.log('AAA',action.name,out)
        //annotate(out)
        //callback(...out)

        self._running = false
        self._res = out
        self._last = Date.now()

        // avoid over count
        self._stats.hit--

        var qc = null
        while ((qc = self._que.shift())) {
          self._stats.hit++
          annotate(self._res)
          qc(...self._res)
        }
      })
    }
  }

  function annotate(res) {
    var mc =
      self._last +
      ';d' +
      (self._last - self._start) +
      ';v' +
      self._stats.live +
      ';m' +
      self._stats.miss +
      ';h' +
      self._stats.hit

    //console.log('RES',res)
    res.forEach((o) => o && (o.mc$ = mc))
  }

  return self
}
