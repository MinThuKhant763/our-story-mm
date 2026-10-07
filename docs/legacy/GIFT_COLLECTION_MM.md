# 3D Gift Collection + Design — version 1.3.0

## ဘာတွေ အသစ်ပါလဲ

| Gift ပုံစံ | 3D reveal |
|---|---|
| Wrapped with love | ဖဲကြိုးချည်ထားတဲ့ box အဖုံး မြင့်တက်ပြီး ဖွင့်သည် |
| Forever flowers | ပန်းစည်း၏ flowers ဖြည်းဖြည်းပွင့်၊ bouquet မြင့်တက်သည် |
| A little bear hug | Teddy လေးက heart ကိုင်ပြီး လက်ပြနှုတ်ဆက်သည် |
| Heart of gold | Sculpted heart လေးသည် keepsake stand မှ မြင့်တက်လာသည် |

ဒါတွေက **digital gifts** ဖြစ်သည်။ Physical flowers/bears delivery မချိတ်ထားပါ။ Basic/Premium နှစ်မျိုးလုံးမှာ gift styles ၄ မျိုးနှင့် website templates ၆ မျိုးကို ရွေးနိုင်သည်။ Basic 3,000 MMK / Premium 5,000 MMK တစ်လစာ၊ manual KBZPay screenshot + transaction ID နောက်ဆုံး ၆ လုံး flow ကို ဆက်သုံးသည်။

Hearts / Petals / Golden sparkles / Quiet reveal effects၊ gift/ribbon colors နှင့် couple initials ကို ရွေးနိုင်သည်။ Editor autosave၊ server validation၊ public recipient page နှင့် portable ZIP restore မှာ settings ဆက်ကျန်သည်။ အဟောင်း gift boxes တွင် style/effect မပါလည်း box/hearts ကို default သုံးပြီး အဟောင်း color/ribbon/initials ကို ထိန်းသည်။ ဒီ release အတွက် SQL migration အသစ်မလိုပါ; settings ကို existing `box_config` ထဲမှာ သိမ်းသည်။

## ဘယ်နေရာမှာ ဘယ်လို စမ်းရမလဲ

1. `/` → **Gift collection** မှ gift style တစ်မျိုးချင်းနှိပ်၊ **Try the magic** / **စမ်းမယ်** ကိုနှိပ်ပါ။ Preview animation ပြီးရင် ထပ်စမ်းနိုင်သည်။ Make this their gift နှိပ်ပြီး account ဝင်ပါ; editor step 4 မှာ ရွေးထားသော gift style ဖြစ်ရပါမယ်။
2. `/create` → editor **step 4** မှ gift style ရွေး၊ colors/initials/effect ပြောင်းပါ။ **Preview animation** ကိုနှိပ်ပါ။ Autosave ပြီး reload လုပ်ရင် တူညီသော settings ကျန်ရပါမယ်။
3. **Try opening your gift** ဖြင့် full reveal စမ်းပါ။ Open your gift နှိပ်ပြီး ခန့်မှန်း 2.4 စက္ကန့်အကြာ story ထဲဝင်ရပါမယ်။ Skip animation က ချက်ချင်းဖတ်နိုင်စေရပါမယ်။ Story အပေါ်မှ Open my gift again နှိပ်ပြီး replay လုပ်နိုင်သည်။
4. Owner test publish လုပ်ပြီး recipient URL ကို browser အသစ်မှာ စမ်းပါ။ Saved gift style/effect/colors/initials တူရပါမယ်။ PIN/scheduled reveal သတ်မှတ်ထားရင် gate ပြီးမှ gift reveal ရပါမယ်။
5. `/account` မှ portable gift ZIP export/restore လုပ်ပါ။ Style/effect က ကျန်ရပြီး restored gift သည် fresh draft ဖြစ်ရပါမယ်။ Payment entitlement ကို မကူးပါ။
6. **Use simple view** ကို နှိပ်ပါ။ Gift ပုံစံကို static vector illustration နဲ့ ပြရပါမယ်။ Reduced motion setting ဖွင့်ပြီး စမ်းပါ။ WebGL မရရင်လည်း illustration၊ Open/Skip မှ story ဖတ်နိုင်ရပါမယ်။
7. 320/375px mobile၊ iPhone Safari၊ Android Chrome၊ desktop keyboard-only နဲ့ စမ်းပါ။ Long Myanmar names/initials၊ template ၆ မျိုး၊ PIN/reveal time ကို စုံအောင်စမ်းပါ။ Device တကယ်မှာ loading/performance ကို တိုင်းပါ။

Quick demos: `/demo/bloom?gift=bouquet`, `/demo/bloom?gift=bear`, `/demo/aurora?gift=heart`, `/demo/film?gift=box`။ Gift styles ကို template မည်သည့်အမျိုးအစားနဲ့မဆို တွဲနိုင်သည်။

## Design / performance

Homepage ကို gift atelier preview၊ illustrated selection cards၊ warm colors၊ rounded cards၊ softer shadows နှင့် mobile layout အသစ်ပြင်ထားသည်။ Reveal page တွင် gift style အလိုက် background/arch၊ description နှင့် initials tag ပါသည်။

Models သည် Three.js geometry ဖြင့် တည်ဆောက်ထားပြီး external model download မလိုပါ။ 3D scene ကို viewport ထဲဝင်မှ load၊ offscreen/background tab မှာ ရပ်၊ on-demand frames နှင့် DPR cap 1.5 ကို သုံးသည်။ Reveal effects သည် finite duration ဖြစ်ပြီး endless animation မဟုတ်ပါ။ Reduced motion မှာ static fallback သုံးသည်။ Static view ကို manually ရွေးနိုင်သည်။ အဲဒီ setting သည် device-local preview control ဖြစ်ပြီး gift content ထဲ မသိမ်းပါ။

Official reference: https://r3f.docs.pmnd.rs/next/advanced/scaling-performance

## Mac safe update

Server ကို `Control+C` ဖြင့်ရပ်ပြီး project/data ကို backup လုပ်ပါ။ ZIP အသစ်ကို folder သီးခြားမှာ extract၊ အဟောင်း `.env.local` နှင့် `data/` ကို server ရပ်ထားစဉ် copy လုပ်၊ `bash start-dev.sh` run ပါ။ Custom `DATA_DIR` ရှိရင် အဲဒီ directory ကို backup လုပ်ပြီး ဆက်သုံးပါ။ Node 24.13+ လိုသည်။ Terminal ပြသော Local URL ကို သုံးပါ။ မူလ migrations ကို မပြင်ပါနှင့်။

## လက်ရှိ validation အကန့်အသတ်

API/SSR၊ schemas၊ legacy settings compatibility နှင့် backup flow ကို automated tests ဖြင့် စစ်ထားသည်။ Static fallback illustrations ၄ မျိုးကို render လုပ်ပြီး ကြည့်စစ်ထားသည်။ Authoring environment မှာ Chromium binary မရှိသဖြင့် WebGL/browser interactions နှင့် actual mobile visual QA မပြီးသေးပါ။ Public launch မလုပ်မီ အပေါ်က device checks ကို staging မှာ ဆက်စမ်းပါ။
