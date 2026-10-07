# OurStory MM — Cloudflare edition 3.0

A standalone source project: React + Vite frontend on Cloudflare Pages; Hono API on Workers; SQL data in D1; private uploads in R2. This edition replaces the previous Next.js/SQLite filesystem deployment. It is not a ChatGPT Site and does not require Render or Supabase.

## Run on Mac

Install Node.js 24 LTS (24.13 or newer), extract the ZIP, then open Terminal inside `OurStory_MM_Cloudflare`:

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run db:local
npm run dev:all
```

Open **http://localhost:5173**. `dev:all` starts the Vite frontend and the Worker API together; this prevents the Vite `ECONNREFUSED 127.0.0.1:8787` proxy error. If you prefer separate terminals, run `npm run dev:api` first and `npm run dev` second. Local D1 and R2 persist in `.wrangler/` and do not contact your Cloudflare production resources.

Configure a Google OAuth web client. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to the Worker environment, and register `${APP_URL}/api/auth/google` as an authorized redirect URI. For local development, use the local Worker APP_URL callback as well. Sign in with the Google account whose address matches `OWNER_EMAIL`, then visit `/owner` to initialize the workspace. Restart the API after changing `.dev.vars`.

Sign-in uses Google only. Existing account records are matched by verified Google email, so their gifts and workspace ownership remain attached. The old `owner@example.com` address is a configuration placeholder. Existing users remain in the old SQLite database until you run the migration export/import steps. Do not delete `.wrangler/` to fix login errors: it contains your local data.

If the browser console reports `traditional.mjs ... use-sync-external-store ... does not provide an export named default`, stop Vite, remove only the Vite cache, and restart:

```bash
rm -rf node_modules/.vite
npm run dev:all
```

The Vite config prebundles React Three Fiber and its selector shim so this CommonJS/ESM error does not recur. If the old error remains, extract the updated ZIP again and run `npm ci` before starting.

## Included features

- Myanmar/English editor, autosave revision checks, six templates and Anniversary, Birthday, Valentine, Wedding and Graduation presets.
- Interactive 3D gift box, flowers, bear, chocolate shelf packing, ribbons, accessories, secret surprises, entrance animation and reduced-motion/static fallback.
- Photo/voice uploads, PIN protection, scheduled reveal, private recipient replies and first-opening inbox.
- Original ambient audio and consent-based YouTube player; printable QR gift cards and portable ZIP gift exports/imports.
- Basic **3,000 MMK** and Premium **5,000 MMK**, per gift per calendar month. These are manually renewed hosting purchases, not automatic card subscriptions.
- KBZPay screenshot + last six transaction digits. The admin checks actual received amount and full merchant transaction ID before approving. The application cannot independently read KBZPay transactions.
- Private receipts, owner permissions, approval/renewal/refund rules, audit trail, bounded version history and opt-in renewal/opening emails.

## Deploy and migrate

Follow **[PRODUCTION_NO_DOMAIN.md](PRODUCTION_NO_DOMAIN.md)** for a `pages.dev` staging deployment with Google sign-in. Public production OAuth requires a domain you own and can verify. Follow **[DEPLOY_CLOUDFLARE.md](DEPLOY_CLOUDFLARE.md)** for service bindings, D1 migrations, R2, secrets, backup/restore and migration from your previous project.

PIN checks and gift ZIP processing can exceed Workers Free's 10 ms CPU budget. Use **Workers Paid for live customers**, starting at $5/month plus applicable overages; D1/R2 have included allowances, not unlimited free usage. 3D rendering runs on the customer's device. Current official pricing links and quotas are in the deployment guide.

## Checks

```bash
npm run typecheck
npm test
npm run test:workers
npm run test:render
npm run test:timer
npm run build
npm run build:api
npm run test:integration
npm run test:operations
```

API integration uses workerd with actual local D1 and R2. Render checks verify bilingual markup; the Timer test creates a real bundled Fiber root. These do not replace real-device testing of WebGL, touch gestures, YouTube consent/playback, audio, printing, QR scanning or a live email delivery smoke test.

`frontend/` contains the SPA router; `components/ourstory/` contains the retained UI; `app/api/` contains framework-independent API handlers; `worker/` mounts them with Hono and runs cron jobs; `functions/api/` forwards Pages requests over a private service binding. D1 migrations are in `db/migrations/`. Wrangler configurations are separate for API and Pages.

No cloud resources have been created or deployed by this ZIP. Set your account-specific database ID, Pages name/domain, Google OAuth credentials, and optional email-job settings before deployment. Keep `.dev.vars`, `.wrangler`, migration exports, decrypted backups and encryption keys out of Git.
# our-story-mm

## Google login configuration

Google login is implemented at `/api/auth/google` with OAuth state validation, PKCE, verified email matching, and a revocable session cookie. Cancelling consent is shown separately from a failed sign-in. Integration tests mock only Google's HTTPS responses and exercise the real Worker, Pages service binding, D1 and R2.

For `https://ourstory-mm.pages.dev`, create a Google OAuth **Web application** client and register this exact redirect URI:

```text
https://ourstory-mm.pages.dev/api/auth/google
```

Set its public client ID in `wrangler.jsonc` under `vars.GOOGLE_CLIENT_ID`. Store the matching secret on **the API Worker `ourstory-mm-api`**, not just on Pages, using Cloudflare's Variables and Secrets settings or `npx wrangler secret put GOOGLE_CLIENT_SECRET --config wrangler.jsonc`. Add your account as a test user if Google's app audience is in Testing. Keep `APP_URL` equal to the site's canonical URL.

For local login, set both credentials in the ignored `.dev.vars` and also register `http://localhost:5173/api/auth/google`. Restart the Worker after changing local bindings. No real OAuth credentials are included in this project.

After configuration, deploy both the API Worker and Pages using `npm run deploy:api` and `npm run deploy:pages` (after `npm run build`). Local file edits or a Pages-only deployment do not update the API Worker. Before deployment, run `npm run typecheck`, `npm run build:api`, `npm run build`, and `npm run test:integration`.

Pages rejects `--config wrangler.pages.jsonc`. The `deploy:pages` helper reads that configuration, stages the built frontend and Pages Functions with a standard `wrangler.jsonc`, and deploys to the `main` production branch. It preserves the `API` service binding and leaves the API Worker's root configuration unchanged. Run `npm run deploy:pages -- --check` to validate the staged Pages configuration and Functions build without uploading anything.

If sign-in fails after deployment, the final login URL includes a safe `reason` such as `state_mismatch`, `token_exchange_rejected`, or `profile_request_rejected`; the Worker logs the same stage and any upstream HTTP status without authorization codes, tokens, or secrets. OAuth attempts expire after ten minutes; sign in from one tab and start again after a deployment.
