import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getDatabase,requireAdministrator,createId} from '@/lib/server/sites';
import {project,sameOrigin} from '@/lib/server/projects';
import {findUpload,UploadError} from '@/lib/server/large-upload';
const schema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('public'),uploadId:z.string().max(100),title:z.string().trim().min(2).max(120),altText:z.string().trim().min(2).max(240)}),
 z.object({kind:z.literal('delivery'),originalId:z.string().max(100),previewId:z.string().max(100).optional(),automatic:z.boolean(),previewConfirmed:z.literal(true),title:z.string().trim().min(1).max(120)}),
]);
export async function POST(req:Request){
 const a=await requireAdministrator(req);if(a.status!==200||!a.identity)return NextResponse.json({error:'Staff access required'},{status:a.status});
 if(req.headers.get('origin')!==new URL(req.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Check the title and protected preview.'},{status:400});
 try{
 const db=await getDatabase(),v=parsed.data,now=new Date().toISOString();
 if(v.kind==='public'){
  const u=await findUpload(db,v.uploadId,a.identity.email);if(!u||u.purpose!=='public'||u.state!=='complete')throw new UploadError('Complete the public media upload first.',409);
  const existing=await db.prepare('SELECT id FROM media_assets WHERE upload_id=?').bind(u.id).first<{id:string}>();if(existing)return NextResponse.json(existing);
  const id=createId('media');await db.batch([
   db.prepare("INSERT INTO media_assets(id,storage_key,filename,title,alt_text,mime_type,size_bytes,visibility,created_by_email,created_at,upload_id) VALUES(?,?,?,?,?,?,?,'PUBLIC',?,?,?)").bind(id,u.storage_key,u.filename,v.title,v.altText,u.mime_type,u.size_bytes,a.identity.email,now,u.id),
   db.prepare("INSERT INTO audit_log(id,actor_email,action,entity_type,entity_id,created_at) VALUES(?,?,'media.uploaded','media_asset',?,?)").bind(createId('audit'),a.identity.email,id,now),
  ]);return NextResponse.json({id});
 }
 const original=await findUpload(db,v.originalId,a.identity.email);
 if(!original||original.purpose!=='original'||original.state!=='complete'||!original.booking_id)throw new UploadError('Complete the original upload first.',409);
 const p=await project(db,original.booking_id);if(!p?.deposit_paid||p.status==='CANCELLED')throw new UploadError('The booking is not eligible for delivery.',409);
 const existing=await db.prepare('SELECT id FROM booking_deliverables WHERE original_upload_id=?').bind(original.id).first<{id:string}>();if(existing)return NextResponse.json(existing);
 let previewKey:string,previewMime:string,previewSize:number,previewId:string|null=null;
 if(v.automatic){
  const ready=await db.prepare('SELECT stream_id,stream_host FROM media_uploads WHERE id=? AND stream_host IS NOT NULL').bind(original.id).first<{stream_id:string;stream_host:string}>();
  if(!ready||!original.mime_type.startsWith('video/'))throw new UploadError('Wait for the protected video preview to finish.',409);
  previewKey=`stream/${ready.stream_id}`;previewMime='video/mp4';previewSize=0;
 }else{
  const preview=v.previewId?await findUpload(db,v.previewId,a.identity.email):null;
  if(!preview||preview.purpose!=='preview'||preview.state!=='complete'||preview.booking_id!==original.booking_id||preview.mime_type.split('/')[0]!==original.mime_type.split('/')[0])throw new UploadError('Upload a matching protected preview for this booking.',409);
  const [originalPart,previewPart]=await Promise.all([db.prepare('SELECT checksum FROM media_upload_parts WHERE upload_id=? AND part_number=1').bind(original.id).first<{checksum:string}>(),db.prepare('SELECT checksum FROM media_upload_parts WHERE upload_id=? AND part_number=1').bind(preview.id).first<{checksum:string}>()]);
  if(original.size_bytes===preview.size_bytes&&originalPart?.checksum===previewPart?.checksum)throw new UploadError('The preview must differ from the original.');
  previewKey=preview.storage_key;previewMime=preview.mime_type;previewSize=preview.size_bytes;previewId=preview.id;
 }
 const id=createId('delivery');await db.batch([
 db.prepare('INSERT INTO booking_deliverables(id,booking_id,title,filename,mime_type,preview_mime,original_key,preview_key,original_size,preview_size,created_at,original_upload_id,preview_upload_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,p.id,v.title,original.filename,original.mime_type,previewMime,original.storage_key,previewKey,original.size_bytes,previewSize,now,original.id,previewId),
 db.prepare("INSERT INTO audit_log(id,actor_email,action,entity_type,entity_id,created_at) VALUES(?,?,'delivery.uploaded','booking',?,?)").bind(createId('audit'),a.identity.email,p.id,now),
 ]);return NextResponse.json({id});
 }catch(e){return NextResponse.json({error:e instanceof UploadError?e.message:'Could not attach this file. Retry; completed uploads are retained.'},{status:e instanceof UploadError?e.status:503});}
}
