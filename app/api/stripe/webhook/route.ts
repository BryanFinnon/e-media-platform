import {NextResponse} from 'next/server';
import Stripe from 'stripe';
import {env} from '@/lib/env';
import {getDatabase} from '@/lib/server/sites';
import {project,notifyProject} from '@/lib/server/projects';
export async function POST(req:Request) {
 const signature=req.headers.get('stripe-signature');if(!env.STRIPE_WEBHOOK_SECRET)return NextResponse.json({error:'Webhook not configured'},{status:503});
 if(!signature)return NextResponse.json({error:'Invalid signature'},{status:400});
 let event:Stripe.Event;try{event=await Stripe.webhooks.constructEventAsync(await req.text(),signature,env.STRIPE_WEBHOOK_SECRET);}catch{return NextResponse.json({error:'Invalid signature'},{status:400});}
 const db=await getDatabase();if(await db.prepare('SELECT id FROM checkout_events WHERE id=?').bind(event.id).first())return NextResponse.json({received:true});
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return NextResponse.json({received:true});
 const s=event.data.object as Stripe.Checkout.Session;
 if(s.payment_status!=='paid')return NextResponse.json({received:true});
 const row=await db.prepare('SELECT * FROM booking_checkout WHERE stripe_session_id=?').bind(s.id).first<{id:string;booking_id:string;stage:'deposit'|'balance';amount_minor:number;state:string}>();
 if(!row||s.amount_total!==row.amount_minor||s.currency!=='gbp'||s.metadata?.checkout_id!==row.id||s.metadata?.booking_id!==row.booking_id||s.metadata?.stage!==row.stage)return NextResponse.json({error:'Payment does not match a stored quote'},{status:400});
 const p=await project(db,row.booking_id);if(!p||p.status==='CANCELLED')return NextResponse.json({error:'Booking requires staff payment review'},{status:409});
 if(row.stage==='balance'&&!p.deposit_paid)return NextResponse.json({error:'Deposit not yet verified'},{status:409});
 const now=new Date().toISOString();
 const statements=[db.prepare("UPDATE booking_checkout SET state='paid',paid_at=? WHERE id=?").bind(now,row.id),db.prepare(`UPDATE booking_quotes SET ${row.stage==='deposit'?'deposit_paid':'balance_paid'}=1 WHERE booking_id=?`).bind(p.id),db.prepare('INSERT OR IGNORE INTO checkout_events(id,processed_at) VALUES(?,?)').bind(event.id,now)];
 if(row.stage==='deposit')statements.push(db.prepare("UPDATE bookings SET status='CONFIRMED',updated_at=? WHERE id=? AND status='CONTACTED'").bind(now,p.id));
 statements.push(db.prepare("INSERT OR IGNORE INTO audit_log(id,actor_email,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,'payment.verified','booking',?,?,?)").bind(`payment_${s.id}`,p.client_email,p.id,JSON.stringify({stage:row.stage,amountMinor:row.amount_minor,livemode:event.livemode}),now));
 await db.batch(statements);
 const sent=await notifyProject(p,'PAYMENT_CONFIRMED',row.stage==='deposit'?'Your 50% deposit has been received. Your booking is now confirmed.':'Your final payment has been received. Original downloads are now unlocked in your gallery.',`payment/${row.id}`);
 if(sent.status==='sent'&&row.stage==='deposit')await db.prepare('UPDATE bookings SET client_confirmation_email_sent_at=? WHERE id=?').bind(now,p.id).run();
 return NextResponse.json({received:true});
}
