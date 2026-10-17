'use client';

import {useState, type FormEvent, type ChangeEvent} from 'react';
import {useRouter} from 'next/navigation';
import {rates, buildQuote, isTimedRate, billableQuantity} from '@/lib/domain/quotes';
import {formatMoney} from '@/lib/domain/pricing';

type Values={rateId:string;quantity:number;durationMinutes:number;customPrice:number;extraLabel:string;extraPrice:number;notes:string;priority:boolean};
export function AdminQuoteForm({bookingId,rateId,quantity,durationMinutes}:{bookingId:string;rateId:string;quantity:number;durationMinutes:number}) {
 const router=useRouter();
 const [values,setValues]=useState<Values>({rateId,quantity,durationMinutes,customPrice:0,extraLabel:'',extraPrice:0,notes:'',priority:false});
 const [sending,setSending]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const selected=rates.find(r=>r.id===values.rateId);
 let quote:ReturnType<typeof buildQuote>|null=null,validation='';
 try {
  quote=buildQuote({rateId:values.rateId,quantity:values.quantity,durationMinutes:values.durationMinutes,customMinor:Math.round(values.customPrice*100),extras:values.extraPrice>0?[{label:values.extraLabel,amountMinor:Math.round(values.extraPrice*100)}]:[],priority:values.priority,notes:values.notes});
 }catch(e){validation=e instanceof Error?e.message:'Check the quote fields.';}
 const timed=!!selected&&isTimedRate(selected);
 function change(event:ChangeEvent<HTMLFormElement>){
  const form=new FormData(event.currentTarget);
  setValues({rateId:String(form.get('rateId')),quantity:form.has('quantity')?Number(form.get('quantity')):1,durationMinutes:Number(form.get('durationMinutes')),customPrice:Number(form.get('customPrice')),extraLabel:String(form.get('extraLabel')??''),extraPrice:Number(form.get('extraPrice')),notes:String(form.get('notes')??''),priority:form.get('priority')==='on'});
  setError('');
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(validation){setError(validation);return;}
  const data=new FormData(event.currentTarget);setSending(true);setError('');
  try{
   const response=await fetch(`/api/admin/bookings/${bookingId}/quote`,{method:'POST',headers:{accept:'application/json'},body:data});
   const body=await response.json().catch(()=>null) as {error?:string;message?:string}|null;
   if(!response.ok)throw new Error(body?.error||'The quote could not be sent. Your entries have been preserved.');
   setSuccess(body?.message||'Availability approved and quote published.');router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'The quote could not be sent. Your entries have been preserved.');}
  finally{setSending(false);}
 }
 return <form className="stack" method="post" action={`/api/admin/bookings/${bookingId}/quote`} onChange={change} onSubmit={submit}>
  <label>Rate from price guide<select className="input" name="rateId" defaultValue={rateId}>{rates.map(r=><option value={r.id} key={r.id}>{r.category} — {r.name}</option>)}</select></label>
  {selected&&<div className="notice"><strong>{selected.name} · {selected.amountMinor===null?'Custom quote':formatMoney(selected.amountMinor)} per {selected.unit}</strong><p>{selected.scope}</p>{selected.includedMinutes&&<p>Included duration: {selected.includedMinutes/60} hours. Requested duration: {values.durationMinutes/60} hours.</p>}</div>}
  {timed&&selected?<div className="notice"><strong>Duration-based price</strong><p>{values.durationMinutes/60} hours ÷ {selected.includedMinutes!/60} hours per unit = {billableQuantity(selected,1,values.durationMinutes).toLocaleString('en-GB',{maximumFractionDigits:4})} billable units. The quantity and total update automatically from the duration.</p><input type="hidden" name="quantity" value="1"/></div>:<label>Quantity<input className="input" name="quantity" type="number" min={selected?.minimumQuantity??1} max="10000" defaultValue={quantity} required/></label>}
  <label>Agreed duration (minutes)<input className="input" name="durationMinutes" type="number" min="30" max="1440" defaultValue={durationMinutes} required/><small>60 = 1 hour · 120 = 2 hours · 240 = 4 hours.</small></label>
  <label>Custom rate (£), for custom-quote items only<input className="input" type="number" name="customPrice" step="0.01" min="0" defaultValue="0" required/></label>

  <label>Additional costs description<input className="input" name="extraLabel" maxLength={200} placeholder="Studio, crew, travel…" defaultValue=""/></label>
  <label>Additional costs (£)<input className="input" name="extraPrice" type="number" min="0" step="0.01" defaultValue="0" required/></label>
  <label>Final scope / revisions / delivery notes<textarea className="input" name="notes" maxLength={3000} defaultValue=""/></label>
  <label className="check-row"><input type="checkbox" name="priority"/>Priority delivery +30%</label>
  {quote&&<div className="notice" aria-live="polite"><strong>Quote preview</strong>{quote.lines.map((l,i)=><p key={i}>{l.label} × {l.quantity}: {formatMoney(l.amountMinor)}</p>)}<p>Total: <strong>{formatMoney(quote.totalMinor)}</strong></p><p>50% deposit: {formatMoney(quote.depositMinor)} · Remaining balance: {formatMoney(quote.balanceMinor)}</p></div>}
  {validation&&<p className="error-text" role="alert">{validation}</p>}
  <label className="check-row"><input type="checkbox" name="availability" required/>I have checked availability, the selected package, all additional hours and costs.</label>
  {error&&<p className="error-text" role="alert">{error}</p>}{success&&<p className="notice" role="status">{success}</p>}
  <button className="button button-primary" disabled={sending||!!validation||!!success}>{sending?'Sending quote…':'Approve & send quote'}</button>
 </form>;
}
