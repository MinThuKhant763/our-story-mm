# Production deployment: Cloudflare Pages + Google sign-in

This guide deploys the current OurStory project to a free `pages.dev` address, a private Cloudflare Worker API, D1 and R2. It uses Google OAuth; there is no email/password sign-in. Treat the `pages.dev` deployment as staging/testing: Google’s production OAuth policies require a public homepage and verified domain ownership. For public sign-in, use a custom domain you control. Cloudflare settings live in `wrangler.jsonc` and `wrangler.pages.jsonc`. The `.env.production.example` file is for the older Docker setup and is not read by this Cloudflare deployment.

## Before you start

- A Cloudflare account with Workers & Pages access.
- A Google account to create OAuth credentials.
- Node.js 24.13 or newer.
- This project folder and its dependencies installed.
- The production owner’s Google email address. It must match `OWNER_EMAIL` exactly.

## 1. Install dependencies and sign in to Cloudflare

From the project directory:

```bash
npm ci
npx wrangler login
```

Approve Wrangler in the browser. Then check that it sees the correct Cloudflare account:

```bash
npx wrangler whoami
```

## 2. Create the production resources

Create a D1 database and private R2 bucket:

```bash
npx wrangler d1 create ourstory-mm
npx wrangler r2 bucket create ourstory-mm-private
```

Copy the D1 `database_id` printed by Wrangler. Then create a Pages project using a unique lowercase name:

```bash
npx wrangler pages project create Ourstory-mm -production-branch main
```

The production address will be `https://YOUR-PROJECT-NAME.pages.dev`. Save the exact name and URL. R2 may ask you to set up billing; keep the bucket private and do not enable `r2.dev`.

## 3. Point the project configuration at those resources

Edit `wrangler.jsonc`:

- Set `name` to the API Worker name. It is `ourstory-mm-api` by default.
- Set `APP_URL` to the exact Pages URL, such as `https://YOUR-PROJECT-NAME.pages.dev`.
- Set `OWNER_EMAIL` to the Google account email that will own the workspace.
- Set `GOOGLE_CLIENT_ID` to the OAuth web client ID after creating it in step 4.
- Replace the D1 `database_id` with the ID returned in step 2.
- Keep `database_name` and `bucket_name` consistent with the resources you created.
- Keep `LOCAL_AUTH_UNVERIFIED` and `MAINTENANCE_MODE` set to `false`.

Edit `wrangler.pages.jsonc` and set `name` to the exact Pages project name. Keep the `API.service` value as `ourstory-mm-api` unless you also changed the Worker name.

Do not put `GOOGLE_CLIENT_SECRET` or other secrets in either Wrangler file. Keep the Worker API private; the Pages Function forwards `/api/*` requests through a service binding.

## 4. Create the Google OAuth web client

