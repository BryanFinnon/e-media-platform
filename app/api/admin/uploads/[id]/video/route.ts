import {NextResponse} from 'next/server';
import {requireAdministrator,getDatabase} from '@/lib/server/sites';
import {findUpload,UploadError} from '@/lib/server/large-upload';
import {prepareVideo} from '@/lib/server/video-processing';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const a=await requireAdministrator(req);if(a.status!==200||!a.identity)return NextResponse.json({error:'Staff access required'},{status:a.status});
 if(req.headers.get('origin')!==new URL(req.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403});
 try{const db=await getDatabase(),row=await findUpload(db,(await params).id,a.identity.email);if(!row)return NextResponse.json({error:'Upload not found'},{status:404});return NextResponse.json(await prepareVideo(db,row),{headers:{'cache-control':'no-store'}});}catch(e){return NextResponse.json({error:e instanceof UploadError?e.message:'Video preparation failed. The original is retained.'},{status:e instanceof UploadError?e.status:503});}
}
