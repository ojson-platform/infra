#!/usr/bin/env node
'use strict';

const {runTool} = require('./_tool-runner.cjs');

runTool({
  pkgName: 'typescript',
  binName: 'tsc',
  argv: process.argv.slice(2),
});

