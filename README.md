<p align="center"><img src="docs/brand/cover.png" alt="Kharcha: a spending ledger built from bank messages" width="100%"></p>

# Kharcha

<div align="center">
  <a href="https://github.com/cneuralnetwork/kharcha/actions/workflows/ci.yml"><img src="https://github.com/cneuralnetwork/kharcha/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://github.com/cneuralnetwork/kharcha/stargazers"><img src="https://img.shields.io/github/stars/cneuralnetwork/kharcha?style=social" alt="GitHub Stars"></a>
  <a href="mobile/package.json"><img src="https://img.shields.io/badge/node-%E2%89%A522.13-339933?logo=node.js&logoColor=white" alt="Node ≥22.13"></a>
</div>

<p align="center">
  <a href="#what-you-can-do">Features</a> ·
  <a href="#run-from-source">Getting Started</a> ·
  <a href="#contributing">Contributing</a> ·
  <a href="https://github.com/cneuralnetwork/kharcha/issues">Pick an Issue</a> ·
  <a href="https://github.com/cneuralnetwork/kharcha/issues/new?template=bug_report.md">Report a Bug</a> ·
  <a href="https://github.com/cneuralnetwork/kharcha/issues/new?template=feature_request.md">Request a Feature</a>
</p>

**A little clearer every day.** Kharcha turns bank transaction SMS into a private spending ledger. It keeps the original message beside the parsed amount, so you can check the source, correct a name or category, and decide what belongs in your ledger.

This repository contains a working Expo app and a small Render backup API. The app works without an account or backend. The API is used only when you opt into encrypted backup.

**Install on Android:** [Download Kharcha 1.0.0 APK](https://github.com/cneuralnetwork/kharcha/releases/download/v1.0.0/Kharcha-v1.0.0-android.apk) (Android 7.0+, 114 MB). Open the download on your device and allow installation from your browser or file manager if prompted. Manual entry works immediately; SMS access is requested only if you enable the bank SMS reader. See the [release notes and SHA-256 checksum](https://github.com/cneuralnetwork/kharcha/releases/tag/v1.0.0). This build has not yet been smoke-tested on a physical device.

## What you can do

| Feature | Android build | iOS build | Web preview |
| --- | --- | --- | --- |
| Add and edit entries, assign categories, set budgets, and view insights | Yes | Yes | Yes |
| Paste a bank SMS and review the parsed entry | Yes | Yes | Yes |
| Read allowlisted bank SMS from the device inbox | Yes, with `READ_SMS` permission | No platform API | No browser API |
| Optional encrypted backup to Render | Yes | Yes | Not enabled |

The Android reader uses a small local Expo module. It reads only messages from enabled sender IDs. Common OTP and promotion patterns are filtered; parsing is heuristic, so review entries against your bank records. The app never asks for a bank password or login.

## Run from source

You need Node.js **22.13+**, npm, and Git. Clone the repository, then install the app dependencies:

```bash
git clone https://github.com/cneuralnetwork/kharcha.git
cd kharcha/mobile
npm ci
cp .env.example .env
npm start
```

For a quick manual-entry preview, press `w` for web or open the app in Expo Go. No Render service is needed. The web preview keeps entries in that browser's local storage; clearing site data removes them. Installed iOS and Android apps use SQLite.

### Read SMS on Android

Expo Go cannot load the custom `KharchaSms` native module. From `kharcha/mobile`, use a native build:

```bash
npm ci
npx expo run:android
```

That command needs an Android SDK and a connected device or emulator. For a cloud-built installable APK instead:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

The first EAS run may ask you to connect or create an Expo project and configure Android signing. Install the resulting APK, open Kharcha, and choose **Read my bank SMS**. The permission prompt is shown before the first scan. On the **You** tab, review or edit bank sender IDs; standard two-letter SMS routing prefixes are ignored when matching. The initial scan covers the last 90 days, with a 1,500-message cap per scan; later scans check recent messages when the app becomes active. Duplicate source messages are ignored.

For iOS, use manual entry or paste a bank SMS. iOS does not expose general inbox-reading access to third-party apps.

## Add optional Render backup

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/cneuralnetwork/kharcha)

