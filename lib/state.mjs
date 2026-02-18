import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

const STATE_FILENAME = '.infra.json';
const SCHEMA_VERSION = 1;

export function getStatePath(cwd) {
  return path.join(cwd, STATE_FILENAME);
}

export function createInitialState({toolName, toolVersion}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    tool: {
      name: toolName,
      version: toolVersion,
    },
    applied: [],
    lastRun: null,
  };
}

export async function loadState({cwd, toolName, toolVersion}) {
  const statePath = getStatePath(cwd);

  try {
    const raw = await readFile(statePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (parsed?.schemaVersion !== SCHEMA_VERSION) {
      return createInitialState({toolName, toolVersion});
    }

    if (!parsed.tool || typeof parsed.tool !== 'object') {
      parsed.tool = {name: toolName, version: toolVersion};
    } else {
      parsed.tool.name ??= toolName;
      parsed.tool.version ??= toolVersion;
    }

    parsed.applied = Array.isArray(parsed.applied) ? parsed.applied : [];
    parsed.lastRun ??= null;

    return parsed;
  } catch (e) {
    if (e && typeof e === 'object' && e.code === 'ENOENT') {
      return createInitialState({toolName, toolVersion});
    }
    throw e;
  }
}

export async function saveState({cwd, state}) {
  const statePath = getStatePath(cwd);
  const raw = JSON.stringify(state, null, 2) + '\n';
  await writeFile(statePath, raw, 'utf8');
}

export function isApplied(state, migrationId) {
  return state.applied.some(entry => entry?.id === migrationId);
}

export function markApplied({state, migrationId, toolVersion, command}) {
  const appliedAt = new Date().toISOString();

  if (!isApplied(state, migrationId)) {
    state.applied.push({id: migrationId, appliedAt});
  }

  state.lastRun = {
    at: appliedAt,
    version: toolVersion,
    command,
  };
}

