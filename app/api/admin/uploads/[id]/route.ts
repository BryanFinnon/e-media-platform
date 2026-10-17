import {NextResponse} from 'next/server';
import {getDatabase,getFileStorage,requireAdministrator} from '@/lib/server/sites';
import {findUpload,uploadStatus,putPart,completeUpload,UploadError} from '@/lib/server/large-upload';
import {PART_BYTES,partSize} from '@/lib/domain/large-upload';
type Props={params:Promise<{id:string}>};
async function access(req:Request,props:Props,mutation=false){
 const a=await requireAdministrator(req);if(a.status!==200||!a.identity)throw new UploadError('Staff access required',a.status);
 if(mutation&&req.headers.get('origin')!==new URL(req.url).origin)throw new UploadError('Invalid origin',403);
 const db=await getDatabase(),row=await findUpload(db,(await props.params).id,a.identity.email);if(!row)throw new UploadError('Upload not found',404);
 return {db,row};
}
function failure(e:unknown){return NextResponse.json({error:e instanceof UploadError?e.message:'Upload could not be completed. Retry to resume.'},{status:e instanceof UploadError?e.status:503,headers:{'cache-control':'no-store'}});}
export async function GET(req:Request,props:Props){try{const {db,row}=await access(req,props);return NextResponse.json(await uploadStatus(db,row),{headers:{'cache-control':'no-store'}});}catch(e){return failure(e);}}
export async function PUT(req:Request,props:Props){try{
 const {db,row}=await access(req,props,true),number=Number(new URL(req.url).searchParams.get('part'));
 const expected=partSize(row.size_bytes,number);if(expected===null)throw new UploadError('Invalid chunk number');
 if(Number(req.headers.get('content-length')??expected)!==expected)throw new UploadError('Invalid chunk length');
 const reader=req.body?.getReader();if(!reader)throw new UploadError('Missing chunk');
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>PART_BYTES||size>expected){await reader.cancel();throw new UploadError('Chunk too large',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 await putPart(db,await getFileStorage(),row,number,bytes.buffer);return NextResponse.json({success:true});
 }catch(e){return failure(e);}}
export async function POST(req:Request,props:Props){try{const {db,row}=await access(req,props,true);await completeUpload(db,await getFileStorage(),row);return NextResponse.json({id:row.id,state:'complete'});}catch(e){return failure(e);}}
export async function DELETE(req:Request,props:Props){try{
 const {db,row}=await access(req,props,true);
 // Attached files are permanent delivery records and must never be removed by upload cancellation.
 const attached=await db.prepare('SELECT id FROM booking_deliverables WHERE original_upload_id=? OR preview_upload_id=? UNION ALL SELECT id FROM media_assets WHERE upload_id=? LIMIT 1').bind(row.id,row.id,row.id).first();
 if(attached||row.stream_id)throw new UploadError('This file is already attached or processing.',409);
 if(row.state==='pending'){await (await getFileStorage()).resumeMultipartUpload(row.storage_key,row.multipart_id).abort();}
 else if(row.state==='complete')throw new UploadError('Completed files cannot be cancelled here.',409);
 await db.prepare("UPDATE media_uploads SET state='cancelled' WHERE id=? AND state='pending'").bind(row.id).run();
 return NextResponse.json({success:true});
 }catch(e){return failure(e);}}
