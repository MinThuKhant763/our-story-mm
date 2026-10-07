import {env} from '@/lib/runtime';
import {api,user,origin,db,setup,defaultConfig,json,ApiError,audit} from '@/lib/server';
export async function POST(req:Request){return api(async()=>{origin(req);const u=await user();if(u.email!==env().OWNER_EMAIL?.trim().toLowerCase())throw new ApiError(403,'Only the configured owner email can initialize the workspace.');if(await setup())throw new ApiError(409,'This workspace has already been set up.');await db().prepare("INSERT OR IGNORE INTO settings (id,owner_id,config) VALUES ('workspace',?,?)").bind(u.userId,JSON.stringify(defaultConfig)).run();const s=await setup();if(s?.owner_id!==u.userId)throw new ApiError(409,'This workspace already has an owner.');await audit(u.userId,'setup','workspace');return json({ok:true});});}

