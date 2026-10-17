import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireAdministrator,getDatabase,createId} from '@/lib/server/sites';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const a=await requireAdministrator(req);if(a.status!==200||!a.identity)return NextResponse.json({error:'Staff access required'},{status:a.status});
 if(req.headers.get('origin')!==new URL(req.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403});
 const video=z.string().max(100).safeParse((await req.formData()).get('videoMediaId'));if(!video.success)return NextResponse.json({error:'Select a video'},{status:400});
 const db=await getDatabase(),id=(await params).id;
 if(!(await db.prepare('SELECT id FROM portfolio_items WHERE id=?').bind(id).first()))return NextResponse.json({error:'Project not found'},{status:404});
 if(video.data){const asset=await db.prepare("SELECT id FROM media_assets WHERE id=? AND visibility='PUBLIC' AND mime_type LIKE 'video/%'").bind(video.data).first();if(!asset)return NextResponse.json({error:'Select a public video from the media library'},{status:400});}
 const now=new Date().toISOString();await db.batch([
 db.prepare('UPDATE portfolio_items SET video_media_id=?,updated_at=? WHERE id=?').bind(video.data||null,now,id),
 db.prepare("INSERT INTO audit_log(id,actor_email,action,entity_type,entity_id,created_at) VALUES(?,?,'portfolio.video_updated','portfolio_item',?,?)").bind(createId('audit'),a.identity.email,id,now),
 ]);
 return NextResponse.redirect(new URL('/admin/portfolio',req.url),303);
}
