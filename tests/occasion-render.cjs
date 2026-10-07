const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const assert=require('node:assert/strict');
// Transpile project TSX in this test process only; this checks markup, not browser/WebGL behavior.
const root=path.resolve(__dirname,'..');
const projectRequire=Module.createRequire(path.join(root,'package.json'));
const ts=projectRequire('typescript');
const originalResolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...args){return originalResolve.call(this,request.startsWith('@/')?path.join(root,request.slice(2)):request,parent,...args);};
for(const extension of ['.ts','.tsx'])Module._extensions[extension]=(module,filename)=>{
 const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 module._compile(output,filename);
};
const React=projectRequire('react');const {renderToStaticMarkup}=projectRequire('react-dom/server');
const {GiftView}=require(path.join(root,'components/ourstory/gift-view.tsx'));
const {occasionIds,occasionWords}=require(path.join(root,'lib/occasions.ts'));
const {demoContent,templateIds}=require(path.join(root,'lib/gifts.ts'));
let checks=0;
for(const occasion of occasionIds)for(const template of templateIds)for(const lang of ['en','my']){
 const content={...demoContent,occasion,letter:'<script>private text</script>',photoIds:[]};
 const html=renderToStaticMarkup(React.createElement(GiftView,{content,template,lang}));
 assert.ok(html.includes('data-occasion="'+occasion+'"'));
 assert.ok(html.includes('/images/occasions/'+occasion+'.webp'));
 assert.ok(html.includes(occasionWords(occasion,lang).badge));
 assert.ok(html.includes('&lt;script&gt;private text&lt;/script&gt;'));assert.ok(!html.includes('<script>private text'));
 if(occasion!=='anniversary'){assert.ok(!html.includes('class="together"'));assert.ok(html.includes('class="celebration-date-note"'));assert.ok(html.includes('class="occasion-sender"'));}
 else assert.ok(html.includes('class="together"'));
 checks++;
}
console.log('PASS: '+checks+' rendered combinations of five occasions, six templates and two languages; correct artwork, escaped messages, anniversary-only couple counter.');
const {GiftReveal}=require(path.join(root,'components/ourstory/gift-3d.tsx'));
const {GiftIllustration}=require(path.join(root,'components/ourstory/gift-illustration.tsx'));
const {Home}=require(path.join(root,'components/ourstory/home.tsx'));
const {presetBox}=require(path.join(root,'lib/occasions.ts'));
for(const occasion of occasionIds)for(const lang of ['en','my']){
 const html=renderToStaticMarkup(React.createElement(GiftReveal,{occasion,lang,recipient:'<script>Recipient</script>',box:presetBox(occasion)},React.createElement('div',null,'PRIVATE_STORY_SENTINEL')));
 assert.ok(html.includes('keepsake-envelope'));assert.ok(html.includes('&lt;script&gt;Recipient&lt;/script&gt;'));assert.ok(!html.includes('PRIVATE_STORY_SENTINEL'));assert.ok(html.includes('data-occasion="'+occasion+'"'));assert.ok(html.includes(lang==='my'?'စာအိတ်လေး ဖွင့်မယ်':'Open the envelope'));
 const illustration=renderToStaticMarkup(React.createElement(GiftIllustration,{box:presetBox(occasion)}));assert.ok(illustration.includes('data-finish="'+presetBox(occasion).finish+'"'));
}
const home=renderToStaticMarkup(React.createElement(Home,{}));assert.ok(home.includes('interactive-hero-art'));assert.ok(home.includes('hero-occasion-pills'));assert.ok(!home.includes('role="dialog"'));assert.ok(home.includes('Replay entrance'));assert.ok(home.includes('data-frame="arch"'));
console.log('PASS: ten recipient entrances escape names and withhold story markup; five static material/frame/sticker fallbacks; homepage renders without a JavaScript-dependent overlay. Browser gestures/WebGL require manual QA.');
const {MusicPlayer}=require(path.join(root,'components/ourstory/music-player.tsx'));
const {defaultMusic,ambientTracks}=require(path.join(root,'lib/music.ts'));
assert.equal(renderToStaticMarkup(React.createElement(MusicPlayer,{value:defaultMusic})), '');
for(const lang of ['my','en']){
 const youtube=renderToStaticMarkup(React.createElement(MusicPlayer,{lang,value:{...defaultMusic,source:'youtube',youtubeUrl:'https://youtu.be/M7lc1UVf-VE'}}));
 assert.ok(!youtube.includes('<iframe'));assert.ok(!youtube.includes('youtube-nocookie.com/embed'));assert.ok(youtube.includes(lang==='my'?'YouTube Player ဖွင့်မယ်':'Load YouTube player'));
 for(const track of ambientTracks){const html=renderToStaticMarkup(React.createElement(MusicPlayer,{lang,value:{...defaultMusic,source:'ambient',ambient:track.id}}));assert.ok(html.includes(track.file));assert.ok(html.includes('preload="none"'));assert.ok(!html.includes('autoPlay'));assert.ok(html.includes('type="range"'));assert.ok(fs.existsSync(path.join(root,'public',track.file)));}
}
console.log('PASS: silent legacy music, local audio controls, and no YouTube iframe/network embed in initial markup for either language.');
const {GiftCard}=require(path.join(root,'components/ourstory/gift-card.tsx'));
for(const lang of ['en','my']){const html=renderToStaticMarkup(React.createElement(GiftCard,{url:'https://gifts.example/gift/abc',lang}));assert.ok(html.includes('gift-card-builder'));assert.ok(html.includes('maxLength="60"'));assert.ok(html.includes(lang==='my'?'ကတ် HTML ဒေါင်းမယ်':'Download printable card'));}
console.log('PASS: bilingual printable gift-card builder renders. Printing and QR scanning require real device QA.');

