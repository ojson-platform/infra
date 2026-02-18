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

**Bin precedence note:** if you install `eslint`/`prettier`/`vitest`/`typescript` directly in your package, pnpm may prefer those binaries over the ones shipped by `@ojson/infra`.

## Usage

### ESLint (flat config)

Create `eslint.config.js`:

```js
export { default } from '@ojson/infra/eslint';
```

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

## Scaffolding (optional)

From a package root directory:

```bash
pnpm exec ojson-infra init
```

This applies `@ojson/infra` migrations (tracked in `.infra.json`) and may create:

- `eslint.config.js`, `prettier.config.js`, `vitest.config.mjs`, `tsconfig.json`
- `.github/workflows/ci.yml`
- `.agents/*` fragments and a managed section in `AGENTS.md`

Overwrite behavior is safe-by-default (skips existing files). Use `--force` to overwrite and `--dry-run` to preview.

