import path from 'node:path';

import {exists, writeTextFile} from '../lib/fileOps.mjs';

const id = '0002_add_ci_workflow';

function workflowYaml() {
  return `name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20.x

      - name: Enable pnpm
        run: corepack enable && corepack prepare pnpm@10.30.0 --activate

      - name: Install dependencies
        run: |
          if [ -f pnpm-lock.yaml ]; then
            pnpm install --frozen-lockfile
          else
            pnpm install
          fi

      - name: Lint
        run: pnpm -s run lint --if-present

      - name: Format check
        run: pnpm -s run format:check --if-present

      - name: Test
        run: pnpm -s run test --if-present

      - name: Build
        run: pnpm -s run build --if-present
`;
}

export default {
  id,
  title: 'Add base CI workflow',
  description:
    'Create a minimal GitHub Actions workflow (ci.yml) that installs dependencies with pnpm and runs lint/format/test/build if scripts exist.',
  async apply({cwd, options}) {
    const dryRun = Boolean(options.dryRun);
    const mode = options.force ? 'overwrite' : 'skip';

    const workflowPath = path.join(cwd, '.github', 'workflows', 'ci.yml');

    if ((await exists(workflowPath)) && !options.force) {
      return [{status: 'skipped', filePath: workflowPath, reason: 'exists'}];
    }

    return [
      await writeTextFile({
        filePath: workflowPath,
        content: workflowYaml(),
        mode,
        dryRun,
      }),
    ];
  },
};

