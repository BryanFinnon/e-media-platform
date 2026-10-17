import 'server-only';
import {z} from 'zod';
import {getSitesEnv,type D1Database} from './sites';
import {randomToken,tokenHash} from './client-auth';
import {type Upload,UploadError} from './large-upload';
const id=z.string().regex(/^[a-f0-9]{32}$/i);
const configSchema=z.object({account:id,token:z.string().min(10),watermark:id,origin:z.string().url().refine(v=>new URL(v).protocol==='https:')});
export async function videoConfig(){const e=await getSitesEnv();return configSchema.safeParse({account:e.CLOUDFLARE_ACCOUNT_ID,token:e.CLOUDFLARE_STREAM_API_TOKEN,watermark:e.CLOUDFLARE_STREAM_WATERMARK_UID,origin:e.NEXT_PUBLIC_SITE_URL});}
export async function videoEnabled(){return (await videoConfig()).success;}
async function api(path:string,init:RequestInit={}){
 const c=await videoConfig();if(!c.success)throw new UploadError('Automatic video watermarking is not activated. Connect the Cloudflare Stream account first.',503);
 const res=await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.data.account}/stream${path}`,{...init,headers:{authorization:`Bearer ${c.data.token}`,'content-type':'application/json'},signal:AbortSignal.timeout(20000)});
 const payload=await res.json().catch(()=>null);if(!res.ok||!payload?.success)throw new UploadError('Video service rejected the request. Check its configuration or retry later.',503);
 return payload.result;
}
const videoSchema=z.object({uid:id,readyToStream:z.boolean().optional(),requireSignedURLs:z.boolean().optional(),status:z.object({state:z.string(),errorReasonText:z.string().optional()}).optional(),watermark:z.object({uid:id}).nullable().optional(),playback:z.object({hls:z.string().url()}).optional()});
export async function prepareVideo(db:D1Database,row:Upload){
 const c=await videoConfig();if(!c.success)throw new UploadError('Automatic video watermarking is not activated. Connect Cloudflare Stream first.',503);
 if(row.purpose!=='original'||!row.mime_type.startsWith('video/')||row.state!=='complete')throw new UploadError('Upload a completed original video first.');
 if(row.size_bytes>30_000_000_000)throw new UploadError('Automatic previews currently accept videos up to 30 GB. Upload a prepared watermarked preview for larger originals.');
 if(row.stream_id==='starting')return {ready:false,message:'Preview creation is being submitted. Refresh shortly.'};
 let uid=row.stream_id;
 if(!uid){
  const claimed=await db.prepare("UPDATE media_uploads SET stream_id='starting' WHERE id=? AND stream_id IS NULL").bind(row.id).run();
  if(claimed.meta?.changes!==1)return {ready:false,message:'Preview creation is already in progress.'};
  const token=randomToken();
  await db.prepare('UPDATE media_uploads SET source_token_hash=?,source_expires_at=? WHERE id=?').bind(await tokenHash(token),new Date(Date.now()+24*3600*1000).toISOString(),row.id).run();
  try{
   const url=new URL(`/api/video-source/${row.id}`,c.data.origin);url.searchParams.set('token',token);
   const created=videoSchema.parse(await api('/copy',{method:'POST',body:JSON.stringify({url:url.href,requireSignedURLs:true,watermark:{uid:c.data.watermark},meta:{name:`E-MEDIA preview ${row.id}`}})}));
   uid=created.uid;await db.prepare('UPDATE media_uploads SET stream_id=? WHERE id=?').bind(uid,row.id).run();
  }catch(e){await db.prepare("UPDATE media_uploads SET stream_id=NULL,source_token_hash=NULL,source_expires_at=NULL WHERE id=? AND stream_id='starting'").bind(row.id).run();throw e;}
 }
 const video=videoSchema.parse(await api(`/${uid}`));
 if(video.status?.state==='error')throw new UploadError('Video processing failed. Your original is retained; upload a prepared watermarked preview.',409);
 if(!video.readyToStream)return {ready:false,message:'Creating the protected video preview. You can close this page and resume later.'};
 if(!video.requireSignedURLs||video.watermark?.uid!==c.data.watermark)throw new UploadError('The preview protection could not be verified. Publication is blocked.',409);
 const host=video.playback?new URL(video.playback.hls).hostname:'';
 if(!/^customer-[a-z0-9]+\.cloudflarestream\.com$/.test(host))throw new UploadError('Invalid video playback host.',503);
 await db.prepare('UPDATE media_uploads SET stream_host=?,source_token_hash=NULL,source_expires_at=NULL WHERE id=?').bind(host,row.id).run();
 return {ready:true,message:'Protected video preview ready.'};
}
export async function videoPlayerURL(uid:string,host:string){
 if(!id.safeParse(uid).success||!/^customer-[a-z0-9]+\.cloudflarestream\.com$/.test(host))throw new UploadError('Video unavailable',503);
 const result=z.object({token:z.string().min(20)}).parse(await api(`/${uid}/token`,{method:'POST'}));
 return `https://${host}/${result.token}/iframe`;
}
