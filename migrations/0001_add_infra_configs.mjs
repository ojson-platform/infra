import path from 'node:path';

import {exists, writeTextFile} from '../lib/fileOps.mjs';
import { detectWithModulesConfig } from '../lib/detectWithModules.mjs';

const id = '0001_add_infra_configs';

function contentEslint() {
  return "// ESLint configuration with auto-detection of with-* modules\n// @ojson/infra automatically detects with-* patterns and applies architectural restrictions\nexport { default } from '@ojson/infra/eslint';\n";
}

function contentPrettier() {
  return "export { default } from '@ojson/infra/prettier';\n";
}

function contentVitest() {
  return "export { default } from '@ojson/infra/vitest';\n";
}

function contentTsconfigBase() {
  return (
    JSON.stringify(
      {
        extends: '@ojson/infra/tsconfig/base',
        include: ['src/**/*.ts'],
        exclude: ['**/*.spec.ts', '**/*.test.ts'],
      },
      null,
      2,
    ) + '\n'
  );
}

async function anyExists(cwd, names) {
  for (const name of names) {
    if (await exists(path.join(cwd, name))) return name;
  }
  return null;
}

export default {
  id,
  title: 'Add @ojson/infra config re-exports',
  description:
    'Create config entry points in the package root (eslint, prettier, vitest) that re-export from @ojson/infra. Optionally add a base tsconfig.json extending @ojson/infra. ESLint config now includes auto-detection for with-* modules and applies architectural restrictions automatically.',
  async apply({cwd, options}) {
    const dryRun = Boolean(options.dryRun);
    const mode = options.force ? 'overwrite' : 'skip';

    const ops = [];

    const existingEslint = await anyExists(cwd, ['eslint.config.js', 'eslint.config.mjs']);
    if (existingEslint && !options.force) {
      ops.push({status: 'skipped', filePath: path.join(cwd, 'eslint.config.js'), reason: `exists:${existingEslint}`});
    } else {
      // Detect with-* modules and include information in operation
      const withDetection = detectWithModulesConfig(cwd);
      ops.push(
        await writeTextFile({
          filePath: path.join(cwd, 'eslint.config.js'),
          content: contentEslint(),
          mode,
          dryRun,
        }),
      );
      // Add info about with-* detection to the operation result
      ops[ops.length - 1].withModulesDetected = withDetection.detected;
      ops[ops.length - 1].detectionMessage = withDetection.message;
    }

    const existingPrettier = await anyExists(cwd, [
      'prettier.config.js',
      'prettier.config.mjs',
      '.prettierrc',
      '.prettierrc.json',
      '.prettierrc.js',
      '.prettierrc.cjs',
      '.prettierrc.yaml',
      '.prettierrc.yml',
    ]);
    if (existingPrettier && !options.force) {
      ops.push({status: 'skipped', filePath: path.join(cwd, 'prettier.config.js'), reason: `exists:${existingPrettier}`});
    } else {
      ops.push(
        await writeTextFile({
          filePath: path.join(cwd, 'prettier.config.js'),
          content: contentPrettier(),
          mode,
          dryRun,
        }),
      );
    }

    const existingVitest = await anyExists(cwd, ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mjs']);
    if (existingVitest && !options.force) {
      ops.push({status: 'skipped', filePath: path.join(cwd, 'vitest.config.mjs'), reason: `exists:${existingVitest}`});
    } else {
      ops.push(
        await writeTextFile({
          filePath: path.join(cwd, 'vitest.config.mjs'),
          content: contentVitest(),
          mode,
          dryRun,
        }),
      );
    }

    const existingTsconfig = await anyExists(cwd, ['tsconfig.json']);
    if (existingTsconfig && !options.force) {
      ops.push({status: 'skipped', filePath: path.join(cwd, 'tsconfig.json'), reason: 'exists'});
    } else {
      ops.push(
        await writeTextFile({
          filePath: path.join(cwd, 'tsconfig.json'),
          content: contentTsconfigBase(),
          mode,
          dryRun,
        }),
      );
    }

    return ops;
  },
};

