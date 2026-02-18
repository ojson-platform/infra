import {readFile} from 'node:fs/promises';

export async function getToolMeta() {
  const pkgUrl = new URL('../package.json', import.meta.url);
  const raw = await readFile(pkgUrl, 'utf8');
  const pkg = JSON.parse(raw);
  return {
    name: pkg.name ?? '@ojson/infra',
    version: pkg.version ?? '0.0.0',
  };
}

