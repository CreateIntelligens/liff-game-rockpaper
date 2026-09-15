## 1. Product decisions and project foundation

- [ ] 1.1 Confirm the production email recipient and consent policy; record the decision in the relevant spec and verify the accepted flow is covered by an automated or documented acceptance test
- [ ] 1.2 Confirm the official-account "new friend" definition, including previously blocked users; record the decision in the MGM spec and verify attribution scenarios cover the final rule
- [x] 1.3 Create the npm workspace structure for `apps/web`, `apps/api`, and shared packages; verify a clean install and workspace type-check succeed
- [x] 1.4 Add shared TypeScript domain types and API error contract; verify frontend and backend compile against the same request and response shapes
- [x] 1.5 Create `packages/core` and `packages/ports` boundaries; verify core imports no Fastify, Drizzle, SQLite driver, Resend SDK, Node filesystem API, or runtime-specific globals

## 2. Docker runtime and configuration

- [ ] 2.1 Add the multi-stage frontend Dockerfile and Nginx configuration; verify `docker compose build web` completes and the built app is served
- [ ] 2.2 Add the API Dockerfile using a pinned Node.js LTS Debian slim image; verify `docker compose build api` completes without exposing development secrets
- [ ] 2.3 Add `compose.yaml`, `.env.example`, health checks, and `./data:/app/data` persistence mapping; verify `docker compose up -d` starts both services and `docker compose ps` reports healthy containers
- [x] 2.4 Add configuration loading and startup validation for public flags, private secrets, database path, and active campaign versions; verify invalid required environment values fail with a safe error

## 3. Campaign rules and assets

- [x] 3.1 Define the campaign rule schema with initial energy 3, energy cap, energy cost 1, referral reward, leaderboard types, fallback policy, timezone, and feature flags; verify valid and invalid fixtures pass the schema tests
- [x] 3.2 Define versioned image-frame and asset manifest schemas for canvas size, safe area, border, transparency, crop strategy, model asset, and asset version; verify invalid assets are rejected before activation
- [x] 3.3 Implement active rule and asset version loading without rewriting historical versions; verify a game fixture retains its original `ruleVersion` and `assetVersion` after a new version is activated
- [x] 3.4 Add initial campaign visual assets and MediaPipe model asset to the web build; verify the assets are available from the web container and are covered by a manifest check

## 4. SQLite persistence and transactions

- [x] 4.1 Create the SQLite schema and migrations for members, sessions, campaign versions, games, energy events, referrals, leaderboard source scores, and email deliveries; verify migrations run on an empty database and can be applied twice safely
- [x] 4.2 Implement the energy ledger and current-energy projection; verify initial energy, one-point consumption, capped refill, and negative-energy prevention with transaction tests
- [x] 4.3 Implement game and referral idempotency constraints; verify repeated play requests and repeated referral callbacks produce one result and one reward
- [ ] 4.4 Add access-scoped repositories for member history, energy, notifications, and rankings; verify a member cannot query another member's private records
- [x] 4.5 Add SQLite backup and restore scripts for the Docker data directory; verify a backup can restore members, games, energy events, referrals, and email statuses
- [x] 4.6 Implement the SQLite persistence adapter behind the database ports and keep migrations SQL-first; verify repository contract tests run against the local adapter without exposing driver row types to core

## 5. LINE authentication and feature flags

- [x] 5.1 Implement `GET /api/config` with public-only runtime settings; verify the response contains no channel secret, access token, or Resend key
- [x] 5.2 Integrate `@line/liff` initialization and external-browser login handling in the web app; verify LIFF and preview modes follow their respective feature flags
- [x] 5.3 Implement `POST /api/auth/line` with server-side ID token or access token verification and member session creation; verify invalid, expired, and wrong-channel tokens are rejected
- [ ] 5.4 Add secure session handling, CORS policy, security headers, rate limits, and request validation; verify authentication and configuration secrets are absent from client output and logs

## 6. Camera recognition and opt-in fallback

- [x] 6.1 Implement the camera adapter using MediaPipe Gesture Recognizer in video mode; verify `Closed_Fist`, `Open_Palm`, and `Victory` map to rock, paper, and scissors
- [x] 6.2 Add confidence threshold, single-hand restriction, multi-frame stability window, and `unknown` handling; verify low-confidence, no-hand, and multi-hand fixtures require retry instead of automatic submission
- [ ] 6.3 Run recognition in a Web Worker and expose model/version metadata; verify the main UI remains responsive during repeated video recognition tests
- [x] 6.4 Implement camera failure fallback gating; verify fallback is hidden when disabled, requires explicit user opt-in when enabled, and offers only the rule-allowed `manual` and/or `random` modes
- [x] 6.5 Implement manual fallback submission and backend-generated random fallback; verify random mode sends only the mode and the backend selects a legal hand
- [ ] 6.6 Verify iOS Safari, Android Chrome, and LINE LIFF camera permission flows with Playwright/device test notes; verify denied permission reaches the configured fallback or close-game state

## 7. Game API and gameplay

- [x] 7.1 Implement the server-authoritative game service and `POST /api/games/plays`; verify the server determines host hand, result, energy change, reward, and versions
- [ ] 7.2 Apply the active energy and play-limit rules atomically; verify no-energy, disabled-game, duplicate-request, and transaction-failure scenarios
- [x] 7.3 Add `GET /api/me/games` history and current-energy response; verify results are private, ordered by time, and include rule and asset versions
- [x] 7.4 Implement the web gameplay states for camera, retry, manual fallback, random fallback, result animation, energy display, and error recovery; verify the UI handles refresh and network retry without duplicate plays

