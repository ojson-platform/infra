#!/usr/bin/env node
import process from 'node:process';

import {migrations} from '../migrations/index.mjs';
import {runMigrations, planMigrations} from '../lib/engine.mjs';
import {getToolMeta} from '../lib/meta.mjs';
import {detectMode} from '../lib/mode.mjs';
import {loadState} from '../lib/state.mjs';
import {authorMigration} from '../lib/authorMigration.mjs';

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift() ?? 'help';

  const options = {
    dryRun: false,
    force: false,
    yes: false,
    to: null,
    only: null,
  };

  const positionals = [];

  while (args.length) {
    const a = args.shift();
    if (a === '--dry-run') options.dryRun = true;
    else if (a === '--force') options.force = true;
    else if (a === '--yes') options.yes = true;
    else if (a === '--to') options.to = args.shift() ?? null;
    else if (a === '--only') options.only = args.shift() ?? null;
    else positionals.push(a);
  }

  return {command, options, positionals};
}

function logger() {
  return {
    info: msg => process.stdout.write(String(msg) + '\n'),
    warn: msg => process.stderr.write(String(msg) + '\n'),
    error: msg => process.stderr.write(String(msg) + '\n'),
  };
}

function printHelp() {
  process.stdout.write(`ojson-infra (from @ojson/infra)

Usage:
  ojson-infra status
  ojson-infra plan [--to <id>] [--only <id>]
  ojson-infra migrate [--dry-run] [--force] [--yes] [--to <id>] [--only <id>]
  ojson-infra init    (alias for migrate)
  ojson-infra author-migration <title>
`);
}

async function cmdStatus({cwd, log, toolName, toolVersion}) {
  const mode = await detectMode(cwd);
  const state = await loadState({cwd, toolName, toolVersion});
  const pending = planMigrations({migrations, state});

  log.info(`Tool: ${toolName}@${toolVersion}`);
  log.info(`CWD: ${cwd}`);
  log.info(`Mode: ${mode.mode}`);
  if (mode.rootDir) log.info(`Metapackage root: ${mode.rootDir}`);
  log.info('');

  log.info(`Applied migrations: ${state.applied.length}`);
  for (const m of state.applied) log.info(`- ${m.id}`);
  log.info('');

  log.info(`Pending migrations: ${pending.length}`);
  for (const m of pending) log.info(`- ${m.id}`);
}

async function cmdPlan({cwd, log, toolName, toolVersion, options}) {
  const state = await loadState({cwd, toolName, toolVersion});
  const planned = planMigrations({migrations, state, onlyId: options.only, toId: options.to});

  if (!planned.length) {
    log.info('No pending migrations.');
    return;
  }

  log.info('Planned migrations:');
  for (const m of planned) log.info(`- ${m.id}: ${m.title}`);
  log.info('');

  const res = await runMigrations({
    cwd,
    migrations,
    toolName,
    toolVersion,
    command: 'plan',
    logger: log,
    options: {...options, dryRun: true},
  });

  for (const r of res.results) {
    for (const op of r.ops) {
      log.info(`${r.id}: ${op.status} ${op.filePath}${op.reason ? ` (${op.reason})` : ''}`);
    }
  }
}

async function cmdMigrate({cwd, log, toolName, toolVersion, options, command}) {
  const res = await runMigrations({
    cwd,
    migrations,
    toolName,
    toolVersion,
    command,
    logger: log,
    options,
  });

  if (!res.planned.length) {
    log.info('No pending migrations.');
    return;
  }

  log.info('');
  log.info('Summary:');
  for (const r of res.results) {
    const counts = r.ops.reduce(
      (acc, op) => {
        acc[op.status] = (acc[op.status] ?? 0) + 1;
        return acc;
      },
      {created: 0, updated: 0, skipped: 0},
    );
    log.info(
      `${r.id}: created=${counts.created ?? 0} updated=${counts.updated ?? 0} skipped=${counts.skipped ?? 0}`,
    );
  }
}

async function main() {
  const {command, options, positionals} = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const log = logger();

  const meta = await getToolMeta();
  const toolName = meta.name;
  const toolVersion = meta.version;

  try {
    if (command === 'help' || command === '--help' || command === '-h') {
      printHelp();
      return;
    }

    if (command === 'status') {
      await cmdStatus({cwd, log, toolName, toolVersion});
      return;
    }

    if (command === 'plan') {
      await cmdPlan({cwd, log, toolName, toolVersion, options});
      return;
    }

    if (command === 'migrate' || command === 'init') {
      await cmdMigrate({cwd, log, toolName, toolVersion, options, command});
      return;
    }

    if (command === 'author-migration') {
      const title = positionals.join(' ').trim();
      if (!title) {
        log.error('author-migration requires a <title>');
        process.exitCode = 1;
        return;
      }
      await authorMigration({cwd, title, log, toolName, toolVersion});
      return;
    }

    printHelp();
    process.exitCode = 1;
  } catch (e) {
    log.error(e?.stack ?? String(e));
    process.exitCode = 1;
  }
}

await main();

