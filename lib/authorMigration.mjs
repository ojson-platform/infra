import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

function slugify(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, {recursive: true});
}

async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function nextMigrationId(existingIds, title) {
  const max = existingIds.reduce((acc, id) => {
    const n = Number.parseInt(id.slice(0, 4), 10);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);

  const next = String(max + 1).padStart(4, '0');
  const slug = slugify(title) || 'migration';
  return `${next}_${slug}`;
}

function migrationTemplate({id, title}) {
  return `import path from 'node:path';
\nimport {writeTextFile} from '../lib/fileOps.mjs';
\n\nconst id = ${JSON.stringify(id)};
\n\nexport default {\n  id,\n  title: ${JSON.stringify(title)},\n  description: 'TODO: describe why this migration exists',\n  async apply({cwd, options}) {\n    const dryRun = Boolean(options.dryRun);\n    const mode = options.force ? 'overwrite' : 'skip';\n\n    // TODO: implement migration operations\n    // Example:\n    // return [\n    //   await writeTextFile({\n    //     filePath: path.join(cwd, 'some-file.txt'),\n    //     content: '...',\n    //     mode,\n    //     dryRun,\n    //   }),\n    // ];\n\n    return [];\n  },\n};\n`;
}

function changelogEntryTemplate({id, title}) {
  return `\n## ${id}\n\n- **Title**: ${title}\n- **Changes**:\n  - TODO\n- **Notes**:\n  - TODO (overwrite behavior, compat, etc.)\n`;
}

function testTemplate({id}) {
  return `import {describe, it, expect} from 'vitest';\n\n// Skeleton test for migration ${id}\n// Prefer integration-style tests using fixtures and running the engine.\n\ndescribe('${id}', () => {\n  it.todo('applies cleanly and is idempotent');\n\n  it('placeholder', () => {\n    expect(true).toBe(true);\n  });\n});\n`;
}

function updateIndex({raw, id}) {
  const importName = id.replace(/[^a-zA-Z0-9]/g, '_');
  const importLine = `import ${importName} from './${id}.mjs';\n`;

  if (raw.includes(`'./${id}.mjs'`)) return raw;

  const exportIdx = raw.indexOf('export const migrations');
  if (exportIdx === -1) throw new Error('migrations/index.mjs: cannot find export const migrations');

  const beforeExport = raw.slice(0, exportIdx);
  const afterExport = raw.slice(exportIdx);

  const withImport = beforeExport + importLine + afterExport;

  const arrStart = withImport.indexOf('export const migrations');
  const arrEnd = withImport.indexOf('];', arrStart);
  if (arrEnd === -1) throw new Error('migrations/index.mjs: cannot find end of migrations array');

  const insertPos = arrEnd;
  const updated =
    withImport.slice(0, insertPos) + `, ${importName}` + withImport.slice(insertPos);

  return updated;
}

export async function authorMigration({cwd, title, log}) {
  const pkgPath = path.join(cwd, 'package.json');
  const pkg = await readJson(pkgPath);
  if (pkg.name !== '@ojson/infra') {
    throw new Error('author-migration must be run from the @ojson/infra package root');
  }

  const migrationsDir = path.join(cwd, 'migrations');
  await ensureDir(migrationsDir);

  const entries = await readdir(migrationsDir);
  const existingIds = entries
    .filter(f => /^\d{4}_.+\.mjs$/.test(f))
    .map(f => f.replace(/\.mjs$/, ''));

  const id = nextMigrationId(existingIds, title);

  const migrationPath = path.join(migrationsDir, `${id}.mjs`);
  await writeFile(migrationPath, migrationTemplate({id, title}), 'utf8');

  const indexPath = path.join(migrationsDir, 'index.mjs');
  const indexRaw = await readFile(indexPath, 'utf8');
  const indexUpdated = updateIndex({raw: indexRaw, id});
  await writeFile(indexPath, indexUpdated, 'utf8');

  const changelogPath = path.join(cwd, 'CHANGELOG.md');
  let changelogRaw = '';
  try {
    changelogRaw = await readFile(changelogPath, 'utf8');
  } catch (e) {
    if (!(e && typeof e === 'object' && e.code === 'ENOENT')) throw e;
    changelogRaw = '# Changelog\n\n';
  }
  await writeFile(changelogPath, changelogRaw + changelogEntryTemplate({id, title}), 'utf8');

  const testsDir = path.join(cwd, 'test', 'migrations');
  await ensureDir(testsDir);
  const testPath = path.join(testsDir, `${id}.spec.mjs`);
  await writeFile(testPath, testTemplate({id}), 'utf8');

  log.info(`Created migration: ${id}`);
  log.info(`- ${path.relative(cwd, migrationPath)}`);
  log.info(`- ${path.relative(cwd, testPath)}`);
  log.info('Checklist:');
  log.info('- Implement apply() with idempotent operations');
  log.info('- Add/adjust tests (fixtures + migrate engine)');
  log.info('- Update CHANGELOG.md entry');
}

