# Kharcha privacy and data flow

Kharcha is a local-first spending ledger. This document describes the code in this repository. Whoever distributes a build or runs its backup API is responsible for publishing their own operator identity and support contact before offering it to others.

## What the app reads

On Android, and only after the user grants `READ_SMS` permission, the app queries SMS received from sender IDs on its local allowlist. The default list contains `HDFCBK`, `VM-SBIUPI`, and `AX-ICICIT`; users can edit it. Standard two-letter routing prefixes are ignored when matching. The native module sends the bodies of matching messages to the app's JavaScript parser on the same device. Other sender bodies are not returned to JavaScript. The app scans up to 90 days on first use, then checks recent messages when opened.

The parser looks for debit or credit transactions, rejects common OTP and marketing patterns, and marks uncertain matches for review. These filters are heuristic; a user should verify entries against their bank records. Manually pasted messages are processed in the same way. iOS and web do not read the device inbox.

## What stays local

On iOS and Android, transactions, source SMS text for accepted transactions, budgets, sender rules, and preferences are stored in the app's SQLite database. The database is protected by the operating system's app sandbox; this project does **not** add local database encryption. The web preview stores the same data in that browser's local storage, which is not encrypted by Kharcha. Clearing the site's browser data removes it. No analytics SDK, advertising SDK, or account sign-in is included.

## Optional backup

Backup is off until the user creates a recovery code and taps **Back up now**. The app encrypts a snapshot locally with AES-GCM. The Render API stores the ciphertext, a random backup ID, a hash of the access token, a version number, and timestamps. It does not receive the encryption key or plaintext ledger. The recovery code contains the ID, access token, and key, so anyone who has it can retrieve and decrypt the backup. Keep it private. The app stores a copy in the operating system's secure storage.

The backend keeps one current snapshot per backup ID until the user deletes it or the operator removes it. Deleting the remote backup does not erase the local ledger. Restoring a backup replaces the local ledger after confirmation.

## Network and platform services

The installed app contacts the configured Render API only for explicit backup actions. Expo development/build services and the app store may process ordinary build, distribution, and crash information under their own terms. This repository does not include an in-app telemetry service.

## Contact

For this open-source repository, use GitHub Issues. If you distribute a branded build, publish your support address and the URL of the policy for your deployed service.
