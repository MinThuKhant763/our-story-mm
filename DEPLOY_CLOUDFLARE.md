# Cloudflare production deployment

For a first `pages.dev` test deployment, follow [PRODUCTION_NO_DOMAIN.md](PRODUCTION_NO_DOMAIN.md) for the step-by-step Google OAuth setup. Public production OAuth requires a domain you own and can verify. This file covers architecture, migration and disaster recovery.

## Architecture

| Service | Responsibility |
|---|---|
| Pages | React frontend and local artwork/audio |
| Pages Function `/api/*` | Same-origin forwarding using private `API` service binding |
| Hono Worker `ourstory-mm-api` | Auth, gifts, orders and permissions |
| D1 binding `DB` | Users, sessions, gifts, orders, replies and notification ledgers |
| R2 binding `MEDIA` | Private photos, voice recordings, merchant QR and payment receipts |

API `workers.dev` and preview URLs are disabled. Do not add a public R2 domain or enable `r2.dev`. Browser code contains no Cloudflare credentials or email secrets. Normal API reads also check the configured deployment address, so production bindings do not power arbitrary Pages preview addresses. Use separate resources and a separate backend APP_URL if you need functional preview environments.

## 1. Create resources

Use Node 24 LTS. From the project directory:

```bash
npm ci
npx wrangler login
npx wrangler d1 create ourstory-mm
npx wrangler r2 bucket create ourstory-mm-private
npx wrangler pages project create YOUR-PAGES-NAME --production-branch main
```

R2 activation may ask you to set up billing in the Cloudflare dashboard. Use Standard storage. Replace `YOUR-PAGES-NAME` with your chosen unique Pages project name.

Edit `wrangler.jsonc`: paste the returned D1 `database_id`, use the actual R2 bucket name, set `APP_URL=https://YOUR-PAGES-NAME.pages.dev` (or your final HTTPS custom domain), `OWNER_EMAIL` to your real owner address and `GOOGLE_CLIENT_ID` to your OAuth web client ID. Keep `LOCAL_AUTH_UNVERIFIED=false`.

Edit `wrangler.pages.jsonc`: set `name` to `YOUR-PAGES-NAME`. If you rename the API Worker, update both its `name` and the Pages `API.service` value. The Worker must be deployed before Pages can bind to it.

Production configuration files are JSON-compatible `.jsonc` files; the supplied validation/backup scripts expect JSON without added comments.

## 2. Google sign-in and database

Create a Google OAuth web client. Add `https://YOUR-APP-HOST/api/auth/google` as an authorized redirect URI (use the exact `APP_URL` from `wrangler.jsonc`). Configure the client ID in `wrangler.jsonc` and the secret on the API Worker:

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET --config wrangler.jsonc
npm run db:production
```

Paste the OAuth client secret at the prompt. Keep the secret out of source control and all `VITE_*` variables. Google sign-in does not require Resend. There is no password login or default admin password.

## 3. Build and deploy

```bash
npm run typecheck
npm run build
npm run build:api
npm run deploy:api
npm run deploy:pages
```

Optional: set `VITE_SUPPORT_EMAIL` to your public support address **before the frontend build**. This is a public contact field, not a secret. There is no server-rendered Next.js app in this edition: deploying the old `.next` folder or running `next start` is not applicable.

Sign in with the verified Google account whose email matches `OWNER_EMAIL`, then open `/owner`. Initialize the workspace, enter real KBZPay merchant details/QR and enable payments only after your own test transfer is verified. Existing accounts keep their data when you sign in with the same verified email.

For public production sign-in, configure a custom domain you own on Pages, update Worker APP_URL and the Google OAuth callback, then redeploy the Worker and Pages. Use one canonical hostname. Account and PIN cookies are Secure, HttpOnly, SameSite=Lax and host-only; moving domains requires signing in again.

The Pages build command is `npm run build`, output directory `dist`, with project-root `functions/`. Direct CLI deployment is provided. If using Git integration, explicitly configure `wrangler.pages.jsonc`/the `API` service binding in Pages settings rather than selecting the API `wrangler.jsonc` as the Pages configuration.

## 4. Move existing SQLite data

Keep your old project/data intact. Stop its server and both email workers so database and files cannot change during export. Run this script from the **new** Cloudflare project:

```bash
node scripts/prepare-sqlite-migration.mjs /absolute/path/old-project/data migration-export --service-stopped
```

This generates private SQL data and copies referenced photos, voice, receipts and merchant QR. It retains user records, gift URLs, orders, replies, history and first-opening records. Old password hashes are carried as legacy database values but are not used for sign-in; users must use Google with the same verified email. The migration revokes old sessions by omitting sessions/tokens/rate limits and preserves existing paid expiry and annual legacy quotations.

First apply all D1 migrations to a **new empty database** (`npm run db:production`), then import:

```bash
npx wrangler d1 execute DB --remote --file migration-export/database.sql --config wrangler.jsonc
node scripts/upload-migration-media.mjs migration-export
```

The SQL has an empty-database guard. Do not merge into an initialized workspace or bypass the guard. D1 import plus R2 upload is not a distributed transaction: keep the new app in maintenance mode until both finish. If SQL import fails partway, use a new empty database and retry the export; do not rerun into partially imported data. Media upload can be retried while the app remains stopped.

Compare table counts with `manifest.json`, sign in with Google using an old account's verified email, inspect owner/order status and open existing PIN-protected gift links. Confirm recipient and receipt permissions, upload/delete a new photo, test one gift restore, then switch traffic. Keep an encrypted old backup until migration is verified. Migration-export files contain personal data; keep them private.

## 5. Backup and disaster recovery

D1 Time Travel protects database state, but it is not a matching R2 media backup. Take consistent encrypted system backups as well:

1. Set `MAINTENANCE_MODE=true` in Worker vars, deploy it, and wait for in-flight requests and email jobs to finish. The app returns 503 and cron skips processing. Keep other operators/CLI scripts from changing data.
2. Generate a backup encryption key once and store it securely outside the project. Losing it makes backups unrecoverable.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
export BACKUP_KEY='YOUR_BASE64_32_BYTE_KEY'
node scripts/cloudflare-backup.mjs --maintenance-enabled
```