In [Google Cloud Console](https://console.cloud.google.com/):

1. Select or create a Google Cloud project.
2. Configure the OAuth consent screen / Google Auth Platform with the application name, support email, public homepage, privacy policy (`/privacy`), terms (`/terms`) and audience required for your rollout. Add test users if the app remains in testing mode.
3. Create an OAuth client with application type **Web application**.
4. Add this exact **Authorized redirect URI**:

   ```text
   https://YOUR-PROJECT-NAME.pages.dev/api/auth/google
   ```

   It must exactly match `APP_URL` plus `/api/auth/google`, including the scheme, hostname, path, and trailing-slash choice. Register another URI if you later switch to a custom domain. Google documents that the redirect URI must match the registered value exactly: [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server).

5. Copy the OAuth client ID into `GOOGLE_CLIENT_ID` in `wrangler.jsonc`.
6. Save the OAuth client secret for step 7. Do not commit it or expose it in a `VITE_*` variable.

While the consent screen is in **Testing**, Google limits access to configured test users (up to 100), and their authorization expires after seven days. This is suitable for a staging deployment. Before public production, use a domain you own for the app homepage, privacy policy, terms and OAuth callback; verify it in Google Search Console, then publish the OAuth app and complete any verification Google requires. Google describes these requirements in its [OAuth production readiness policy](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance) and [brand verification guide](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification).

## 5. Initialize the database

Apply all project migrations to the newly created production database:

```bash
npm run db:production
```

Use only a new, empty database for the initial deployment. This command targets the remote D1 database configured in `wrangler.jsonc`.

## 6. Check the production configuration and deploy the API

The production deploy command checks the real HTTPS URL, owner email, Google client ID, production auth setting, and D1 ID before deploying. Run:

```bash
npm run typecheck
npm run build:api
npm run deploy:api
```

The Worker must deploy before Pages because the Pages project uses a service binding to it. It intentionally has no public `workers.dev` address.

## 7. Store the OAuth secret and deploy Pages

After the first API Worker deployment, securely upload the Google OAuth client secret:

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET --config wrangler.jsonc
```

Paste the secret when Wrangler prompts. Wrangler stores it as an encrypted Worker secret and publishes a new Worker version. Keep the secret out of source control and frontend variables. See [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

Optionally set a public support address before the build. This value is compiled into the public frontend and must not be a secret:

```bash
export VITE_SUPPORT_EMAIL='support@example.com'
```

Build and deploy Pages:

```bash
npm run build
npm run deploy:pages
```

Use this npm script rather than `wrangler pages deploy --config wrangler.pages.jsonc`: Pages does not accept custom configuration paths. The script stages the Pages configuration under its standard filename, retains the API service binding, and targets the production branch `main`. Run `npm run deploy:pages -- --check` first for a local configuration and Functions build check without deploying.

If Wrangler fails while retrieving `/accounts`, set `CLOUDFLARE_ACCOUNT_ID` to the 32-character Account ID from the Cloudflare dashboard. Alternatively, add `account_id` to `wrangler.pages.jsonc`; the deployment helper forwards it through the supported environment variable. This skips automatic account discovery, but does not bypass authentication or resolve errors from other API endpoints.

Open `https://YOUR-PROJECT-NAME.pages.dev`. If using Cloudflare Git integration instead of CLI deployment, configure the project-root Pages Function and service binding from `wrangler.pages.jsonc`; do not use the API Worker config as the Pages config.

## 8. Verify Google sign-in and initialize the owner workspace

1. Open `/api/health` on the production Pages URL. It should return `{"status":"ok"}`.
2. Open `/login` and choose **Continue with Google**.
3. Sign in using the account whose verified email matches `OWNER_EMAIL`.
4. Confirm that you land in the dashboard and can create a draft gift.
5. Open `/owner` and choose **Set up my workspace**. The first account whose email matches `OWNER_EMAIL` receives owner access.
6. Confirm other Google accounts cannot initialize or administer the workspace.

Existing account records are matched by verified Google email, preserving gifts and workspace ownership. Password login and registration endpoints are disabled.

## 9. Configure payments only after a real test

In `/owner`, enter the provider-approved merchant name, account details and instructions, then upload the merchant QR. Keep payment submissions disabled until these settings are reviewed. A screenshot is not payment confirmation: for a small test, compare the complete transaction ID and exact received amount in the merchant account before approving it.

The app does not connect automatically to KBZPay or Wave. Review the business contact details, support hours, refund terms and privacy/retention policies before accepting real customer orders.

## 10. Set up backups and keep production credentials safe

- Keep `.dev.vars`, OAuth secrets, D1 exports and decrypted backups out of source control.
- Keep the R2 bucket private; do not enable public R2 access.
- Keep an encrypted system backup and store the backup encryption key separately. Follow [Cloudflare deployment and disaster recovery](DEPLOY_CLOUDFLARE.md) for backup and restore steps.
- Test the site from a phone and a separate browser before sharing it. Check sign-in, private uploads, PIN-protected gifts, payment submission and account isolation.
- Before changing domains, add the new callback URL to Google OAuth, change `APP_URL`, redeploy the Worker and Pages, then sign in again. For public production, choose a domain you own and can verify with Google.

## Troubleshooting

| Symptom | Check |
|---|---|
| `redirect_uri_mismatch` | Google’s authorized redirect URI must equal `APP_URL/api/auth/google` exactly. |
| Login page says Google is not configured | Set `GOOGLE_CLIENT_ID` in `wrangler.jsonc`, store `GOOGLE_CLIENT_SECRET` as a Worker secret, and redeploy. |
| API health returns 503 | Confirm the D1 migrations, D1 ID, R2 bucket binding and Pages-to-Worker service binding. |
| Sign-in succeeds but owner setup is denied | The signed-in Google account’s verified email must exactly match `OWNER_EMAIL`. |
| A non-owner can access the admin view | Stop accepting traffic and review the owner record in D1 before continuing. |

For moving data from the previous SQLite deployment, use the migration procedure in [DEPLOY_CLOUDFLARE.md](DEPLOY_CLOUDFLARE.md) before switching production traffic.
