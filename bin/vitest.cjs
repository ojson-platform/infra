#!/usr/bin/env node
'use strict';

const {runTool} = require('./_tool-runner.cjs');

runTool({
  pkgName: 'vitest',
  binName: 'vitest',
  argv: process.argv.slice(2),
});

