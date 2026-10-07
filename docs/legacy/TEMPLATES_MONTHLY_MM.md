# Templates ၆ မျိုး + Monthly hosting — version 1.2.0

## အသစ်ထည့်ထားသော templates

| Template | ခံစားမှု / interaction | Demo path |
|---|---|---|
| Bloom | ပန်းရောင် cover၊ sealed love letter | `/demo/bloom` |
| Film | Film style၊ perspective photo album | `/demo/film` |
| Night | ညကောင်းကင်၊ memory ကြယ်များ | `/demo/night` |
| Scrapbook | Paper texture၊ လှည့်ဖတ်နိုင်သော Polaroid photos | `/demo/scrapbook` |
| Aurora | Luminous cover၊ CSS 3D photo orbit၊ memory journey | `/demo/aurora` |
| Garden | Botanical arch cover၊ ပန်းရွေးပြီး memory ဖတ်ခြင်း | `/demo/garden` |

`/` ရဲ့ templates section၊ `/create` နှင့် editor template selector မှာ ရွေးနိုင်သည်။ Demos တွင် sample content သုံးပြီး ကိုယ်ပိုင် gift တွင် ကိုယ်တင်ထားသော photos/letter/timeline ကို သုံးသည်။ Templates အားလုံးက personalized 3D gift box၊ letter၊ optional voice၊ PIN၊ scheduled reveal ကို ဆက်သုံးနိုင်သည်။ Template တစ်မျိုးချင်းစီအတွက် အပိုကြေးမရှိပါ။

Scrapbook မှာ photo နှိပ်ပြီး နောက်ကျော caption ဖတ်၊ View photo နှိပ်ပြီး ပုံကြီးဖွင့်နိုင်သည်။ Full memory notes ကို အောက်က timeline တွင် ဖတ်နိုင်သည်။ Aurora မှာ Next/Previous ဖြင့် ဓာတ်ပုံပြောင်းပြီး memory stops ကို ရွေးဖတ်နိုင်သည်။ Garden မှာ ပန်းလေးရွေးပြီး memory title/date/note အပြည့်ဖတ်နိုင်သည်။ Reduced motion ကို OS setting သို့မဟုတ် gift ထဲက checkbox ဖြင့် သုံးနိုင်သည်။

## Monthly plan စျေးနှုန်း

| Plan | ဝယ်ယူမှု / ၁ လ | Renewal / ၁ လ | Selected photos |
|---|---:|---:|---:|
| Basic | 3,000 MMK | 3,000 MMK | 10 |
| Premium | 5,000 MMK | 5,000 MMK | 30 |

ဒီစျေးသည် **gift တစ်ခုချင်းစီ၏ hosted link သက်တမ်း** ဖြစ်သည်။ Account subscription အဖြစ် gifts အကန့်အသတ်မရှိ ဖန်တီးပေးခြင်း မဟုတ်ပါ။ Renewal တစ်ကြိမ်အတွက် KBZPay screenshot နှင့် transaction ID နောက်ဆုံး ၆ လုံး ထပ်တင်၊ admin approval စောင့်ရသည်။ Auto-charge မရှိပါ။

- Approval ပြီးချိန်မှ စပြီး မြန်မာအချိန် calendar month **၁ လ** ရသည်။ Publish နောက်ကျလည်း approval ချိန်ကနေ သက်တမ်းတွက်သည်။
- Active gift renewal သည် လက်ရှိ expiry မှ ၁ လ တိုးသည်။ Expired gift renewal သည် approval ပြီးချိန်မှ ၁ လ တိုးသည်။
- တစ်လသည် ရက် ၃၀ အတိအကျ မဟုတ်ပါ။ Jan 31 → Feb 28 (leap year တွင် Feb 29) ဖြစ်ပြီး မြန်မာအချိန် hour/minute/second ကို ထိန်းသည်။ နောက်တစ်ကြိမ် renewal ကို အဲဒီ expiry date မှ ဆက်တွက်သည်။
- Approval retry သည် ထပ်မတိုးပါ။ Pending renewal က လက်ရှိ active hosting ကို မပိတ်ပါ။
- Hosting ကုန်လျှင် public page/media access ပိတ်သည်။ Account ထဲက gift/backup ကို မဖျက်ပါ။

## အဟောင်း orders / gifts

