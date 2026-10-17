'use client';
import {useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {uploadLarge,uploadJson} from '@/lib/client/large-upload';
export function AdminLargeUpload({bookingId,automaticVideo=false}:{bookingId?:string;automaticVideo?:boolean}){
 const router=useRouter(),controller=useRef<AbortController|null>(null);
 const [busy,setBusy]=useState(false),[percent,setPercent]=useState(0),[message,setMessage]=useState(''),[error,setError]=useState('');
 const [automatic,setAutomatic]=useState(automaticVideo);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget,data=new FormData(form),original=data.get('original'),preview=data.get('preview');
  if(!(original instanceof File)||!original.size)return;
  if(bookingId&&!automatic&&(!(preview instanceof File)||!preview.size)){setError('Select the separate watermarked preview.');return;}
  setBusy(true);setError('');setPercent(0);controller.current=new AbortController();
  const signal=controller.current.signal;
  try{
   setMessage('Uploading original. Keep this tab open; you can pause and resume.');
   const originalId=await uploadLarge(original,{purpose:bookingId?'original':'public',bookingId},setPercent,signal);
   if(bookingId){
    let previewId:string|undefined;
    if(automatic){
     setMessage('Preparing the video preview…');
     let result=await uploadJson(`/api/admin/uploads/${originalId}/video`,{method:'POST',signal});
     for(let check=0;!result.ready&&check<15;check++){
      setMessage(result.message || 'Encoding the protected preview…');
      await new Promise<void>(resolve=>setTimeout(resolve,8000));
      if(signal.aborted)throw new DOMException('Paused','AbortError');
      result=await uploadJson(`/api/admin/uploads/${originalId}/video`,{method:'POST',signal});
     }
     if(!result.ready){setMessage(`${result.message} Submit this form again with the same file to check and finish adding it.`);return;}
    }else{
     setPercent(0);setMessage('Uploading protected preview…');
     previewId=await uploadLarge(preview as File,{purpose:'preview',bookingId},setPercent,signal);
    }
    await uploadJson('/api/admin/uploads/attach',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind:'delivery',originalId,previewId,automatic,previewConfirmed:true,title:data.get('title')}),signal});
    setMessage('File added. Use Publish gallery when all delivery files are ready.');
   }else{
    await uploadJson('/api/admin/uploads/attach',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind:'public',uploadId:originalId,title:data.get('title'),altText:data.get('altText')}),signal});
    setMessage('Public media added. Select it in the portfolio editor.');
   }
   form.reset();router.refresh();
  }catch(e){if(signal.aborted)setMessage('Paused. Keep or reselect the same file and submit again to resume.');else{setError(e instanceof Error?e.message:'Upload interrupted.');setMessage('Completed chunks are retained for 24 hours. Submit the same file again to resume.');}}
  finally{setBusy(false);}
 }
 return <form className="stack admin-panel" onSubmit={submit}>
  <h3>{bookingId?'Large video / prepared delivery':'Upload public media'}</h3>
  <p className="help-text">Up to 100 GiB per file. Progress is saved for 24 hours. After reopening the page, reselect the same unchanged file to resume. Completed files are retained.</p>
  <label>Title<input className="input" name="title" minLength={bookingId?1:2} maxLength={120} required disabled={busy}/></label>
  <label>{bookingId?'Original file (private)':'Image or video (public)'}<input className="input" type="file" name="original" accept={automatic&&bookingId?'video/mp4,video/webm':'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm'} required disabled={busy}/></label>
  {bookingId?<>
   <label className="check-row"><input type="checkbox" checked={automatic} disabled={!automaticVideo||busy} onChange={e=>setAutomatic(e.target.checked)}/>Generate the video watermark automatically (up to 30 GB)</label>
   {!automaticVideo&&<p className="notice">Automatic video watermarking is awaiting connection to Cloudflare Stream. You can upload an original and a separately prepared watermarked preview now.</p>}
   {!automatic&&<><label>Watermarked preview<input className="input" type="file" name="preview" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" required disabled={busy}/></label><label className="check-row"><input type="checkbox" required disabled={busy}/>I checked this preview: it contains a visible watermark and is safe to show before final payment.</label></>}
  </>:<><label>Description / alternative text<input className="input" name="altText" minLength={2} maxLength={240} required disabled={busy}/></label><p className="help-text">This library is public. Upload only work approved for your portfolio. For videos, use a web-ready MP4 or WebM; originals for clients belong in their private booking.</p></>}
  <progress max={100} value={percent} aria-label="Upload progress" style={{width:'100%'}}/>
  <div><button className="button button-primary" disabled={busy}>{busy?`Uploading · ${percent}%`:'Upload / resume →'}</button>{busy&&<button type="button" className="button" onClick={()=>controller.current?.abort()}>Pause</button>}</div>
  {message&&<p className="notice" role="status">{message}</p>}{error&&<p className="error-text" role="alert">{error}</p>}
 </form>;
}
