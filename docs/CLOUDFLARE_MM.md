# OurStory MM — Cloudflare edition

ဒီ edition မှာ Render / Supabase မလိုပါ။ Frontend ကို **Cloudflare Pages**၊ API ကို **Hono + Workers**၊ database ကို **D1** နဲ့ uploaded files ကို **private R2** သုံးပါတယ်။

## Mac မှာ run ရန်

Node.js 24 LTS တင်ပြီး ZIP ဖြည်ပါ။ Terminal မှာ project folder ထဲဝင်ပြီး:

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run db:local
npm run dev:all
```

Browser မှာ **http://localhost:5173** ဖွင့်ပါ။ `dev:all` က Vite frontend နဲ့ Worker API နှစ်ခုလုံးကို တစ်ခါတည်း run လုပ်ပေးတဲ့အတွက် `/api/account` proxy `ECONNREFUSED 127.0.0.1:8787` error မဖြစ်တော့ပါ။ အရင် Next.js project ရဲ့ port 3000 နဲ့ `.env.local` ကို ဒီ edition မှာ မသုံးတော့ပါ။

Google OAuth web client တစ်ခုဖန်တီးပြီး `.dev.vars` မှာ `GOOGLE_CLIENT_ID` နဲ့ `GOOGLE_CLIENT_SECRET` ထည့်ပါ။ Authorized redirect URI ကို `APP_URL/api/auth/google` အတိအကျ သတ်မှတ်ပါ။ `OWNER_EMAIL` နဲ့ကိုက်တဲ့ verified Google account ဖြင့်ဝင်ပြီး `/owner` မှာ workspace setup လုပ်နိုင်ပါတယ်။ Email/password login မရှိပါ။

## Production အတွက်

1. Cloudflare account နဲ့ Pages project၊ D1 database၊ private R2 bucket တည်ဆောက်ပါ။
2. Google OAuth web client ဖန်တီးပြီး authorized redirect URI ကို `APP_URL/api/auth/google` ထည့်ပါ။ `GOOGLE_CLIENT_ID` ကို `wrangler.jsonc` မှာ၊ client secret ကို Worker secret အဖြစ် သတ်မှတ်ပါ။
3. `wrangler.jsonc` မှာ တကယ့် D1 ID၊ Pages domain၊ `OWNER_EMAIL` နဲ့ Google client ID ထည့်ပါ။ `wrangler.pages.jsonc` မှာ Pages project name ပြောင်းပါ။
4. Production migrations apply လုပ်ပြီး API Worker ကို အရင်၊ Pages ကို နောက်မှ deploy လုပ်ပါ။
5. `OWNER_EMAIL` နဲ့ကိုက်တဲ့ Google အကောင့်နဲ့ ဝင်ပါ။ KBZPay payment ကို ကိုယ်တိုင်စမ်း၊ admin review နဲ့ approve လုပ်ပြီးမှ customers လက်ခံပါ။

Google sign-in အတွက် Resend မလိုပါ။ Optional reminder/opening emails ဖွင့်လိုမှသာ Resend API key နဲ့ verified email sender သတ်မှတ်ပါ။ Commands အပြည့်အစုံကို root folder ရဲ့ **PRODUCTION_NO_DOMAIN.md** မှာ ကြည့်ပါ။

Backup/restore နဲ့ အဟောင်း SQLite data ပြောင်းနည်းကို root folder ရဲ့ **DEPLOY_CLOUDFLARE.md** မှာ ရေးထားပါတယ်။ အဟောင်း data ကို project အသစ်ထဲ အလိုအလျောက်ကူးမထားပါ။

Free plan မှာ စမ်းနိုင်ပေမယ့် ဒီ app ရဲ့ PIN checking နဲ့ gift ZIP processing က CPU limit ကျော်နိုင်လို့ live customers အတွက် **Workers Paid (အနည်းဆုံး $5/month + usage)** အကြံပြုပါတယ်။ D1/R2 free allowances က unlimited မဟုတ်ပါ။

Basic **3,000 MMK/month**၊ Premium **5,000 MMK/month** က gift တစ်ခုချင်းစီ hosting သက်တမ်းအတွက် ဖြစ်ပါတယ်။ လစဉ် auto ငွေဖြတ်တာ မပါ။ Customer က screenshot + transaction ID နောက်ဆုံး 6 လုံး တင်ပြီး admin က အမှန်တကယ်လက်ခံရတဲ့ amount နဲ့ full merchant transaction ကို စစ်ပြီးမှ approve လုပ်ပါတယ်။

R2 public access မဖွင့်ပါနဲ့။ Photos၊ voice နဲ့ receipts ကို API မှာ ownership/PIN/expiry စစ်ပြီးမှ ပေးပါတယ်။ Production email jobs ကို ဖွင့်ပြီးမှ opt-in users ရဲ့ renewal reminders နဲ့ opening emails ပို့ပါမယ်။

`docs/legacy/` ထဲက files က အရင် edition ရဲ့ feature history အတွက်ပါ။ လက်ရှိ run/deploy နည်းကို README နဲ့ DEPLOY_CLOUDFLARE.md ကိုပဲ အခြေခံပါ။