Migration `0006_monthly_hosting.sql` က ရှိပြီးသား orders အားလုံးကို `annual` အဖြစ် မှတ်သားသည်။ Pending annual order ကို approve လုပ်ရင် မူလ quote amount နှင့် **365 ရက်** ပေးသည်။ Approved gift ရှိပြီးသား expiry ကို migration က မပြောင်းပါ။ အဟောင်း annual gift ကို monthly renewal အသစ်လုပ်ရင် လက်ရှိ expiry မှ calendar month တစ်လတိုးသည်။

Orders history၊ pending payment notice နှင့် owner review မှာ order တစ်ခု၏ actual period ကို ပြသည်။ Plan အသစ်နှင့် အဟောင်း quote ကို မရောပါနှင့်။ Merchant amount/full transaction verification ကို [PAYMENTS_MM.md](PAYMENTS_MM.md) အတိုင်းလုပ်ပါ။

## Mac မှာ safe update

1. Terminal မှ server ကို `Control+C` ဖြင့် ရပ်ပါ။ Project အဟောင်းတစ်ခုလုံးကို backup copy လုပ်ထားပါ။
2. ZIP အသစ်ကို **သီးခြား folder** ထဲ extract လုပ်ပါ။ အဟောင်း folder ထဲ merge မလုပ်ပါနှင့်။
3. အဟောင်း `.env.local` နှင့် `data/` ကို project အသစ်ထဲ copy လုပ်ပါ။ Finder မှ hidden files မြင်ဖို့ `Command+Shift+.` သုံးပါ။ Custom `DATA_DIR` သုံးရင် အဲဒီ directory ကို backup လုပ်ပြီး ဆက်သုံးပါ။ Database/media copy လုပ်နေချိန် server ရပ်ထားရပါမယ်။
4. Project အသစ် folder ထဲ Terminal ဖွင့်ပြီး `bash start-dev.sh` ကို run ပါ။ Node 24.13+ လိုသည်။ Dependencies ကို script က install လုပ်ပေးသည်။
5. Terminal ပြသော Local URL ကိုဖွင့်ပါ။ ပုံမှန် `http://localhost:3000` ဖြစ်သည်။ First database request မှ migration 0005/0006 ကို လိုသလို အလိုအလျောက် run သည်။ အဟောင်း SQL migrations မပြင်ပါနှင့်။
6. `/` မှ templates ၆ မျိုး၊ `/create` မှ monthly plan၊ `/orders` မှ အဟောင်း order period/expiry ကို စစ်ပါ။

Migration ပြီးသော database ကို code အဟောင်းဖြင့် ပြန်မသုံးပါနှင့်။ Rollback လုပ်ဖို့ အဟောင်း source နှင့် **pre-upgrade data backup** နှစ်ခုလုံး ပြန်သုံးရသည်။

## နောက်ထပ်တိုးချဲ့ရန် အကြံပြုချက်များ

1. **Expiry reminder** — သက်တမ်းမကုန်မီ ၇ ရက်/၁ ရက် email ပို့၊ renewal editor link ထည့်။ Consent၊ job scheduling၊ duplicate-send protection လိုသည်။ လက်ရှိ release မှာ reminder မပို့သေးပါ။
2. **Recipient reply** — gift ဖတ်ပြီး private thank-you message ပြန်ပို့နိုင်ခြင်း။ PIN access၊ spam limit၊ sender notification preferences ထည့်စဉ်းစားပါ။
3. **Low-data mode** — ပုံသေးများ၊ click-to-load media၊ optional static box ဖြင့် Myanmar mobile users အတွက် bandwidth လျှော့ပါ။ လက်ရှိ reduced motion သည် data-saving feature အပြည့်မဟုတ်ပါ။
4. **Short video memories** — video duration/size limit၊ private storage၊ processing queue၊ explicit playback ဖြင့်ထည့်ပါ။ Mobile bandwidth နှင့် storage cost ကို တိုင်းပြီးမှ ဖွင့်ပါ။
5. **Payment review tools** — review queue မှ received date/amount filters၊ merchant CSV import နှင့် candidate matching ကို ထည့်နိုင်သည်။ နောက်ဆုံး ၆ လုံးကို automatic payment proof အဖြစ် မသုံးပါနှင့်။

Low-data media reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/video
