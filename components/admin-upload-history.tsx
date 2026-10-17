'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export function AdminUploadHistory({uploads}:{uploads:{id:string;filename:string;size_bytes:number;state:string;expires_at:string;purpose:string}[]}){
 const router=useRouter(),[message,setMessage]=useState('');
 async function cancel(id:string){const res=await fetch(`/api/admin/uploads/${id}`,{method:'DELETE'});const data=await res.json().catch(()=>null);setMessage(res.ok?'Incomplete upload cancelled.':data?.error||'Cancellation failed.');router.refresh();}
 return <section className="admin-panel"><h2>Your recent uploads</h2><p className="help-text">Resume an unfinished upload by selecting the same file in its original form. Cancellation only removes an incomplete transfer; completed delivery files are retained.</p>{message&&<p role="status" className="notice">{message}</p>}<div className="admin-list">{uploads.map(u=><article key={u.id}><div><strong>{u.filename}</strong><small>{(u.size_bytes/1024**3).toFixed(2)} GiB · {u.purpose} · {u.state}{u.state==='pending'&&u.expires_at<new Date().toISOString()?' (expired)':''}</small></div>{u.state==='pending'&&<button className="button" onClick={()=>cancel(u.id)}>Cancel transfer</button>}</article>)}</div></section>;
}
