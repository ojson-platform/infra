# Infra migrations

`@ojson/infra` scaffolding is implemented as **forward-only migrations** (like database migrations), applied to a package and tracked in `.infra.json`.

## Principles

- **Forward-only**: migrations have only `up` semantics (`apply()`); rollback is done via git/PR if needed.
- **Idempotent**: applying migrations multiple times must not break the package.
- **Safe-by-default**: do not overwrite existing user files unless `--force` is provided.
- **AGENTS.md safety**: never overwrite `AGENTS.md` entirely; only insert/update a managed marker block.

## How to add a migration (AI-friendly checklist)

1. **Generate the skeleton**:

```bash
pnpm exec ojson-infra author-migration "short title here"
```

2. **Implement `apply()`** in the generated file under `migrations/`:
   - Use `lib/fileOps.mjs` helpers (`writeTextFile`, `upsertMarkedSection`) so overwrite behavior is consistent.
   - Ensure paths are relative to the target package root (`cwd`).

3. **Write tests**:
   - Add/extend integration tests in `test/` using fixtures.
   - Test **dry-run**, **idempotency**, and **--force** behavior where relevant.
   - For AGENTS.md changes: assert that content outside markers remains intact.

4. **Update changelog**:
   - Add or refine the entry in `CHANGELOG.md`:
     - what files change
     - overwrite rules
     - compatibility notes

5. **Verify locally**:

```bash
pnpm run test

# Optional: manual smoke test
tmpdir="$(mktemp -d)"
printf '{"name":"tmp","version":"0.0.0","type":"module"}\n' > "$tmpdir/package.json"
(cd "$tmpdir" && node /path/to/@ojson/infra/bin/cli.mjs plan --dry-run)
(cd "$tmpdir" && node /path/to/@ojson/infra/bin/cli.mjs migrate --yes)
cat "$tmpdir/.infra.json"
```

## Managed block in AGENTS.md

Migrations that touch `AGENTS.md` must only manage a marker block:

- `<!-- OJSON_INFRA_AGENTS:BEGIN -->`
- `<!-- OJSON_INFRA_AGENTS:END -->`

Everything outside those markers is user-owned and must not be changed.

