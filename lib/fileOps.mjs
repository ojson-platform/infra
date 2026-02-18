import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';

export async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (e) {
    if (e && typeof e === 'object' && e.code === 'ENOENT') return false;
    throw e;
  }
}

export async function readText(filePath) {
  return await readFile(filePath, 'utf8');
}

export async function mkdirp(dirPath) {
  await mkdir(dirPath, {recursive: true});
}

export async function writeTextFile({
  filePath,
  content,
  mode = 'skip',
  dryRun = false,
}) {
  const alreadyExists = await exists(filePath);

  if (alreadyExists && mode === 'skip') {
    return {status: 'skipped', filePath, reason: 'exists'};
  }

  if (dryRun) {
    return {status: alreadyExists ? 'updated' : 'created', filePath, dryRun: true};
  }

  await mkdirp(path.dirname(filePath));
  await writeFile(filePath, content, 'utf8');

  return {status: alreadyExists ? 'updated' : 'created', filePath};
}

export async function upsertMarkedSection({
  filePath,
  beginMarker,
  endMarker,
  sectionContent,
  mode = 'skip',
  dryRun = false,
}) {
  const alreadyExists = await exists(filePath);

  if (!alreadyExists) {
    const content = sectionContent.endsWith('\n') ? sectionContent : sectionContent + '\n';
    return await writeTextFile({filePath, content, mode: 'overwrite', dryRun});
  }

  const raw = await readText(filePath);

  const beginIdx = raw.indexOf(beginMarker);
  const endIdx = raw.indexOf(endMarker);

  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    if (mode === 'skip') {
      return {status: 'skipped', filePath, reason: 'no-markers'};
    }

    const updated =
      raw.replace(/\s*$/, '') +
      '\n\n' +
      (sectionContent.endsWith('\n') ? sectionContent : sectionContent + '\n');

    return await writeTextFile({filePath, content: updated, mode: 'overwrite', dryRun});
  }

  const before = raw.slice(0, beginIdx);
  const after = raw.slice(endIdx + endMarker.length);
  const updated =
    before +
    sectionContent +
    after.replace(/^\n?/, '\n'); // keep file readable

  return await writeTextFile({filePath, content: updated, mode: 'overwrite', dryRun});
}

