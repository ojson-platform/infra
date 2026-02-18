#!/usr/bin/env node
'use strict';

const {runTool} = require('./_tool-runner.cjs');

// Check if tsconfig has transformers, then use tspc, otherwise use regular tsc
const fs = require('fs');
const path = require('path');

function hasTransformers(tsconfigPath) {
  try {
    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    return content.compilerOptions?.plugins?.some(p => p.transform);
  } catch {
    return false;
  }
}

// Try to find tsconfig.json
const possibleConfigs = [
  path.join(process.cwd(), 'tsconfig.json'),
  path.join(process.cwd(), 'tsconfig.build.json'), 
  path.join(process.cwd(), 'tsconfig.test.json')
];

const hasPlugins = possibleConfigs.some(config => fs.existsSync(config) && hasTransformers(config));

runTool({
  pkgName: hasPlugins ? 'ts-patch' : 'typescript',
  binName: hasPlugins ? 'tspc' : 'tsc',
  argv: process.argv.slice(2),
});