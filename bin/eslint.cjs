#!/usr/bin/env node
'use strict';

const {runTool} = require('./_tool-runner.cjs');

runTool({
  pkgName: 'eslint',
  binName: 'eslint',
  argv: process.argv.slice(2),
});

