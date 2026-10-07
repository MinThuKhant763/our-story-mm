# ကိုယ်ပိုင် Server ပေါ် Deploy လုပ်နည်း

ဒီ ZIP က source project အပြည့်ဖြစ်ပြီး hosting service သီးခြား ဝယ်ယူ/ပြင်ဆင်ရပါမယ်။ လက်ရှိ code အတွက် **single VPS + Docker Compose + persistent volume** ကို အကြံပြုပါတယ်။ Singapore region ရှိတဲ့ VPS ကို Myanmar မှာရှိတဲ့ စမ်းသပ်အသုံးပြုသူတွေကနေ latency တိုင်းပြီး ရွေးပါ။ DigitalOcean Droplet က ရွေးချယ်စရာတစ်ခုပါ။ VPS အစမ်းအတွက် 2 vCPU / 4 GB RAM ကနေ စတင်နိုင်ပေမယ့် build နဲ့ traffic ကို တိုင်းပြီး resources တိုးရပါမယ်။ လစဉ်ဈေးနှုန်းကို provider မှာ ဝယ်ယူခါနီး ပြန်စစ်ပါ။

## ၁။ ကြိုတင်လိုအပ်ချက်

- ကိုယ်ပိုင် domain နှင့် DNS access။
- Linux VPS၊ SSH key၊ Docker Engine နှင့် Compose plugin။ Installation ကို https://docs.docker.com/engine/install/ မှာ server OS နဲ့ ကိုက်တဲ့ လမ်းညွှန်အတိုင်း လုပ်ပါ။
- ကိုယ်ပိုင် verified sender domain ပါတဲ့ Resend account; API key နှင့် sender address။ SPF/DKIM records ပြင်ဆင်ပြီး တကယ့် inbox တွေဆီ delivery စမ်းရပါမယ်။
- Merchant owner email၊ support email၊ provider-approved payment account/QR။
- Off-site encrypted backup သိမ်းမယ့်နေရာနှင့် backup encryption key ကို သီးခြားလုံခြုံစွာ သိမ်းဖို့ password manager။

## ၂။ Server နှင့် DNS ပြင်ဆင်ခြင်း

1. VPS အတွက် SSH key သုံးပါ။ OS security updates တင်ပါ။
2. SSH port ကို သင့်စီမံခန့်ခွဲရေး IP များအတွက်ပဲ ခွင့်ပြုပါ။ HTTP 80 နှင့် HTTPS 443 ကို ဖွင့်ပါ။ Docker publishing က host firewall policy ကို ကျော်နိုင်တဲ့အတွက် provider firewall ကိုလည်း စစ်ပါ။
3. Domain ရဲ့ A record ကို VPS IPv4 address သို့ညွှန်ပါ။ AAAA record ရှိရင် IPv6 ကလည်း VPS သို့ မှန်ကန်စွာ ရောက်ရပါမယ်။
4. ဒီ project ကို server ပေါ် upload လုပ်ပြီး project folder ထဲ ဝင်ပါ။ Source ကို private Git repository မှာလည်း ထားနိုင်ပါတယ်။

## ၃။ Production settings

```bash
cp .env.production.example .env
chmod 600 .env
```

`.env` ကို ပြင်ပြီး အောက်ပါ values ဖြည့်ပါ။

| Variable | ဖြည့်ရမယ့်အချက် |
| --- | --- |
| `DOMAIN` | `gifts.your-domain.com` — scheme/path မပါ |
| `APP_URL` | `https://gifts.your-domain.com` — တကယ့် browser origin နဲ့ တူရမယ် |
| `TLS_EMAIL` | Certificate သက်ဆိုင်ရာ notification email |
| `OWNER_EMAIL` | Owner အဖြစ် register/verify လုပ်မယ့် email; lowercase သုံးပါ |
| `SUPPORT_EMAIL` | Customer support email |
| `RESEND_API_KEY` | Server-only email API key |
| `EMAIL_FROM` | Verified sender, ဥပမာ `OurStory <accounts@your-domain.com>` |
| `LOCAL_AUTH_UNVERIFIED` | Production မှာ `false` |
| `DATA_VOLUME_NAME` | Persistent Docker volume name; staging နှင့် production မတူရပါ |
| `BACKUP_KEY` | base64 encoded random 32-byte key |

Backup key ကို ကိုယ့်စက်မှာ generate လုပ်နိုင်ပါတယ်။ Output ကို password manager နဲ့ `.env` ထဲမှာ သိမ်းပြီး chat/log/public repository ထဲ မတင်ပါနဲ့။

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

