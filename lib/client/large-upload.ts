import {MAX_FILE_BYTES} from '@/lib/domain/large-upload';
type Input={purpose:'original'|'preview'|'public';bookingId?:string};
async function json(url:string,init?:RequestInit){const r=await fetch(url,{...init,cache:'no-store'});const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.error||'Upload interrupted. Select the same file to resume.');return data;}
async function fingerprint(file:File){const sample=await file.slice(0,65536).arrayBuffer();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',sample)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function uploadLarge(file:File,input:Input,onProgress:(percent:number)=>void,signal?:AbortSignal):Promise<string>{
 if(!file.size||file.size>MAX_FILE_BYTES)throw new Error('Maximum file size is 100 GiB.');
 const key=`emedia-upload:${input.purpose}:${input.bookingId??'public'}:${file.name}:${file.size}:${file.lastModified}:${await fingerprint(file)}`;
 let id:string|null=null;try{id=localStorage.getItem(key);}catch{}
 let status:{id:string;state:string;partBytes:number;parts:number[];expiresAt:string}|null=null;
 if(id){try{status=await json(`/api/admin/uploads/${id}`,{signal});}catch(e){if(signal?.aborted)throw e;id=null;}}
 if(status&&(status.state==='cancelled'||(status.state!=='complete'&&status.expiresAt<new Date().toISOString()))){status=null;id=null;}
 if(!id){const created=await json('/api/admin/uploads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...input,filename:file.name,mimeType:file.type,size:file.size}),signal});id=created.id;try{localStorage.setItem(key,id!);}catch{}status={...created,state:'pending',parts:[]};}
 if(!status||!id)throw new Error('Unable to start upload');
 if(status.state==='complete'){onProgress(100);return id;}
 const count=Math.ceil(file.size/status.partBytes),completed=new Set(status.parts);
 for(let number=1;number<=count;number++){
  if(signal?.aborted)throw new DOMException('Paused','AbortError');
  if(!completed.has(number)){
   const start=(number-1)*status.partBytes,chunk=file.slice(start,Math.min(start+status.partBytes,file.size));
   for(let attempt=0;;attempt++){try{await json(`/api/admin/uploads/${id}?part=${number}`,{method:'PUT',body:chunk,signal});break;}catch(e){if(signal?.aborted||attempt>=2)throw e;}}
  }
  onProgress(Math.round(Math.min(number*status.partBytes,file.size)/file.size*100));
 }
 await json(`/api/admin/uploads/${id}`,{method:'POST',signal});onProgress(100);return id;
}
export {json as uploadJson};
