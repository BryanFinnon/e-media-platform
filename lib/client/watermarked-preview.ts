/** Only this flattened, reduced image is delivered before the final payment. */
export async function watermarkedPreview(file:File,reference:string):Promise<File>{
 const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
 try{
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Your browser cannot prepare protected previews.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const size=Math.max(16,Math.min(48,canvas.width/18));
  ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/6);
  ctx.font=`700 ${size}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  const text='E-MEDIA · PREVIEW',stepX=ctx.measureText(text).width+size*2,stepY=size*3;
  const span=Math.hypot(canvas.width,canvas.height);
  ctx.lineWidth=Math.max(1,size/18);ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.fillStyle='rgba(255,255,255,0.52)';
  for(let y=-span;y<span;y+=stepY)for(let x=-span;x<span;x+=stepX){ctx.strokeText(text,x,y);ctx.fillText(text,x,y);}
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(0,canvas.height-size*1.7,canvas.width,size*1.7);
  ctx.font=`600 ${Math.max(12,size*0.48)}px Arial, sans-serif`;ctx.fillStyle='#fff';ctx.fillText(`E-MEDIA · ${reference} · Preview only`,canvas.width/2,canvas.height-size*0.85);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Preview generation failed.')),'image/jpeg',0.8));
  return new File([blob],'emedia-watermarked-preview.jpg',{type:'image/jpeg'});
 }finally{bitmap.close();}
}
