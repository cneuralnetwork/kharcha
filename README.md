<p align="center"><img src="docs/brand/cover.png" alt="Kharcha: a spending ledger built from bank messages" width="100%"></p>

# Kharcha

**A little clearer every day.** Kharcha turns bank transaction SMS into a private spending ledger. It keeps the original message beside the parsed amount, so you can check the source, correct a name or category, and decide what belongs in your ledger.

This repository contains a working Expo app and a small Render backup API. The app works without an account or backend. The API is used only when you opt into encrypted backup.

## What you can do

| Feature | Android build | iOS build | Web preview |
| --- | --- | --- | --- |
| Add and edit expenses, categories, budgets, and insights | Yes | Yes | Yes |
| Paste a bank SMS and review the parsed entry | Yes | Yes | Yes |
| Read allowlisted bank SMS from the device inbox | Yes, with `READ_SMS` permission | No platform API | No browser API |
| Optional encrypted backup to Render | Yes | Yes | Not enabled |

The Android reader uses a small local Expo module. It reads only messages from enabled sender IDs. Common OTP and promotion patterns are filtered; parsing is heuristic, so review entries against your bank records. The app never asks for a bank password or login.

## Start using it

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

Expo Go cannot load the custom `KharchaSms` native module. Use a native build:

```bash
cd mobile
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

The app is useful without Render. For cross-device recovery, deploy the API and connect a **persistent** Render Postgres database. The included [Render Blueprint](render.yaml) configures a free web service and a paid `0.1c-256mb` Postgres instance in Singapore. **Review Render's current pricing before applying the Blueprint.** The paid database is deliberate: [Render's free Postgres expires after 30 days](https://render.com/docs/free), so it is unsuitable as the only copy of a real backup.

1. In Render, create a Blueprint from this GitHub repository and review the proposed web service and database.
2. Apply it. Render sets `DATABASE_URL` from the database and starts the API. The API creates its table at startup.
3. Visit `https://<your-service>.onrender.com/healthz`; it should return `{"ok":true}`.
4. In `mobile/.env`, set `EXPO_PUBLIC_BACKUP_API_URL=https://<your-service>.onrender.com`.
5. Restart Metro, or rebuild the installed app. `EXPO_PUBLIC_` values are compiled into the client. Never put a database password or secret there.
6. In **You → Encrypted backup**, create a recovery code, store it privately, then tap **Back up now**. To restore on another installed app, enter that code in the same screen.

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

## Build and verify

```bash
cd mobile
npm ci
npm run lint
npm run typecheck
npm test
npx expo export --platform web
npx expo export --platform android

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
