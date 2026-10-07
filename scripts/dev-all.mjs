import {spawn} from 'node:child_process';
const npm=process.platform==='win32'?'npm.cmd':'npm';
const children=[
  spawn(npm,['run','dev:api'],{stdio:'inherit',env:process.env}),
  spawn(npm,['run','dev'],{stdio:'inherit',env:process.env})
];
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(code),250);}
for(const child of children)child.once('exit',(code,signal)=>{if(!stopping&&code!==0)stop(code??1);});
process.once('SIGINT',()=>stop(0));process.once('SIGTERM',()=>stop(0));