The script exports remote D1 and downloads every referenced private object, then writes an AES-256-GCM encrypted `.oscb` archive. It fails if an object cannot be downloaded. For a large account, schedule a maintenance window and consider a dedicated S3-compatible backup workflow; this CLI implementation downloads objects sequentially.

3. Set maintenance back to false, redeploy, and store the encrypted archive separately from the encryption key. Practice restoration, not only archive creation.

To restore:

```bash
export BACKUP_KEY='THE_ORIGINAL_KEY'
node scripts/unpack-cloudflare-backup.mjs backups/your-backup.oscb restore-export
```

Create a **new empty D1 database** and **new private R2 bucket**, update bindings, and keep maintenance on. The system SQL export includes schema: import it into the empty database, without applying application migrations first.

```bash
npx wrangler d1 execute DB --remote --file restore-export/database.sql --config wrangler.jsonc
node scripts/upload-migration-media.mjs restore-export
npx wrangler d1 execute DB --remote --file db/restore-revoke.sql --config wrangler.jsonc
npx wrangler d1 migrations list DB --remote --config wrangler.jsonc
```

Confirm the imported migration ledger and table schema match the backup version before applying future migrations. If D1 omitted its migration bookkeeping from an export, have an operator reconcile that ledger against the included schema; do not blindly rerun CREATE/ALTER migrations. Revocation SQL clears restored sessions/tokens and disables queued emails. Verify counts, gift access, media hashes/permissions, orders and the owner login, then redeploy with maintenance false. Do not restore over the existing production database.

The unpack script only writes a new local directory; remote import is an explicit operator action. Decrypted files and SQL dumps contain personal information and must be kept private. System `.oscb` backups and recipient gift `.zip` exports are different formats.

## Cost and limits — verified 7 October 2026

| Service | Included/free allowance |
|---|---|
| Workers Free | 100,000 requests/day; 10 ms CPU per invocation |
| Workers Paid | Starts at $5/month; included requests/CPU, then usage charges |
| D1 Free | 5 million rows read/day; 100,000 rows written/day; 5 GB total storage |
| R2 Standard | 10 GB-month storage; 1 million Class A and 10 million Class B operations/month; no direct R2 egress charge |

Free D1 has a smaller per-database limit than its total account allowance. Query scans and indexes count toward usage. Pages Functions are billed as Workers. Resend, domain registration and excess storage/requests can have additional costs.

**Use Workers Paid for production in this application.** PBKDF2 PIN checks, archive processing and multi-query operations can exceed free CPU/query limits. Local workerd integration passing does not prove the app fits a free-tier invocation budget. Portable gift exports are limited to 32 MB of content (imports 33 MB); system backup uses local Node rather than buffering a whole account in Worker memory.

Official references: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Pages service bindings](https://developers.cloudflare.com/pages/functions/bindings/), [D1 migration commands](https://developers.cloudflare.com/d1/reference/migrations/), [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).

## Before taking live orders

Verify Google sign-in and owner-only access, actual KBZPay payment matching, receipt privacy, expired/PIN/scheduled gift access, renewal/refund behavior and a system restore. Review the business contact/terms/privacy/retention details for your operation. Rotate leaked credentials and do not share `.dev.vars`, database exports or decrypted backups with recipients.
