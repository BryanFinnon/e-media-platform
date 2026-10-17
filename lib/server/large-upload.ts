import 'server-only';
import {type D1Database,type R2Bucket,createId} from './sites';
import {PART_BYTES,partSize,uploadHeaderType,validUploadTail,type uploadSchema} from '@/lib/domain/large-upload';
import {safeFilename} from '@/lib/domain/delivery';
import type {z} from 'zod';
export type Upload={id:string;actor_email:string;purpose:'original'|'preview'|'public';booking_id:string|null;filename:string;mime_type:string;size_bytes:number;storage_key:string;multipart_id:string;state:string;expires_at:string;stream_id:string|null};
export class UploadError extends Error {constructor(message:string,public status=400){super(message);}}
export async function findUpload(db:D1Database,id:string,actor:string){return db.prepare('SELECT * FROM media_uploads WHERE id=? AND actor_email=?').bind(id,actor).first<Upload>();}
export async function createUpload(db:D1Database,bucket:R2Bucket,actor:string,input:z.infer<typeof uploadSchema>){
 const id=createId('upload'),key=`uploads/${id}/${safeFilename(input.filename)}`;
 const multipart=await bucket.createMultipartUpload(key,{httpMetadata:{contentType:input.mimeType}});
 const now=new Date(),expires=new Date(now.getTime()+24*3600*1000).toISOString();
 try{await db.prepare('INSERT INTO media_uploads(id,actor_email,purpose,booking_id,filename,mime_type,size_bytes,storage_key,multipart_id,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,actor,input.purpose,input.bookingId??null,safeFilename(input.filename),input.mimeType,input.size,key,multipart.uploadId,now.toISOString(),expires).run();}catch(e){await multipart.abort();throw e;}
 return {id,partBytes:PART_BYTES,expiresAt:expires};
}
export async function uploadStatus(db:D1Database,row:Upload){const parts=await db.prepare('SELECT part_number FROM media_upload_parts WHERE upload_id=? AND etag IS NOT NULL ORDER BY part_number').bind(row.id).all<{part_number:number}>();return {id:row.id,state:row.state,size:row.size_bytes,partBytes:PART_BYTES,parts:(parts.results??[]).map(p=>p.part_number),expiresAt:row.expires_at};}
export async function putPart(db:D1Database,bucket:R2Bucket,row:Upload,number:number,bytes:ArrayBuffer){
 if(row.state!=='pending'||row.expires_at<new Date().toISOString())throw new UploadError('Upload expired or already closed. Start a new upload.',409);
 const expected=partSize(row.size_bytes,number);if(expected===null||bytes.byteLength!==expected)throw new UploadError('Invalid chunk number or size.');
 if(number===1&&uploadHeaderType(new Uint8Array(bytes),row.size_bytes)!==row.mime_type)throw new UploadError('File contents do not match the selected media type.');
 // Hash only one bounded chunk at a time.
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 await db.prepare('INSERT INTO media_upload_parts(upload_id,part_number,size_bytes,checksum) VALUES(?,?,?,?) ON CONFLICT(upload_id,part_number) DO NOTHING').bind(row.id,number,bytes.byteLength,digest).run();
 const claim=await db.prepare('SELECT checksum,etag FROM media_upload_parts WHERE upload_id=? AND part_number=?').bind(row.id,number).first<{checksum:string;etag:string|null}>();
 if(claim?.checksum!==digest)throw new UploadError('This chunk differs from the original upload. Cancel and restart.',409);
 if(claim.etag)return;
 const part=await bucket.resumeMultipartUpload(row.storage_key,row.multipart_id).uploadPart(number,bytes);
 await db.prepare('UPDATE media_upload_parts SET etag=? WHERE upload_id=? AND part_number=? AND checksum=?').bind(part.etag,row.id,number,digest).run();
}
export async function completeUpload(db:D1Database,bucket:R2Bucket,row:Upload){
 if(row.state==='complete')return;
 if(row.state!=='pending'||row.expires_at<new Date().toISOString())throw new UploadError('Upload expired or cancelled.',409);
 const result=await db.prepare('SELECT part_number,etag,size_bytes FROM media_upload_parts WHERE upload_id=? AND etag IS NOT NULL ORDER BY part_number').bind(row.id).all<{part_number:number;etag:string;size_bytes:number}>();
 const parts=result.results??[];
 if(parts.length!==Math.ceil(row.size_bytes/PART_BYTES)||parts.some((p,i)=>p.part_number!==i+1||p.size_bytes!==partSize(row.size_bytes,i+1)))throw new UploadError('Some chunks are missing. Resume the upload.',409);
 // A previous completion may have succeeded before the response was interrupted.
 if(!(await bucket.head(row.storage_key)))await bucket.resumeMultipartUpload(row.storage_key,row.multipart_id).complete(parts.map(p=>({partNumber:p.part_number,etag:p.etag})));
 if((await bucket.head(row.storage_key))?.size!==row.size_bytes)throw new UploadError('Stored file size mismatch.',409);
 const head=await bucket.get(row.storage_key,{range:{offset:0,length:Math.min(64,row.size_bytes)}});
 const tail=await bucket.get(row.storage_key,{range:{offset:Math.max(0,row.size_bytes-16),length:Math.min(16,row.size_bytes)}});
 if(!head||!tail||uploadHeaderType(new Uint8Array(await new Response(head.body).arrayBuffer()),row.size_bytes)!==row.mime_type||!validUploadTail(row.mime_type,new Uint8Array(await new Response(tail.body).arrayBuffer())))throw new UploadError('The completed file failed media validation.',409);
 await db.prepare("UPDATE media_uploads SET state='complete' WHERE id=? AND state='pending'").bind(row.id).run();
}
