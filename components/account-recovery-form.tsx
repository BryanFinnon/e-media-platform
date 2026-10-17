'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
export function AccountRecoveryForm({reset}:{reset:boolean}){
 const [token,setToken]=useState(''),[loaded,setLoaded]=useState(!reset),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const linkRead=useRef(false);
 useEffect(()=>{
  if(!reset||linkRead.current)return;
  linkRead.current=true;
  const value=new URLSearchParams(window.location.hash.slice(1)).get('token')??'';
  setToken(/^[a-f0-9]{64}$/.test(value)?value:'');setLoaded(true);
  // Keep the secret in component memory, out of URLs, history and persistent storage.
  window.history.replaceState(null,'',window.location.pathname);
 },[reset]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');const values=new FormData(event.currentTarget);
  if(reset&&values.get('password')!==values.get('confirmPassword')){setError('The passwords do not match.');return;}
  setBusy(true);
  try{
   const response=await fetch(`/api/account-recovery/${reset?'reset':'request'}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(reset?{token,password:values.get('password'),confirmPassword:values.get('confirmPassword')}:{email:values.get('email')})});
   const result=await response.json().catch(()=>null);if(!response.ok)throw new Error(result?.error||'Please try again shortly.');setMessage(result.message);setDone(true);setToken('');
  }catch(e){setError(e instanceof Error?e.message:'Connection failed. Please try again.');}finally{setBusy(false);}
 }
 if(!loaded)return <p role="status">Opening your reset link…</p>;
 if(reset&&!token&&!done)return <div className="stack"><p className="notice" role="alert">Open the complete reset link from your email. If you refreshed this page, reopen the email link or request a new one.</p><Link className="button" href="/auth/forgot-password">Request a new link →</Link></div>;
 return <div className="stack">{done?<><p className="notice" role="status">{message}</p>{!reset&&<p className="help-text">The link expires after 30 minutes. Wait a few minutes and check spam. If needed, you can request another link later.</p>}<Link className="button button-primary" href="/auth/login">Back to login →</Link></>:<form className="stack client-auth-form" onSubmit={submit}>{reset?<><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label><p className="help-text">At least 12 characters. Your previous sessions will be signed out.</p></>:<><p>Enter the email address you used to register. We will email a link if an account exists.</p><label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required/></label></>}{error&&<p className="error-text" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy?'Please wait…':reset?'Save new password →':'Send reset link →'}</button><Link className="text-link" href="/auth/login">Back to login</Link></form>}</div>;
}
