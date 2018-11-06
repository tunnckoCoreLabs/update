#!/usr/bin/env node

'use strict';

/* eslint-disable promise/always-return */

const proc = require('process');
const mri = require('mri');
const update = require('./index');

const argv = mri(proc.argv.slice(2));

// TODO: make CLI similar to the `charlike` one
// just after the charlike Issue#64

update(argv._[0], argv)
  .then(() => {
    console.log('Updating your project has finished.');
  })
  .catch((err) => {
    console.error(';( Oooh, crap! Some error happened.');
    console.error(argv.verbose ? err.stack : err.message);
    proc.exit(1);
  });
