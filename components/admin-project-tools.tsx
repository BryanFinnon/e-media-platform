import {AdminLargeUpload} from '@/components/admin-large-upload';
import {AdminDeliveryUpload} from './admin-delivery-upload';
import {AdminQuoteForm} from './admin-quote-form';
import {rates, ratesFor} from '@/lib/domain/quotes';
import type {Project} from '@/lib/server/projects';
export function AdminProjectTools({p,automaticVideo=false}:{p:Project;automaticVideo?:boolean}) {
 const options=ratesFor(p.service_slug);const selected=p.rate_id || options[0]?.id || rates[0].id;
 return <div className="stack quote-tools"><a className="button" href={`/account/projects/${p.id}`}>Open project / quote</a>{!p.snapshot_json&&['NEW','CONTACTED'].includes(p.status)&&<details><summary>Approve availability & generate quote</summary><AdminQuoteForm bookingId={p.id} rateId={selected} quantity={p.quantity||1} durationMinutes={p.duration_minutes}/></details>}{!!p.deposit_paid&&p.status!=='CANCELLED'&&<details><summary>Upload client delivery</summary><AdminDeliveryUpload bookingId={p.id} reference={p.reference}/><AdminLargeUpload bookingId={p.id} automaticVideo={automaticVideo}/><form method="post" action={`/api/admin/bookings/${p.id}/gallery`}><input name="action" type="hidden" value="publish"/><button className="button button-primary">Publish gallery & request balance</button></form></details>}<p className="help-text">{p.balance_paid?'Paid in full':p.deposit_paid?'Deposit paid':p.snapshot_json?'Awaiting 50% deposit':'Availability review pending'}</p></div>;
}
