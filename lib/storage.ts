import {env} from './runtime';
export function database(){return env().DB;}
function key(value:string){if(!/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(value)||value.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Invalid media key');return value;}
export function mediaStore(){return {
 put:(name:string,value:ArrayBuffer|Uint8Array,options?:{httpMetadata?:{contentType:string}})=>env().MEDIA.put(key(name),value,options),
 get:(name:string)=>env().MEDIA.get(key(name)),
 delete:(names:string|string[])=>env().MEDIA.delete(Array.isArray(names)?names.map(key):key(names))
};}
