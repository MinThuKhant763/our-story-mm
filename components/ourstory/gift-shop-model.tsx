import {useRef} from 'react';
import {Bouquet,Bear} from './gift-models';
import type {BoxConfig} from '@/lib/box';
import type {ShopKind} from '@/lib/gift-shop';
export function ShopItemModel({kind,box}:{kind:ShopKind;box:BoxConfig}){
 const progress=useRef(1),itemBox={...box,accessory:'none' as const};
 if(kind==='bouquet')return <Bouquet box={itemBox} progress={progress}/>;
 if(kind==='bear')return <Bear box={{...itemBox,color:'ivory',ribbon:'champagne'}} progress={progress}/>;
 return <group position={[0,.1,0]} rotation={[-.08,0,.1]}><mesh><boxGeometry args={[.82,1.25,.16]}/><meshStandardMaterial color="#c99e60" roughness={.42} metalness={.25}/></mesh><mesh position={[0,0,.09]}><boxGeometry args={[.72,1.15,.08]}/><meshStandardMaterial color="#624030"/></mesh>{[0,1,2].flatMap(row=>[0,1].map(col=><mesh key={row+'-'+col} position={[(col-.5)*.33,.43-row*.26,.15]}><boxGeometry args={[.28,.21,.08]}/><meshStandardMaterial color="#865639" roughness={.65}/></mesh>))}<mesh position={[0,-.38,.19]}><boxGeometry args={[.84,.5,.04]}/><meshStandardMaterial color="#e8ccc0"/></mesh><mesh position={[0,-.36,.22]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[.19,.19,.025]}/><meshStandardMaterial color="#ad4c62"/></mesh></group>;
}
