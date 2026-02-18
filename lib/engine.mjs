import {assertValidMigration, sortMigrations} from './migration.mjs';
import {markApplied, loadState, saveState} from './state.mjs';

export function planMigrations({migrations, state, onlyId, toId}) {
  const sorted = sortMigrations(migrations);
  sorted.forEach(assertValidMigration);

  let planned = sorted.filter(m => !state.applied.some(a => a?.id === m.id));

  if (onlyId) {
    planned = planned.filter(m => m.id === onlyId);
  }

  if (toId) {
    planned = planned.filter(m => m.id.localeCompare(toId) <= 0);
  }

  return planned;
}

export async function runMigrations({
  cwd,
  migrations,
  toolName,
  toolVersion,
  command,
  logger,
  options,
}) {
  const state = await loadState({cwd, toolName, toolVersion});
  const planned = planMigrations({
    migrations,
    state,
    onlyId: options.only ?? null,
    toId: options.to ?? null,
  });

  const results = [];

  for (const migration of planned) {
    logger.info(`Applying ${migration.id}: ${migration.title}`);

    const ops = await migration.apply({
      cwd,
      logger,
      options,
      state,
      migration,
    });

    results.push({id: migration.id, ops: Array.isArray(ops) ? ops : []});

    if (!options.dryRun) {
      markApplied({state, migrationId: migration.id, toolVersion, command});
      await saveState({cwd, state});
    }
  }

  return {
    planned: planned.map(m => m.id),
    appliedNow: planned.map(m => m.id),
    state,
    results,
  };
}

