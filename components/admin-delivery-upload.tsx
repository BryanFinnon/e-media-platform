'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {watermarkedPreview} from '@/lib/client/watermarked-preview';
export function AdminDeliveryUpload({bookingId,reference}:{bookingId:string;reference:string}){
 const router=useRouter();const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function send(data:FormData){const res=await fetch(`/api/admin/bookings/${bookingId}/gallery`,{method:'POST',headers:{accept:'application/json'},body:data});const result=await res.json().catch(()=>null);if(!res.ok)throw new Error(result?.error||'Upload failed. Please retry.');}
 async function upload(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const values=new FormData(form),files=values.getAll('photos').filter((f):f is File=>f instanceof File&&f.size>0);setBusy(true);setError('');setMessage('');
  try{if(!files.length)throw new Error('Select at least one photo.');
   for(let i=0;i<files.length;i++){const original=files[i];if(original.size>25*1024*1024)throw new Error(`${original.name}: maximum 25 MB.`);setMessage(`Preparing and uploading protected photo ${i+1} of ${files.length}…`);const preview=await watermarkedPreview(original,reference);const data=new FormData();data.set('title',original.name.replace(/\.[^.]+$/,''));data.set('original',original);data.set('preview',preview);data.set('previewConfirmed','on');await send(data);}
   const publish=new FormData();publish.set('action','publish');await send(publish);form.reset();setMessage('Gallery published. The client can view protected previews and pay the remaining balance.');router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Upload failed.');setMessage('Files already uploaded are retained. Use Publish gallery below to publish completed uploads.');}finally{setBusy(false);}
 }
 return <form className="stack" onSubmit={upload}><h3>Upload photos</h3><p className="help-text">Select originals. Reduced previews with repeated E-MEDIA text are generated automatically. Original files stay private until the final payment.</p><label>Photos (up to 25 MB each)<input className="input" name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple required disabled={busy}/></label><button className="button button-primary" disabled={busy}>{busy?'Preparing gallery…':'Upload photos & publish gallery'}</button>{message&&<p className="notice" role="status">{message}</p>}{error&&<p className="error-text" role="alert">{error}</p>}</form>;
}
