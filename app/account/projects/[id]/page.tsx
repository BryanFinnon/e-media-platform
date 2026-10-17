import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {DeliveryGallery} from '@/components/delivery-gallery';
import {getCurrentIdentity,getDatabase} from '@/lib/server/sites';
import {ownedProject,type QuoteSnapshot} from '@/lib/server/projects';
import {formatMoney} from '@/lib/domain/pricing';
import {ProjectPayment} from '@/components/project-payment';
export const dynamic='force-dynamic';
export default async function ProjectPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;if(!await getCurrentIdentity())redirect(`/auth/login?return_to=${encodeURIComponent(`/account/projects/${id}`)}`);
 const p=await ownedProject(id);if(!p)notFound();const q:QuoteSnapshot|null=p.snapshot_json?JSON.parse(p.snapshot_json):null;
 const files=p.gallery_ready?(await (await getDatabase()).prepare('SELECT id,title,mime_type FROM booking_deliverables WHERE booking_id=? ORDER BY created_at').bind(p.id).all<{id:string;title:string;mime_type:string}>()).results??[]:[];
 const cancelled=p.status==='CANCELLED';const expired=!!p.expires_at&&p.expires_at<new Date().toISOString()&&!p.deposit_paid;
 return <section className="page-shell section"><Link href="/account">← Your projects</Link><p className="eyebrow">{p.reference}</p><h1 className="dashboard-title">{p.service_name}</h1><p>{new Date(p.preferred_at).toLocaleString('en-GB',{timeZone:'Europe/London'})} · {p.duration_minutes/60} hours</p><p className="notice">{cancelled?'Request declined or cancelled.':p.balance_paid?'Paid in full — original downloads unlocked.':p.gallery_ready?'Gallery ready — balance due.':p.deposit_paid?'Booking confirmed — deposit received.':q?'Availability approved — 50% deposit required to confirm.':'Request received — E-MEDIA is reviewing availability.'}</p>
 <ol className="project-timeline"><li>Request received ✓</li><li>Availability & quote {q?'✓':'— pending review'}</li><li>50% deposit & booking confirmation {p.deposit_paid?'✓':'— pending'}</li><li>Preview gallery {p.gallery_ready?'✓':'— pending'}</li><li>Final 50% & downloads {p.balance_paid?'✓':'— pending'}</li></ol>
 {files.length>0&&!cancelled&&<DeliveryGallery files={files} paid={!!p.balance_paid}/>}
 {q&&<div className="admin-panel stack"><h2>Your quote</h2><table className="admin-table"><thead><tr><th>Description</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{q.lines.map((l,i)=><tr key={i}><td>{l.label}</td><td>{l.quantity}</td><td>{formatMoney(l.unitMinor)}</td><td>{formatMoney(l.amountMinor)}</td></tr>)}</tbody></table><p>{q.scope}</p><p>Delivery: {q.delivery}</p>{q.notes&&<p>{q.notes}</p>}<strong>Total {formatMoney(q.totalMinor)}</strong><p>Deposit {formatMoney(q.depositMinor)} · Balance {formatMoney(q.balanceMinor)}</p><p className="help-text">Valid until {new Date(p.expires_at!).toLocaleString('en-GB',{timeZone:'Europe/London'})}. Payment of the deposit accepts the stated scope and price. Additional scope requires a separately agreed quote.</p><Link href={`/account/projects/${id}/quote`} className="button">Printable quote →</Link>{expired&&<p className="notice">This quote has expired. Contact E-MEDIA to renew availability.</p>}{!cancelled&&!expired&&!p.deposit_paid&&<ProjectPayment bookingId={id} stage="deposit" label={`Accept quote & pay 50% — ${formatMoney(q.depositMinor)}`} />}{!cancelled&&!!p.deposit_paid&&!!p.gallery_ready&&!p.balance_paid&&<ProjectPayment bookingId={id} stage="balance" label={`Pay balance & unlock downloads — ${formatMoney(q.balanceMinor)}`} />}</div>}

 </section>;
}
