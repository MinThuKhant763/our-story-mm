import {boxColors,ribbonColors,type BoxConfig} from '@/lib/box';
export function GiftAccessory({box}:{box:BoxConfig}){
 const color=ribbonColors[box.ribbon].color,c=boxColors[box.color];
 if(box.accessory==='none')return null;
 if(box.accessory==='party-hat')return <group><mesh position={[0,.22,0]}><coneGeometry args={[.3,.65,24]}/><meshStandardMaterial color={c.lid} roughness={.6}/></mesh><mesh position={[0,.58,0]}><sphereGeometry args={[.085,14,10]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,-.1,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.3,.035,8,24]}/><meshStandardMaterial color={color}/></mesh></group>;
 if(box.accessory==='crown')return <group><mesh><cylinderGeometry args={[.33,.33,.14,24]}/><meshStandardMaterial color={color} metalness={.55} roughness={.3}/></mesh>{Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return <mesh key={i} position={[Math.cos(a)*.26,.13,Math.sin(a)*.26]}><coneGeometry args={[.11,.3,5]}/><meshStandardMaterial color={color} metalness={.55} roughness={.3}/></mesh>;})}</group>;
 return <group>{[-1,1].map(side=><mesh key={side} position={[side*.21,0,0]} scale={[1,.65,1]} rotation={[0,0,side*.4]}><torusGeometry args={[.22,.06,8,24]}/><meshStandardMaterial color={color}/></mesh>)}<mesh><sphereGeometry args={[.11,14,10]}/><meshStandardMaterial color={color}/></mesh></group>;
}
