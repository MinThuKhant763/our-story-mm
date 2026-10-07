import {z} from 'zod';
export const shopKinds=['bouquet','bear','chocolate'] as const;
export const shopKindSchema=z.enum(shopKinds);
export type ShopKind=z.infer<typeof shopKindSchema>;
export const shopSlots=[0,1,2] as const;
const slotSchema=z.union([z.literal(0),z.literal(1),z.literal(2)]);
export type ShopSlot=z.infer<typeof slotSchema>;
export const shopSchema=z.object({enabled:z.boolean().default(false),items:z.array(z.object({kind:shopKindSchema,slot:slotSchema})).max(3).default([])}).superRefine((value,ctx)=>{
 if(new Set(value.items.map(i=>i.slot)).size!==value.items.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'Choose one gift per box position.'});
 if(new Set(value.items.map(i=>i.kind)).size!==value.items.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'Choose each gift item only once.'});
});
export type GiftShopConfig=z.infer<typeof shopSchema>;
export const shopCatalog={bouquet:{name:'Forever flowers',my:'ပန်းစည်းလေး',note:'A little bloom for their day.',myNote:'နေ့လေးကို လှပစေဖို့။'},bear:{name:'Pocket teddy',my:'Teddy bear လေး',note:'A hug they can keep.',myNote:'အမြဲသိမ်းထားလို့ရတဲ့ အဖက်လေး။'},chocolate:{name:'Sweet chocolate',my:'ချောကလက်လေး',note:'Something sweet, just for them.',myNote:'ချိုမြိန်တဲ့ surprise လေး။'}};
export const slotNames={en:['Left','Center','Right'],my:['ဘယ်ဘက်','အလယ်','ညာဘက်']};
/** Move into an occupied position swaps items; a new shelf item replaces that position. */
export function placeShopItem(config:GiftShopConfig,kind:ShopKind,slot:ShopSlot):GiftShopConfig{
 shopKindSchema.parse(kind);slotSchema.parse(slot);
 const valid=shopSchema.parse(config),previous=valid.items.find(i=>i.kind===kind),occupant=valid.items.find(i=>i.slot===slot&&i.kind!==kind);
 const items=valid.items.filter(i=>i.kind!==kind&&i.slot!==slot);
 if(previous&&occupant)items.push({kind:occupant.kind,slot:previous.slot});
 items.push({kind,slot});return {enabled:true,items:items.sort((a,b)=>a.slot-b.slot)};
}
export function removeShopItem(config:GiftShopConfig,slot:ShopSlot):GiftShopConfig{return {...config,items:config.items.filter(i=>i.slot!==slot)};}
