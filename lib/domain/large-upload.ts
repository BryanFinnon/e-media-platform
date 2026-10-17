import {z} from 'zod';
export const PART_BYTES=16*1024*1024;
export const MAX_FILE_BYTES=100*1024*1024*1024;
export const uploadSchema=z.object({
 purpose:z.enum(['original','preview','public']),bookingId:z.string().max(100).optional(),
 filename:z.string().min(1).max(240),mimeType:z.enum(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']),
 size:z.number().int().min(1).max(MAX_FILE_BYTES),
}).refine(v=>v.purpose==='public'?!v.bookingId:!!v.bookingId);
export function partSize(total:number,number:number){
 if(!Number.isSafeInteger(number)||number<1||number>Math.ceil(total/PART_BYTES))return null;
 return Math.min(PART_BYTES,total-(number-1)*PART_BYTES);
}
export function parseRange(value:string|null,total:number):{offset:number;length:number}|null|'invalid'{
 if(!value)return null;
 const m=/^bytes=(\d*)-(\d*)$/.exec(value);if(!m||(!m[1]&&!m[2]))return 'invalid';
 const start=m[1]?Number(m[1]):Math.max(0,total-Number(m[2]));
 const end=m[1]?(m[2]?Math.min(Number(m[2]),total-1):total-1):total-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=total||end<start)return 'invalid';
 return {offset:start,length:end-start+1};
}
export function uploadHeaderType(bytes:Uint8Array,total:number){
 const starts=(s:number[])=>s.every((n,i)=>bytes[i]===n);
 if(starts([255,216,255]))return 'image/jpeg';
 if(starts([137,80,78,71,13,10,26,10]))return 'image/png';
 const text=(a:number,b:number)=>String.fromCharCode(...bytes.slice(a,b));
 if(text(0,6)==='GIF87a'||text(0,6)==='GIF89a')return 'image/gif';
 if(text(0,4)==='RIFF'&&text(8,12)==='WEBP'&&bytes.length>=12&&new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(4,true)===total-8)return 'image/webp';
 if(bytes.length>16&&text(4,8)==='ftyp')return 'video/mp4';
 if(bytes.length>16&&starts([0x1a,0x45,0xdf,0xa3]))return 'video/webm';
 return null;
}
export function validUploadTail(mime:string,tail:Uint8Array){
 if(mime==='image/jpeg')return tail.at(-2)===255&&tail.at(-1)===217;
 if(mime==='image/gif')return tail.at(-1)===0x3b;
 if(mime==='image/png')return [0,0,0,0,73,69,78,68,174,66,96,130].every((n,i)=>tail[tail.length-12+i]===n);
 return true;
}
