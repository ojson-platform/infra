#!/usr/bin/env node
'use strict';

const {runTool} = require('./_tool-runner.cjs');

runTool({
  pkgName: 'prettier',
  binName: 'prettier',
  argv: process.argv.slice(2),
});