App က Docker volume `/app/data` မှာ database နှင့် private media ကို သိမ်းပါတယ်။ Media ကို `public/` ထဲ မရွှေ့ပါနဲ့။ `docker compose down -v` က persistent volumes ကို ဖျက်နိုင်လို့ လည်ပတ်နေတဲ့ deployment မှာ မသုံးပါနဲ့။

## ၄။ Build နှင့် start

```bash
mkdir -p backups
sudo chown 1001:1001 backups
chmod 700 backups
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Caddy က DNS နှင့် ports မှန်ရင် certificate ကို ရယူပြီး HTTPS ကို စီမံပါတယ်။ App port 3000 ကို public internet သို့ publish မလုပ်ထားပါ။ `.env` values အားလုံးကို ထုတ်ပြတဲ့ `docker compose config` output ကို share မလုပ်ပါနဲ့; `--quiet` သုံးပါ။

```bash
curl -fsS https://gifts.your-domain.com/api/health
docker compose logs --tail=100 app caddy
```

Logs မှာ token၊ password၊ receipt သို့မဟုတ် customer content မပါဖို့ ဆက်စစ်ပါ။ Reverse proxy access logs မဖွင့်ထားပါ; verification/reset token query strings တွေကို log မသိမ်းပါနဲ့။

## ၅။ Owner နှင့် staging စမ်းသပ်ခြင်း

1. `/register` မှာ `OWNER_EMAIL` ကို သုံးပြီး owner account ဖွင့်ပါ။
2. ရောက်လာတဲ့ verification email link ကို ဖွင့်ပြီး **Verify email** ကို နှိပ်ပါ။ GET link ဖွင့်ရုံနဲ့ token ကို မသုံးသေးပါ။
3. `/login` မှာဝင်ပြီး `/owner` မှာ workspace setup လုပ်ပါ။
4. Customer account သီးခြားတစ်ခုနဲ့ register/verify လုပ်ပါ။ Customer က `/owner` setup/approval ကို မလုပ်နိုင်ရပါမယ်။
5. `TESTING_MM.md` အတိုင်း templates၊ mobile၊ PIN၊ scheduled reveal၊ receipt review၊ refund revocation နဲ့ backup restore စမ်းပါ။
6. Customer registration ကို verify မလုပ်မချင်း sign-in မရနိုင်တာ၊ password reset ပြီး session အဟောင်းတွေ ပယ်ဖျက်တာ စစ်ပါ။
7. Production readiness အချက်အားလုံး ပြည့်ပြီးမှ merchant payments enable လုပ်ပါ။

## ၆။ Backup နှင့် restore

Portable gift ZIP က individual gift အတွက်ပဲ ဖြစ်ပါတယ်။ Accounts/payment ledger အပြည့်ကို ပြန်ရဖို့ encrypted system backup လိုပါတယ်။ ဒီ script က database နှင့် media တူညီတဲ့ အချိန်အနေအထားဖြစ်ဖို့ **app ကို ခဏရပ်ပြီး** backup လုပ်ရပါတယ်။ Zero-downtime backups မဟုတ်ပါ။

```bash
docker compose --profile reminders --profile openings stop app reminders openings
docker compose --profile tools run --rm operations node scripts/backup.mjs --service-stopped
docker compose start app
```

Failure ဖြစ်ရင်လည်း app ကို ပြန်စဖို့ operations runbook/monitoring ထားပါ။ `backups/*.osb` ကို သီးခြား server/object storage သို့ copy လုပ်ပြီး daily retention နှင့် monthly restore drill စီစဉ်ပါ။ Backup encryption key ကို backup file နဲ့ တစ်နေရာတည်းမှာပဲ မထားပါနဲ့။ Key ပျောက်ရင် restore မရနိုင်ပါ။

Restore က **empty data directory** ကိုပဲ လက်ခံပါတယ်။ ပျက်နေတဲ့ data ကို မဖျက်ဘဲ အရင်သီးခြားသိမ်းပါ။ Host မှာ portable source ရှိပြီး Docker volume ကို mount/export လုပ်နိုင်တဲ့ operator က restore command ကို သုံးရပါမယ်။ အလွယ်ဆုံး restore drill အဖြစ် ကိုယ့်စက်မှာ `.osb` ကို ကူးပြီး အောက်ပါ command သုံးပါ။

```bash
DATA_DIR=./restored-data BACKUP_KEY='your-original-key' node scripts/restore.mjs ./backups/your-file.osb --service-stopped
```

Production recovery မှာ `.env` ထဲမှာ key ရှိပြီးသားကို သုံးပါ။ `DATA_VOLUME_NAME` ကို volume အသစ်နာမည်သို့ ပြောင်းပြီး restore လုပ်နိုင်ပါတယ်။ နာမည်အဟောင်းကို အရင်မှတ်ထားပါ; volume အဟောင်းကို မဖျက်ပါနဲ့။

```bash
docker compose --profile reminders --profile openings stop app reminders openings
# Edit .env: DATA_VOLUME_NAME=ourstory-mm-recovery-YYYYMMDD
# Keep the original BACKUP_KEY unchanged.
docker compose --profile tools run --rm operations node scripts/restore.mjs /app/backups/your-file.osb --service-stopped
docker compose up -d app
```

New empty volume မှာ permissions ကို image မှ copy လုပ်ပေးပါတယ်။ Restore ပြီး မအောင်မြင်ရင် app ကို ပြန်မစခင် error ကို စစ်ပါ; လိုအပ်ရင် `.env` ရဲ့ volume name ကို အဟောင်းသို့ ပြန်ပြောင်းနိုင်ပါတယ်။ New volume name ကို နောက်တစ်ကြိမ် update လုပ်တဲ့အခါလည်း ဆက်သုံးရပါမယ်။ ဒီလုပ်ဆောင်ချက်ကို staging မှာ အရင် စမ်းပါ။ Restore က session/PIN-viewer/recovery tokens အဟောင်းတွေကို ဖျက်ပြီး accounts၊ gifts၊ uploads နဲ့ payment records ကို ထိန်းထားပါတယ်။ Database/app version ကို backup နဲ့ ကိုက်ညီအောင် အရင်ပြန်တင်ပြီးမှ migration အသစ်တွေကို apply လုပ်ပါ။

## ၇။ Routine maintenance / updates

Daily host cron ကနေ expired sessions နှင့် rate-limit records ရှင်းနိုင်ပါတယ်။ Gift/photos/receipt retention ကို ဒီ maintenance script က မဖျက်ပါ။

```bash
docker compose --profile tools run --rm operations node scripts/maintenance.mjs
```

Update ခါနီး encrypted backup လုပ်ပါ။ Source အသစ်နဲ့ lockfile အတူတင်ပါ၊ CI/tests အောင်မြင်ရပါမယ်။ `docker compose up -d --build` နဲ့ application ကို replace လုပ်နိုင်ပြီး data volume တူနေပါမယ်။ Applied SQL migration ဖိုင်ကို ပြန်မပြင်ပါနဲ့; migration အသစ် ထပ်ရေးပါ။ Migration checksum က ပြင်ထားတဲ့ history ကို တွေ့ရင် storage startup ကို ရပ်ပေးပါတယ်။ Database migration ပြီးနောက် code rollback တစ်ခုတည်းနဲ့ မလုံလောက်နိုင်ပါ; restore/version plan လိုပါတယ်။

## Hosting ရွေးချယ်မှု နှိုင်းယှဉ်ချက်

| Hosting | ဒီ ZIP အတွက် |
| --- | --- |
| Persistent VPS + Docker | အဓိက target; DB/media volume + Caddy ပါပြီးသား |
| Managed container + persistent disk | ဖြစ်နိုင်ပေမယ့် Docker environment/volume path/single-instance ကို ကိုယ်တိုင်ချိန်ရမယ်; Compose file ကို တိုက်ရိုက်တင်လို့မရနိုင် |
| Vercel / static hosting | ဒီ filesystem/SQLite version ကို အတိုင်း deploy မလုပ်ပါနဲ့; external database/storage adapter နဲ့ architecture ပြောင်းပြီးမှ သုံးပါ |
| Kubernetes / autoscaling replicas | SQLite/local media ကို shared service database/object storage သို့ ရွှေ့ပြီး rate-limit/transaction design ပြန်စစ်မှ သုံးပါ |

References: Next.js self-hosting https://nextjs.org/docs/app/guides/self-hosting ; Docker https://docs.docker.com/compose/ ; Caddy https://caddyserver.com/docs/automatic-https ; DigitalOcean regions https://docs.digitalocean.com/platform/regional-availability/ ; Render disks https://render.com/docs/disks ; Resend https://resend.com/docs/api-reference/emails/send-email .

Version 1.4.0 optional reminder worker requires `REMINDERS_ENABLED=true`, account consent and configured Resend delivery. Read [REPLIES_REMINDERS_SURPRISES_MM.md](REPLIES_REMINDERS_SURPRISES_MM.md). Stop the reminder worker together with the app for cold backups/restores.

Version 1.9.0 opening notifications: [GIFT_OPENING_MM.md](GIFT_OPENING_MM.md). Cold backup/restore မလုပ်ခင် app၊ reminders၊ openings worker အားလုံးရပ်ပါ။ Backup ပြီးလျှင် မူလအသုံးပြုထားသော optional workers ကို ပြန်စပါ။ System restore သည် opening email consent ကို OFF ပြန်ထားပြီး pending opening sends ကို review hold သို့ပြောင်းသည်။
