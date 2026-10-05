# Security Policy

Kharcha handles bank transaction SMS and, optionally, an encrypted backup of a
user's spending ledger. See [PRIVACY.md](PRIVACY.md) for the full data flow
before reporting an issue — it may already answer what data is read, stored,
or transmitted.

## Supported versions

Kharcha is early-stage and pre-1.x in spirit despite the `1.0.0` tag. Only the
latest release and the current `main` branch receive security fixes.

| Version | Supported |
| --- | --- |
| `main` (latest commit) | ✅ |
| `1.0.x` | ✅ |
| < `1.0.0` | ❌ |

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report it privately using [GitHub's private vulnerability reporting](https://github.com/cneuralnetwork/kharcha/security/advisories/new)
on the main repository. If that form is unavailable to you, contact the
maintainer through the details on the [cneuralnetwork](https://github.com/cneuralnetwork)
GitHub profile.

### What to include

* A clear description of the vulnerability and its potential impact.
* The affected version or commit hash.
* Step-by-step reproduction instructions (minimal repro if possible).
* A suggested fix or mitigation, if you have one.
* Whether the issue affects the mobile app, the backup API, or both.

### Response expectations

* **Acknowledgement** — within 5 business days of a private report.
* **Triage** — we'll confirm severity and scope, and may ask follow-up
  questions.
* **Fix timeline** — critical issues (e.g. backup data exposure, auth bypass)
  are targeted within 30 days; lower-severity issues are scheduled into
  regular development.

We'll credit reporters in the fix's release notes unless you ask to stay
anonymous.

## Security guidance for contributors

* **Never commit secrets.** `.env` files, `DATABASE_URL`, recovery codes, and
  API tokens must never appear in a commit. Anything prefixed
  `EXPO_PUBLIC_` is compiled into the client bundle and is public by
  definition — it must never hold a secret.
* **Treat all external input as untrusted.** This includes SMS bodies (device
  inbox or pasted), request bodies and path parameters in `api/src/app.ts`,
  and any backup payload decrypted on-device. Validate shape and bounds
  before use, as the existing `idPattern`, `tokenPattern`, and
  `ciphertextPattern` checks do.
* **Compare secrets in constant time.** Use `crypto.timingSafeEqual` (as
  `authorized()` in `api/src/app.ts` does) instead of `===` when comparing
  tokens or hashes.
* **Keep the backup server zero-knowledge.** The API must only ever see
  ciphertext and a hash of the access token — never the encryption key or
  plaintext ledger. Any change to `api/src/app.ts` or `mobile/src/lib/backup.ts`
  that risks breaking that boundary needs extra scrutiny in review.
* **Be conservative with permissions.** The Android SMS reader only reads
  allowlisted sender IDs and never requests more than `READ_SMS`. Don't widen
  that scope without a strong justification documented in the PR.
