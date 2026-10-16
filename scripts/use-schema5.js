/* eslint-env node */
// Test-matrix hook: resolve @colyseus/schema -> schema 5.x and colyseus.js -> @colyseus/sdk 0.18.x
// (installed as npm aliases `schema5` / `sdk018`). Applies to every require, including from inside the sdk,
// so library, tests and sdk share one schema instance.
const Module = require('module');
const redirects = { '@colyseus/schema': 'schema5', 'colyseus.js': 'sdk018' };
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
    return resolve.call(this, redirects[request] ?? request, ...rest);
};
