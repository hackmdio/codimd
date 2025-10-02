# Repository Guidelines

## Dos and Don'ts

- Do run `nvm use` (reads the version pinned in `.nvmrc`) before `npm ci`; don't rely on ad-hoc Node versions.
- Do lint (`npm run lint -- lib/...`) and run focused tests; don't commit artifacts from `public/build/`.
- Do sign commits with `git commit -s`; don't rewrite reviewed history.
- Do update `public/docs/release-notes.md` and `package.json` on `release/*`; CI verifies both.

## Project Structure & Module Organization

- `app.js` boots Express, Socket.IO, metrics, and pulls settings from `lib/**` modules.
- Scripts and utilities live in `bin/` and `utils/`; base config defaults reside in `config.json.example`.
- Front-end assets/locales live in `public/` and `locales/`; docs live in `public/docs/`.
- Tests mirror runtime folders under `test/` with shared fakes in `test/testDoubles/`, and CI workflows live in `.github/workflows/`.

## Build, Test, and Development Commands

- Install once per checkout: `nvm use` (uses `.nvmrc`) then `npm ci` (mirrors `.github/workflows/build.yml`).
- `npm run dev` watches webpack; `npm run build` emits production bundles to `public/build/`.
- `npm start` runs `sequelize db:migrate` before serving.
- Lint via `npm run lint -- lib/realtime/realtime.js`; validate JSON with `npm run jsonlint`.
- Targeted tests: `npx mocha --require intelli-espower-loader --exit test/realtime/connection.test.js`; use `npm run test:ci` or `npm run coverage` for the full suite.

## Coding Style & Naming Conventions

- StandardJS and `.editorconfig` enforce two-space indents, no semicolons, and single quotes.
- Keep filenames lowercase/camelCase in `lib/`, kebab-case for web assets, and reuse `test/testDoubles/` helpers for specs.

## Testing Guidelines

- Mocha + Power Assert run through `npm run mocha`; `nyc` covers `app.js` and `lib/**`.
- Place specs beside their domain (`test/realtime/*.test.js`, `test/auth/*.test.js`) and keep them deterministic via shared fakes.

## Commit & Pull Request Guidelines

- Keep commits atomic, DCO-signed, and in `type: summary` form (for example `fix: empty exported notes in the archive`).
- Reference issues, document config/schema changes, attach `npm run test:ci` output or UI evidence when relevant, ensure `release/*` PRs update `public/docs/release-notes.md` and `package.json`, and gather sign-off from two other developers per `CONTRIBUTING.md`.

## Safety & Permissions

- Safe: read/list files, adjust docs, run scoped lint/test commands.
- Ask first: new dependencies, renames/deletions, build or CI edits, Docker publish flows, or other large refactors.
- Never force-push shared branches, wipe data stores, or leak secrets.

## Security & Configuration Tips

- Seed new configs from `config.json.example` and inject secrets via environment variables.
- Security headers default in `lib/config/default.js` (override via `config.json`), with CSP logic in `lib/csp.js`; image upload adapters under `lib/imageRouter/` (for example `lib/imageRouter/s3.js`) need local S3/MinIO verification and documented port/TLS expectations.
