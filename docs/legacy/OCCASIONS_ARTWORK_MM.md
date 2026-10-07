# OurStory 1.5.0 — Occasion presets နှင့် artwork အသစ်များ

Anniversary အပြင် Birthday၊ Valentine၊ Wedding နှင့် Graduation အတွက် မြန်မာ/အင်္ဂလိပ်စာသားနမူနာ၊ လိုက်ဖက်သည့် template နှင့် 3D gift အလှတို့ ပါဝင်သည်။

| Occasion | Design | 3D gift preset | နေ့စွဲအဓိပ္ပါယ် |
| --- | --- | --- | --- |
| Anniversary | Bloom | Rose box၊ bow၊ champagne ribbon၊ hearts | ဇာတ်လမ်းအစပြုသည့်ရက်၊ together counter နှင့် နောက်နှစ်ပတ်လည်နေ့ |
| Birthday | Scrapbook | Lavender teddy၊ party hat၊ sparkles | ယခုမွေးနေ့ကျင်းပမည့်ရက် |
| Valentine | Night | Rose heart၊ rose ribbon၊ hearts | ယခုချစ်သူများနေ့ ကျင်းပမည့်ရက် |
| Wedding | Garden | Ivory bouquet၊ rose ၇ ပွင့်၊ bow၊ petals | မင်္ဂလာပွဲနေ့ |
| Graduation | Aurora | Midnight box၊ crown၊ champagne ribbon၊ sparkles | ဘွဲ့ရပွဲ ကျင်းပမည့်ရက် |

Graduation artwork တွင် graduation cap ပါသည်။ Interactive 3D preset တွင် လက်ရှိ support လုပ်ထားသော crown accessory ကို သုံးထားသည်။ ပုံထဲက cake၊ balloons၊ rings၊ diploma တို့သည် illustration များဖြစ်ပြီး editable 3D objects သို့မဟုတ် physical delivery မဟုတ်ပါ။

## သုံးပုံ

1. Homepage **Every reason to celebrate** မှ preset ရွေးပါ။ Preview ကိုလည်း အကောင့်မဝင်ဘဲ ကြည့်နိုင်သည်။ ဥပမာ `/demo/scrapbook?occasion=birthday&lang=my`။
2. အကောင့်ဝင်ပြီး `/create?occasion=birthday` ကဲ့သို့ လက်ဆောင်စပါ။ Account language အလိုက် sample title/message ပါလာသည်။ Template နှင့် gift အလှကို ပြင်နိုင်သည်။
3. Editor **step 1** မှ occasion ကို ပြောင်းနိုင်သည်။ **Keep my words, apply design** က လက်ရှိ title/letter ကို ဆက်ထိန်းသည်။ **Apply design + sample words** ကို နှိပ်မှ title/letter ကို အစားထိုးသည်။
4. Sample words ထဲသို့ နာမည်ထည့်လိုလျှင် နာမည်နှစ်ခုဖြည့်ပြီး preset ကို ပြန်ရွေးကာ sample words ကို apply လုပ်ပါ။ စာသည် မိမိရေးသားသည့် saved text ဖြစ်ပြီး language ပြောင်းခြင်းကြောင့် အလိုအလျောက် ဘာသာပြန်/အစားထိုးမည်မဟုတ်ပါ။
5. Step 3 ရှိ starting point က ရွေးထားသော occasion နှင့် editor language အတွက် draft ဖြစ်သည်။ ရေးထားပြီးသားစာရှိလျှင် မအစားထိုးဘဲ ကာကွယ်ထားသည်။

Preset ပြောင်းခြင်းသည် template၊ gift style၊ palette၊ ribbon၊ accessory၊ effect နှင့် flower options ကို ပြောင်းသည်။ နာမည်၊ ရက်စွဲ၊ ဓာတ်ပုံ၊ timeline၊ PIN၊ reveal schedule၊ saved initials၊ reply setting နှင့် secret note ကို ထိန်းထားသည်။ Memories/photo selection သည် reset မဖြစ်ပါ။

Anniversary မှလွဲလျှင် sender → recipient အဖြစ် ဖော်ပြပြီး couple together counter မပြပါ။ ရွေးထားသော ကျင်းပမည့်ရက်အထိ ရက်တွက်ခြင်းကို မြန်မာအချိန်ဖြင့် ပြသည်။ အတိတ်ရက်များကို အမှတ်တရနေ့အဖြစ် ပြပြီး နှစ်တိုင်းရက်ကို အလိုအလျောက် ရှေ့ရွှေ့မည်မဟုတ်ပါ။ Birthday date သည် DOB field မဟုတ်ပါ။ Public gift နှင့် demo တွင် language switch ပါသည်။

