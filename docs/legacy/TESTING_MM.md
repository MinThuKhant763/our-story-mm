# ဘယ်နေရာမှာ ဘယ်လိုစမ်းရမလဲ

## Recorded automated validation

Standalone edition 1.10.0: Next.js 16.3.8 / React 19.2.8 / Node 24.19.0.

- Independent dependency installation and portable lockfile: checked in 1.1.0; 1.10.0 does not change dependencies. No references to the earlier project directory.
- Production Next.js build: passed.
- TypeScript strict checks: passed.
- Unit checks: **42 passed** — calendar/date policies, Myanmar text, content validation, QR, schedule conversion and box presets; production origin protection and local development origin handling; last-six validation, leading-zero/Myanmar digits, full-ID matching and upgrade data preservation; six template IDs, monthly migration, Myanmar month-end/leap-year and active/expired renewal calculations; defaulted legacy gift configurations and validated styles/effects; occasion defaults/validation, safe sample/design application, privacy preservation and celebration dates.
- Rendered markup: **60 combinations passed** — five occasions × six templates × two languages; correct artwork/badges, escaped text, anniversary-only couple counter and sender/recipient semantics. This is static React rendering, not browser interaction QA.
- Opening-worker checks: **13 passed** — eligibility, default-off migration, one-time delivery, consent, retries, lease exclusion and no retroactive emails.
- Reminder-worker checks: **10 passed** — threshold windows, consent, verification, dry-run, stable payload/key, retry backoff/window, renewal, stale consent/expiry cancellation and worker lease exclusion; no external email calls.
- Production-server API/SSR checks: **548 passed** — five occasion presets with language-aware sample text, create/save/reload/publication/portable restore, invalid occasion rejection, legacy Anniversary fallback and ten artwork HTTP checks; private recipient replies with ownership/PIN/schedule/expiry/rate/idempotency gates, reminder preferences, accessories/flower/secret settings; four gift styles with settings including nondefault finishes/frames/stickers across create/reload/save/publication/ZIP restore and query-string demo routes, invalid style/effect/finish/frame/sticker rejection; six templates create/save/publish/portable restore, unknown template rejection, monthly purchase and active/expired renewal, retained annual quotes/expiry; new purchase/renewal prices, six-digit validation, screenshot requirement, suffix collisions, full-ID uniqueness even after refund, concurrent approval, preserved legacy quotes; real account cookies, account isolation, ignored forged platform headers, origin protection, single-use verification/reset, old-session revocation, login throttling; gift ownership, autosave revisions, media/PIN/time/expiry access, payment gates, approval idempotency, renewals/refunds, orders, voice, portable ZIP restore and deletion.
- Development login regression (1.4.0): passed — alternate local port plus localhost/127.0.0.1 registration/login/account; mismatched, external and missing origins rejected.
- Encrypted full-system backup/restore (1.9.0): passed — accounts/gifts/approved orders/full merchant transaction IDs/monthly periods/private replies/media preserved; pending reminders held for review and reminder consent paused, sessions/recovery tokens revoked, wrong key/tampering/nonempty target rejected.
- `npm audit --omit=dev`: **0 known vulnerabilities** in the prior 1.1.0 advisory check; dependencies are unchanged in 1.5.0. This is a registry advisory check, not a security audit or a guarantee.

Gift illustration fallbacks were rendered and visually inspected (all four styles). Browser interaction/WebGL visual QA could not run: the environment has no Chromium binary and browser installation did not complete. Browser/WebGL/mobile visual QA, live inbox email delivery, Docker build on a real Docker host and actual-domain HTTPS were **not performed** in the authoring environment. Run the manual steps below on staging before public launch. CI includes a Docker build, but it must run in your repository.

## Local testing steps

### Account နှင့် owner setup

