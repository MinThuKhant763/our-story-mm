# Interactive design + entrance — version 1.6.0

ကိုကိုအတွက် standalone source project ထဲမှာ ထည့်ထားတဲ့ design update ဖြစ်ပါတယ်။ မူရင်း native Three.js geometry၊ CSS နဲ့ local artwork ကို သုံးထားတာဖြစ်ပြီး reference websites တွေရဲ့ models၊ artwork သို့မဟုတ် source ကို ကူးယူထားခြင်း မရှိပါ။ Dependency အသစ်နှင့် SQL migration အသစ် မလိုပါ။

## ဘယ်နေရာမှာ စမ်းရမလဲ

1. Homepage `/` ကိုဖွင့်ပါ။ Browser tab session တစ်ခုမှာ ပထမဆုံးဝင်ချိန် entrance screen ပြမယ်။ **Enter OurStory / Skip intro / Escape** နဲ့ ဝင်နိုင်တယ်။ Homepage ရဲ့ **Replay entrance** နဲ့ ပြန်ကြည့်နိုင်တယ်။ Session storage ပိတ်ထားလည်း ဝင်နိုင်ပြီး JavaScript မပါရင် intro overlay မတားပါ။ Intro ကို ကျော်ပြီးရင် header/content ကို keyboard နဲ့ ပြန်သုံးနိုင်ရမယ်။
2. Hero မှာ Anniversary၊ Birthday၊ Valentine၊ Wedding၊ Graduation ရွေးပါ။ Palette၊ headline၊ gift preset နဲ့ create/demo links ပြောင်းမယ်။ Box၊ bouquet၊ bear၊ heart ကို သီးခြားစမ်းနိုင်တယ်။ Hero ပေါ်က စမ်းထားတဲ့ rotation/opening က save မလုပ်ထားတဲ့ preview ဖြစ်တယ်။ **Create this gift** က ရွေးထားတဲ့ occasion နဲ့ gift style ကို editor သို့ပို့တယ်။
3. Gift ကို ဘယ်/ညာ drag လုပ်ပြီး လှည့်ကြည့်ပါ။ Rotation buttons က keyboard အတွက် အစားထိုးဖြစ်တယ်။ **Reset** နဲ့ မူလအနေအထား ပြန်ထားနိုင်တယ်။ ဖုန်းပေါ်မှာ ဒေါင်လိုက် scroll လုပ်ရင် page ကို scroll လုပ်နိုင်ရမယ်။ Drag လုပ်ပြီးနောက် secret note မဖွင့်သင့်ပါ။
4. `/create` သို့မဟုတ် `/edit/:id` → အဆင့် 4 → **Material finish / 3D display frame / Keepsake sticker** ရွေးပါ။ Save/reload၊ Try opening your gift၊ Full preview၊ test publish၊ recipient link၊ gift ZIP export/restore စမ်းပါ။ ရွေးထားတဲ့ finish/frame/sticker ပြန်ပါရမယ်။ Occasions ပြန်ရွေးပြီး Apply design လုပ်ရင် visual options အားလုံးက preset သို့ပြောင်းမယ်; initials၊ reply permission၊ secret note နဲ့ ကိုယ်ပိုင် memories ကို ထိန်းထားတယ်။
5. `/demo/bloom?occasion=anniversary&lang=my` သို့မဟုတ် ကိုယ်ပိုင် published gift ကိုဖွင့်ပါ။ **Recipient အမည်ပါစာအိတ် → 3D gift → story** ဖြစ်မယ်။ အဆင့်နှစ်ခုလုံးကနေ **Skip animation & read my story** နဲ့ ချက်ချင်းဖတ်နိုင်တယ်။ **Open my gift again** က စာအိတ်မှစ ပြန်ပြမယ်။ PIN/schedule/expiry checks ပြီးမှ ဒီ flow ကို ပြမယ်။

## Theme များ

| Occasion | Art direction | Paper / background | Main text | Accent |
| --- | --- | --- | --- | --- |
| Anniversary | Warm Ivory | `#FFF8F0` | `#293D35` | `#A44860` |
| Birthday | Pastel Party | `#FBF5FF` | `#493650` | `#80519A` |
| Valentine | Midnight Love | `#172238` | `#FFF8F0` | `#F0BCC8` |
| Wedding | Botanical Garden | `#FBF9EF` | `#355640` | `#41694C` |
| Graduation | Golden Chapter | `#20304A` | `#FFF8E8` | `#E3BF77` |

Rose/lavender ကို decoration အဖြစ်သုံးပြီး light backgrounds မှာ button အတွက် ပိုနက်တဲ့ accent သုံးထားတယ်။ Homepage၊ recipient entrance၊ story cover/ending တွေက occasion palette အတိုင်းဖြစ်တယ်။ Template layout၊ album၊ constellation၊ scrapbook နဲ့ other memory widgets ကို template အလိုက် ဆက်ရွေးနိုင်တယ်။ Editor/payment workflow က ဖတ်ရလွယ်တဲ့ warm ivory UI ဖြစ်ပြီး occasion strip နဲ့ step indicator ပါတယ်။

