# Little Gift Shop — v1.10.0

## ဘယ်နေရာမှာ ဘယ်လို စမ်းမလဲ
1. Gift editor → **Make it a gift** (Step 4) → **Little Gift Shop → Enter the little gift shop** ကိုနှိပ်ပါ။ Wrapping style သည် gift box သို့ပြောင်းမည်။
2. Shelf မှ ပန်းစည်း၊ teddy သို့မဟုတ် chocolate ကို နှိပ်ရွေးပါ။ Box ရဲ့ Left / Center / Right နေရာကို နှိပ်ပြီးထည့်ပါ။ ဖုန်းမှာ tap နဲ့ စီနိုင်သည်။ Keyboard Tab + Enter/Space နဲ့လည်း ရွေးထည့်နိုင်သည်။ Computer တွင် shelf card ကို box slot ထဲ drag-and-drop လုပ်နိုင်သည်။ 3D scene ထဲက shelf / box နေရာများကိုလည်း mouse နဲ့နှိပ်နိုင်သည်။
3. Packed item ရဲ့ **Move** နှိပ်ပြီး နေရာအသစ်ကိုနှိပ်ပါ။ အဲ့နေရာတွင် ပစ္စည်းရှိလျှင် နှစ်ခု နေရာချင်းလဲမည်။ Shelf မှ item အသစ်ကို ရှိပြီးသားနေရာမှာ ထည့်လျှင် အဲ့ပစ္စည်းကို အစားထိုးမည်။ Trash button နဲ့ ဖယ်နိုင်သည်။ တစ်မျိုးကို တစ်ခုစီ၊ အများဆုံး သုံးခု ထည့်နိုင်သည်။
4. Save icon / Saved indicator ကို စစ်ပြီး page reload လုပ်ပါ။ Item နဲ့ position မပျောက်ရပါ။ **Preview animation** နဲ့ box အဖုံးမြောက်ပြီး contents ပေါ်လာတာ စမ်းပါ။
5. Gift ကို publish လုပ်ပြီး shared link ကို private browser window မှာဖွင့်ပါ။ Gift ဖွင့်ပြီးနောက် **Handpicked, just for you** section မှာ ရွေးထားသောပစ္စည်းနဲ့ နေရာကို ကြည့်နိုင်သည်။ Notification သည် gift/story ဖွင့်ချိန်မှသာ ဖြစ်ပြီး shelf ပြင်ခြင်းနဲ့ မဖြစ်ပါ။
6. အခြား arrangement တစ်ခု Save လုပ် → History မှ အရင် version Restore လုပ်ပါ။ Box contents နဲ့ နေရာများကို ပြန်ယူနိုင်သည်။ Account မှ gift ZIP export → fresh draft import လုပ်လျှင်လည်း arrangement ပါလာမည်။

## Design and device behavior
Warm ivory / sage green / rose နဲ့ wood shelf၊ arch displays၊ open keepsake counter ကို အသုံးပြုထားသည်။ ပစ္စည်းများသည် code-native 3D geometry နှင့် original SVG illustrations ဖြစ်ပြီး external model / font / texture download မလိုပါ။ 3D scene ကို viewport ထဲမြင်မှ load လုပ်သည်။ Hidden tab၊ reduced-motion preference၊ simple view နှင့် WebGL failure အတွက် static illustration + tap/keyboard controls သုံးနိုင်သည်။ Shelf cards/slots က 3D မရလည်း အလုပ်လုပ်သည်။ **Simple view / Retry 3D** ခလုတ်ပါသည်။

ဤပစ္စည်းများသည် digital keepsakes ဖြစ်သည်။ Physical product order၊ stock၊ delivery သို့မဟုတ် သီးခြား item payment မပါဝင်ပါ။ လက်ရှိ monthly hosting plan 3000 / 5000 MMK ကို မပြောင်းပါ။

**Use a classic gift box** ခလုတ်သည် shop ကိုပိတ်ပြီး ရွေးထားသော items ကို ဆက်သိမ်းထားသည်။ ပြန်ဖွင့်လျှင် arrangement ပြန်လာမည်။ Wrapping style ကို bear / bouquet / heart ပြောင်းပါက packed contents ကို ဖျောက်ထားပြီး configuration ကို ဆက်ထိန်းသည်။ Shop ကိုပြန်ဝင်လျှင် box style သို့ပြန်ပြောင်းမည်။ Occasion preset ပြောင်းလည်း ကိုယ်တိုင်စီထားသော items မပျောက်ပါ။ Box color / flowers settings သည် 3D presentation ကို လိုက်ပြောင်းသည်; static illustrations သည် decorative fallback ဖြစ်သည်။

## Upgrade
အရင် project / data ကို backup ယူပါ။ New source ကို clean folder ထဲဖြည်ပြီး မူလ environment နှင့် DATA_DIR / production volume ကို ဆက်သုံးပါ။ Node 24.13+၊ `npm ci`၊ `npm run build` လိုသည်။ Existing migrations ကို မပြင်ထားပါ။ ဒီ feature အတွက် SQL migration / new dependency မလိုပါ။ Gift အဟောင်းများသည် shop OFF / empty items default ဖြစ်ပြီး ယခင် wrapping ကို ဆက်သုံးသည်။

Automated coverage သည် bounded/unique item placement၊ swap/replace/remove semantics၊ legacy defaults၊ bilingual markup၊ API save/reload/publication၊ history restore နှင့် ZIP import ကို စစ်သည်။ Browser/mobile drag/tap၊ orbit controls၊ WebGL reveal နှင့် visual layout ကို staging မှာ device အစစ်နဲ့ စစ်ပါ။ Static render test သည် browser visual QA မဟုတ်ပါ။