The app is useful without Render. If you want cross-device recovery, the button opens this repository's [Render Blueprint](render.yaml) in your Render account. It proposes a free API web service and a paid, persistent `0.1c-256mb` Postgres database in Singapore. **Review the database cost before approving the deploy.** [Render's free Postgres expires after 30 days](https://render.com/docs/free), so it is unsuitable as the only copy of a real backup.

1. Click **Deploy to Render**, sign in, choose your workspace, and review the proposed web service and database.
2. Approve the Blueprint if the cost works for you. Render sets `DATABASE_URL` from the database and starts the API. The API creates its table at startup.
3. Visit `https://<your-service>.onrender.com/healthz`; it should return `{"ok":true}`.
4. In `mobile/.env`, set `EXPO_PUBLIC_BACKUP_API_URL=https://<your-service>.onrender.com`.
5. Restart Metro, or rebuild the installed app. `EXPO_PUBLIC_` values are compiled into the client. Never put a database password or secret there.
6. In **You → Encrypted backup**, create a recovery code, store it privately, then tap **Back up now**. To restore on another installed app, enter that code in the same screen.

The Blueprint leaves automatic deploys off, so changes pushed to this public repository will not update your service unexpectedly. Deploy a newer commit from your Render dashboard when you choose to update.

The recovery code contains both the access token and encryption key. Whoever has it can restore the snapshot. Losing it means the server cannot decrypt your backup. The API stores ciphertext only, along with a token hash, backup ID, version, and timestamp. Remote deletion is available in the app. See [PRIVACY.md](PRIVACY.md) for the full data flow.

### Run the API locally

With Docker Compose installed, start Postgres from the repository root:

```bash
docker compose up -d db
cd api
npm ci
DATABASE_URL=postgres://kharcha:kharcha@localhost:5433/kharcha npm run dev
```

The database credentials in `compose.yaml` are for **local development only**. In another terminal, `curl http://localhost:4000/healthz` should return `{"ok":true}`. The API is not required to run the app without backup.

## How it works

```mermaid
flowchart LR
  SMS[Allowlisted Android bank SMS] --> Parser[On-device parser]
  Paste[Message you paste] --> Parser
  Manual[Manual entry] --> Ledger[(Local SQLite ledger)]
  Parser --> Review[Review or auto-add]
  Review --> Ledger
  Ledger --> Insights[Home, insights, budgets]
  Ledger -->|Explicit backup only| AES[AES-GCM on device]
  AES --> API[Render API]
  API --> DB[(Render Postgres ciphertext)]
```

The parser is intentionally conservative. It requires a debit or credit signal and an amount, tries to identify the merchant, and gives uncertain reads to the review inbox. High-confidence reads can be auto-added if that setting is on. A message's raw body remains attached to its entry. The API never parses SMS or calculates spending.

## Repository map

| Path | Purpose |
| --- | --- |
| [`mobile/src/app`](mobile/src/app) | Expo Router screens |
| [`mobile/src/lib/parser.ts`](mobile/src/lib/parser.ts) | Bank SMS parsing and category rules |
| [`mobile/src/lib/database.ts`](mobile/src/lib/database.ts) | Native SQLite ledger and snapshot format |
| [`mobile/src/lib/database.web.ts`](mobile/src/lib/database.web.ts) | Browser-local preview storage |
| [`mobile/modules/kharcha-sms`](mobile/modules/kharcha-sms) | Android allowlisted inbox reader |
| [`mobile/src/lib/backup.ts`](mobile/src/lib/backup.ts) | On-device encryption and recovery code |
| [`api/src`](api/src) | Render backup HTTP API and Postgres store |
| [`docs/brand`](docs/brand) | Ready-to-use promotional art and generator |

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for the fork/clone workflow, branch naming, coding standards, and how to run tests for both `mobile` and `api`. Everyone participating is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Found a security issue? Report it privately per [SECURITY.md](SECURITY.md) instead of opening a public issue. Notable changes are tracked in [CHANGELOG.md](CHANGELOG.md).

## Build and verify

From the repository root, run:

```bash
cd mobile
npm ci
npm run lint
npm run typecheck
npm test
npx expo export --platform web
npx expo export --platform android
npx expo export --platform ios

cd ../api
npm ci
npm run typecheck
npm test
npm run build
```

The parser tests cover debit extraction, OTP/promotion rejection, ambiguity, and the case where a balance appears before a transaction amount. API tests cover authorization and version conflicts. A JavaScript bundle is not a native Android APK; complete a native/EAS build and test SMS permission and real bank formats on a device before distributing one.

## Distribution and Play policy

Android's `READ_SMS` permission is restricted on Google Play. Google's [SMS and Call Log policy](https://support.google.com/googleplay/android-developer/answer/10208820) lists SMS-based money management as a possible exception, but a Play listing requires the permission declaration and Google's approval. Approval is not guaranteed. A manually entered and pasted-SMS edition can be distributed without that permission; remove the Android permission and native SMS reader before building that edition. Do not claim a Play-approved release until review has passed.

Kharcha is an expense organizer, not a bank statement or financial advice tool. It may miss messages or parse them incorrectly. Keep your bank's records as the source of truth. Before a broad public launch, add account-level abuse protection and operational monitoring to the optional backup service; its current recovery-code flow is suited to a small, self-hosted beta.

## Graphics and promotion

The repository includes a [1600 × 900 cover](docs/brand/cover.png), [1200 × 630 social card](docs/brand/social-card.png), and app icons in [`mobile/assets`](mobile/assets). These are original, editable through [`docs/brand/generate.py`](docs/brand/generate.py). The financial numbers in the artwork are illustrative demo data. To regenerate after `npm ci`, install Pillow and run `python3 docs/brand/generate.py` from the repository root.

**Short description:** Your spending ledger, already in your messages.

**Launch copy:** Bank messages tell a fragmented story. Kharcha puts each spend in one private ledger, keeps the original SMS close, and lets you correct anything it got wrong. Start with manual entries, or read allowlisted bank SMS on Android. Backup is optional and encrypted on your device.

## License

[MIT](LICENSE). The Expo, React Native, and font packages keep their own upstream licenses.
