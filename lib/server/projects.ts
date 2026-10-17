import 'server-only';
import {ownsClientProject} from '@/lib/domain/client-auth';
import { getDatabase, getCurrentIdentity, isAdministrator, type D1Database } from './sites';
import type { buildQuote } from '@/lib/domain/quotes';
import { sendTransactionalEmail } from './email';
import { formatMoney } from '@/lib/domain/pricing';
export type QuoteSnapshot = ReturnType<typeof buildQuote>;
export type Project = { id:string; client_account_id:string|null; reference:string; service_name:string; service_slug:string; client_name:string; client_email:string; preferred_at:string; duration_minutes:number; status:string; brief:string; rate_id:string|null; quantity:number; snapshot_json:string|null; total_minor:number|null; deposit_minor:number|null; balance_minor:number|null; deposit_paid:number|null; balance_paid:number|null; gallery_ready:number|null; expires_at:string|null; quote_email_sent_at:string|null };
export async function project(database:D1Database,id:string) {return database.prepare('SELECT b.*, q.* FROM bookings b LEFT JOIN booking_quotes q ON q.booking_id=b.id WHERE b.id=?').bind(id).first<Project>();}
export async function ownedProject(id:string) {
 const identity=await getCurrentIdentity(); if(!identity) return null;
 const p=await project(await getDatabase(),id);
 return p && (ownsClientProject(identity,p) || await isAdministrator(identity)) ? p : null;
}
export async function notifyProject(p:Project,kind:'QUOTE_READY'|'PROJECT_UPDATE'|'PAYMENT_CONFIRMED',text:string,key:string) {
 return sendTransactionalEmail({to:p.client_email,kind,subject:`${p.reference} — ${kind==='QUOTE_READY'?'Availability approved & quote':kind==='PAYMENT_CONFIRMED'?'Payment received':'Your gallery is ready'}`,preview:text,heading:kind==='QUOTE_READY'?'Your quote is ready.':kind==='PAYMENT_CONFIRMED'?'Payment received.':'Preview your project.',paragraphs:[text],details:p.total_minor?[{label:'Quote total',value:formatMoney(p.total_minor)},{label:'50% deposit',value:formatMoney(p.deposit_minor ?? 0)},{label:'Remaining balance',value:formatMoney(p.balance_minor ?? 0)}]:[],action:{label:'Open your project',href:`https://weareemedia.co.uk/account/projects/${p.id}`},idempotencyKey:key});
}
export function sameOrigin(request:Request) { const origin=request.headers.get('origin'); return !origin || origin===new URL(request.url).origin; }
