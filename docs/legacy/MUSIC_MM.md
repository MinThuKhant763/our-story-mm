# Background sound + YouTube music — version 1.7.0

## ဘယ်နေရာမှာ ထည့်ရမလဲ

1. `/create` သို့မဟုတ် `/edit/:id` → **အဆင့် 3 / Your message** ကိုဖွင့်ပါ။ **Add a background soundtrack** section မှာ သတ်မှတ်ပါ။
2. **Ambient sounds** ရွေးရင် Tender keys၊ Moonlit dream၊ Garden chimes ဆိုတဲ့ original တေးသွား 3 မျိုးရမယ်။ Starting volume၊ Repeat နဲ့ Play/Pause ကိုစမ်းပါ။ တေးသွားတွေသည် ဒီ project အတွက် code နဲ့ synthesize လုပ်ထားတဲ့ 16-second loops ဖြစ်တယ်; downloaded songs သို့မဟုတ် sampled recordings မပါပါ။
3. YouTube တေးသီချင်းအတွက် HTTPS link paste → **Add YouTube song** နှိပ်ပါ။ Watch၊ youtu.be၊ Shorts၊ live၊ music.youtube.com video links ကို လက်ခံတယ်။ Single video ပဲရပြီး channel/playlist link၊ iframe HTML နဲ့ arbitrary websites မရပါ။ Timestamp/playlist/tracking parameters ကို ဖယ်ပြီး video URL ပဲသိမ်းတယ်။
4. Saved ပြတာစောင့်ပြီး reload၊ **Full preview**၊ **Try opening your gift** နဲ့ published recipient link ကိုစမ်းပါ။ Recipient က story ရောက်ပြီး music panel ကိုမြင်မယ်။ **No music** ရွေးရင် အသံမပါ၊ music panel မပြတော့ပါ။
5. YouTube source မှာ **Load YouTube player** ကိုနှိပ်ပြီး player ထဲက **Play / Pause / volume** ကိုသုံးပါ။ YouTube video ကို visible player ထဲမှာပြထားတယ်; hidden audio extraction မလုပ်ပါ။ **Stop & close player** နဲ့ player ကို ပိတ်နိုင်တယ်။ App ရဲ့ starting-volume slider က local ambient တေးသွားအတွက်ပဲဖြစ်တယ်။ Mobile YouTube volume ကို device controls မှ ထိန်းရနိုင်တယ်။

အသံကို အလိုအလျောက် မဖွင့်ပါ။ Initial page/compact editor preview မှာ YouTube iframe မပါ၊ YouTube thumbnail/script/network ကို မခေါ်ပါ။ Player ကို လက်ခံသူက ဖွင့်မှ YouTube နဲ့ ချိတ်ဆက်တယ်။ YouTube video availability၊ embed permission၊ network/data၊ ads နဲ့ login/region restrictions ကို OurStory က မထိန်းချုပ်နိုင်ပါ။ မဖွင့်နိုင်ရင် **Open it on YouTube** ကိုသုံးနိုင်တယ်။ Privacy notice ကို `/privacy` မှာပါ ရှင်းထားတယ်။

Browser tab ကို နောက်ကွယ်ထားရင် local audio ရပ်ပြီး YouTube iframe ပိတ်တယ်။ ပြန်ဝင်ရင် ကိုယ်တိုင် ပြန်ဖွင့်ရမယ်။ Voice message တစ်ခုကို Play နှိပ်ရင် နောက်ခံတေးသံ ရပ်ပြီး အသံနှစ်ခု ထပ်မဖွင့်ရပါ။ Gift ကို replay လုပ်ချိန် story/player unmount ဖြစ်ပြီး music ရပ်မယ်။

## သိမ်းဆည်းခြင်း၊ update၊ deployment

Music config သည် gift content JSON ထဲမှာဖြစ်ပြီး autosave၊ public gift access checks နဲ့ per-gift ZIP export/restore ထဲပါမယ်။ YouTube link သာသိမ်းပြီး video/audio ဖိုင်ကို download မလုပ်ပါ။ Local ambient assets သည် `public/audio/` ထဲမှာ ပါပြီး original generator က `scripts/generate-soundtracks.py` ဖြစ်တယ်။ Offline HTML keepsake သည် interactive music player မသိမ်းပါ; ZIP restore ပြီး hosted app မှာ နားဆင်ပါ။

SQL migration/API key/new dependency မလိုပါ။ Gift JSON အဟောင်းနှင့် ZIP အဟောင်းတွေမှာ music source **none** ကို default ဖြည့်တယ်။ သီချင်းရွေးမှ အသံပါမယ်။ CSP က `https://www.youtube-nocookie.com` iframe host ကိုသာ ထပ်ခွင့်ပြုပြီး referrer policy ကို origin ပို့နိုင်တဲ့ `strict-origin-when-cross-origin` အတိုင်း ထားတယ်။ Reverse proxy မှ CSP header အသစ်ကို ပိတ်မထားကြောင်းစစ်ပါ။

Mac: app/reminder worker ရပ် → data backup → ZIP အသစ်ကို folder အသစ်ထဲဖြည် → မူလ `.env.local`/DATA_DIR ကို ထိန်းထား → `bash start-dev.sh`။ Production: app image ကို rebuild လုပ်ပြီး persistent volume ကို ဆက်သုံးပါ။ [DEPLOYMENT_MM.md](DEPLOYMENT_MM.md) ကိုဖတ်ပါ။

## စမ်းသပ်ရန်

- Ambient tracks သုံးမျိုး၊ volume 0/35/100၊ loop on/off၊ Play/Pause၊ tab hide/resume၊ voice Play၊ gift replay၊ preview modal ပိတ်ခြင်း စမ်းပါ။ Modal/gift ပိတ်ပြီး အသံ မဆက်ထွက်ရပါ။
- မှန်ကန်/မှားတဲ့ YouTube links၊ link add/remove၊ save/reload၊ consent-load၊ player Play/Pause/Stop၊ embed ပိတ်ထားတဲ့ video နှင့် external fallback ကိုစမ်းပါ။
- Gift ZIP export/restore ပြီး same music settings ရရမယ်။ PIN/schedule/expired gift တွင် authorized story မရောက်မချင်း player မပြရပါ။
- iPhone Safari/Android Chrome တွင် media playback၊ system volume နဲ့ 320px layout စမ်းပါ။ Player viewport ကို အနည်းဆုံး 200 × 200px ပြထားတယ်။ Network blocked/offline ဖြစ်လည်း story/Skip ကို ဖတ်နိုင်ရပါ။

YouTube references: https://developers.google.com/youtube/player_parameters နှင့် https://developers.google.com/youtube/terms/required-minimum-functionality ။ Automated checks သည် URL/security validation၊ initial markup၊ local WAV asset validity၊ API persistence/restore နှင့် CSP ကို စစ်တယ်။ Live YouTube playback၊ mobile sound quality နှင့် actual browser interaction ကို ဒီ environment မှာ မစမ်းနိုင်သေးပါ။
