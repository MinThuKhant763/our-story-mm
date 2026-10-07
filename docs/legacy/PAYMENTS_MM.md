# KBZPay screenshot + transaction ID နောက်ဆုံး ၆ လုံး — version 1.2.0

## စျေးနှုန်း

| Package | ဝယ်ယူမှု (၁ လ) | သက်တမ်း ၁ လ တိုးမှု | ဓာတ်ပုံ |
|---|---:|---:|---:|
| Basic | 3,000 MMK | 3,000 MMK | 10 |
| Premium | 5,000 MMK | 5,000 MMK | 30 |

Order အသစ်နှင့် renewal အသစ်သည် မြန်မာအချိန် calendar month **၁ လ** ဖြစ်သည်။ Auto-charge မရှိပါ။ အဟောင်း pending annual orders ကို approve လုပ်ရင် မူလ annual period (365 ရက်) ပေးသည်။ ရှိပြီးသား paid expiry ကို update က မပြောင်းပါ။ [TEMPLATES_MONTHLY_MM.md](TEMPLATES_MONTHLY_MM.md) တွင် အသေးစိတ်ဖတ်ပါ။

ဒီစျေးတွေကို order အသစ်များတွင် သုံးသည်။ တင်ထားပြီးသား pending/approved orders များ၏ amount ကို မပြောင်းပါ။ အဟောင်း order ကို approve လုပ်ရင် အဲဒီ order မှာ မူလသတ်မှတ်ထားသော amount အတိုင်း စစ်ရပါမယ်။

## Owner setup

`/owner` → Merchant settings မှာ KBZPay ကို ရွေး၊ merchant name/account နှင့် provider QR ကို ထည့်၊ Enable payment submissions ဖွင့်ပြီး Save လုပ်ပါ။ ကိုယ်ပိုင် merchant အကောင့်ထဲ ဝင်ကြည့်နိုင်သော owner ကသာ review လုပ်ရပါမယ်။

Payment instructions နမူနာ: `KBZPay ဖြင့် အော်ဒါပမာဏအတိအကျ လွှဲပါ။ ငွေလွှဲပြီး screenshot တင်၊ Transaction ID နောက်ဆုံး ဂဏန်း ၆ လုံး ဖြည့်ပါ။ လက်ခံရရှိသောငွေကို စစ်ပြီးမှ အတည်ပြုပေးပါမည်။`

## Customer flow

1. `/edit/{giftId}?step=3` မှာ Basic/Premium ရွေးပြီး merchant KBZPay account/QR သို့ ပြထားသော amount ကို ပေးချေပါ။
2. ငွေလွှဲ screenshot ကို upload လုပ်ပါ။ JPG / PNG / WebP သုံးနိုင်သည်။
3. Transaction ID နောက်ဆုံး ဂဏန်း **၆ လုံးတိတိ** ဖြည့်ပါ။ ဥပမာ ID က `20261007000123` ဆို `000123` ထည့်ပါ။ ရှေ့က 0 များ မဖယ်ပါနှင့်။ မြန်မာဂဏန်း `၀၀၀၁၂၃` ကိုလည်း `000123` အဖြစ် လက်ခံသည်။
4. Submit payment for review နှိပ်ပါ။ `/orders` မှာ In review ပြသည်။ Review မပြီးမီ paid hosting မရပါ။

## Admin approval

1. `/owner` → Payment reviews မှာ customer screenshot၊ နောက်ဆုံး ၆ လုံး၊ expected amount ကို ကြည့်ပါ။
2. Merchant KBZPay အကောင့်ထဲက **အမှန်တကယ် received transaction** ကိုရှာပါ။ နောက်ဆုံး ၆ လုံး၊ amount၊ screenshot ပေါ်က အချိန်နှင့် ပေးပို့သူကိုပါ တိုက်စစ်ပါ။ Suffix/amount တူရုံနဲ့ မအတည်ပြုပါနှင့်။
3. Approve ကို နှိပ်ပြီး merchant record မှ **transaction ID အပြည့်အစုံ** နှင့် Amount actually received ဖြည့်ပါ။ ID အပြည့်၏ နောက်ဆုံး ၆ လုံးက customer ပေးထားသော ၆ လုံးနဲ့ တူရပါမယ်။ New orders အတွက် ၆ လုံးတည်းကို full ID အဖြစ် မလက်ခံပါ။
4. Merchant record ကို တကယ်စစ်ခဲ့ကြောင်း checkbox ကို အမှန်ခြစ်၊ verification note ထည့်ပြီး Approve payment နှိပ်ပါ။
5. Server က suffix/amount/confirmation နှင့် full ID ထပ်သုံးထားမှုကို စစ်ပြီး approved ဖြစ်စေသည်။ Customer က Review & publish ဖြင့် ကိုယ်တိုင် ထုတ်နိုင်သည်။

