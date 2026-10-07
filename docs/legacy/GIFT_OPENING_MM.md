# Gift opening notification — v1.9.0

## ဘယ်မှာ ဘယ်လို စမ်းမလဲ
1. Creator account နဲ့ gift ဖန်တီးပြီး publish လုပ်ပါ။ Local development တွင် workspace owner ရဲ့ 30-day test gift ကိုသုံးနိုင်သည်။
2. Dashboard → **Gift opening notifications** မှာ notification ကို ကြည့်ပါ။ မြန်မာ/English label များသည် Account language preference ကို လိုက်နာသည်။
3. Gift link ကို incognito/private window သို့မဟုတ် အခြားဖုန်းမှာ ဖွင့်ပါ။ Link ဝင်ရုံ၊ PIN unlock လုပ်ရုံနှင့် မမှတ်တမ်းတင်ပါ။ Envelope → **Open your gift** နောက် story ပေါ်လာချိန်၊ သို့မဟုတ် **Skip animation & read my story** နှိပ်ချိန်မှ မှတ်တမ်းတင်သည်။ Recipient screen မှာ ပေးပို့သူအား အသိပေးမည်ဟု ကြိုပြထားသည်။
4. Creator dashboard ကို Refresh နှိပ်ပါ။ Visible dashboard သည် 30 seconds တိုင်း ပြန်စစ်သည်။ Background tab မှာ polling ခဏရပ်သည်။ Notification ရဲ့ အချိန်ကို Myanmar time ဖြင့်ပြသည်။ **Mark read** နှိပ်လျှင် unread count လျော့မည်။
5. တူညီသော gift ကို ပြန်ဖွင့်ပါ။ Notification ထပ်မပေါ်ရပါ။ Gift တစ်ခုရဲ့ lifetime တွင် ပထမဆုံးဖွင့်ချိန်တစ်ကြိမ်ကိုသာ ထိန်းထားသည်။ Hosting renewal၊ version restore၊ gift ပြန် publish လုပ်ခြင်းသည် notification ကို reset မလုပ်ပါ။

Signed-in creator ကိုယ်တိုင် shared link ဖွင့်ခြင်းကို မတွက်ပါ။ Creator က incognito/logged-out ဖြင့်ဖွင့်ပါက creator ဟု မခွဲနိုင်သောကြောင့် opening အဖြစ်တွက်သည်။ Demo နှင့် editor preview သည် notification မပို့ပါ။ PIN မဖြည့်ရသေးခြင်း၊ schedule မရောက်ခြင်း၊ unpublished / expired gift သည် opening POST ကို server က ပယ်ချသည်။

## Optional email notification
**Account → Email me when a gift is first opened → Save profile** လုပ်ပါ။ Default သည် OFF ဖြစ်သည်။ မဖွင့်ရသေးသော gift များအတွက်သာ အကျိုးသက်ရောက်သည်; နောက်မှ opt-in လုပ်လျှင် အရင်ဖွင့်ပြီးသော gift အတွက် email ပြန်မပို့ပါ။ Dashboard notification သည် email opt-in မလိုဘဲ အလုပ်လုပ်သည်။

Server environment:
```dotenv
OPENING_NOTIFICATIONS_ENABLED=true
OPENING_INTERVAL_SECONDS=60
RESEND_API_KEY=your_real_key
EMAIL_FROM=OurStory <accounts@your_verified_domain>
APP_URL=https://your-domain.example
```

Resend verified sender domain နဲ့ verified creator account လိုသည်။ Account preference ရော server worker ရော enabled ဖြစ်ရမည်။ Local registration bypass သည် localhost အတွက်ပဲဖြစ်သည်။

