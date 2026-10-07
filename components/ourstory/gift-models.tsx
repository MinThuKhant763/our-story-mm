import {GiftAccessory} from './gift-accessory';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {DoubleSide,Group,MathUtils,Shape} from 'three';
import {boxColors,ribbonColors,type BoxConfig} from '@/lib/box';
function Heart({color,scale=1}:{color:string;scale?:number}){
 const shape=useMemo(()=>{const s=new Shape();s.moveTo(0,-.65);s.bezierCurveTo(-1.4,.15,-.8,1.05,0,.5);s.bezierCurveTo(.8,1.05,1.4,.15,0,-.65);return s;},[]);
 return <mesh scale={scale}><extrudeGeometry args={[shape,{depth:.22,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.08,bevelThickness:.08,curveSegments:16}]}/><meshStandardMaterial color={color} roughness={.35} metalness={.12}/></mesh>;
}
function Sphere({position,scale=[1,1,1],color}:{position:[number,number,number];scale?:[number,number,number];color:string}){return <mesh position={position} scale={scale}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={color} roughness={.85}/></mesh>;}
function Bow({color}:{color:string}){return <group>{[-1,1].map(side=><mesh key={side} position={[side*.18,0,0]} rotation={[0,0,side*.4]} scale={[1,.6,1]}><torusGeometry args={[.2,.05,8,20]}/><meshStandardMaterial color={color} roughness={.4}/></mesh>)}<Sphere color={color} position={[0,0,0]} scale={[.09,.09,.09]}/></group>;}
export function Bouquet({box,progress}:{box:BoxConfig;progress:React.MutableRefObject<number>}){
 const blossoms=useRef<Group>(null);
 useFrame(()=>{if(!blossoms.current)return;for(const flower of blossoms.current.children){flower.scale.setScalar(.7+progress.current*.3);flower.rotation.x=-.25+(1-progress.current)*.35;}});
 const c=boxColors[box.color],r=ribbonColors[box.ribbon].color;
 const flowers=[[-.55,.92,.1],[0,1.18,-.18],[.52,1,.03],[-.3,.65,.4],[.32,.68,.47],[-.65,.48,.26],[.62,.48,.3]].slice(0,box.flowerCount);
 return <group position={[0,-.35,0]}><mesh position={[0,-.1,0]}><cylinderGeometry args={[.68,.2,1.15,24,1,true]}/><meshStandardMaterial color={r} side={DoubleSide} roughness={.7}/></mesh><group ref={blossoms}>{flowers.map(([x,y,z],i)=><group key={i} position={[x,y,z]} rotation={[-.25,x*.4,x*-.35]}><mesh position={[0,-.6,0]}><cylinderGeometry args={[.022,.025,1.2,8]}/><meshStandardMaterial color="#597550"/></mesh><Sphere color="#728b5d" position={[.18,-.43,0]} scale={[.2,.07,.1]}/>{Array.from({length:box.flowerKind==='rose'?10:box.flowerKind==='tulip'?3:6},(_,j)=>{const count=box.flowerKind==='rose'?10:box.flowerKind==='tulip'?3:6,a=j*Math.PI*2/count,radius=box.flowerKind==='rose'?.13:.2;return <Sphere key={j} color={i%2?c.lid:c.base} position={box.flowerKind==='tulip'?[(j-1)*.12,j===1?.07:0,.04+j*.004]:[Math.cos(a)*radius,Math.sin(a)*radius,.04+j*.004]} scale={box.flowerKind==='tulip'?[.13,.24,.1]:[.18,.18,.1]}/>;})}<Sphere color={box.flowerKind==='daisy'?'#f2cd85':c.lid} position={[0,0,.14]} scale={[.12,.12,.1]}/></group>)}</group><group position={[0,-.1,.58]}>{box.accessory==='bow'?<GiftAccessory box={box}/>:<Bow color={c.base}/>}</group>{['crown','party-hat'].includes(box.accessory)&&<group position={[0,1.6,0]}><GiftAccessory box={box}/></group>}</group>;
}
export function Bear({box,progress}:{box:BoxConfig;progress:React.MutableRefObject<number>}){
 const c=boxColors[box.color],r=ribbonColors[box.ribbon].color,arm=useRef<Group>(null);
 useFrame(()=>{if(arm.current)arm.current.rotation.z=-.75-Math.sin(progress.current*Math.PI*4)*.25*Math.sin(progress.current*Math.PI);});
 return <group position={[0,-.25,0]}><Sphere color={c.base} position={[0,0,0]} scale={[.64,.68,.42]}/><Sphere color={r} position={[0,0,.35]} scale={[.42,.44,.12]}/>{[-1,1].map(side=><group key={side}><Sphere color={c.base} position={[side*.52,1.07,0]} scale={[.27,.27,.18]}/><Sphere color={r} position={[side*.52,1.08,.13]} scale={[.16,.16,.065]}/><Sphere color={c.lid} position={[side*.42,-.52,.28]} scale={[.34,.22,.35]}/></group>)}{box.accessory!=='none'&&<group position={box.accessory==='bow'?[0,1.3,.3]:[0,1.32,0]}><GiftAccessory box={box}/></group>}<Sphere color={c.lid} position={[0,.73,0]} scale={[.65,.58,.43]}/><Sphere color={r} position={[0,.53,.39]} scale={[.35,.24,.15]}/>{[-1,1].map(side=><Sphere key={side} color="#302923" position={[side*.23,.8,.4]} scale={[.057,.065,.04]}/>)}<Sphere color="#644739" position={[0,.6,.53]} scale={[.09,.065,.045]}/><Sphere color={c.lid} position={[-.62,.07,.12]} scale={[.21,.38,.23]}/><group ref={arm} position={[.53,.22,.02]} rotation={[0,0,-.75]}><Sphere color={c.lid} position={[0,.23,0]} scale={[.22,.4,.23]}/></group><group position={[0,-.04,.56]} scale={.46}><Heart color="#b95770"/></group><group position={[0,.23,.5]} scale={.7}><Bow color={r}/></group></group>;
}
export function SculptedGift({box,opening,onGiftClick}:{box:BoxConfig;opening:boolean;onGiftClick?:()=>void}){
 const root=useRef<Group>(null),progress=useRef(0),{invalidate,gl}=useThree();
 useEffect(()=>{const update=()=>invalidate();gl.domElement.addEventListener('pointermove',update);gl.domElement.addEventListener('pointerleave',update);invalidate();return()=>{gl.domElement.removeEventListener('pointermove',update);gl.domElement.removeEventListener('pointerleave',update);};},[opening,box.style,box.color,box.ribbon,invalidate,gl]);
 useFrame((state,dt)=>{if(!root.current)return;const delta=Math.min(dt,.05),target=opening?1:0;progress.current=MathUtils.damp(progress.current,target,3.5,delta);const p=progress.current;
 const y=-.05+p*(box.style==='heart'?.38:.12),ry=-.18+state.pointer.x*.25;
 root.current.position.y=y;root.current.rotation.y=MathUtils.damp(root.current.rotation.y,ry,5,delta);root.current.rotation.x=MathUtils.damp(root.current.rotation.x,state.pointer.y*.06,5,delta);
 const scale=box.style==='bouquet'?.86+p*.14:1;root.current.scale.setScalar(scale);
 if(Math.abs(p-target)>.001||Math.abs(root.current.rotation.y-ry)>.001||Math.abs(root.current.rotation.x-state.pointer.y*.06)>.001)invalidate();
 });
 const c=boxColors[box.color],r=ribbonColors[box.ribbon].color;
 return <>{box.style==='heart'&&<mesh position={[0,-.9,0]}><cylinderGeometry args={[.7,.8,.16,32]}/><meshStandardMaterial color={r} roughness={.4}/></mesh>}<group ref={root} rotation={[0,-.18,0]} onPointerMove={()=>invalidate()} onClick={e=>{if(onGiftClick){e.stopPropagation();onGiftClick();}}}>{box.style==='bouquet'?<Bouquet box={box} progress={progress}/>:box.style==='bear'?<Bear box={box} progress={progress}/>:<group><group position={[0,1.05,0]}><GiftAccessory box={box}/></group><Heart color={c.base} scale={1.3}/><group position={[.3,.35,.37]} rotation={[0,0,-.3]}><Bow color={r}/></group></group>}</group></>;
}
