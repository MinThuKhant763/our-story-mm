# Renewal reminders + Recipient replies + Accessories — version 1.4.0

ဒီ release က feature ၃ ခုကို အသုံးပြုနိုင်သော flow အဖြစ် ထည့်ထားသည်။ Basic 3,000 MMK / Premium 5,000 MMK calendar month တစ်လ pricing နှင့် manual KBZPay review ကို ဆက်သုံးသည်။ Auto-charge မရှိပါ။

## 1. Renewal reminders

`/account` မှ **Email renewal reminders** checkbox ကို ဖွင့်ပြီး **Save profile** နှိပ်ပါ။ Default သည် OFF ဖြစ်သည်။ ကိုယ်ပိုင် verified account ၏ **published + paid + active** gifts များအတွက်သာ ပို့သည်။ Draft၊ owner test gift၊ expired gift နှင့် consent ပိတ်ထားသူကို မပို့ပါ။

- Expiry အထိ ၁ ရက်ကျော် / ၇ ရက်အတွင်း ရှိလျှင် 7-day notice၊ ၁ ရက်အတွင်း ရှိလျှင် 1-day notice ဖြစ်သည်။ Worker နောက်ကျမှ စရင် ရောက်နေသော window ကိုသာ ပို့ပြီး missed notices နှစ်ခုလုံး မပို့ပါ။
- မြန်မာအချိန် expiry နှင့် login လိုသော renewal editor link ပါသည်။ Public gift token၊ secret notes၊ photos၊ recipient replies မပါပါ။
- Language preference အလိုက် Myanmar / English email body သုံးသည်။ Account checkbox ပိတ်ပြီး နောက် job မှစ၍ မပို့တော့ပါ။ ပို့နေပြီးသား provider request ကို ပြန်ရုပ်သိမ်းမရပါ။
- Same gift + expiry + reminder threshold ကို delivery ledger ဖြင့် မှတ်သား၊ provider idempotency key သုံး၊ retry payload တူတူထားသည်။ Concurrent worker ကို lease ဖြင့် ကာကွယ်သည်။
- Failure အတွက် 15-minute backoff၊ attempts အများဆုံး ၅ ကြိမ် သုံးသည်။ First attempt မှ 23 နာရီကျော်လျှင် ambiguous delivery ကို `review` အဖြစ် ထားပြီး automatic retry မလုပ်တော့ပါ။ Resend idempotency window သည် 24 နာရီဖြစ်သည်။
- Sent record သည် provider က request လက်ခံကြောင်း ဖြစ်သည်; inbox delivery/open tracking အတည်ပြုခြင်း မဟုတ်ပါ။

Official provider reference: https://resend.com/changelog/idempotency-keys

### Local dry-run စမ်းရန်

App အသစ်ကို run ပြီး first database request ဖြင့် migration 0007 အလုပ်လုပ်စေပါ။ Project folder မှ:

```bash
npm run reminders -- --dry-run
npm run test:reminders
```

Dry-run သည် eligible gift အရေအတွက်ကို ပြသည်။ Email မပို့၊ delivery ledger မရေးပါ။ Local မှ owner test gift သည် eligible မဖြစ်ပါ; reminder tests သည် fake provider နှင့် temporary in-memory database ကိုသာ သုံးသည်။ Production customer data ကို စမ်းသပ်ရန် မပြင်ပါနှင့်။

### VPS / Docker မှာ scheduled worker ဖွင့်ရန်

`.env` တွင် configured email provider နှင့် verified sending domain လိုသည်:

```dotenv
APP_URL=https://your-domain.example
RESEND_API_KEY=your-real-key
EMAIL_FROM=OurStory <accounts@your-domain.example>
REMINDERS_ENABLED=true
REMINDER_INTERVAL_MINUTES=60
```

```bash
docker compose up -d --build app caddy
docker compose --profile tools run --rm operations node scripts/reminders.mjs --dry-run
docker compose --profile reminders up -d reminders
docker compose logs --tail=50 reminders
```

`reminders` profile သည် opt-in ဖြစ်သည်။ Worker ကို မဖွင့်ထားလျှင် emails အလိုအလျောက် မပို့ပါ။ First job ကို ချက်ချင်း run ပြီး နောက်တစ်ကြိမ်တိုင်း interval အလိုက် run သည်။ Shared persistent volume ကို ဆက်သုံးသည်။ `.env` ကို secret အဖြစ်ထားပါ။ Job ကို standalone Node/VPS cron မှလည်း hourly run နိုင်သည်; app process တစ်ခုထဲက timer ကို မသုံးပါ။

Worker ပိတ်ရန် `docker compose stop reminders` သုံးပါ။ Full backup/restore မလုပ်မီ app **နှင့် reminders / openings workers အားလုံး** ရပ်ပါ။ Restore သည် pending sends ကို review အဖြစ်ထား၊ lease ကိုရှင်း၊ account reminder consent ကို OFF ပြန်ထားသည်။ Provider records ကိုတိုက်စစ်ပြီးမှ customer ကို preferences ပြန်ဖွင့်စေပါ; snapshot restore ကြောင့် အဟောင်း email ပြန်ပို့မိခြင်းကို ရှောင်ရန် ဖြစ်သည်။

## 2. Private recipient reply

Editor **step 4** မှ **Allow private recipient replies** ကို ဖွင့်ပါ။ Default OFF ဖြစ်သည်။ Autosave ပြီး recipient URL ကို share ပါ။ Recipient က story ထဲက reply form တွင် name + message (အများဆုံး 2,000 characters) ဖြည့်ပြီး ပို့နိုင်သည်။ ဒီ release တွင် **text reply** ပါသည်; reply voice attachment မပါသေးပါ။

