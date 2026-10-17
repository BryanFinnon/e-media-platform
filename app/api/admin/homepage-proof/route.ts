import {NextResponse} from 'next/server';
import {z} from 'zod';
import {brandSchema,reviewSchema} from '@/lib/domain/homepage-proof';
import {getDatabase,createId,requireAdministrator} from '@/lib/server/sites';
import {sameOrigin} from '@/lib/server/projects';
export async function POST(req:Request){
 const a=await requireAdministrator(req);if(a.status!==200||!a.identity)return NextResponse.json({error:'Staff access required'},{status:a.status});if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const data=await req.formData(),kind=data.get('kind');if(kind!=='brand'&&kind!=='review')return NextResponse.json({error:'Invalid record type'},{status:400});
 const db=await getDatabase(),now=new Date().toISOString(),table=kind==='brand'?'homepage_brands':'homepage_reviews';
 if(data.get('action')==='unpublish'||data.get('action')==='publish'){
 const id=z.string().min(5).max(100).safeParse(data.get('id'));if(!id.success)return NextResponse.json({error:'Invalid record'},{status:400});
 const publish=data.get('action')==='publish'; if(publish&&data.get('permission')!=='on')return NextResponse.json({error:'Confirm permission before publishing.'},{status:400});
 await db.batch([db.prepare(`UPDATE ${table} SET published=?,permission=CASE WHEN ?=1 THEN 1 ELSE permission END WHERE id=?`).bind(Number(publish),Number(publish),id.data),db.prepare("INSERT INTO audit_log(id,actor_email,action,entity_type,entity_id,created_at) VALUES(?,?,?,?,?,?)").bind(createId('audit'),a.identity.email,publish?'homepage.published':'homepage.unpublished',kind,id.data,now)]);
 }else{
 const common={name:String(data.get('name')??''),published:data.get('published')==='on',permission:data.get('permission')==='on'};const id=createId(kind);
 if(kind==='brand'){
 const v=brandSchema.safeParse({...common,relationship:data.get('relationship'),logoMediaId:String(data.get('logoMediaId')??'')});if(!v.success)return NextResponse.json({error:v.error.issues[0]?.message},{status:400});
 if(v.data.logoMediaId&&!await db.prepare("SELECT id FROM media_assets WHERE id=? AND visibility='PUBLIC'").bind(v.data.logoMediaId).first())return NextResponse.json({error:'Select a public logo from the media library.'},{status:400});
 await db.prepare('INSERT INTO homepage_brands(id,name,relationship,logo_media_id,published,permission,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,v.data.name,v.data.relationship,v.data.logoMediaId||null,Number(v.data.published),Number(v.data.permission),now).run();
 }else{
 const v=reviewSchema.safeParse({...common,company:String(data.get('company')??''),quote:String(data.get('quote')??''),stars:Number(data.get('stars'))});if(!v.success)return NextResponse.json({error:v.error.issues[0]?.message},{status:400});
 await db.prepare('INSERT INTO homepage_reviews(id,name,company,quote,stars,published,permission,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,v.data.name,v.data.company,v.data.quote,v.data.stars,Number(v.data.published),Number(v.data.permission),now).run();
 }
 await db.prepare("INSERT INTO audit_log(id,actor_email,action,entity_type,entity_id,created_at) VALUES(?,?,'homepage.created',?,?,?)").bind(createId('audit'),a.identity.email,kind,id,now).run();
 }
 return NextResponse.redirect(new URL('/admin/homepage',req.url),303);
}
