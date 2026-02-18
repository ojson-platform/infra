# @ojson/infra

Shared development infrastructure for ojson packages: ESLint, Prettier, TypeScript presets, Vitest, and optional scaffolding.

## Installation

```bash
pnpm add -D @ojson/infra
```

## Tool runners (one dependency)

`@ojson/infra` ships executable runners so a package can run common tools without installing them directly:

```bash
pnpm exec eslint --version
pnpm exec prettier --version
pnpm exec vitest --version
pnpm exec tsc --version
```

**Bin precedence note:** if you install `eslint`/`prettier`/`vitest`/`typescript`/`ts-patch` directly in your package, pnpm may prefer those binaries over the ones shipped by `@ojson/infra`.

## Usage

### ESLint (cascading flat config)

Create `eslint.config.js`:

```js
// Auto-detects with-* modules and applies architectural restrictions when needed
export { default } from '@ojson/infra/eslint';
```

**Cascading Configuration System:**

`@ojson/infra` now provides a cascading ESLint configuration system that automatically detects architectural patterns and applies appropriate rules:

- **Auto-detection**: Scans your `src/` directory for `with-*` modules (e.g., `with-auth`, `with-cache`, `with-services`)
- **Base Rules**: All packages get standard TypeScript/ESLint rules for consistent code quality
- **Architectural Restrictions**: When `with-*` modules are detected, automatically adds `no-restricted-imports` rules to enforce proper module boundaries

**Manual Override Options:**

If you need explicit control instead of auto-detection:

```js
// Force base configuration (no with-* restrictions)
export { default } from '@ojson/infra/eslint/base';

// Force with-restrictions configuration (architectural rules)
export { default } from '@ojson/infra/eslint/with-restrictions';
```

**Architectural Restrictions Applied:**

When `with-*` modules are detected, the following rule is enforced:

```js
'no-restricted-imports': [
  'error',
  {
    patterns: [
      {
        group: ['../with-*/**/*', '!../with-*'],
        message: 'Import from module root instead of internal module files'
      }
    ]
  }
]
```

This prevents importing from internal files within `with-*` modules and forces usage through the module's public API.

### Prettier

Create `prettier.config.js`:

```js
export { default } from '@ojson/infra/prettier';
```

### Vitest

Create `vitest.config.mjs` (or `vitest.config.ts`):

```js
export { default } from '@ojson/infra/vitest';
```

### TypeScript

Create `tsconfig.json`:

```json
{
  "extends": "@ojson/infra/tsconfig/base"
}
```

Additional presets:

- `@ojson/infra/tsconfig/build`
- `@ojson/infra/tsconfig/test`

### TypeScript Custom Transformers

`@ojson/infra` provides optional custom TypeScript transformers through ts-patch for advanced compilation transformations.

When using custom transformers, the standard `tsc` command automatically detects and applies them during compilation.

**Setup in your package:**

1. **Update tsconfig.json** (add transformer plugin):

```json
{
  "extends": "@ojson/infra/tsconfig/base",
  "compilerOptions": {
    "module": "ES2020",
    "moduleResolution": "Node",
    "rewriteRelativeImportExtensions": true,
    "plugins": [
      {
        "transform": "./node_modules/@ojson/infra/lib/transformer.mjs",
        "after": true
      }
    ]
  }
}
```

The shared transformer automatically resolves relative imports without extensions:

```typescript
// Source:
import { utils } from './utils';
// Output:
import { utils } from './utils.js';
```

## Scaffolding (optional)

From a package root directory:

```bash
pnpm exec ojson-infra init
```

This applies `@ojson/infra` migrations (tracked in `.infra.json`) and may create:

- `eslint.config.js`, `prettier.config.js`, `vitest.config.mjs`, `tsconfig.json`
- `.agents/*` fragments and a managed section in `AGENTS.md`

**ESLint Auto-Detection:**
During scaffolding, the system detects `with-*` modules in your `src/` directory and reports whether architectural restrictions will be applied.

Overwrite behavior is safe-by-default (skips existing files). Use `--force` to overwrite and `--dry-run` to preview.

