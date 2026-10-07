# Public customer တွေအတွက် production လိုအပ်ချက်

ဒီ project က အလုပ်လုပ်တဲ့ MVP source ဖြစ်ပါတယ်။ Source code/build ရှိပြီးပြီဆိုတာနဲ့ public paid service အတွက် စစ်ဆေးပြီးသားလို့ မဆိုလိုပါ။ အောက်က launch gates တွေကို ကိုယ့် infrastructure နဲ့ စမ်းပြီး ဖြည့်ရပါမယ်။

## မဖြစ်မနေ ဖြည့်ရမယ့် launch gates

| အပိုင်း | Code ထဲမှာရှိပြီးသား | Operator ဖြည့်ရမယ့်အချက် |
| --- | --- | --- |
| Hosting | Docker, persistent volume, health API, Caddy config | Domain/DNS, VPS, HTTPS အမှန်တကယ်စမ်းခြင်း၊ firewall၊ OS patching |
| Login | Password hash, database sessions, CSRF-origin checks, rate limits | Verified email sender၊ inbox delivery test၊ abuse protection; owner MFA/custom auth security review |
| Data access | Per-owner authorization, PIN, scheduled/expired/unpublished access gates | Independent authorization/security review; two-account penetration tests |
| Payment | Receipt/reference, manual approve/reject/refund, audit history | Merchant provider approval၊ actual received-amount verification၊ refund process၊ accounting reconciliation |
| Media | Private storage; size/count/signature checks | Storage quotas/disk alerting၊ malware/content review၊ safe re-encoding; CPU/memory/request abuse limits |
| Backups | Gift ZIP + AES-256-GCM system backup/restore | Daily off-site copies၊ retention၊ separate key custody၊ proven restore drill၊ alerts on failed backups |
| Monitoring | Health route, bounded Docker logs | External uptime check၊ disk/memory/CPU alerts၊ failed login/email/payment review alerts၊ incident contact |
| Policies | Starter Terms/Privacy pages | Reviewed business identity၊ retention/deletion၊ refunds၊ support hours; replace starter text before payment collection |
| UX | 3D fallback, reduced motion, swipe, bilingual editor | Android Chrome/iPhone Safari၊ WebGL disabled၊ slow network၊ keyboard/screen reader စမ်းခြင်း |
| Deployment | Version-pinned package lock, CI template, migrations | CI ကို private repository မှာ enable လုပ်ခြင်း၊ dependency audits၊ staging→production workflow၊ rollback rehearsal |

## Payment စနစ်ကို နားလည်ရန်

Receipt ပုံတင်လိုက်တာက payment အတည်ပြုချက် မဟုတ်ပါ။ Owner က merchant transaction/reference/received amount ကို အမှန်တကယ် တိုက်စစ်ပြီးမှ approve လုပ်ရပါတယ်။ UI မှာ amount ကို confirm ထည့်ထားလို့ မှန်ကန်ကြောင်း အလိုအလျောက် မသိပါ။ Payment provider API/webhook အမှန်တကယ်သုံးချင်ရင် merchant agreement၊ signing secrets၊ signature validation၊ duplicate-event/idempotency၊ reconciliation ကို သီးခြားတည်ဆောက်ရပါမယ်။ API keys မပါဘဲ receipt ပုံကနေ automated approval မလုပ်ပါနဲ့။

## Backup / privacy လည်ပတ်မှု

- Daily encrypted system backup ကို server အပြင် တစ်နေရာမှာ သိမ်းပါ; VPS snapshot တစ်ခုတည်းကို မမှီခိုပါနဲ့။
- ဥပမာ daily 30 copies + monthly 6 copies ဆိုတဲ့ retention ကို လုပ်ငန်းအခြေအနေ၊ privacy policy နဲ့ ကိုက်အောင် ရွေးပါ။ ဒီကာလက recommendation ဖြစ်ပြီး code က အလိုအလျောက် purge မလုပ်ပါ။
- Backup တွေမှာ password hashes၊ personal memories နှင့် receipts ပါပါတယ်။ Access ကို owner/operator သတ်မှတ်ထားသူတွေကိုပဲ ပေးပါ။
- Gift ကို delete လုပ်တဲ့အခါ payment records/receipts က accounting အတွက် ကျန်ပါတယ်။ Account deletion၊ legal retention နှင့် backup expiration ကို document လုပ်ပါ။
- Restore drill မှာ account login၊ media၊ existing orders၊ payment approval history အားလုံး စစ်ပါ။

## Scale တိုးမယ့်အချိန်

One app instance + SQLite + filesystem ကို အစပိုင်း single-server service အတွက် ရွေးထားပါတယ်။ Database/media latency၊ concurrent writes၊ storage growth၊ CPU/RAM ကို ကိုယ့် traffic နဲ့ တိုင်းပါ။ Server replicas/zero-downtime/full high availability လိုလာရင် PostgreSQL + private S3-compatible storage + distributed rate limits/queues ကို ရွှေ့ပါ။ PostgreSQL SQL syntax/transactions၊ media authorization၊ migration နှင့် restore process ကို ပြန်တည်ဆောက်ပြီး test လုပ်ဖို့ လိုပါတယ်; service name ပြောင်းရုံနဲ့ မပြီးပါ။

## မပါသေးတဲ့လုပ်ဆောင်ချက်

Phone OTP၊ social login၊ owner MFA၊ automated anniversary emails၊ order email notifications၊ subscriptions/automatic renewals၊ physical gift box packing/delivery၊ multi-merchant tenants၊ media transcoding၊ malware scanning၊ per-account storage budget၊ strong nonce-based CSP နှင့် unattended off-site backup scheduling မပါသေးပါ။ File တွေကို တစ်ခုချင်းစီအလိုက် download/စမ်းသပ်နိုင်တဲ့ source ပေးထားတာဖြစ်ပြီး ပြီးပြည့်စုံတဲ့ audited enterprise platform မဟုတ်သေးပါ။

## Launch အစီအစဉ်

1. Local tests အောင်မြင်အောင်လုပ်ပါ။
2. Staging domain ပေါ် deploy၊ email delivery/HTTPS/restore drill စမ်းပါ။
3. Android + iPhone + account isolation + actual merchant reconciliation စမ်းပါ။
4. Policies/monitoring/backup/abuse protection ပြည့်စုံရင် invite-only pilot စပါ။
5. Pilot ရဲ့ error/performance/support data အပေါ်အခြေခံပြီး public paid launch လုပ်ပါ။

Version 1.2.0: customer သည် transaction ID နောက်ဆုံး ၆ လုံးတင်ပြီး owner သည် received merchant transaction ID အပြည့်နှင့် amount ကို စစ်ဖြည့်ရသည်။ Suffix တူတာက transaction တူကြောင်း သက်သေမဟုတ်ပါ။ [PAYMENTS_MM.md](PAYMENTS_MM.md) ကိုဖတ်ပြီး review စမ်းပါ။

New purchase/renewal orders သည် calendar month ၁ လ ဖြစ်သည်။ မူလ annual expiry/quotes ကို ထိန်းထားသည်။ Version 1.4.0 တွင် consent ရှိသော published paid gifts အတွက် optional renewal email worker ပါသည်။ [TEMPLATES_MONTHLY_MM.md](TEMPLATES_MONTHLY_MM.md) ကိုဖတ်ပါ။

Reminder worker setup၊ recipient reply limits/identity နှင့် restore ပြီး reminder consent pause ဖြစ်ခြင်းကို [REPLIES_REMINDERS_SURPRISES_MM.md](REPLIES_REMINDERS_SURPRISES_MM.md) တွင်ဖတ်ပါ။
