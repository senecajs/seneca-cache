# Changes

## 5.0.0 2026-11-21

First entry of this change log. Earlier versions are on npm and in the git
history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0`. Seneca 3 users stay
  on `@seneca/cache@4`.
* Node.js 24 or later (`engines.node` `>=24`).
* The `lrucache` option is declared in the plugin defaults as an open
  object. Seneca 4 validates plugin options against the defaults and
  rejects keys they do not name, so `use('@seneca/cache', { lrucache })`
  failed with `invalid_plugin_option`. Any lru-cache 6 option is accepted,
  and `max`, `maxAge` and `length` are checked as a number, a number and a
  function.
* Options are merged by Seneca's option validation instead of the
  deprecated `seneca.util.deepextend` (`SENECA_DEP_UTIL_DEEPEXTEND`).
* The micro-cache parses string pins with `seneca.util.Jsonic`. The plugin
  no longer requires `jsonic`, which it never declared.
* Tests run with `node:test` (was `@hapi/lab` 22, which does not run on
  Node.js 24), `@seneca/cache-test` 3 and `seneca-plugin-validator` 0.7,
  and keep the 100% coverage threshold. `seneca-promisify` and
  `use('promisify')` are removed: Seneca 4 has promises built in.
* `package-lock.json`, `.travis.yml`, the coveralls script and the
  committed coverage report are removed. `CHANGES.md` is published.
