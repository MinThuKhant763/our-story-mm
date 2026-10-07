import type { OccasionId } from './occasions.ts';

export const designThemes: Record<OccasionId, {name:string;paper:string;ink:string;accent:string;wash:string}> = {
 anniversary:{name:'Warm Ivory',paper:'#FFF8F0',ink:'#293D35',accent:'#A44860',wash:'#F2DDDC'},
 birthday:{name:'Pastel Party',paper:'#FBF5FF',ink:'#493650',accent:'#80519A',wash:'#DCCFF5'},
 valentine:{name:'Midnight Love',paper:'#172238',ink:'#FFF8F0',accent:'#F0BCC8',wash:'#303D58'},
 wedding:{name:'Botanical Garden',paper:'#FBF9EF',ink:'#355640',accent:'#41694C',wash:'#DDE7D3'},
 graduation:{name:'Golden Chapter',paper:'#20304A',ink:'#FFF8E8',accent:'#E3BF77',wash:'#344967'}
};
/** Bounded yaw keeps pointer gestures finite without storing transient viewer state. */
export function rotateGift(yaw:number,dx:number){
 if(!Number.isFinite(yaw)||!Number.isFinite(dx))return 0;
 return Math.max(-Math.PI*2,Math.min(Math.PI*2,yaw+dx*.012));
}