Matte/satin/pearl သည် stylized surface roughness/metalness ဖြစ်ပြီး photorealistic fabric simulation မဟုတ်ပါ။ 3D frames က arch/orbit native geometry၊ stickers က heart/star/flower အမှတ်တံဆိပ်ဖြစ်တယ်။ Unrestricted 3D uploads မပါပါ။ Static fallback မှာလည်း ဒီ options တွေ ပြတယ်။

## Performance နှင့် motion

- Visible gift၊ active browser tab နဲ့ OS Reduce Motion ပိတ်ထားချိန်မှသာ lazy-load 3D scene ကို ဖွင့်တယ်။ Demand rendering၊ capped pixel ratio နဲ့ native geometry သုံးထားတယ်။ Intro ပြနေစဉ် hero 3D ကို ရပ်ထားတယ်။
- **Use simple view** ကနေ WebGL မသုံးဘဲ preview ကြည့်နိုင်တယ်။ WebGL initialization error/context loss ဖြစ်ရင် illustration ပြပြီး **Retry 3D** ရမယ်။ Story ဖတ်ဖို့ WebGL မလိုပါ။
- OS Reduce Motion ဖွင့်ထားရင် static preview သုံးပြီး entrance/envelope/reveal animations မစောင့်ရပါ။ Audio က ကိုယ်တိုင် Play နှိပ်မှ ဖွင့်တယ်။
- Intro language switch၊ modal focus trap၊ Escape၊ keyboard rotation နှင့် transitions ပြီးရင် focus ရွှေ့ခြင်း ပါတယ်။ Myanmar text က OS Myanmar font fallback နဲ့ line-height မြင့်မြင့် သုံးထားတယ်။ Internet font download မရှိပါ။

## Mac မှာ run / update

Node 24.13+ သုံးပါ။ ZIP ကို extract လုပ်ပြီး project folder ထဲမှာ Terminal ဖွင့်ပါ။

```bash
bash start-dev.sh
```

Terminal မှာပြတဲ့ Local URL ကိုဖွင့်ပါ။ အဟောင်းကို update လုပ်ရင် server/reminder worker ကို ရပ်ပြီး data backup ယူပါ။ အသစ်ကို folder အသစ်ထဲ extract လုပ်ပါ။ အဟောင်း `.env.local` နဲ့ configured `DATA_DIR` ထဲက data ကို အသစ်သို့ copy လုပ်ပါ။ DATA_DIR သည် absolute path ဖြစ်ရင် မူလ data ကို ဆက်ညွှန်းနိုင်တယ်; app နှစ်ခုကို တစ်ပြိုင်တည်း မ run ပါနှင့်။ `node_modules`၊ `.next` အဟောင်းကို မကူးပါနှင့်။ `bash start-dev.sh` ကို run ပါ။ Gift JSON အဟောင်းတွေမှာ finish=matte၊ frame=none၊ sticker=none ကို အလိုအလျောက်ဖြည့်ပြီး မူလ style/color/ribbon/initials ကို ထိန်းထားတယ်။

Public production အတွက် domain + HTTPS၊ persistent data volume၊ OWNER_EMAIL၊ Resend/email sender၊ merchant KBZPay account/QR၊ admin approval၊ backups လိုပါတယ်။ ဒီ design release က deployment မလုပ်ထားပါ။ [PRODUCTION_MM.md](PRODUCTION_MM.md) နှင့် [DEPLOYMENT_MM.md](DEPLOYMENT_MM.md) ကိုဖတ်ပါ။

## Browser QA checklist

- 320px/375px mobile၊ iPhone Safari၊ Android Chrome၊ desktop keyboard-only: intro Enter/Skip/Escape၊ focus return၊ replay၊ page scroll၊ lang switch ကိုစစ်ပါ။
- Occasions 5 × gift styles 4: drag၊ rotation buttons၊ opening animation၊ frame/sticker၊ long Myanmar initials/name စစ်ပါ။ Secret note ကို click နဲ့သာ ဖွင့်ရပြီး drag နောက် မဖွင့်ရပါ။
- Editor setting changes/save/reload/publication/export/restore၊ customer screenshot + 6 digits + amount + admin approval ကို staging data နဲ့စစ်ပါ။
- Reduce Motion၊ WebGL disabled၊ context loss၊ background tab၊ low-power mobile ကိုစမ်းပါ။ Skip button ကနေ story/reply သို့ ရောက်ရမယ်။ Existing story letter envelope/album interactions ကိုလည်း စစ်ပါ။

Automated checks သည် TypeScript၊ production build၊ static rendered markup၊ server API persistence/access/payment gates နဲ့ portable restore ကို စစ်တယ်။ ဒီ environment မှာ mobile/browser/WebGL gestures ကို visual QA မလုပ်နိုင်သေးပါ။ Deployment မတိုင်မီ အထက်ပါ browser checks ကို အမှန်တကယ် device တွေမှာ လုပ်ပါ။
