# Version 1.8.0 — Music start, QR card, History

## Music start time
Editor → Music → YouTube ကိုရွေးပြီး Start time (seconds) ထည့်ပါ။ ဥပမာ 90 = 1:30။ 0–86400 seconds ခွင့်ပြုထားသည်။ YouTube player သည် အနီးဆုံး keyframe မှ စတင်နိုင်သည်။ လက်ခံသူက player ကိုဖွင့်ပြီး Play နှိပ်ရသည်။ Autoplay မလုပ်ပါ။

## Printable Gift QR card
Gift ကို publish လုပ်ပြီး Share → Create a printable gift QR card ကိုဖွင့်ပါ။ Recipient၊ Sender၊ Message ဖြည့်ပြီး HTML ဒေါင်းပါ။ Mac browser မှာ ဖွင့်ပြီး Cmd+P → Save as PDF / Print လုပ်ပါ။ QR သည် hosted gift URL ကိုဖွင့်သည်။ Production HTTPS domain မှ card ဖန်တီးပါ; localhost QR ကို အခြားဖုန်းက ဖွင့်မရပါ။ PIN ကို သီးခြားပေးပါ။ Hosting သက်တမ်းကုန်ပါက card ပေါ်က QR ဖြင့် gift ဖွင့်မရပါ။ Card fields ကို server တွင် မသိမ်းပါ။ Download သည် PDF မဟုတ်ဘဲ printable HTML ဖြစ်သည်။

## Version history
Editor header → History → version ရွေး → Restore this version။ Completed draft ရဲ့ writing/design ပြောင်းပြီး Save လုပ်တိုင်း အရင် version ကို snapshot သိမ်းသည်။ နောက်ဆုံး 20 ခုသာ ထိန်းထားသည်။ History ဖွင့်ချိန် valid current draft ကို Save လုပ်သည်။ Invalid unsaved draft ကို Restore နှိပ်လျှင် ရွေးထားသော version ဖြင့် အစားထိုးသည်။ Restore မလုပ်ခင် မသိမ်းနိုင်သောစာကို ကိုယ်တိုင်ကူးသိမ်းပါ။

Restore သည် writing၊ photo selection၊ template၊ box settings (secret surprise နှင့် reply permission အပါအဝင်) ကို ပြန်ယူသည်။ PIN၊ reveal schedule၊ plan၊ payment၊ status၊ hosting expiry၊ current voice recording နှင့် recipient replies ကို မပြောင်းပါ။ ဖျက်ပြီးသားပုံကို ပြန်မယူနိုင်ပါ။ လက်ရှိ plan photo limit ကို လိုက်နာသည်။ Restore မလုပ်ခင် current saved version ကိုလည်း သိမ်းထားသဖြင့် ပြန်ရွေးနိုင်သည်။ Other tab မှ update လုပ်ထားလျှင် conflict ပြပြီး reload လိုသည်။

## Upgrade / production
Existing deployment ကို stop လုပ်ပြီး documented encrypted full backup ကိုယူပါ။ Source ကို update လုပ်၊ `npm ci`, `npm run build`, `npm start` လုပ်ပါ။ Existing DATA_DIR နှင့် production environment ကို ဆက်သုံးပါ။ Migration 0008 သည် app စတင်ချိန် automatic run သည်။ Update မတိုင်မီ edits များကို history အဖြစ် ပြန်မဖန်တီးနိုင်ပါ။ Full database backup တွင် history ပါဝင်သည်; per-gift portable ZIP သည် current gift ကိုသာ export လုပ်ပြီး history မပါပါ။ Gift delete လုပ်လျှင် history လည်း ဖျက်သည်။ New dependency / YouTube API key မလိုပါ။

Browser/device QA: actual YouTube playback/start point, mobile audio, QR scanning, A5 printing and Save as PDF ကို deployment တွင် စစ်ပါ။ Automated render tests သည် browser interaction ကို မအစားထိုးနိုင်ပါ။
