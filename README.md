# seneca-cache

### Node.js Seneca in-memory caching module.

This module is a plugin for the [Seneca framework](http://senecajs.org). It provides a set of common caching actions (`get`, `set` etc.), backed by [lru-cache](https://github.com/isaacs/node-lru-cache).
It also exposes some lru-cache specific actions (`peek`, `has`, `keys`, `values`, `reset`).

By moving cache operations into Seneca, you can change your cache implementation or business rules at a later point.
For example, you might decide to send certain kinds of keys to a different cache mechanism, such as redis.

Current Version: 0.1.2

Tested on: Seneca 0.5.21, Node 0.10.31

[![Build Status](https://travis-ci.org/darsee/seneca-cache.png?branch=master)](https://travis-ci.org/darsee/seneca-cache)


### Quick example

This code snippet sets a value and then retrieves it.

```JavaScript
var seneca = require('seneca')();
seneca.use('cache');

seneca.ready(function(err) {
  seneca.act({role: 'cache', cmd: 'set', key: 'k1', val: 'v1'}, function(err) {
    seneca.act({role: 'cache', cmd: 'get', key: 'k1'}, function(err, out) {
      console.log('value = ' + out)
    });
  });
});
```

The full action argument pattern can be a bit tedious, so use a Seneca _pin_ to make things more convenient:

```JavaScript
var cache = seneca.pin({role:'cache', cmd:'*'});

cache.set({key: 'k1', val: 'v1'}, function(err) {
  cache.get({key:'k1'}, function(err, out) {
    console.log('value = ' + out);
  });
});
```
## Install

```sh
npm install seneca
npm install seneca-cache
```

## Common Cache API

Seneca has a common caching API with the following actions:

   * `role:cache, cmd:set` store a value - _key_ and _val_ arguments required
   * `role:cache, cmd:get` retreive a value - _key_ argument is required
   * `role:cache, cmd:add` store a value, only if the key does not exist - _key_ and _val_ arguments required
   * `role:cache, cmd:delete` delete a value - _key_ argument is required, no error if key does not exist
   * `role:cache, cmd:incr` increment a value - _key_ and _val_ (integer) arguments required
   * `role:cache, cmd:decr` decrement a value - _key_ and _val_ (integer) arguments required

All caching plugins, including this one, implement this action API.

### Options

You can use any of the options from the [lru-cache](https://github.com/isaacs/node-lru-cache) module directly as options to this plugin:

```JavaScript
seneca.use('cached', {
  lrucache: {
    max: 1000,
    maxAge: 1000 * 60 * 60,
    length: function(n) {return n.length}
  }
});
```
## Test

```bash
mocha test/cache.test.js
```

