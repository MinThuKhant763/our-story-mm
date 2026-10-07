# Three.js Clock warning ပြင်ဆင်မှု — 1.10.2

`THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` သည် login error မဟုတ်ပါ။ လက်ရှိ pinned React Three Fiber 9.8.1 က Canvas တစ်ခုစီအတွက် deprecated Three Clock ကို ဆောက်နေသောကြောင့် ဖြစ်သည်။

ဤ update တွင် Three 0.186.1 နှင့် Fiber 9.8.1 ကို ဆက်သုံးပြီး Fiber ၏ internal Three import အတွက်သာ Timer adapter ချိတ်ထားသည်။ Adapter သည် supported `THREE.Timer` ဖြင့် အချိန်တိုင်းပြီး Fiber 9 လိုအပ်သော seconds၊ start/stop၊ elapsedTime၊ manual frame API ကို ထိန်းထားသည်။ Global Three object သို့မဟုတ် console.warn ကို ပြောင်းမထားပါ။ npm install ပြန်လုပ်တိုင်း node_modules ကို patch လုပ်ရန် မလိုပါ။

## Mac မှာ update လုပ်ရန်

1. လက်ရှိ dev server ကို Ctrl+C နှိပ်ပြီး ရပ်ပါ။
2. လက်ရှိ `.env.local` နှင့် `data/` ကို backup ယူပါ။ Project folder အသစ်တွင် ZIP ကို ဖြည်ပါ။
3. မိမိ `.env.local` ကို folder အသစ်သို့ ကူးပြီး `DATA_DIR` က လက်ရှိ data ကို ညွှန်နေကြောင်း စစ်ပါ။ Relative `./data` သုံးထားလျှင် server ရပ်ထားစဉ် data folder အပြည့်ကို folder အသစ်သို့ ကူးပါ။
4. Terminal မှာ project folder အသစ်ထဲ ဝင်ပြီး run ပါ။

```bash
npm ci
npm run test:timer
npm run dev
```

Browser ကို reload လုပ်ပါ။ Dev/build scripts တွင် `--webpack` ပါပြီးသား ဖြစ်သည်။ `npx next dev` သို့မဟုတ် Turbopack သို့ ပြောင်းသုံးလျှင် ဤ scoped Webpack adapter မချိတ်ပါ။ `npm run dev` နှင့် `npm run build` ကို သုံးပါ။

Production update တွင် `npm run build` ပြီး server restart လုပ်ပါ။ Docker သုံးလျှင် `docker compose build` ပြီး `docker compose up -d` လုပ်ပါ။ Database migration အသစ် မရှိပါ။

## စစ်ဆေးရန်

`npm run test:timer` က actual Fiber code ကို project Webpack configuration ဖြင့် bundle လုပ်ပြီး Timer-backed root၊ warning မထွက်မှု၊ shared Three constructors၊ frame delta seconds၊ start/stop/restart၊ demand/never frame switching နှင့် manual advance ကို စစ်သည်။ CI တွင်လည်း ထည့်ထားသည်။

Browser မှာ homepage gift rotation၊ recipient gift opening နှင့် editor Little Gift Shop ကို စမ်းပါ။ Real WebGL rendering/touch animation ကို automated timer tests က မစစ်ပါ။ မတူသော warning/error များကို ပုံမှန်အတိုင်း မြင်နိုင်သည်။

Official references:

- https://github.com/pmndrs/react-three-fiber/issues/3741
- https://threejs.org/docs/pages/Timer.html
- https://r3f.docs.pmnd.rs/next/migration/v10

Future Fiber major upgrade လုပ်သောအခါ adapter နှင့် scoped Webpack replacement ကို ပြန်သုံးသပ်ပါ။ Fiber 10 သည် timing API နှင့် renderer API ကို ပြောင်းထားသောကြောင့် scene code/Drei compatibility ကို စစ်ပြီးမှ upgrade လုပ်သင့်သည်။
