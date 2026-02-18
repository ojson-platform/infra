import {mkdtemp, readFile, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {beforeEach, describe, expect, it} from 'vitest';

import {runMigrations} from '../lib/engine.mjs';
import {detectMode} from '../lib/mode.mjs';
import {migrations} from '../migrations/index.mjs';
import {loadState} from '../lib/state.mjs';

const toolName = '@ojson/infra';
const toolVersion = '1.0.0';

function silentLogger() {
  return {info() {}, warn() {}, error() {}};
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch (e) {
    if (e && typeof e === 'object' && e.code === 'ENOENT') return false;
    throw e;
  }
}

async function makeTempDir() {
  return await mkdtemp(path.join(os.tmpdir(), 'ojson-infra-test-'));
}

async function copyFixture(fixtureName, targetDir) {
  const src = new URL(`./fixtures/${fixtureName}/`, import.meta.url);
  const srcPath = fileURLToPath(src);
  const {cp} = await import('node:fs/promises');
  await cp(srcPath, targetDir, {recursive: true});
}

describe('migration engine', () => {
  let cwd;

  beforeEach(async () => {
    cwd = await makeTempDir();
  });

  it('dry-run does not write files or state', async () => {
    await copyFixture('empty-package', cwd);

    const res = await runMigrations({
      cwd,
      migrations,
      toolName,
      toolVersion,
      command: 'migrate',
      logger: silentLogger(),
      options: {dryRun: true, force: false, yes: true, to: null, only: null},
    });

    expect(res.planned.length).toBeGreaterThan(0);
    expect(await exists(path.join(cwd, '.infra.json'))).toBe(false);
    expect(await exists(path.join(cwd, 'eslint.config.js'))).toBe(false);
  });

  it('migrate writes files and state; second run is idempotent', async () => {
    await copyFixture('empty-package', cwd);

    const first = await runMigrations({
      cwd,
      migrations,
      toolName,
      toolVersion,
      command: 'migrate',
      logger: silentLogger(),
      options: {dryRun: false, force: false, yes: true, to: null, only: null},
    });

    expect(await exists(path.join(cwd, '.infra.json'))).toBe(true);
    expect(await exists(path.join(cwd, 'eslint.config.js'))).toBe(true);
    expect(await exists(path.join(cwd, '.github', 'workflows', 'ci.yml'))).toBe(true);
    expect(await exists(path.join(cwd, '.agents', 'core.md'))).toBe(true);
    expect(first.appliedNow).toEqual([
      '0001_add_infra_configs',
      '0002_add_ci_workflow',
      '0003_add_agents_fragments',
    ]);

    const second = await runMigrations({
      cwd,
      migrations,
      toolName,
      toolVersion,
      command: 'migrate',
      logger: silentLogger(),
      options: {dryRun: false, force: false, yes: true, to: null, only: null},
    });

    expect(second.appliedNow).toEqual([]);
  });

  it('does not overwrite existing AGENTS.md outside markers', async () => {
    await copyFixture('existing-agents', cwd);

    await runMigrations({
      cwd,
      migrations,
      toolName,
      toolVersion,
      command: 'migrate',
      logger: silentLogger(),
      options: {
        dryRun: false,
        force: false,
        yes: true,
        to: '0003_add_agents_fragments',
        only: '0003_add_agents_fragments',
      },
    });

    const raw = await readFile(path.join(cwd, 'AGENTS.md'), 'utf8');
    expect(raw).toContain('Some project-specific content.');
    expect(raw).toContain('<!-- OJSON_INFRA_AGENTS:BEGIN -->');
    expect(raw).toContain('<!-- OJSON_INFRA_AGENTS:END -->');
  });

  it('force overwrites managed files', async () => {
    await copyFixture('empty-package', cwd);

    const {writeFile} = await import('node:fs/promises');
    await writeFile(path.join(cwd, 'eslint.config.js'), 'custom\n', 'utf8');

    await runMigrations({
      cwd,
      migrations,
      toolName,
      toolVersion,
      command: 'migrate',
      logger: silentLogger(),
      options: {
        dryRun: false,
        force: true,
        yes: true,
        to: '0001_add_infra_configs',
        only: '0001_add_infra_configs',
      },
    });

    const raw = await readFile(path.join(cwd, 'eslint.config.js'), 'utf8');
    expect(raw).toContain('@ojson/infra/eslint');
  });
});

describe('mode detection', () => {
  it('detects standalone by default', async () => {
    const cwd = await makeTempDir();
    const mode = await detectMode(cwd);
    expect(mode.mode).toBe('standalone');
  });

  it('detects metapackage when workspace markers exist', async () => {
    const root = await makeTempDir();
    const {mkdir, writeFile} = await import('node:fs/promises');

    await writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n', 'utf8');
    await writeFile(path.join(root, '.gitmodules'), '', 'utf8');
    await mkdir(path.join(root, 'packages', 'x'), {recursive: true});

    const mode = await detectMode(path.join(root, 'packages', 'x'));
    expect(mode.mode).toBe('metapackage');
    expect(mode.rootDir).toBe(root);
  });
});

describe('state loader', () => {
  it('creates initial state when missing', async () => {
    const cwd = await makeTempDir();
    const state = await loadState({cwd, toolName, toolVersion});
    expect(state.schemaVersion).toBe(1);
    expect(state.applied).toEqual([]);
  });
});

