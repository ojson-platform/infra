#!/usr/bin/env node
'use strict';

const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function findUpPackageJson(startDir) {
  let dir = path.resolve(startDir);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, 'package.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function resolvePackageJsonPath(pkgName) {
  try {
    return require.resolve(`${pkgName}/package.json`);
  } catch {
    // Fallback for packages that don't export package.json
    const entry = require.resolve(pkgName);
    const pj = findUpPackageJson(path.dirname(entry));
    if (!pj) throw new Error(`Unable to locate package.json for "${pkgName}" (from: ${entry})`);
    return pj;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveBinRelativePath(pkgJson, binName) {
  const bin = pkgJson?.bin;
  if (!bin) return null;

  if (typeof bin === 'string') return bin;
  if (typeof bin === 'object') {
    return bin[binName] ?? bin[pkgJson.name] ?? null;
  }

  return null;
}

function runTool({pkgName, binName, argv}) {
  const pkgJsonPath = resolvePackageJsonPath(pkgName);
  const pkgRoot = path.dirname(pkgJsonPath);
  const pkgJson = readJson(pkgJsonPath);

  const rel = resolveBinRelativePath(pkgJson, binName);
  if (!rel) {
    throw new Error(
      `Package "${pkgName}" does not expose a usable "bin" entry for "${binName}". bin=${JSON.stringify(pkgJson.bin)}`,
    );
  }

  const cliPath = path.resolve(pkgRoot, rel);

  const child = spawn(process.execPath, [cliPath, ...argv], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', err => {
    // eslint-disable-next-line no-console
    console.error(err?.stack ?? String(err));
    process.exitCode = 1;
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      try {
        process.kill(process.pid, signal);
      } catch {
        process.exit(1);
      }
      return;
    }
    process.exit(code ?? 1);
  });
}

module.exports = {runTool};

