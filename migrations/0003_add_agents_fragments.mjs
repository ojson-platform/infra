import path from 'node:path';

import {upsertMarkedSection, writeTextFile} from '../lib/fileOps.mjs';

const id = '0003_add_agents_fragments';

const BEGIN = '<!-- OJSON_INFRA_AGENTS:BEGIN -->';
const END = '<!-- OJSON_INFRA_AGENTS:END -->';

function agentsSection({fragments}) {
  const lines = [
    BEGIN,
    '',
    '## Important',
    '',
    'Additional AI agent guidance is available as fragments in the `.agents/` directory:',
    '',
    ...fragments.map(f => `- \`${f.path}\` — ${f.description}`),
    '',
    'This section is managed by `@ojson/infra` migrations. Edit content outside this block freely.',
    '',
    END,
    '',
  ];

  return lines.join('\n');
}

function agentsCoreMd() {
  return `# Agent Guide – Core Concepts

## Two modes: metapackage vs standalone

This package can be developed in **two modes**:

- **Metapackage mode**: the package is developed inside the ojson metapackage workspace. Other \`@ojson/*\` packages may be linked locally, and shared dev infrastructure is available via workspace.
- **Standalone mode**: the package is cloned and developed on its own. Dependencies resolve from npm (semver ranges), and metapackage scripts (submodule/bootstrap) do not apply.

## Behavioral differences

- **Dependency resolution**:
  - metapackage: workspace can override semver deps with local clones
  - standalone: only installed deps (npm registry) are used
- **Tooling & scripts**:
  - metapackage: root scripts (bootstrap/check-submodules) exist at metapackage root
  - standalone: only package-local scripts exist
- **Lockfiles/CI**:
  - metapackage: workspace setup may differ from per-package CI
  - standalone: CI typically runs against the package alone

## How to detect current mode (copy/paste)

### Quick check (filesystem)

\`\`\`bash
# Run from the package root
test -f ../pnpm-workspace.yaml && echo \"metapackage-like\" || echo \"standalone-like\"
test -f ../.gitmodules && echo \"metapackage gitmodules present\" || true
\`\`\`

### Tool-assisted

If \`ojson-infra\` CLI is available:

\`\`\`bash
pnpm exec ojson-infra status
\`\`\`
`;
}

function agentsDevInfrastructureMd() {
  return `# Agent Guide – Dev infrastructure

This package uses **@ojson/infra** for shared development tooling:

- ESLint: \`eslint.config.js\` re-exports from \`@ojson/infra/eslint\`
- Prettier: \`prettier.config.js\` re-exports from \`@ojson/infra/prettier\`
- Vitest: \`vitest.config.mjs\` re-exports from \`@ojson/infra/vitest\`
- TypeScript: \`tsconfig.json\` extends \`@ojson/infra/tsconfig/base\` (and/or build/test presets)

If you update tooling, prefer updating **@ojson/infra** and applying migrations rather than copy/paste changes per package.
`;
}

export default {
  id,
  title: 'Add .agents fragments and AGENTS.md section',
  description:
    'Create .agents fragments with metapackage vs standalone guidance and add a managed “Important” section to AGENTS.md that points to .agents/.',
  async apply({cwd, options}) {
    const dryRun = Boolean(options.dryRun);

    const fragments = [
      {path: '.agents/core.md', description: 'Core concepts, two modes (metapackage vs standalone), and mode detection'},
      {path: '.agents/dev-infrastructure.md', description: 'Lint/format/test tooling and @ojson/infra usage'},
    ];

    const ops = [];

    ops.push(
      await writeTextFile({
        filePath: path.join(cwd, '.agents', 'core.md'),
        content: agentsCoreMd(),
        mode: options.force ? 'overwrite' : 'skip',
        dryRun,
      }),
    );

    ops.push(
      await writeTextFile({
        filePath: path.join(cwd, '.agents', 'dev-infrastructure.md'),
        content: agentsDevInfrastructureMd(),
        mode: options.force ? 'overwrite' : 'skip',
        dryRun,
      }),
    );

    const section = agentsSection({fragments});
    ops.push(
      await upsertMarkedSection({
        filePath: path.join(cwd, 'AGENTS.md'),
        beginMarker: BEGIN,
        endMarker: END,
        sectionContent: section,
        mode: 'append',
        dryRun,
      }),
    );

    return ops;
  },
};