1. `.env.local` မှာ `OWNER_EMAIL` သတ်မှတ်ပြီး server restart လုပ်ပါ။ Localhost မှာ `/register` သုံးပြီး owner account ဖွင့်ပါ။
2. `/owner` → Set up my workspace လုပ်ပါ။ Customer email အခြားတစ်ခုနဲ့ account ဖွင့်ပြီး owner setup/payment approval မလုပ်နိုင်ကြောင်း စစ်ပါ။
3. Account A မှာ gift create လုပ်ပါ; account B နဲ့ A ရဲ့ `/api/gifts/{id}` နှင့် media URL ကို ဖွင့်ရင် 404 ရရပါမယ်။ Incognito/အခြား browser သုံးပြီး ခွဲစမ်းပါ။
4. `/logout` မှာ Sign out ကို နှိပ်ပြီး account API 401 ဖြစ်တာ စစ်ပါ။ GET `/logout` ကို ကြည့်ရုံနဲ့ session မပျက်ရပါ။

### Myanmar editor

1. `/create` မှာ မြန်မာ / English switch နှစ်မျိုး စမ်းပါ။ Names/letter ရေးပြီး language ပြောင်းလည်း user ရေးထားတဲ့ စာသား မပြောင်းရပါ။
2. Steps ၁–၄ ကို စုံအောင်လုပ်ပါ; reload လုပ်ပြီး autosave/preferences ကျန်တာ စစ်ပါ။
3. Gift တူညီတာကို tabs နှစ်ခုဖွင့်၊ တစ်ခုမှာ save ပြီး နောက်တစ်ခုမှာ save လုပ်ရင် revision conflict ပြရပါမယ်။ နောက်မှရေးတဲ့စာက အရင်သိမ်းပြီးသားကို တိတ်တဆိတ် မဖုံးရပါ။

### 3D experiences

1. `/demo/bloom`: box ကို Open/Skip လုပ်ပါ; envelope ကို ဖွင့်/ပိတ်ပြီး စာဖတ်ကြည့်ပါ။
2. `/demo/film`: envelope အပြင် memory album ကို Next/Previous ပြောင်းပါ။ Mobile မှာ swipe လုပ်ပါ။ Desktop mouse ကို album အပေါ်ရွှေ့ရင် အနည်းငယ် tilt ဖြစ်ရပါမယ်။
3. `/demo/night`: ကြယ်ကို နှိပ်ပြီး timeline title/date/note ပြောင်းတာ စစ်ပါ။ ကိုယ်ပိုင် gift မှာ placeholder/demo မှတ်တမ်းတွေ အစား ကိုယ်ရေးထားတဲ့ memories ဖြစ်ရပါမယ်။
4. `/demo/scrapbook`: photo flip/View photo နှင့် အောက်က full timeline စမ်းပါ။ `/demo/aurora`: photo Next/Previous/enlarge၊ journey stops ကို ရွေးပြီး note အပြည့်ဖတ်ပါ။ `/demo/garden`: ပန်းရွေးပြီး note ပြောင်းတာ စမ်းပါ။ Demos အားလုံးသည် sample names/content ဖြစ်ပြီး ကိုယ်ပိုင် gift တွင် actual content ဖြစ်ရပါမယ်။
5. `/create` step 4: box/ribbon colors/initials ပြောင်းပြီး Try opening your gift စမ်းပါ။ Save/reload လုပ်ပြီး custom box တူရပါမယ်။
6. Actual uploaded photos၊ 8,000-character letter၊ long Myanmar names၊ 1/10/30 photos နှင့် 0/1/5 timeline entries စမ်းပါ။ Album caption ရှည်ရင် layout မပျက်ရပါ; timeline/full letter မှာ content ပြည့်ပြည့်စုံစုံ ဖတ်ရပါမယ်။
7. OS Reduce Motion ကိုဖွင့်ပါ။ WebGL disabled စမ်းပါ။ Static box/Skip option ကနေ gift ကို ဖတ်နိုင်ရပါမယ်။ Gift ရဲ့ Reduce motion checkbox နဲ့ album tilt/page animation ကို ရပ်နိုင်ရပါမယ်။
8. 320px/375px mobile width, Android Chrome, iPhone Safari, keyboard-only စမ်းပါ။ Audio က ကိုယ်တိုင် Play နှိပ်မှ ဖွင့်ရပါမယ်။

