import {getDatabase} from '@/lib/server/sites';
import {tokenHash} from '@/lib/server/client-auth';
import {serveFile} from '@/lib/server/serve-file';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const token=new URL(req.url).searchParams.get('token');if(!token||!/^[a-f0-9]{64}$/.test(token))return new Response(null,{status:404});
 const row=await (await getDatabase()).prepare("SELECT storage_key,mime_type,size_bytes FROM media_uploads WHERE id=? AND source_token_hash=? AND source_expires_at>? AND state='complete' AND purpose='original'").bind((await params).id,await tokenHash(token),new Date().toISOString()).first<{storage_key:string;mime_type:string;size_bytes:number}>();
 if(!row)return new Response(null,{status:404});
 const res=await serveFile(req,row.storage_key,row.mime_type,row.size_bytes);res.headers.set('referrer-policy','no-referrer');return res;
}
