# Changelog

This changelog is **migration-oriented**: every user-facing change in scaffolding is represented as a migration.

## 0001_add_infra_configs

- **Title**: Add @ojson/infra config re-exports
- **Changes**:
  - Creates `eslint.config.js`, `prettier.config.js`, `vitest.config.mjs` that re-export from `@ojson/infra/*`
  - Creates `tsconfig.json` extending `@ojson/infra/tsconfig/base`
- **Notes**:
  - Existing files are **not overwritten** by default. Use `ojson-infra migrate --force` to overwrite managed files.

## 0003_add_agents_fragments

- **Title**: Add `.agents/` fragments and a managed section in `AGENTS.md`
- **Changes**:
  - Creates `.agents/core.md` (two modes: metapackage vs standalone; mode detection commands)
  - Creates `.agents/dev-infrastructure.md` (how this package uses `@ojson/infra`)
  - Creates or updates `AGENTS.md` by **inserting a managed section** between markers:
    - `<!-- OJSON_INFRA_AGENTS:BEGIN -->`
    - `<!-- OJSON_INFRA_AGENTS:END -->`
- **Notes**:
  - Content outside the managed marker block is not touched.
  - If markers are missing, the migration appends the block at the end of the file.


## 0004_test_migration

- **Title**: Test migration
- **Changes**:
  - TODO
- **Notes**:
  - TODO (overwrite behavior, compat, etc.)
