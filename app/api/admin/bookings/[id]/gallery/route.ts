import {NextResponse} from 'next/server';
import {z} from 'zod';
import {createId,getDatabase,getFileStorage,requireAdministrator} from '@/lib/server/sites';
import {project,notifyProject,sameOrigin} from '@/lib/server/projects';
import {detectDeliveryType,safeFilename} from '@/lib/domain/delivery';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}) {
 const a=await requireAdministrator(req);if(a.status!==200||!a.identity)return NextResponse.json({error:'Staff access required'},{status:a.status});if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const db=await getDatabase(),p=await project(db,(await params).id);if(!p?.deposit_paid||['CANCELLED'].includes(p.status))return NextResponse.json({error:'Deposit must be received first'},{status:409});
 const data=await req.formData();
 if(data.get('action')==='publish') {
 const count=await db.prepare('SELECT count(*) AS count FROM booking_deliverables WHERE booking_id=?').bind(p.id).first<{count:number}>();if(!count?.count)return NextResponse.json({error:'Upload files first'},{status:409});
 await db.batch([db.prepare('UPDATE booking_quotes SET gallery_ready=1 WHERE booking_id=?').bind(p.id),db.prepare("UPDATE bookings SET status='COMPLETED' WHERE id=?").bind(p.id),db.prepare("INSERT INTO audit_log(id,actor_email,action,entity_type,entity_id,created_at) VALUES(?,?,'gallery.published','booking',?,?)").bind(createId('audit'),a.identity.email,p.id,new Date().toISOString())]);
 await notifyProject(p,'PROJECT_UPDATE','Your preview gallery is ready. Pay the remaining 50% balance to unlock original downloads.',`gallery/${p.id}`);
 } else {
 const title=z.string().trim().min(1).max(120).safeParse(data.get('title'));const original=data.get('original'),preview=data.get('preview');
 if(!title.success||!(original instanceof File)||!(preview instanceof File)||data.get('previewConfirmed')!=='on')return NextResponse.json({error:'Upload an original and a separate watermarked preview, and confirm it is safe to show.'},{status:400});
 if(original.size>25*1024*1024||preview.size>10*1024*1024||!original.size||!preview.size)return NextResponse.json({error:'Original limit 25 MB; preview limit 10 MB.'},{status:413});
 const ob=await original.arrayBuffer(),pb=await preview.arrayBuffer();const ot=detectDeliveryType(new Uint8Array(ob)),pt=detectDeliveryType(new Uint8Array(pb));
 if(!ot||!pt||ot!==original.type||pt!==preview.type||ot.split('/')[0]!==pt.split('/')[0])return NextResponse.json({error:'Use valid images or MP4/WebM videos with matching preview media type.'},{status:400});
 const [oh,ph]=await Promise.all([crypto.subtle.digest('SHA-256',ob),crypto.subtle.digest('SHA-256',pb)]);if(new Uint8Array(oh).every((b,i)=>b===new Uint8Array(ph)[i]))return NextResponse.json({error:'The preview must differ from the original.'},{status:400});
 const id=createId('delivery'),ok=`deliveries/${p.id}/${id}/original`,pk=`deliveries/${p.id}/${id}/preview`,storage=await getFileStorage();
 await storage.put(ok,ob,{httpMetadata:{contentType:ot}});await storage.put(pk,pb,{httpMetadata:{contentType:pt}});
 await db.batch([db.prepare('INSERT INTO booking_deliverables(id,booking_id,title,filename,mime_type,preview_mime,original_key,preview_key,original_size,preview_size,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,p.id,title.data,safeFilename(original.name),ot,pt,ok,pk,original.size,preview.size,new Date().toISOString()),db.prepare("INSERT INTO audit_log(id,actor_email,action,entity_type,entity_id,created_at) VALUES(?,?,'delivery.uploaded','booking',?,?)").bind(createId('audit'),a.identity.email,p.id,new Date().toISOString())]);
 }
 if(req.headers.get('accept')?.includes('application/json'))return NextResponse.json({success:true});
 return NextResponse.redirect(new URL('/admin/bookings',req.url),303);
}
