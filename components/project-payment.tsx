'use client';
import Script from 'next/script';
import {useState,useRef,useEffect} from 'react';
type EmbeddedCheckout={mount:(selector:string)=>void;destroy:()=>void};
declare global {interface Window {Stripe?:(key:string)=>{initEmbeddedCheckout:(opts:{clientSecret:string;onComplete:()=>void})=>Promise<EmbeddedCheckout>}}}
export function ProjectPayment({bookingId,stage,label}:{bookingId:string;stage:'deposit'|'balance';label:string}) {
 const [ready,setReady]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[opened,setOpened]=useState(false);const formRef=useRef<EmbeddedCheckout|null>(null);
 useEffect(()=>()=>formRef.current?.destroy(),[]);
 async function pay(){setLoading(true);setError('');try{const res=await fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({bookingId,stage})});if(!res.headers.get('content-type')?.includes('application/json'))throw new Error('Unable to open secure payment. Please retry shortly or contact E-MEDIA.');const data=await res.json();if(!res.ok)throw new Error(data.error||'Payment unavailable');if(!window.Stripe)throw new Error('Payment form is still loading.');formRef.current?.destroy();const checkout=await window.Stripe(data.publishableKey).initEmbeddedCheckout({clientSecret:data.clientSecret,onComplete:()=>window.location.reload()});checkout.mount('#project-checkout');formRef.current=checkout;setOpened(true);}catch(e){setError(e instanceof Error?e.message:'Payment unavailable');}finally{setLoading(false);}}
 return <div className="stack"><Script src="https://js.stripe.com/v3/" onReady={()=>setReady(true)} onError={()=>setError('The payment provider could not load.')} />{!opened&&<button className="button button-primary" disabled={!ready||loading} onClick={pay}>{loading?'Loading…':label}</button>}<div id="project-checkout" />{error&&<p className="error-text" role="alert">{error}</p>}<p className="help-text">Confirmation follows verified payment. Refresh your project if processing takes a moment.</p></div>;
}
