import { z } from 'zod';
import { defaultBox, type BoxConfig } from './box.ts';
import type { GiftContent, TemplateId } from './gifts.ts';
import type { Language } from './i18n.ts';

export const occasionIds = ['anniversary', 'birthday', 'valentine', 'wedding', 'graduation'] as const;
export const occasionSchema = z.enum(occasionIds);
export type OccasionId = z.infer<typeof occasionSchema>;
export function isOccasionId(value: string): value is OccasionId { return occasionSchema.safeParse(value).success; }
type Words = { name: string; description: string; title: string; dateLabel: string; badge: string; ending: string; letter: string };
type Preset = { id: OccasionId; template: TemplateId; box: Partial<BoxConfig>; en: Words; my: Words };
export const occasionPresets: Preset[] = [
  { id: 'anniversary', template: 'bloom', box: { style: 'box', color: 'rose', ribbon: 'champagne', effect: 'hearts', accessory: 'bow', finish: 'satin', frame: 'arch', sticker: 'heart' },
    en: { name: 'Anniversary', description: 'Your shared story, in soft rose and gold.', title: 'Every day, I choose you.', dateLabel: 'When did your story begin?', badge: 'A LITTLE WORLD, JUST FOR US', ending: 'Here’s to all the chapters still ahead of us.', letter: 'Thank you for making ordinary days feel special. Every little memory with you is part of my favorite story.\n\nHere’s to another chapter together, and all the moments we have yet to share.' },
    my: { name: 'နှစ်ပတ်လည်နေ့', description: 'တို့နှစ်ယောက်ရဲ့ အမှတ်တရတွေကို နှင်းဆီနဲ့ ရွှေရောင်လေးတွေနဲ့ ဖန်တီးမယ်။', title: 'နေ့တိုင်း မင်းကိုပဲ ရွေးချယ်တယ်။', dateLabel: 'တို့နှစ်ယောက်ရဲ့ ဇာတ်လမ်း ဘယ်နေ့ကစခဲ့လဲ။', badge: 'တို့နှစ်ယောက်အတွက် ကမ္ဘာလေး', ending: 'နောင်လာမယ့် အခန်းတိုင်းမှာလည်း အတူရှိကြမယ်။', letter: 'သာမန်နေ့ရက်တွေကို ထူးခြားအောင် လုပ်ပေးခဲ့တာ ကျေးဇူးတင်တယ်။ မင်းနဲ့အတူရှိခဲ့တဲ့ အမှတ်တရလေးတိုင်းကို တန်ဖိုးထားတယ်။\n\nဒီနှစ်ပတ်လည်နေ့ကနေ နောင်လာမယ့် နေ့ရက်တွေမှာလည်း အမှတ်တရလှလှလေးတွေ အတူဖန်တီးကြမယ်နော်။' } },
  { id: 'birthday', template: 'scrapbook', box: { style: 'bear', color: 'lavender', ribbon: 'champagne', effect: 'sparkles', accessory: 'party-hat', finish: 'matte', frame: 'orbit', sticker: 'star' },
    en: { name: 'Birthday', description: 'A playful scrapbook, a teddy and golden wishes.', title: 'Today is all about you.', dateLabel: 'Birthday celebration date', badge: 'A LITTLE BIRTHDAY MAGIC', ending: 'Wishing you a year full of happy little moments.', letter: 'Happy birthday! I hope today brings you laughter, little surprises, and time with the people who make you happy.\n\nMay the year ahead be kind to you and full of things you are excited to wake up for. You deserve to be celebrated.' },
    my: { name: 'မွေးနေ့', description: 'ပျော်စရာ scrapbook၊ teddy နဲ့ ရွှေရောင်ဆုတောင်းလေးတွေ။', title: 'ဒီနေ့က မင်းအတွက်ပဲ။', dateLabel: 'မွေးနေ့ကျင်းပမည့်ရက်', badge: 'မွေးနေ့အတွက် အံ့ဩစရာလေး', ending: 'ပျော်ရွှင်စရာ အခိုက်အတန့်တွေနဲ့ ပြည့်တဲ့နှစ် ဖြစ်ပါစေ။', letter: 'မွေးနေ့မှာ ပျော်ရွှင်ပါစေ။ ဒီနေ့လေးမှာ ရယ်မောစရာတွေ၊ အံ့ဩစရာလေးတွေနဲ့ ကိုယ့်ကိုချစ်တဲ့သူတွေရဲ့ နွေးထွေးမှုတွေ ရပါစေ။\n\nနောင်လာမယ့်နှစ်မှာလည်း စိတ်ချမ်းသာပြီး ရည်မှန်းထားတာတွေ တစ်ခုချင်း အကောင်အထည်ဖော်နိုင်ပါစေ။ မင်းအတွက် ဝမ်းသာပေးနေမယ်နော်။' } },
  { id: 'valentine', template: 'night', box: { style: 'heart', color: 'rose', ribbon: 'rose', effect: 'hearts', accessory: 'none', finish: 'pearl', frame: 'orbit', sticker: 'heart' },
    en: { name: 'Valentine', description: 'A heart, a sealed letter and a little midnight magic.', title: 'My favorite place is beside you.', dateLabel: 'Valentine celebration date', badge: 'A VALENTINE, JUST FOR YOU', ending: 'A little reminder of how much you mean to me.', letter: 'Happy Valentine’s Day. You make the little things feel like the big things: a message, a quiet conversation, an ordinary day spent together.\n\nThis little gift is a reminder that I am thinking of you, and that you mean so much to me.' },
    my: { name: 'ချစ်သူများနေ့', description: 'နှလုံးသားလေး၊ စာအိတ်လေးနဲ့ ကြယ်ရောင်အလှတွေ။', title: 'အနှစ်သက်ဆုံးနေရာက မင်းဘေးနားမှာ။', dateLabel: 'ချစ်သူများနေ့ ကျင်းပမည့်ရက်', badge: 'မင်းအတွက် ချစ်သူများနေ့လက်ဆောင်', ending: 'မင်းကို ဘယ်လောက်တန်ဖိုးထားလဲဆိုတာ သတိရစေချင်တယ်။', letter: 'ချစ်သူများနေ့မှာ ပျော်ရွှင်ပါစေ။ စကားလေးတစ်ခွန်း၊ message လေးတစ်စောင်နဲ့ အတူရှိတဲ့ သာမန်နေ့ရက်တွေကို မင်းက ထူးခြားအောင် လုပ်ပေးတယ်။\n\nဒီလက်ဆောင်လေးနဲ့ မင်းကို သတိရနေကြောင်း၊ မင်းက ကိုယ့်အတွက် အရေးပါတဲ့သူဖြစ်ကြောင်း ပြောချင်တယ်။' } },
  { id: 'wedding', template: 'garden', box: { style: 'bouquet', color: 'ivory', ribbon: 'champagne', effect: 'petals', accessory: 'bow', finish: 'satin', frame: 'arch', sticker: 'flower', flowerKind: 'rose', flowerCount: 7 },
    en: { name: 'Wedding', description: 'Ivory flowers and a botanical keepsake for a new chapter.', title: 'A beautiful beginning, together.', dateLabel: 'Wedding date', badge: 'TO A BEAUTIFUL NEW CHAPTER', ending: 'May your shared life be full of kindness and joy.', letter: 'Congratulations on your wedding! May this new chapter bring you patient love, shared laughter, and a home full of warmth.\n\nHere’s to the promises you make today and the beautiful everyday moments you will build together.' },
    my: { name: 'မင်္ဂလာပွဲ', description: 'ဖြူနုရောင်ပန်းစည်းနဲ့ အခန်းသစ်အတွက် ရုက္ခဗေဒအလှလေး။', title: 'အတူတကွ လှပတဲ့ အစပြုခြင်း။', dateLabel: 'မင်္ဂလာပွဲနေ့', badge: 'လှပတဲ့ ဘဝအခန်းသစ်အတွက်', ending: 'နှစ်ယောက်အတူ မေတ္တာနဲ့ ပျော်ရွှင်မှုအပြည့် နေထိုင်နိုင်ပါစေ။', letter: 'မင်္ဂလာပွဲအတွက် ဝမ်းမြောက်ပါတယ်။ ဘဝအခန်းသစ်မှာ အပြန်အလှန် နားလည်မှု၊ ရယ်မောပျော်ရွှင်မှုနဲ့ နွေးထွေးတဲ့ အိမ်လေးကို တည်ဆောက်နိုင်ပါစေ။\n\nဒီနေ့ပေးခဲ့တဲ့ ကတိတွေနဲ့ နောင်လာမယ့် နေ့ရက်တိုင်းမှာ ချစ်ခြင်းမေတ္တာတွေ ပိုတိုးလာပါစေ။' } },
  { id: 'graduation', template: 'aurora', box: { style: 'box', color: 'midnight', ribbon: 'champagne', effect: 'sparkles', accessory: 'crown', finish: 'satin', frame: 'orbit', sticker: 'star' },
    en: { name: 'Graduation', description: 'Midnight blue, golden sparks and a proud new beginning.', title: 'You did it. Your next chapter awaits.', dateLabel: 'Graduation celebration date', badge: 'CELEBRATING YOUR ACHIEVEMENT', ending: 'Keep going. There are so many good things ahead.', letter: 'Congratulations on your graduation! Behind this day are all the hours you worked, the things you learned, and the times you kept going.\n\nI am so proud of you. Take a moment to enjoy what you have achieved, then step into your next chapter with confidence.' },
    my: { name: 'ဘွဲ့ရနေ့', description: 'နက်ပြာရောင်၊ ရွှေရောင်အလင်းနဲ့ ဂုဏ်ယူစရာ အစသစ်။', title: 'မင်းလုပ်နိုင်ခဲ့ပြီ။ အခန်းသစ်က စောင့်နေတယ်။', dateLabel: 'ဘွဲ့ရပွဲ ကျင်းပမည့်ရက်', badge: 'မင်းရဲ့အောင်မြင်မှုကို ဂုဏ်ပြုမယ်', ending: 'ရှေ့မှာ ကောင်းတဲ့အရာတွေ အများကြီး စောင့်နေတယ်။', letter: 'ဘွဲ့ရတဲ့အတွက် ဝမ်းမြောက်ပါတယ်။ ဒီနေ့ရောက်ဖို့ ကြိုးစားခဲ့တဲ့ အချိန်တွေ၊ သင်ယူခဲ့တာတွေနဲ့ မလျှော့ဘဲ ဆက်လျှောက်ခဲ့တာတွေ အားလုံးကို ဂုဏ်ယူတယ်။\n\nကိုယ့်အောင်မြင်မှုကို ပျော်ပျော်ရွှင်ရွှင် ခံစားလိုက်ပါ။ နောက်အခန်းသစ်ကိုလည်း ယုံကြည်မှုနဲ့ စတင်နိုင်ပါစေ။' } }
];
export function occasionPreset(id: OccasionId = 'anniversary') { return occasionPresets.find(p => p.id === id) || occasionPresets[0]; }
export function occasionWords(id: OccasionId | undefined, lang: Language) { return occasionPreset(id)[lang]; }
export function occasionArtwork(id: OccasionId | undefined) { return '/images/occasions/' + occasionPreset(id).id + '.webp'; }
export function occasionLetter(id: OccasionId, lang: Language, recipient = '', sender = '') {
  const greeting = lang === 'my' ? (recipient || 'ချစ်ခင်ရသူ') + 'ရေ၊' : 'Dear ' + (recipient || 'you') + ',';
  const closing = lang === 'my' ? 'မေတ္တာဖြင့်၊\n' + (sender || 'ကိုယ်') : 'With love,\n' + (sender || 'me');
  return greeting + '\n\n' + occasionWords(id, lang).letter + '\n\n' + closing;
}
export function presetBox(id: OccasionId, previous: BoxConfig = defaultBox): BoxConfig {
  return { ...defaultBox, ...occasionPreset(id).box, shop: { ...previous.shop, items: [...previous.shop.items] }, initials: previous.initials, allowReply: previous.allowReply, secret: { ...previous.secret } };
}
/** Applying sample words only changes title/letter; all personal memories survive. */
export function applyOccasion(content: GiftContent, id: OccasionId, lang: Language, sampleWords = false): GiftContent {
  return { ...content, occasion: id, ...(sampleWords ? { title: occasionWords(id, lang).title, letter: occasionLetter(id, lang, content.partnerName, content.yourName) } : {}) };
}
/** Non-anniversary dates are the selected celebration, never an inferred birth date. */
export function celebrationDays(date: string, now = new Date()) {
  const parsed = new Date(date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < '1900-01-01' || date > '2100-12-31') return NaN;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yangon', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (key: string) => parts.find(p => p.type === key)?.value;
  const today = part('year') + '-' + part('month') + '-' + part('day');
  return Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
}
