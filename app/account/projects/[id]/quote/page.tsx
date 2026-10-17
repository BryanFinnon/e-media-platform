import {notFound} from 'next/navigation';
import {ownedProject,type QuoteSnapshot} from '@/lib/server/projects';
import {formatMoney} from '@/lib/domain/pricing';
import {PrintQuote} from '@/components/print-quote';
export const dynamic='force-dynamic';
export default async function QuotePage({params}:{params:Promise<{id:string}>}) {
 const p=await ownedProject((await params).id);if(!p?.snapshot_json)notFound();const q:QuoteSnapshot=JSON.parse(p.snapshot_json);
 return <section className="page-shell section quote-print"><p className="eyebrow">E-MEDIA · Quote {p.reference}</p><h1>Project quotation</h1><p>Prepared for {p.client_name} · {p.client_email}</p><p>{p.service_name} · {new Date(p.preferred_at).toLocaleString('en-GB',{timeZone:'Europe/London'})} · {q.durationMinutes/60} hours</p><table className="admin-table"><thead><tr><th>Description</th><th>Quantity</th><th>Unit</th><th>Amount</th></tr></thead><tbody>{q.lines.map((l,i)=><tr key={i}><td>{l.label}</td><td>{l.quantity}</td><td>{formatMoney(l.unitMinor)}</td><td>{formatMoney(l.amountMinor)}</td></tr>)}</tbody></table><h2>Total {formatMoney(q.totalMinor)}</h2><p>50% deposit: {formatMoney(q.depositMinor)} · Remaining balance: {formatMoney(q.balanceMinor)}</p><p>{q.scope}</p><p>Delivery: {q.delivery}</p><p>{q.notes}</p><p>Valid until {new Date(p.expires_at!).toLocaleString('en-GB',{timeZone:'Europe/London'})}. Booking is confirmed after the deposit is received. Originals are released after the balance is received.</p><p>No VAT added, per the supplied E-MEDIA price guide. Studio, crew, travel, licences and software costs are included only when expressly itemised.</p><PrintQuote /></section>;
}