const {OpeningNotifications}=require(path.join(root,'components/ourstory/opening-notifications.tsx'));
for(const lang of ['en','my']){const html=renderToStaticMarkup(React.createElement(OpeningNotifications,{lang}));assert.ok(html.includes('opening-notifications-title'));assert.ok(html.includes(lang==='my'?'လက်ဆောင် ဖွင့်ကြည့်မှုများ':'Gift opening notifications'));const reveal=renderToStaticMarkup(React.createElement(GiftReveal,{lang,openingNotice:true},React.createElement('div',null,'STORY')));assert.ok(reveal.includes(lang==='my'?'ပေးပို့သူအား အသိပေးမည်':'Opening this gift notifies its creator'));assert.ok(!reveal.includes('>STORY<'));}
console.log('PASS: bilingual opening inbox and recipient disclosure render; opening is not recorded by SSR. Browser click/polling QA is separate.');

const {GiftShop,PackedGiftContents}=require(path.join(root,'components/ourstory/gift-shop.tsx'));
const {defaultBox}=require(path.join(root,'lib/box.ts'));
const {ShopItemArt}=require(path.join(root,'components/ourstory/gift-shop-art.tsx'));
const packedBox={...defaultBox,shop:{enabled:true,items:[{kind:'bouquet',slot:0},{kind:'bear',slot:1},{kind:'chocolate',slot:2}]}};
for(const lang of ['en','my']){const html=renderToStaticMarkup(React.createElement(GiftShop,{box:packedBox,lang,onChange:()=>{}}));assert.equal((html.match(/draggable="true"/g)||[]).length,3);assert.equal((html.match(/class="shop-place-button"/g)||[]).length,3);assert.ok(html.includes('aria-live="polite"'));assert.ok(html.includes(lang==='my'?'Physical delivery မပါပါ':'No physical delivery'));assert.ok(!html.includes('<canvas'));const packed=renderToStaticMarkup(React.createElement(PackedGiftContents,{box:packedBox,lang}));for(const slot of [0,1,2])assert.ok(packed.includes('data-shop-slot="'+slot+'"'));assert.equal(renderToStaticMarkup(React.createElement(PackedGiftContents,{box:{...packedBox,style:'bear'},lang})), '');assert.equal(renderToStaticMarkup(React.createElement(PackedGiftContents,{box:defaultBox,lang})), '');}
for(const kind of ['bouquet','bear','chocolate']){const svg=renderToStaticMarkup(React.createElement(ShopItemArt,{kind}));assert.ok(svg.startsWith('<svg'));assert.ok(!svg.includes('http'));}
console.log('PASS: bilingual gift shop shelf/slots and packed recipient contents render, old gifts remain unchanged and no external model/font/image requests are needed.');
if(process.env.SHOP_ART_QA){const svgs=['bouquet','bear','chocolate'].map(kind=>renderToStaticMarkup(React.createElement(ShopItemArt,{kind})));const montage='<svg xmlns="http://www.w3.org/2000/svg" width="720" height="340" viewBox="0 0 720 340"><rect width="720" height="340" fill="#f8f1e7"/>'+svgs.map((svg,i)=>'<g transform="translate('+((i*240)+40)+' 30)">'+svg.replace('<svg ','<svg width="160" height="230" ')+'</g><text x="'+(i*240+120)+'" y="295" text-anchor="middle" fill="#506549" font-size="20" font-family="Arial">'+['Flowers','Teddy','Chocolate'][i]+'</text>').join('')+'</svg>';fs.writeFileSync(process.env.SHOP_ART_QA,montage);}
