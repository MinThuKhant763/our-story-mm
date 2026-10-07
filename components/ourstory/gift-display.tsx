import {useEffect,useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {Group,Mesh,MeshStandardMaterial} from 'three';
import {giftFinishes,ribbonColors,type BoxConfig} from '@/lib/box';
import type {ReactNode} from 'react';
/** Lighting-friendly native geometry. No external model or texture requests. */
function Sticker({box}:{box:BoxConfig}){
 const color=ribbonColors[box.ribbon].color;
 if(box.sticker==='none')return null;
 return <group position={box.style==='box'?[.57,-.15,.91]:[.73,-.35,.45]} rotation={[Math.PI/2,0,-.2]} scale={.7}><mesh><cylinderGeometry args={[.29,.29,.045,32]}/><meshStandardMaterial color={color} metalness={.2} roughness={.4}/></mesh><group rotation={[Math.PI/2,0,0]} position={[0,.035,0]}>{box.sticker==='heart'?<mesh rotation={[0,0,Math.PI/4]}><boxGeometry args={[.18,.18,.025]}/><meshStandardMaterial color="#a44860"/></mesh>:box.sticker==='star'?Array.from({length:5},(_,i)=><mesh key={i} rotation={[0,0,i*Math.PI*2/5]} position={[Math.sin(i*Math.PI*2/5)*.1,Math.cos(i*Math.PI*2/5)*.1,0]}><coneGeometry args={[.065,.21,3]}/><meshStandardMaterial color="#9b6836"/></mesh>):Array.from({length:6},(_,i)=><mesh key={i} position={[Math.cos(i*Math.PI/3)*.11,Math.sin(i*Math.PI/3)*.11,0]}><sphereGeometry args={[.08,12,8]}/><meshStandardMaterial color="#fff8f0"/></mesh>)}{box.sticker==='heart'&&[-1,1].map(i=><mesh key={i} position={[i*.065,.065,.012]}><sphereGeometry args={[.09,12,8]}/><meshStandardMaterial color="#a44860"/></mesh>)}</group></group>;
}
export function GiftDisplay({box,yaw,children}:{box:BoxConfig;yaw:number;children:ReactNode}){
 const model=useRef<Group>(null),{invalidate}=useThree();
 useEffect(()=>{const surface=giftFinishes[box.finish];model.current?.traverse(object=>{if(object instanceof Mesh){for(const material of Array.isArray(object.material)?object.material:[object.material]){if(material instanceof MeshStandardMaterial){material.roughness=surface.roughness;material.metalness=surface.metalness;}}}});invalidate();},[box,yaw,invalidate]);
 const gold=ribbonColors[box.ribbon].color;
 return <>{box.frame!=='none'&&<group position={[0,.1,-.85]}><mesh rotation={box.frame==='orbit'?[.18,.3,-.25]:[0,0,0]}><torusGeometry args={[1.65,.035,8,64,box.frame==='arch'?Math.PI:Math.PI*2]}/><meshStandardMaterial color={gold} metalness={.55} roughness={.3}/></mesh>{box.frame==='arch'&&[-1,1].map(side=><mesh key={side} position={[side*1.65,-.68,0]}><cylinderGeometry args={[.035,.035,1.36,8]}/><meshStandardMaterial color={gold} metalness={.55} roughness={.3}/></mesh>)}</group>}<group rotation={[0,yaw,0]}><group ref={model}>{children}</group><Sticker box={box}/></group><mesh position={[0,-1.12,0]}><cylinderGeometry args={[1.23,1.28,.08,48]}/><meshStandardMaterial color="#efe2d1" roughness={.9}/></mesh></>;
}
