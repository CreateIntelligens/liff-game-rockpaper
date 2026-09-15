# Changelog

## Unreleased

### Added

- Docker Compose runtime with Nginx web service, Fastify API service, health checks, and SQLite volume.
- SQLite backup and restore scripts for Docker volume upgrades.
- Pure TypeScript game domain and runtime ports for future Cloudflare adapter replacement.
- LINE ID token verification and secure HTTP-only session cookie flow.
- MediaPipe Gesture Recognizer model asset and Web Worker camera adapter.
- Rock, paper, scissors mapping with confidence threshold and multi-frame stability.
- Three-point energy ledger with idempotent game requests and capped referral refill.
- MGM global switch, member opt-in, invite link creation, and onboarding attribution capture.
- Masked invitation leaderboard, win leaderboard, and personal ranking cards.
- Resend REST API adapter, email outbox, idempotency key, retry status, and notification endpoint.
- Traditional Chinese / English detection and `繁 | En` preference switch.
- Light and dark theme token sets with persisted theme switching.
- Generated campaign gesture collage artwork used as a restrained camera-stage accent.
- Mobile-first responsive layout and Playwright viewport checks.

### Decisions

- YOLO is not used for the MVP. MediaPipe Gesture Recognizer is sufficient for the three supported hand gestures and keeps inference in the browser.
- The backend, not the client or vision model, determines official game results and ranking scores.
- Docker uses local SQLite first; future Cloudflare deployment replaces adapters with Workers Static Assets, D1, Queues, and Worker secrets.

### Known limitations

- Docker acceptance cannot be run on machines without a Docker daemon.
- Official LINE account "new friend" policy, including previously blocked users, still needs campaign-owner confirmation before referral rewards are finalized.
- Email recipient and consent policy still needs campaign-owner confirmation; missing email is currently represented as `skipped`.
- Real iOS/Android camera permission and LIFF-browser testing still require physical devices or a device lab.