### Order status နှင့် payment

1. `/owner` မှာ **staging-only merchant details** ကို သတ်မှတ်ပါ။ Real money မလွှဲပါနဲ့; API/payment review test အတွက် operator ကြီးကြပ်မှုရှိရပါမယ်။
2. Customer က receipt/reference တင်ပြီး `/orders` မှာ In review ပြတာ စစ်ပါ။ Last-six reference တူတာကို လက်ခံသော်လည်း one pending order per gift ကို ပိတ်ရပါမယ်။ Full merchant transaction တစ်ခုကို orders နှစ်ခုတွင် approve မလုပ်နိုင်ရပါ။
3. Owner → Payment reviews: amount mismatch ကို မအတည်ပြုနိုင်ရပါ။ Approved ပြီးရင် customer က ကိုယ်တိုင် Review & publish လုပ်ရပါမယ်။
4. Approve ကို retry လုပ်ရင် hosting time ဒုတိယအကြိမ် မတိုးရပါ။ Renewal pending က existing active gift access ကို မပိတ်ရပါ။
5. Monthly purchase သည် approval မှ မြန်မာအချိန် calendar month ၁ လ၊ active renewal သည် existing expiry မှ ၁ လ ဖြစ်ရပါမယ်။ Expired renewal သည် approval မှ စရပါမယ်။ အဟောင်း pending annual orders သည် မူလ amount/365-day quote ကို ထိန်းရပါမယ်။
6. Unpublish/refund လုပ်ပြီး public link/media ကို incognito မှာ ပြန်ဖွင့်ရင် access ပျက်ရပါမယ်။ Refund record က payment provider မှ အမှန်တကယ် money refund ကို မလုပ်ပေးပါ။

### PIN၊ schedule၊ expiry

1. PIN ထည့်ထားတဲ့ gift ကို incognito မှာ ဖွင့်ပါ။ JSON/media ကို PIN မထည့်ဘဲ တိုက်ရိုက်ယူလို့ မရရပါ။
2. PIN မှားတာ ၈ ကြိမ်ကျော်လုပ်ရင် 15-minute limit ပြရပါမယ်။ Lockout က gift တစ်ခုလုံးအလိုက်ဖြစ်ပြီး client IP header ပြောင်းရုံနဲ့ မကျော်နိုင်ရပါ။
3. Myanmar time နဲ့ နောင် ၅ မိနစ်ကို schedule ထားပါ။ Owner preview ရပေမယ့် recipient က countdown ပဲ မြင်ရပါမယ်။ Time မရောက်မချင်း unlock/photo/audio ပိတ်ရပါမယ်။
4. Hosting မကုန်ခင် reveal ဖြစ်ရပါမယ်; invalid schedule ကို server က reject လုပ်ရပါမယ်။

### Backup / recovery

1. `/account` → gift ZIP export လုပ်ပြီး restore လုပ်ပါ။ Photos/voice/letter/box ပြန်ရပြီး fresh draft/token ဖြစ်ရပါမယ်။ PIN/payment entitlement မပါရပါ။
2. Staging server မှာ encrypted full-system backup လုပ်ပါ။ New empty volume/folder ကို restore လုပ်ပြီး accounts၊ gifts၊ orders နဲ့ uploaded files အားလုံး အမှန်ရှိကြောင်း စစ်ပါ။
3. Wrong key/tampered backup ကို reject လုပ်ရပါမယ်။ Existing data directory ကို overwrite မလုပ်ရပါ။
4. Restore ပြီး အဟောင်း login/PIN-viewer/reset sessions ကို မသုံးနိုင်ရပါ; ပြန် sign in/unlock လုပ်ရပါမယ်။

## Automated commands

```bash
npm ci
npm run typecheck
npm test
npm run test:render
npm run test:reminders
npm run build
npm run test:integration
npm run test:dev-auth
node tests/operations.mjs
npm audit --omit=dev
```

