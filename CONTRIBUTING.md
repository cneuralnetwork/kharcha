# Contributing to Kharcha

Thanks for your interest in Kharcha. Before anything else, please read our [Code of Conduct](CODE_OF_CONDUCT.md) — participation in this project means agreeing to follow it. If you've found a security vulnerability, do not open a public issue; follow [SECURITY.md](SECURITY.md) instead.

This guide covers everything you need to go from a fresh clone to a merged pull request.

## Getting started

1. Fork the repository on GitHub.
2. Clone your fork and add this repository as the `upstream` remote:

   ```bash
   git clone https://github.com/<your-username>/kharcha.git
   cd kharcha
   git remote add upstream https://github.com/cneuralnetwork/kharcha.git
   git fetch upstream
   ```

3. Keep your fork's `main` up to date before starting new work:

   ```bash
   git checkout main
   git pull upstream main
   ```

## Development setup

You need Node.js **22.13+**, npm, and Git. The repository has two independent projects: the Expo app in [`mobile/`](mobile) and the optional backup API in [`api/`](api).

### Mobile app

```bash
cd mobile
npm ci
cp .env.example .env
npm start
```

Press `w` for the web preview, or open the project in Expo Go. Reading Android SMS requires a native build (`npx expo run:android`) since Expo Go cannot load the custom `KharchaSms` module — see the [README](README.md#read-sms-on-android) for details.

### Backup API

```bash
docker compose up -d db
cd api
npm ci
DATABASE_URL=postgres://kharcha:kharcha@localhost:5433/kharcha npm run dev
```

The API is only needed if you're working on the encrypted backup flow; the app works fully without it.

## Reporting bugs

- Search [existing issues](https://github.com/cneuralnetwork/kharcha/issues) first to avoid duplicates.
- Open a new issue using the **Bug report** template.
- Include your OS, Node version, platform (Android/iOS/web), and exact reproduction steps. Attach the raw (redacted) SMS text if your bug involves parsing — strip real amounts or account numbers if they're sensitive.

## Suggesting features

- Open an issue using the **Feature request** template.
- Describe the problem you're hitting before proposing a solution — it's easier to evaluate fit against Kharcha's local-first, privacy-conservative design.
- Mention any alternatives you considered.

## Branch naming

Prefix branches by the kind of change, followed by a short kebab-case description:

```
feature/<kebab-case-description>
fix/<kebab-case-description>
migration/<kebab-case-description>
testing/<kebab-case-description>
infra/<kebab-case-description>
docs/<kebab-case-description>
```

Examples from this repository's history: `docs/contribution-onboarding`, `fix/parser-balance-amount`, `infra/render-blueprint`.

## Pull request process

1. Create a branch off an up-to-date `main` using the naming convention above.
2. Make your changes, keeping each PR focused on a single concern.
3. Run the relevant checks locally (see [Running tests](#running-tests)).
4. Push your branch and open a PR against `cneuralnetwork/kharcha:main`. Fill in the pull request template completely.
5. Respond to review feedback with follow-up commits; avoid force-pushing over review history until the PR is approved.

## Coding standards

- **TypeScript everywhere** — both `mobile` and `api` are typed; avoid `any` and keep `tsc --noEmit` clean.
- **Lint** — the mobile app uses `eslint-config-expo` (`npm run lint` inside `mobile`). Fix lint errors rather than disabling rules.
- **Comments** — keep them short and only where the code can't explain itself; don't restate what a line already says.
- **Secrets** — never commit `.env` files, database URLs, or recovery codes. Anything prefixed `EXPO_PUBLIC_` is compiled into the client bundle and is **not** a safe place for secrets.
- **Parser changes** — `mobile/src/lib/parser.ts` is intentionally conservative: prefer leaving an ambiguous message for manual review (`status: 'review'`) over guessing. Add a test in `mobile/test/parser.test.mjs` for every new pattern or rejection rule.
- **API changes** — `api/src/app.ts` validates every input (ID format, token format, ciphertext shape) before touching storage, and compares secrets with `timingSafeEqual`. Follow the same pattern for new routes.

## Running tests

| Command | Location | What it checks |
| --- | --- | --- |
| `npm run lint` | `mobile/` | ESLint via `eslint-config-expo` |
| `npm run typecheck` | `mobile/` | `tsc --noEmit` |
| `npm test` | `mobile/` | Parser unit tests (`node --test`) |
| `npm run typecheck` | `api/` | `tsc --noEmit` |
| `npm test` | `api/` | Fastify route tests against an in-memory store |
| `npm run build` | `api/` | Compiles the API with `tsc` |

Run the full build-and-verify sequence from the [README](README.md#build-and-verify) before opening a PR that touches both projects.

## Adding a new feature unit

- **A new screen** — add a file under `mobile/src/app/` (Expo Router treats every file there as a route); keep non-route logic in `mobile/src/lib` or `mobile/src/state`.
- **A new parser rule** — add or adjust a pattern in `mobile/src/lib/parser.ts`, then add a case to `mobile/test/parser.test.mjs` covering both the match and a plausible false positive.
- **A new API route** — add it in `api/src/app.ts`, validate all inputs up front, and add a corresponding test in `api/test/app.test.ts` using the in-memory `BackupStore`.

## Commit message format

This repository uses short, imperative-mood commit summaries without a type prefix, for example:

```
Add one-click self-service Render setup
Clarify setup and verify local Postgres configuration
Refactor high-complexity flows without changing behavior
```

Write what the commit does, not what you did ("Add X", not "Added X" or "Adds X"). Keep the summary line under ~72 characters; add a body only if the reasoning isn't obvious from the diff.
