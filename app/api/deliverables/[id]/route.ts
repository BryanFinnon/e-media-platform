import {ownsClientProject} from '@/lib/domain/client-auth';
import {NextResponse} from 'next/server';
import {getCurrentIdentity,getDatabase,getFileStorage,isAdministrator} from '@/lib/server/sites';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}) {
 const identity=await getCurrentIdentity();if(!identity)return NextResponse.json({error:'Sign in required'},{status:401});
 const row=await (await getDatabase()).prepare('SELECT d.*,b.client_email,b.client_account_id,b.status,q.deposit_paid,q.balance_paid,q.gallery_ready FROM booking_deliverables d JOIN bookings b ON b.id=d.booking_id JOIN booking_quotes q ON q.booking_id=b.id WHERE d.id=?').bind((await params).id).first<{client_email:string;client_account_id:string|null;status:string;deposit_paid:number;balance_paid:number;gallery_ready:number;original_key:string;preview_key:string;mime_type:string;preview_mime:string;filename:string;original_size:number;preview_size:number}>();
 const admin=await isAdministrator(identity);if(!row||(!admin&&!ownsClientProject(identity,row)))return NextResponse.json({error:'Not found'},{status:404});
 const download=new URL(req.url).searchParams.get('download')==='1';
 if(!admin&&(!row.gallery_ready||row.status==='CANCELLED'||!row.deposit_paid||(download&&!row.balance_paid)))return NextResponse.json({error:'Downloads unlock after the balance is paid.'},{status:403});
 const original=download||!!row.balance_paid;
 const obj=await (await getFileStorage()).get(original?row.original_key:row.preview_key);if(!obj)return NextResponse.json({error:'File unavailable'},{status:404});
 return new Response(obj.body,{headers:{'content-type':original?row.mime_type:row.preview_mime,'content-length':String(original?row.original_size:row.preview_size),'content-disposition':download?`attachment; filename="${row.filename}"`:'inline','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
}