Screenshot ဖတ်ပြီး KBZPay အကောင့်ထဲငွေရောက်ကြောင်း server က အလိုအလျောက် မသိနိုင်ပါ။ ဒီ release မှာ merchant API/webhook/OCR automatic approval မချိတ်ထားပါ။ Admin က received payment ကိုစစ်ပြီး server က ဖြည့်ထားသောအချက်များကို validate လုပ်ခြင်းဖြစ်သည်။

နောက်ဆုံး ၆ လုံးတူသော transaction များကို customer အမျိုးမျိုးက တင်နိုင်သည်။ Merchant method + transaction ID အပြည့်တူတာကို orders နှစ်ခုမှာ approve မလုပ်နိုင်ပါ။ Refund ပြီးလည်း အဲဒီ transaction ကို နောက်အော်ဒါအတွက် ပြန်သုံး၍ မရပါ။ Transaction ID အပြည့်ကို owner API/UI တွင်သာ ပြပြီး customer order history တွင် မပါပါ။

## Mac မှာ source update

1. Server ကို `Control+C` ဖြင့် ရပ်ပါ။ Project folder အဟောင်းကို backup copy လုပ်ထားပါ။
2. ZIP အသစ်ကို သီးခြား folder မှာ extract လုပ်ပါ။
3. အဟောင်း `.env.local` နှင့် `data/` ကို project အသစ်ထဲ copy လုပ်ပါ။ `DATA_DIR` ကို custom သတ်မှတ်ထားရင် အဲဒီ data directory ကို ဆက်သုံးပါ။ Server ရပ်ထားစဉ် database/media ကို copy လုပ်ပါ။ Finder မှာ `.env.local` မြင်ဖို့ `Command+Shift+.` သုံးပါ။
4. Project အသစ်ထဲ Terminal ဖွင့်ပြီး `bash start-dev.sh` ကို run ပါ။ Migration 0005 နှင့် 0006 က first database request မှာ အလိုအလျောက် အလုပ်လုပ်မယ်။ အဟောင်း migration SQL files မပြင်ပါနှင့်။
5. အဟောင်း orders ကို Legacy full reference အဖြစ် ပြသည်။ အဟောင်း pending order approval တွင် မူလ reference အပြည့်ကို အတိအကျစစ်ရသည်။

Migration ပြီးသော data directory ကို code အဟောင်းဖြင့် ပြန်မသုံးပါနှင့်။ Rollback လိုရင် source နှင့် pre-upgrade data backup နှစ်ခုလုံးကို အတူ ပြန်သုံးပါ။

## ဘယ်နေရာမှာ စမ်းရမလဲ

- `/`: Basic 3,000 / Premium 5,000 ပြတာ စစ်ပါ။ `/create` → step 4 မှာလည်း တူရပါမယ်။
- Customer account မှာ `000123` ဖြင့် screenshot တင်ပါ။ ဂဏန်း ၅ လုံး/စာလုံးပါ input ကို submit မလုပ်နိုင်ရပါ။ Screenshot မပါရင်လည်း submit မလုပ်နိုင်ရပါ။
- `/owner` → Payment reviews: amount မှားရင် approve မလုပ်နိုင်ရပါ။ Full ID နောက်ဆုံး ၆ လုံးမတူရင်လည်း approve မလုပ်နိုင်ရပါ။
- Gift နှစ်ခုမှ `000123` တူတူတင်ပါ။ Merchant full ID မတူဘဲ suffix တူရင် သီးခြား received payments အဖြစ် စစ်အတည်ပြုနိုင်သည်။ Full ID တူရင် ဒုတိယ approval ကို reject လုပ်ရပါမယ်။
- Approval retry က hosting ကို ထပ်မတိုးရပါ။ Basic renewal 3,000 / Premium renewal 5,000 နှင့် calendar month ၁ လပဲ တိုးရပါမယ်။
- `/orders` မှာ In review → Payment approved → customer publish ပြီး Ready ပြောင်းတာ စစ်ပါ။

Staging tests အတွက် အစစ်ငွေမလွှဲဘဲ test merchant details သုံးပါ။ Browser interaction နှင့် actual KBZPay record review ကို ကိုယ်ပိုင် staging/merchant account တွင် သီးခြားစမ်းရပါမယ်။
