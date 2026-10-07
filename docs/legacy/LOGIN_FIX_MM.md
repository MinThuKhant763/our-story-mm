# Login fix — version 1.0.1

`Please reload this page before trying again.` ဆိုတဲ့ error ဟာ browser address နဲ့ `.env.local` ထဲက `APP_URL` မတူတဲ့အခါ ဖြစ်နိုင်ပါတယ်။ ဥပမာ port 3000 ကို တခြား app ယူထားရင် Next.js က 3001 မှာ စပေးပေမယ့် `APP_URL` က 3000 ဖြစ်နေနိုင်ပါတယ်။ ဒီအခြေအနေကို မူရင်း version မှာ ပြန်စမ်းပြီး 403 error ရကြောင်း အတည်ပြုထားပါတယ်။

## အဟောင်းကို ချက်ချင်းပြင်ရန်

1. Terminal မှာ Next.js ရဲ့ `Local:` address ကို ကြည့်ပါ။
2. `.env.local` ကို ဖွင့်ပြီး `APP_URL` ကို အဲဒီ address နဲ့ တိတိကျကျ ကိုက်အောင် ပြင်ပါ။ ဥပမာ `APP_URL=http://localhost:3001`။
3. Save လုပ်၊ server ကို `Control+C` နဲ့ ရပ်၊ `bash start-dev.sh` နဲ့ ပြန်စပါ။ Terminal က ပြတဲ့ `Local:` address မှာ ပြန်ဝင်ပါ။
4. Account မဖွင့်ရသေးရင် `/register` မှာ account ဖွင့်ပါ။ `OWNER_EMAIL` သတ်မှတ်ရုံနဲ့ account မဖွင့်ပေးပါ။

## 1.0.1 source ကို update လုပ်ရန် — Mac

Project အဟောင်းကို backup copy အရင်လုပ်ထားပါ။ ZIP အသစ်ကို သီးခြား folder မှာ extract လုပ်ပါ။ Server ကို `Control+C` နဲ့ ရပ်ပြီး အသစ်ထဲက `lib/`, `components/`, `start-dev.sh` ကို project အဟောင်းမှာ အစားထိုးပါ။ ဒီ source-only patch အတွက် `.env.local` နှင့် `data/` ကို မပြောင်းပါနှင့်။ ပြီးရင် project အဟောင်းရဲ့ Terminal မှာ `bash start-dev.sh` နဲ့ ပြန်စပါ။ Dependency versions မပြောင်းထားပါ။

Full release ကို သုံးချင်ရင် extract လုပ်ထားတဲ့ project အသစ်ထဲကို အဟောင်းရဲ့ `.env.local` နှင့် `data/` ကို server ရပ်ထားစဉ် copy လုပ်ပြီး အသစ်မှာ `bash start-dev.sh` ကို run ပါ။ `DATA_DIR` ကို စိတ်ကြိုက်ပြောင်းထားရင် အဲဒီ data directory ကို ထိန်းသိမ်းပါ။ Finder မှာ hidden `.env.local` ကို မြင်ဖို့ `Command+Shift+.` သုံးနိုင်ပါတယ်။ အဟောင်း folder ကို backup အဖြစ် ထားပါ။

## Fix ရဲ့ behavior

Development (`npm run dev`) မှာ configured `APP_URL` က HTTP loopback address ဖြစ်တဲ့အခါ browser ရဲ့ `localhost` / `127.0.0.1` address နဲ့ receiving Host တူရင် port ပြောင်းလည်း register/login လုပ်နိုင်ပါတယ်။ Missing origin၊ မတူတဲ့ origin၊ external/LAN origin ကို ဆက်ပိတ်ထားပါတယ်။ Production (`npm run start`) မှာ configured `APP_URL` origin နဲ့ တိတိကျကျ ကိုက်ရပါမယ်။

Local development မှာ generated sharing/email links အတွက် `APP_URL` ကို သုံးနေဆဲဖြစ်လို့ Terminal ရဲ့ `Local:` address နဲ့ ကိုက်အောင် သတ်မှတ်တာ အကောင်းဆုံးပါ။ Browser မှာ `localhost` သို့မဟုတ် `127.0.0.1` တစ်မျိုးတည်း ဆက်သုံးပါ။ Cookies က hostname တစ်ခုချင်း သီးခြားဖြစ်ပါတယ်။

Error ဆက်ရှိရင် browser address နှင့် error စာသားကို မှတ်သားပါ။ `.env.local`၊ password၊ API key၊ session cookie ကို မမျှဝေပါနှင့်။
