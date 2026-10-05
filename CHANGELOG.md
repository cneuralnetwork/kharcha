# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Contributor onboarding documentation: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, issue and pull request templates, and a CI workflow.

## [1.0.0] - 2026-10-04

### Added

- Initial public release of the Kharcha Expo app: manual entry, pasted-SMS
  parsing, budgets, and insights, backed by an on-device SQLite ledger.
- Android allowlisted bank SMS reader via the local `kharcha-sms` Expo module.
- Optional encrypted backup to a Render-hosted Fastify API with Postgres
  storage, using AES-GCM encryption and a recovery-code flow.
- Downloadable Android APK release.

[Unreleased]: https://github.com/cneuralnetwork/kharcha/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/cneuralnetwork/kharcha/releases/tag/v1.0.0
