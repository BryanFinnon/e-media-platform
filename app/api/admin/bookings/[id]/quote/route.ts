import {NextResponse} from 'next/server';
import {z} from 'zod';
import {buildQuote} from '@/lib/domain/quotes';
import {createId,getDatabase,requireAdministrator} from '@/lib/server/sites';
import {project,notifyProject,sameOrigin} from '@/lib/server/projects';
const schema=z.object({rateId:z.string(),quantity:z.coerce.number().int().min(1).max(10000),durationMinutes:z.coerce.number().int().min(30).max(1440),customPrice:z.coerce.number().min(0).max(1000000),extraLabel:z.string().max(200),extraPrice:z.coerce.number().min(0).max(1000000),notes:z.string().max(3000),priority:z.string().optional(),availability:z.literal('on')});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}) {
 const a=await requireAdministrator(req);if(a.status!==200||!a.identity)return NextResponse.json({error:'Staff access required'},{status:a.status});
 if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const data=schema.safeParse(Object.fromEntries(await req.formData()));if(!data.success)return NextResponse.json({error:'Check quote fields and confirm availability.'},{status:400});
 const db=await getDatabase(), p=await project(db,(await params).id);
 if(!p)return NextResponse.json({error:'Not found'},{status:404});
 if(!['NEW','CONTACTED'].includes(p.status)||p.snapshot_json)return NextResponse.json({error:'Published quotes cannot be changed. Contact the client before issuing a replacement.'},{status:409});
 try {
 const v=data.data;const q=buildQuote({rateId:v.rateId,quantity:v.quantity,durationMinutes:v.durationMinutes,customMinor:Math.round(v.customPrice*100),extras:v.extraPrice?[{label:v.extraLabel,amountMinor:Math.round(v.extraPrice*100)}]:[],priority:v.priority==='on',notes:v.notes});
 if(!q.totalMinor)return NextResponse.json({error:'Quote must have a positive total'},{status:400});
 const start=new Date(p.preferred_at),end=new Date(start.getTime()+v.durationMinutes*60000);
 const conflict=await db.prepare("SELECT id FROM bookings WHERE id<>? AND status IN('CONFIRMED','COMPLETED') AND julianday(preferred_at)<julianday(?) AND julianday(preferred_at)+duration_minutes/1440.0>julianday(?) LIMIT 1").bind(p.id,end.toISOString(),start.toISOString()).first();
 if(conflict)return NextResponse.json({error:'A confirmed booking overlaps this time. Review staffing before approving.'},{status:409});
 const now=new Date().toISOString(),expires=new Date(Math.min(Date.now()+7*86400000,start.getTime())).toISOString();
 if(expires<=now)return NextResponse.json({error:'Preferred date is in the past. Arrange a new date.'},{status:409});
 await db.batch([db.prepare('INSERT INTO booking_quotes(booking_id,snapshot_json,total_minor,deposit_minor,balance_minor,approved_at,expires_at,approved_by) VALUES(?,?,?,?,?,?,?,?)').bind(p.id,JSON.stringify(q),q.totalMinor,q.depositMinor,q.balanceMinor,now,expires,a.identity.email),db.prepare("UPDATE bookings SET status='CONTACTED',duration_minutes=?,updated_at=? WHERE id=?").bind(v.durationMinutes,now,p.id),db.prepare("INSERT INTO audit_log(id,actor_email,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,'quote.approved','booking',?,?,?)").bind(createId('audit'),a.identity.email,p.id,JSON.stringify(q),now)]);
 let emailSent=false;
 const updated=await project(db,p.id);if(updated){const sent=await notifyProject(updated,'QUOTE_READY','We have reviewed your request and approved availability. Review the itemised quote in your account. Your booking is confirmed only after the 50% deposit is received. The quote expires on '+new Date(expires).toLocaleString('en-GB',{timeZone:'Europe/London'}),`quote/${p.id}`);emailSent=sent.status==='sent';if(emailSent)await db.prepare('UPDATE booking_quotes SET quote_email_sent_at=? WHERE booking_id=?').bind(now,p.id).run();}
 if(req.headers.get('accept')?.includes('application/json')) return NextResponse.json({published:true,emailSent,message:emailSent?'Availability approved. Quote published and email sent.':'Availability approved. Quote published in the client account; email delivery is pending.'});
 return NextResponse.redirect(new URL('/admin/bookings',req.url),303);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Quote could not be published'},{status:400});}
}
