# Repository Guidelines

## Project Structure & Module Organization

This repository is an Obsidian plugin for Open Strategy Game referees.

- `src/main.ts` registers plugin commands and orchestrates workflows.
- `src/modals.ts` contains Obsidian modal UI.
- `src/factionlog/` contains Factionlog parsing and formatting.
- `src/providers/` contains AI provider adapters; Gemini is currently implemented.
- `src/brief.ts`, `src/promptBuilder.ts`, `src/frontmatter.ts`, and `src/editor.ts` hold focused workflow helpers.
- `tests/` contains smoke tests and the test runner.
- `docs/` contains reference material used to guide behavior.
- `main.js` and `manifest.json` are release/install artifacts for Obsidian.

## Build, Test, and Development Commands

- `npm install`: install development dependencies.
- `npm test`: bundle and run smoke tests from `tests/smoke-tests.ts`.
- `npm run build`: type-check with `tsc` and bundle `src/main.ts` to `main.js`.
- `npm run dev`: watch and rebuild during plugin development.
- `npm version <patch|minor|major>`: runs the build and syncs `manifest.json` via `scripts/sync-manifest-version.mjs`.

## Coding Style & Naming Conventions

Use TypeScript with strict null checks. Follow the existing style: two-space indentation, double quotes, explicit exported interfaces in `src/types.ts`, and focused modules with small helper functions. Prefer canonical Factionlog output through formatter functions instead of duplicating notation strings in command code.

Command IDs use kebab-case, for example `brief-to-log`; user-facing command names use Title Case, for example `Brief To Log`.

## Testing Guidelines

Tests are lightweight smoke tests using Node `assert/strict`, bundled through esbuild by `tests/run-smoke-tests.mjs`. Add coverage for parser, formatter, prompt, and deterministic conversion behavior when changing those areas. Keep examples realistic and based on Factionlog/OSG notation.

Run before committing:

```bash
npm test
npm run build
```

## Development State & Next Steps

Current state: version `0.2.0` includes the working MVP commands for submitting actions, registering actors, generating campaign briefs, converting briefs to Factionlog actor tags, grading leverage, rolling dice, drafting adjudications, drafting Forces of Nature, and drafting turn reports. Gemini is the only implemented AI provider. `README.md` documents manual and BRAT installation.

Recent work added `src/brief.ts`, smoke tests, reference docs under `docs/`, and rebuilt `main.js`. Keep `main.js`, `manifest.json`, and package versions in sync for releases.

Recommended next steps:

- Test `0.2.0` in a clean Obsidian vault through BRAT and manual install.
- Add OpenAI provider support using the existing `AIProvider` abstraction.
- Expand tests around brief parsing edge cases and Factionlog compatibility notation.
- Consider richer parser diagnostics instead of notice-only failures.
- Keep all AI output behind review modals before insertion.

## Commit & Pull Request Guidelines

Recent history uses concise, imperative or release-style commit subjects, such as `Expand MVP commands and release docs` or `0.2.0`. Use a short subject and add a body when the change spans commands, docs, tests, or release artifacts.

Pull requests should include a clear summary, test results, and notes for Obsidian behavior changes. For UI or command changes, describe the manual command-palette workflow tested.

## Security & Configuration Tips

Do not commit API keys or vault-specific plugin data. Gemini keys are stored through Obsidian plugin settings. Keep `main.js` rebuilt when release behavior changes, because BRAT/manual installs depend on built artifacts.