Integration tests က random temp directory နှင့် localhost port 3217 ကို သုံးပါတယ်။ Port ယူထားရင် `TEST_PORT` ကို ပြောင်းနိုင်ပါတယ်။ Production database/account/merchant ကို မသုံးပါ။

Login address mismatch ဖြေရှင်းနည်းနှင့် safe update steps: [LOGIN_FIX_MM.md](LOGIN_FIX_MM.md)။

New payment-flow manual checks: [PAYMENTS_MM.md](PAYMENTS_MM.md).

Six templates / monthly rules and safe source upgrade: [TEMPLATES_MONTHLY_MM.md](TEMPLATES_MONTHLY_MM.md).

Gift collection/design checks: [GIFT_COLLECTION_MM.md](GIFT_COLLECTION_MM.md).

New feature setup and exact test steps: [REPLIES_REMINDERS_SURPRISES_MM.md](REPLIES_REMINDERS_SURPRISES_MM.md).

Source package coverage: every current app route, component, library module, migration, public asset, script, test and guide is included and hash-checked. The portable restore API omission in the earlier ZIP is corrected in 1.4.0.

The final 1.4.0 source ZIP was extracted into an isolated folder and passed a production build plus all 340 API checks, reusing the installed dependency directory only. No runtime source files were omitted.

Version 1.5.0 presets, artwork paths, generation prompts and staging QA: [OCCASIONS_ARTWORK_MM.md](OCCASIONS_ARTWORK_MM.md). Ten generated artworks were visually inspected and shipped as local 1200px WebP assets. No live email, public deployment or mobile/WebGL browser testing was performed in this update. Development-auth and encrypted-operations results above are retained from 1.4.0; those handlers are unchanged.

The 1.5.0 source ZIP was also extracted into an isolated folder and passed the production build and all 405 API checks, reusing only installed dependencies. Final documentation adds this validation record; runtime source matches the tested extract.

Version 1.6.0: [DESIGN_INTERACTIVE_MM.md](DESIGN_INTERACTIVE_MM.md). Additional static checks pass for ten recipient entrance/language combinations (escaped names, story withheld before opening), five finish/frame/sticker illustrations and homepage rendering without a server-side overlay. Rotation bounds, all 36 visual option combinations and forged values are validated. Entrance-envelope CSS is scoped to preserve the existing story letter envelope. No actual mobile/browser/WebGL gesture visual QA, live email or public deployment was performed. Development-auth validation above remains the recorded 1.4.0 result; authentication handlers are unchanged.

The 1.6.0 source ZIP was extracted into a clean folder and passed strict TypeScript, 34 domain tests, all static rendering checks, the production build and all 408 API checks. Only installed dependencies were shared. The runtime source and tests match that extract; the final documentation adds this validation record. The package contains 158 hash-verified source/assets/guide files including the portable restore route.

Version 1.7.0 music checks: silent legacy defaults, strict YouTube URL normalization/host validation, volume/source validation; initial markup contains no YouTube iframe, both-language ambient controls and no autoplay; three WAV assets decoded and checked for sample rate/duration/nonzero sound/no clipping/zero loop boundaries. API tests cover music save/reload/publication/ZIP restore, malicious URLs/volume rejection, audio HTTP delivery and iframe CSP/referrer headers. Playback/device audio quality/live YouTube availability still require browser QA. See [MUSIC_MM.md](MUSIC_MM.md).

The 1.7.0 source archive was extracted into a clean folder and passed production build, 436 API checks and all rendered-markup checks, sharing only installed dependencies. The final minimum-width CSS refinement also passed a fresh production build. Runtime source/assets/tests match the verification folder. The final archive contains 167 hash-verified files; no customer data, credentials or build caches are included.