## Artwork

- Occasion artwork: `public/images/occasions/` တွင် Anniversary၊ Birthday၊ Valentine၊ Wedding၊ Graduation WebP ၅ ပုံ။
- Template artwork: `public/images/templates/` တွင် Film၊ Night၊ Scrapbook၊ Aurora၊ Garden WebP ၅ ပုံ။ Bloom သည် Anniversary artwork ကို မျှဝေသုံးသည်။
- Homepage hero၊ template cards၊ demo artwork နှင့် photo မရှိသေးသော gift covers အားလုံးကို artwork အသစ်နှင့် ချိတ်ထားသည်။ Demo/gift decoration သည် customer ရဲ့ actual memory photo မဟုတ်ပါ။ Customer upload များကို မအစားထိုးပါ။
- ပုံများကို ChatGPT built-in image generation ဖြင့် ဖန်တီးထားပြီး model version ကို tool က ရွေးရန်/စစ်ရန် မပေးသဖြင့် **“image 2.5” ဖြင့် ထုတ်ထားသည်ဟု မဆိုထားပါ**။
- Prompt set၊ final file paths၊ dimensions နှင့် generation record သည် `docs/ARTWORK_PROVENANCE.json` တွင် ပါသည်။ Maximum 1200px၊ WebP quality 86၊ ပုံတစ်ပုံ 130–260 KB ခန့်။ ပုံအကြောင်းအရာကို နောက်ထပ်ပြင်ခြင်း မလုပ်ထားပါ။
- App ဖွင့်ရာတွင် OpenAI/image API key မလိုပါ။ Runtime generation၊ customer image credits သို့မဟုတ် automatic AI photo editing မပါပါ။
- Logo/favicon၊ UI icons၊ QR နှင့် actual interactive Three.js objects သည် မူလ code/vector assets အဖြစ် ဆက်ရှိသည်။

## Existing project ကို Mac တွင် update လုပ်ခြင်း

1. Terminal တွင် dev server ကို Ctrl+C နှိပ်ပြီး ပိတ်ပါ။ Reminder worker ရှိလျှင် ထို worker ကိုပါ ပိတ်ပါ။ Database/media ကို အရင် backup လုပ်ပါ။
2. ZIP အသစ်ကို folder အသစ်တွင် extract လုပ်ပါ။ Project အဟောင်းမှ `.env.local` နှင့် `data/` ကို folder အသစ်သို့ ကူးပါ။ `DATA_DIR` က အခြား absolute path ဖြစ်လျှင် ထို setting/storage ကို ဆက်သုံးပါ။
3. Project folder ထဲတွင် `bash start-dev.sh` လုပ်ပြီး terminal က ပြသော Local URL ကို ဖွင့်ပါ။ Dependency/build folders အဟောင်းကို ကူးရန် မလိုပါ။
4. Occasion field ကို gift content JSON ထဲ၌ သိမ်းသည်။ 1.4 → 1.5 အတွက် SQL migration အသစ် မလိုပါ။ အရင် gift JSON တွင် occasion မရှိလျှင် Anniversary အဖြစ် ဆက်ဖတ်သည်။ Portable ZIP restore တွင် occasion နှင့် gift customization ကို ဆက်ထိန်းသည်။
5. အဟောင်း version သို့ rollback လုပ်ရမည်ဆိုလျှင် upgrade မလုပ်မီ backup ကို သုံးပါ။ Version အဟောင်းဖြင့် birthday/graduation content ကို save လုပ်ခြင်းသည် occasion field ကို ဖယ်နိုင်သည်။

Production တွင် app image `ourstory-mm:1.5.0` ကို build ပြန်လုပ်ပါ။ Persistent data volume ကို ဆက်သုံးပါ။ Current guides ရှိ backup/restore၊ HTTPS၊ manual KBZPay နှင့် reminder worker setup များ ဆက်အကျုံးဝင်သည်။

## Manual launch QA

Myanmar/English နှစ်မျိုးဖြင့် preset ငါးခုလုံး create → customize → reload → preview → publish → reply ကို စမ်းပါ။ လက်ရှိစာနှင့် photos ရှိသည့် gift တွင် keep-words/replace-words buttons နှစ်မျိုး စမ်းပါ။ PIN၊ reveal schedule နှင့် expiry gates ကိုပါ စမ်းပါ။ Mobile Safari/Chrome၊ WebGL ပိတ်ထားသော browser၊ reduced-motion setting နှင့် 320px screen တွင် images၊ card layout၊ 3D reveal၊ language switch နှင့် modal ကို စစ်ပါ။ ဤ environment တွင် actual mobile/WebGL browser QA မပြီးသေးပါ။
