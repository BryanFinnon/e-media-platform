import 'server-only';
import {parseRange} from '@/lib/domain/large-upload';
import {getFileStorage} from './sites';
export async function serveFile(req:Request,key:string,mime:string,size:number,filename?:string,publicFile=false){
 const range=parseRange(req.headers.get('range'),size);
 if(range==='invalid')return new Response(null,{status:416,headers:{'content-range':`bytes */${size}`,'cache-control':'private, no-store'}});
 const bucket=await getFileStorage();const object=range?await bucket.get(key,{range}):await bucket.get(key);
 if(!object)return new Response('File unavailable',{status:404});
 return new Response(object.body,{status:range?206:200,headers:{
 'content-type':mime,'content-length':String(range?.length??size),'accept-ranges':'bytes',
 ...(range?{'content-range':`bytes ${range.offset}-${range.offset+range.length-1}/${size}`} : {}),
 'content-disposition':filename?`attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g,'_')}"`:'inline',
 'cache-control':publicFile?'public, max-age=3600':'private, no-store','x-content-type-options':'nosniff',
 }});
}
