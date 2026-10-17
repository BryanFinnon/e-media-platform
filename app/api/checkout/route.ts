import {ownsClientProject} from '@/lib/domain/client-auth';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getStripe} from '@/lib/server/stripe';
import {createId,getCurrentIdentity,getDatabase,checkDatabaseRateLimit} from '@/lib/server/sites';
import {project,sameOrigin} from '@/lib/server/projects';
import {paymentDue} from '@/lib/domain/quotes';
import {env} from '@/lib/env';
const schema=z.object({bookingId:z.string().min(5).max(100),stage:z.enum(['deposit','balance'])});
export async function POST(req:Request) {
 try {
 if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const identity=await getCurrentIdentity();if(!identity)return NextResponse.json({error:'Sign in required'},{status:401});
 const data=schema.safeParse(await req.json().catch(()=>null));if(!data.success)return NextResponse.json({error:'Invalid request'},{status:400});
 const stripe=getStripe();if(!stripe||!env.STRIPE_WEBHOOK_SECRET||!env.STRIPE_PUBLISHABLE_KEY)return NextResponse.json({error:'Online payment is not yet activated. Please contact E-MEDIA.'},{status:503});
 const db=await getDatabase();if(!(await checkDatabaseRateLimit(db,`checkout:${identity.email}`)).success)return NextResponse.json({error:'Please wait before retrying.'},{status:429});
 const p=await project(db,data.data.bookingId);if(!p||!ownsClientProject(identity,p))return NextResponse.json({error:'Not found'},{status:404});
 if(!p.snapshot_json||p.status==='CANCELLED')return NextResponse.json({error:'No payable quote'},{status:409});
 const amount=paymentDue({depositMinor:p.deposit_minor??0,balanceMinor:p.balance_minor??0,depositPaid:!!p.deposit_paid,balancePaid:!!p.balance_paid,galleryReady:!!p.gallery_ready},data.data.stage);
 if(amount<=0||(data.data.stage==='deposit'&&(!p.expires_at||p.expires_at<new Date().toISOString())))return NextResponse.json({error:'Payment is already received, not due, or quote expired.'},{status:409});
 let row=await db.prepare("SELECT id,stripe_session_id FROM booking_checkout WHERE booking_id=? AND stage=? AND state='pending'").bind(p.id,data.data.stage).first<{id:string;stripe_session_id:string|null}>();
 if(row?.stripe_session_id){const s=await stripe.checkout.sessions.retrieve(row.stripe_session_id);if(s.status==='open')return NextResponse.json({clientSecret:s.client_secret,publishableKey:env.STRIPE_PUBLISHABLE_KEY});if(s.status==='complete')return NextResponse.json({error:'Payment is processing. Refresh your account shortly.'},{status:409});await db.prepare("UPDATE booking_checkout SET state='expired' WHERE id=?").bind(row.id).run();row=null;}
 if(!row){const id=createId('checkout');await db.prepare("INSERT OR IGNORE INTO booking_checkout(id,booking_id,stage,amount_minor,created_at) VALUES(?,?,?,?,?)").bind(id,p.id,data.data.stage,amount,new Date().toISOString()).run();row=await db.prepare("SELECT id,stripe_session_id FROM booking_checkout WHERE booking_id=? AND stage=? AND state='pending'").bind(p.id,data.data.stage).first<{id:string;stripe_session_id:string|null}>();}
 if(!row)return NextResponse.json({error:'Please retry'},{status:409});
 const session=await stripe.checkout.sessions.create({mode:'payment',ui_mode:'embedded_page',billing_address_collection:'auto',phone_number_collection:{enabled:false},automatic_tax:{enabled:false},name_collection:{individual:{enabled:true,optional:true},business:{enabled:true,optional:true}},integration_identifier:'emedia_booking_qvntprsk',customer_email:p.client_email,return_url:`https://weareemedia.co.uk/account/projects/${p.id}?session_id={CHECKOUT_SESSION_ID}`,line_items:[{price_data:{currency:'gbp',unit_amount:amount,product_data:{name:`${p.reference} — ${data.data.stage==='deposit'?'50% deposit':'Remaining balance'}`}},quantity:1}],metadata:{booking_id:p.id,stage:data.data.stage,checkout_id:row.id}},{idempotencyKey:row.id});
 await db.prepare('UPDATE booking_checkout SET stripe_session_id=? WHERE id=?').bind(session.id,row.id).run();
 return NextResponse.json({clientSecret:session.client_secret,publishableKey:env.STRIPE_PUBLISHABLE_KEY});
 } catch(error) {
  const failure=error as {type?:string;code?:string;requestId?:string};
  console.error('Checkout failed',{type:failure.type,code:failure.code,requestId:failure.requestId});
  return NextResponse.json({error:'Unable to open secure payment. Please retry shortly or contact E-MEDIA.'},{status:502});
 }
}