Gift ဖန်တီးသူသည် `/replies` တွင် private inbox၊ unread count၊ Mark read နှင့် Delete ကို သုံးနိုင်သည်။ အခြား customer/merchant account သည် ကိုယ်မပိုင်သော gift reply ကို မဖတ်၊ မပြင်၊ မဖျက်နိုင်ပါ။ Public gift API တွင် replies history မထည့်ထားပါ။

PIN unlock၊ reveal time၊ status နှင့် expiry ကို POST တိုင်း server က စစ်သည်။ Rate limit သည် gift တစ်ခုအတွက် တစ်ရက် ၅ စောင်၊ stored notes အများဆုံး ၂၀၀ ဖြစ်သည်။ Duplicate request ID ကို replay လုပ်လျှင် note ထပ်မဖန်တီးပါ။ ဒီ flow သည် gift access ရှိသူက message ပို့ခြင်းဖြစ်ပြီး sender name ကို identity verify လုပ်ထားခြင်း မဟုတ်ပါ။ PIN မပါသော link ကို မျှဝေရာတွင် link သိသူတိုင်း reply ပို့နိုင်သည်။

### ဘယ်လိုစမ်းမလဲ

1. Owner test gift တစ်ခုတွင် replies ဖွင့်၊ publish လုပ်ပြီး private browser window မှ link ဖွင့်ပါ။
2. PIN ရှိရင် unlock ပြီးမှ reply ပို့နိုင်ရပါမယ်။ Future reveal/expired/unpublished gift က reply မလက်ခံရပါ။
3. Recipient note ပို့ပြီး sender account `/replies` မှ ဖတ်ပါ။ Mark read လုပ်လည်း gift revision/PIN session မပြောင်းရပါ။
4. Customer account အခြားတစ်ခုတွင် အဲဒီ reply မမြင်ရပါ။ Delete လုပ်ပြီး inbox မှ ပျောက်ရပါမယ်။
5. Gift ဖျက်လျှင် attached replies ပါ ဖျက်သည်။ Portable gift ZIP တွင် recipient replies မပါပါ; encrypted full-system backup တွင် ပါသည်။ Recipient reply အတွက် email notification မပို့သေးပါ; inbox မှ ဖတ်ရသည်။

## 3. Accessories + secret surprises

Editor **step 4** တွင်:

- **Gift accessories:** none / bow / crown / party hat။ 3D model နှင့် simple illustration နှစ်မျိုးလုံးတွင် ပါသည်။
- **Bouquet:** Daisy / Rose / Tulip နှင့် flowers 3 / 5 / 7 ရွေးနိုင်သည်။
- **Secret surprise note:** title အများဆုံး 80 characters၊ message အများဆုံး 1,500 characters။ Empty message ဖြစ်လျှင် surprise section မပါပါ။

Preview animation၊ Try opening your gift နှင့် saved recipient page မှ စမ်းပါ။ Story ဖွင့်ပြီး secret section မှ **3D gift ကိုနှိပ်** သို့မဟုတ် keyboard ဖြင့် reveal button နှိပ်ရင် note ပေါ်လာရပါမယ်။ Use simple view / Reduce motion ဖြင့်လည်း note ကို ဖွင့်နိုင်သည်။ Save/reload နှင့် portable ZIP restore မှာ accessory/flower/secret settings တူရပါမယ်။

Secret note သည် playful reveal ဖြစ်သည်။ Gift ကိုဖွင့်နိုင်သူထံ API မှ content ရောက်နေပြီး သီးခြား encrypted vault/password မဟုတ်ပါ။ Sensitive content အတွက် existing gift PIN သုံးပါ။ Physical accessories/delivery မပါပါ။

## Safe Mac update / migration

1. Server နှင့် reminder / openings workers ရပ်ပါ။ Project အဟောင်းနှင့် data ကို backup လုပ်ပါ။
2. ZIP အသစ်ကို သီးခြား folder မှာ extract လုပ်ပါ။ `.env.local` နှင့် `data/` ကို copy လုပ်ပါ။ Custom DATA_DIR ရှိလျှင် အဲဒီ directory ကို backup လုပ်ပြီး ဆက်သုံးပါ။
3. `bash start-dev.sh` run၊ Terminal ပြသော Local URL ဖွင့်ပါ။ Migration 0007 သည် first database request တွင် အလိုအလျောက် apply သည်။
4. အဟောင်း paid expiry/orders၊ template နှင့် gift colors ကို ထိန်းသည်။ Accessories default none၊ replies default OFF၊ secret empty၊ reminder preference OFF ဖြစ်သည်။ Applied migration SQL ကို မပြင်ပါနှင့်။
5. Rollback လိုလျှင် pre-upgrade source **နှင့် data backup နှစ်ခုလုံး** ပြန်သုံးပါ။ Migrated database ကို code အဟောင်းနှင့် မသုံးပါနှင့်။

## Validation limits

Automated schema/API/worker/backup tests သည် real customer data နှင့် live email ကို မသုံးပါ။ Static illustrations ကို render လုပ်ပြီး ကြည့်စစ်ထားသည်။ Actual iPhone/Android WebGL၊ browser interactions၊ real Resend inbox delivery နှင့် Docker worker on VPS ကို staging မှာ ဆက်စမ်းရပါမယ်။