## 8. MGM member referral flow

- [x] 8.1 Implement MGM global toggle and member opt-in record; verify disabled, not-opted-in, opted-in, and repeat opt-in behavior
- [ ] 8.2 Implement invitation link generation and last-valid-link attribution through onboarding completion; verify self-referral, expired-link, multi-link, and confirmed new-friend cases
- [x] 8.3 Implement one-time valid referral reward and capped energy refill; verify the invitation event, energy event, and reward are committed atomically
- [ ] 8.4 Add referral rate limits, audit fields, rejection reasons, and safe operational logging; verify repeated and malformed callbacks do not grant energy
- [x] 8.5 Implement the web MGM opt-in, invitation-link, copy/share, and reward status screens; verify users who do not opt in never see an active invite reward path

## 9. Dual leaderboards and personal rankings

- [x] 9.1 Implement invitation leaderboard scoring from validated unique MGM events; verify invalid, duplicate, and non-opted-in referrals are excluded
- [x] 9.2 Implement win leaderboard scoring from server-confirmed game results; verify client-supplied win counts cannot affect the score
- [x] 9.3 Implement masked public leaderboard responses and deterministic tie-breaking; verify LINE IDs, full names, emails, and referral details never appear
- [x] 9.4 Implement personal rankings for both invitation and win leaderboards; verify a member sees both ranks, scores, counts, and previous-rank gap, with the correct no-MGM state
- [ ] 9.5 Implement ranking snapshots or equivalent reproducible calculation metadata; verify responses include calculation time, rule version, and metric version
- [x] 9.6 Add the web leaderboard tabs and personal ranking cards; verify masked public data and the member's own ranking are displayed separately

## 10. Resend result notifications

- [ ] 10.1 Implement email recipient and consent resolution according to the confirmed product decision; verify missing or unconsented recipients produce `skipped` without failing the game
- [x] 10.2 Implement the email outbox created from a committed game result; verify the result API returns without waiting for Resend
- [x] 10.3 Integrate the Resend REST API adapter with a sending-only server secret and verified `from` domain; verify the API key is unavailable to the web container and client bundle
- [x] 10.4 Add delivery idempotency, retry limits, status transitions, and safe error summaries; verify timeout retries do not create duplicate sends
- [ ] 10.5 Add result email templates with rule/asset version and localized result content; verify template rendering escapes member-provided values
- [x] 10.6 Add member-visible notification status; verify only the owning member can view queued, sent, skipped, or failed status

## 12. Cloudflare portability verification

- [ ] 12.1 Add an adapter contract test suite for storage, token verification, mail delivery, clock, and random source; verify the domain test suite can run without Docker or Node-specific infrastructure
- [x] 12.2 Add a documented future Workers adapter map for Static Assets, D1, Queues, Worker secrets, and Resend fetch; verify each current port has one named future Cloudflare adapter target
- [x] 12.3 Verify the Docker build does not leak local filesystem or Node-only dependencies into `packages/core` and `packages/ports`; verify a dependency-boundary check fails on forbidden imports
- [x] 12.4 Add a Cloudflare migration note to README after implementation; verify it explains that Docker adapters are replaced, not copied, when moving to Workers

## 11. Integration verification and documentation

- [x] 11.1 Add domain and API tests for authentication, gameplay, energy, MGM, both leaderboards, persistence, and email outbox; verify the full test suite passes
- [ ] 11.2 Add Playwright flows for LIFF preview, camera denied with no fallback, manual fallback opt-in, random fallback opt-in, gameplay result, leaderboard masking, and personal ranking; verify the flows run against Docker services
- [ ] 11.3 Run dependency, secret, and container checks; verify `npm audit`, secret scanning, Docker health checks, and production environment validation pass
- [ ] 11.4 Run the Docker acceptance flow from a clean checkout; verify `docker compose build`, `docker compose up -d`, health endpoints, SQLite persistence after restart, and graceful shutdown
- [x] 11.5 Write root `README.md` with architecture, Docker commands, environment variables, LINE/LIFF setup, MediaPipe model asset, camera permissions, SQLite backup, feature flags, Resend setup, and test commands; verify a new developer can start the project from the README
- [x] 11.6 Write root `CHANGELOG.md` with the initial release, three-point energy rule, MGM opt-in and referral refill, dual masked leaderboards, MediaPipe model decision, fallback modes, Resend delivery, Docker runtime, and known limitations; verify every delivered capability is recorded

## 13. Localization and responsive UI

- [x] 13.1 Define `zh-TW` and `en` message dictionaries for all user-facing web copy, API error codes, camera states, fallback modes, leaderboard labels, and notification statuses; verify no production UI string is missing a locale entry
- [x] 13.2 Implement locale detection from saved user choice and browser/LIFF language with English fallback; verify unsupported languages resolve safely to English
- [x] 13.3 Add the `繁 | En` user switcher with accessible labels and persisted preference; verify a manual choice overrides auto-detection on reload
- [x] 13.4 Convert the current web shell, loading/error states, energy status, and authentication messages to the locale dictionary; verify both locales render without layout overflow
- [x] 13.5 Implement mobile-first RWD for 320px phones, landscape phones, tablets, and desktop; verify no horizontal overflow, camera/fallback controls remain reachable, and touch targets are at least 44px
- [x] 13.6 Add browser tests at 320x568, 390x844, 768x1024, and 1280x800 for locale switching and responsive layout; verify the same information architecture is preserved at every viewport
- [x] 13.7 Add light and dark theme tokens, system preference detection, persisted theme switch, and contrast coverage; verify both themes render the same controls without horizontal overflow
