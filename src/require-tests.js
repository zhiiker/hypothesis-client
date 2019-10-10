'use strict';

// Load test modules.
//
// The `require-globify` package expands the `require` call below into one
// `require` call per test module.
require('./**/test/*-test.{coffee,js}', { mode: 'expand' });
