# LIFF Game Rock Paper Scissors

LIFF 猜拳活動的 Docker-first monorepo。前端使用 React/Vite，後端使用 Fastify，活動資料使用 SQLite persistent volume。核心 domain 與 Node/SQLite/Resend runtime 分離，未來可替換為 Cloudflare Workers、D1、Queues 與 Static Assets。

## Stack

- React + TypeScript + Vite
- `@line/liff` for LIFF initialization and LINE Login
- MediaPipe Gesture Recognizer for browser-side hand recognition
- Node.js + Fastify API
- SQLite + Drizzle metadata + `better-sqlite3`
- Resend REST API adapter with an idempotent email outbox
- Docker Compose + Nginx
- Vitest + Playwright

MediaPipe mapping:

- `Closed_Fist` → rock
- `Open_Palm` → paper
- `Victory` → scissors

The model runs in a Web Worker. Camera frames stay in the browser. The backend remains authoritative for the game result, energy, rewards, and rankings.

## Local development

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev:api
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` to `http://localhost:3000`.

## Docker

Copy `.env.example` to `.env` only when local overrides are needed. The Compose defaults are safe for preview mode.

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f api
docker compose down
```

The SQLite database is stored at `./data/game.sqlite` through the `./data:/app/data` volume. Do not delete this directory in production. Back it up before upgrades.

```bash
npm run db:backup
node scripts/restore-db.mjs ./data/backups/game-<timestamp>.sqlite ./data/game.sqlite --force
```

Services:

- `web`: Nginx serves the Vite build and proxies `/api` to the API service.
- `api`: Fastify, SQLite, LINE token verification, game rules, MGM, rankings, and email outbox.

## GitHub Pages demo

GitHub Pages runs the static demo profile. It does not require an API, LIFF ID, LINE secret, database, or Resend key. The included workflow builds with `VITE_DEMO_MODE=true` and publishes `apps/web/dist`.

Enable Pages in the repository settings with **GitHub Actions** as the source. A push to `main` then deploys the demo at the repository subpath.

## Cloudflare Worker

`wrangler.jsonc` is the deployment shell for the formal profile. It serves `apps/web/dist` as Static Assets and exposes `/health` and `/api/config`. D1 and Queues bindings are intentionally commented until the target Cloudflare account has real resources.

```bash
npm run build --workspace @rockpaper/web
npx wrangler types apps/worker/worker-configuration.d.ts
npx wrangler check startup
npx wrangler deploy --dry-run --env=""
npx wrangler deploy --env=""
```

Use `wrangler secret put` for LINE channel secrets and Resend keys. Do not put production secrets in `wrangler.jsonc` or GitHub Pages variables. After D1 and Queues are provisioned, add their real bindings and implement the corresponding adapters behind `packages/ports`.

## Environment variables

Use `.env.example` as the starting point. `PORT`, `API_BASE_URL`, `PUBLIC_BASE_URL`, `ALLOWED_ORIGIN`, and `DATABASE_PATH` have local defaults; they do not need to be filled for a basic preview. Docker Compose supplies its own internal values.

Public runtime settings:

- `APP_NAME`, `PUBLIC_BASE_URL`, `API_BASE_URL`
- `LIFF_ID`, `LIFF_ENABLED`
- `CAMERA_ENABLED`, `CAMERA_FALLBACK_ENABLED`
- `MGM_ENABLED`, `LEADERBOARD_ENABLED`, `EMAIL_ENABLED`
- `RULE_VERSION`, `ASSET_VERSION`

Server-only secrets:

- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM`

Never expose server-only values through Vite, `/api/config`, logs, or committed files.

## Features

- Default three energy points; each accepted play consumes one point.
- Camera play with MediaPipe Gesture Recognizer.
- Camera failure fallback is separately opt-in and supports manual or backend-generated random moves.
- MGM is globally configurable and requires member opt-in.
- Invitation links are attributed during onboarding; referral rewards require a later verified eligibility event.
- Masked invitation leaderboard and win leaderboard.
- Personal invitation and win rankings.
- Locale detection with Traditional Chinese / English switcher: `繁 | En`.
- Complete light and dark themes with system preference detection and a persisted `深 / 淺` switch.
- Mobile-first responsive layout for LIFF phone usage.
- Campaign gesture collage asset for the camera stage, versioned with the campaign manifest.
- Result email outbox with retry and idempotency support.

## Cloudflare migration boundary

The current Docker adapters are intentionally replaceable:

| Current Docker adapter | Future Cloudflare adapter |
| --- | --- |
| Vite build + Nginx | Workers Static Assets |
| Fastify runtime | Hono/Workers runtime |
| SQLite file | D1 binding |
| Local email outbox loop | Queues producer/consumer |
| `.env` secrets | Worker secrets |
| Local assets | Static Assets or R2 |

`packages/core` and `packages/ports` must stay free of Fastify, Node filesystem APIs, SQLite drivers, and Resend clients. This is what makes the future migration a runtime adapter replacement instead of a rewrite of game rules.

## Project layout

```text
apps/web       React/Vite LIFF frontend and MediaPipe worker
apps/api       Fastify API and local runtime adapters
packages/core  Pure game domain rules
packages/ports Runtime-independent interfaces
packages/config Shared public/private config schemas
openspec       Proposal, specs, design, and implementation tasks
data           Docker SQLite volume, ignored by git
```

## Verification

```bash
npm test
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

Browser responsive checks cover 320×568, 390×844, 768×1024, and 1280×800. Real iOS/Android camera permission checks still require physical devices or a CI device lab.
