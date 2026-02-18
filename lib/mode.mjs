import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (e) {
    if (e && typeof e === 'object' && e.code === 'ENOENT') return false;
    throw e;
  }
}

async function readJsonIfExists(filePath) {
  if (!(await exists(filePath))) return null;
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function findUp(startDir, relativeName, {stopAt} = {}) {
  let dir = path.resolve(startDir);
  const stop = stopAt ? path.resolve(stopAt) : path.parse(dir).root;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(dir, relativeName);
    if (await exists(candidate)) return {dir, path: candidate};

    if (dir === stop) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export async function detectMode(cwd) {
  const workspace = await findUp(cwd, 'pnpm-workspace.yaml');
  const gitmodules = await findUp(cwd, '.gitmodules');

  // Alternative signal: metapackage root package.json
  const rootPkg = workspace ? await readJsonIfExists(path.join(workspace.dir, 'package.json')) : null;
  const isMetapackageRoot = rootPkg?.name === '@ojson/ojson';

  if (workspace && (gitmodules || isMetapackageRoot)) {
    const rootDir = workspace.dir;

    const rel = path.relative(rootDir, cwd).split(path.sep);
    const inKnownArea = rel[0] === 'packages' || rel[0] === 'devops';

    if (inKnownArea) {
      return {mode: 'metapackage', rootDir};
    }
  }

  return {mode: 'standalone', rootDir: null};
}