Mac local one-shot test (အမှန်တကယ် email ပို့နိုင်သော command):
```bash
npm run opening-notifications -- --dry-run
npm run opening-notifications
```
Continuous worker, local `.env.local`:
```bash
node --env-file=.env.local scripts/opening-worker.mjs
```
Production Docker Compose:
```bash
docker compose up -d --build app
docker compose --profile openings up -d openings
docker compose logs --tail=50 openings
```
Renewal worker ကိုပါသုံးလျှင် profile နှစ်ခု ဖွင့်နိုင်သည်:
```bash
docker compose --profile reminders --profile openings up -d
```
Email သည် ချက်ချင်းဖြစ်မည်ဟု အာမမခံပါ; default worker interval သည် 60 seconds ဖြစ်ပြီး backlog / provider retry ကြောင့် နောက်ကျနိုင်သည်။ Sent status သည် provider က request ကို လက်ခံပြီး message ID ပြန်ပေးသည်ဟုသာ ဆိုလိုသည်; inbox delivery/read ကို မအတည်ပြုပါ။ Email မှာ private gift share token၊ PIN၊ စာ/ဓာတ်ပုံ မထည့်ပါ။ Authenticated dashboard/edit link ကိုသာ ထည့်သည်။

## Delivery reliability and privacy
One event per gift ကို database primary key နဲ့ထိန်းပြီး parallel opening requests/reloads/replay တွေက ထပ်မပို့နိုင်ပါ။ Worker တစ်ခုစီ lease ရှိပြီး retry payload နှင့် provider idempotency key ကို မပြောင်းပါ။ 5-minute backoff၊ အများဆုံး attempt 5 ခု၊ first attempt မှ 23 hours ပြည့်လျှင် review hold သို့ပြောင်းသည်။ Resend key retention 24 hours အတွင်းသာ automatic retry လုပ်ရန် ဒီ limit ကို သတ်မှတ်ထားသည်။ Official reference: https://resend.com/docs/dashboard/emails/idempotency-keys

Account opt-out၊ gift unavailable ဖြစ်ခြင်း၊ email verification မရှိခြင်းတို့ကို ပို့မည့်အချိန် ပြန်စစ်သည်။ Pending notice ကို cancel လုပ်သည်; email provider က လက်ခံပြီးသား message ကို ပြန်မရုပ်သိမ်းနိုင်ပါ။ Ambiguous delivery ကို operator က provider records နဲ့စစ်ပြီးမှ manual resolution လုပ်ရမည်; review notices ကို အလိုအလျောက် reset မလုပ်ပါ။

Opening သည် link access ရှိသူက ဖွင့်ခဲ့သည်ဟုသာ ပြသပြီး intended recipient အမည်ကို မအတည်ပြုနိုင်ပါ။ Opening record တွင် recipient name၊ IP၊ location၊ device fingerprint မသိမ်းပါ။ Hosting operator ၏ ပုံမှန် server logs များက သီးခြားဖြစ်သည်။ Network/JavaScript ပိတ်ထားလျှင် opening မရောက်နိုင်ပါ; client သည် failed report ကို အများဆုံး 2 ကြိမ် ထပ်စမ်းသည်။ Exact read receipt / လူတစ်ယောက်စီ၏ view count မဟုတ်ပါ။

## Upgrade and backup
Existing deployment ကို app၊ reminders၊ openings worker အားလုံးရပ်ပြီး documented full backup ယူကာ update လုပ်ပါ။ Migration **0009** သည် app start အချိန် automatic run သည်။ Data volume / DATA_DIR ကို ဆက်သုံးပါ။ Upgrade မတိုင်မီ opening များကို ပြန်ဖန်တီးမရပါ။ Gift delete သည် notification ကိုပါ ဖျက်သည်။ Full encrypted system backup သည် opening history ကို ထိန်းထားသည်။ System restore လုပ်လျှင် pending email များ review hold ဖြစ်ပြီး account opening email consent OFF ပြောင်းသည်; အဟောင်းကို ထပ်မပို့စေရန် ဖြစ်သည်။ Per-gift ZIP သည် notification မပါဝင်ဘဲ import ကို fresh private draft အဖြစ်ယူသည်။

Automated tests: `npm run test:openings`, `npm run test:integration`, `npm run test:render`, `node tests/operations.mjs`။ Browser gift-click/polling၊ mobile layout နှင့် real Resend email delivery ကို production credentials ဖြင့် ထပ်စစ်ပါ။