Version 1.8.0 validation: fresh source extraction passed production build and **474 API checks**. **37 domain tests**, typecheck, bilingual rendered-markup tests, and encrypted system backup/restore passed. New API coverage checks owner-only history, missing/stale revision rejection, writing/template/music restore, unchanged PIN/schedule/status/hosting fields, reversible restore, 20-version retention and cascading deletion. The full-backup test now asserts history preservation. Music start validation checks defaults, bounds and embed parameters. Real browser YouTube playback, QR scanning and printing remain manual QA tasks. No new dependencies were introduced. The archive contains 172 source/asset/documentation files with SHA-256 manifest verification and excludes private data, credentials and build caches.

Version 1.9.0 gift opening validation: a fresh extracted source folder passed production build and **526 API checks**. **13 opening-worker tests**, 37 domain tests, 10 renewal-worker tests, typecheck, bilingual SSR markup and encrypted full-system backup/restore passed. Opening API coverage includes owner preview exclusion, GET/page requests not creating records, anonymous PIN/schedule/expiry/draft/origin gates, five parallel reports creating one event, authenticated owner-only inbox/read actions, stable first-open/read timestamps, old PIN revision rejection, disabled email preference, gift-delete cascade and fresh-draft import without opening history. Worker tests cover default-off migration for old accounts, current consent and verified-account gates, unavailable gifts, no retroactive email, stable retry payload/key, five-attempt and 23-hour review holds, overlap leases, mid-batch opt-out, English/Myanmar messages and read-state independence. Full backup/restore preserves opening records while holding pending opening emails and resetting consent. No real emails were sent by tests; Resend transport uses stubbed providers in automated tests. Actual gift clicks, mobile layout, dashboard polling and real configured email delivery require browser/device QA. No new dependencies were added. The final source archive contains 182 hash-verified files and excludes credentials, customer data and generated build caches.

Version 1.10.0 Little Gift Shop: a fresh archive extraction passed production build and **548 API checks**. **42 domain tests** and bilingual rendered-markup checks passed. New domain checks cover legacy disabled/empty defaults, bounded catalog/slots, duplicate rejection, deterministic swap/replace/remove, immutable packing sequences and preservation across occasion changes. API checks verify create/save/reload/publication, history snapshot/restore, portable gift ZIP import, invalid catalog/position rejection and disabled-shop retention. Render tests cover all shelf cards and placement controls, keyboard-accessible buttons/live announcements, recipient placement summaries and unchanged older gifts. Original SVG shelf illustrations were rendered and visually inspected. No new dependency or SQL migration is required. Real-browser WebGL, orbit controls, shelf drag/drop, touch placement, animation and mobile layout still require manual QA; this authoring environment did not run browser/device visual tests. The final archive contains **188** hash-verified source/asset/documentation files and excludes data, credentials and build caches.

Version 1.10.1 presentation hotfix: removes the floating heart sticker from the homepage interactive hero. Typecheck, existing bilingual render checks and a production build from a fresh archive extraction passed. API behavior and saved gift data are unchanged; the 548 API checks recorded above belong to 1.10.0 and were not repeated for this presentation-only patch. Manual check: homepage → Anniversary → Forever flowers; the bouquet should have no floating heart badge. Browser/WebGL visual QA remains manual.

Version 1.10.2 timing compatibility fix: typecheck, bilingual rendered-markup checks, two Timer regression tests and a production build from a fresh ZIP extraction passed. Regression tests bundle the actual pinned Fiber renderer through the project Webpack hook and verify Timer-backed root construction without the Clock deprecation warning, unchanged Three constructor identity, seconds/elapsed values, auto-start, stop/restart, demand/never switching and manual frame deltas. Tests use a renderer stub; this is not browser/WebGL animation QA. The source archive contains 192 hash-verified files. No dependency or SQL migration was added. API behavior is unchanged; the historical 548 API checks were not repeated for this renderer-only compatibility fix. Real homepage rotation, recipient opening and gift-shop interaction remain manual browser/device checks.

Version 1.10.3 hydration compatibility: root layout now accepts DOM-only attributes injected by browser extensions (for example `crxlauncher`) without suppressing mismatch detection inside the app. Typecheck, render checks, timer tests and a fresh production build passed. Private-window/extension-disabled browser QA remains recommended.
