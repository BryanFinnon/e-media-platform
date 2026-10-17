import {NextResponse} from 'next/server';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {getDatabase,checkDatabaseRateLimit} from '@/lib/server/sites';
import {requestPasswordReset,recoveryOrigin} from '@/lib/server/account-recovery';
import {RECOVERY_MESSAGE,recoveryRequestSchema} from '@/lib/domain/account-recovery';
const headers={'cache-control':'no-store','referrer-policy':'no-referrer'};
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 const data=recoveryRequestSchema.safeParse(await request.json().catch(()=>null));
 if(!data.success)return NextResponse.json({error:'Enter a valid email address.'},{status:400,headers});
 try{
  recoveryOrigin();
  const db=await getDatabase(),ip=request.headers.get('cf-connecting-ip')??'unknown';
  if(!(await checkDatabaseRateLimit(db,`recovery-ip:${ip}`,10,900)).success)return NextResponse.json({error:'Too many requests. Please try again in 15 minutes.'},{status:429,headers});
  const allowed=await checkDatabaseRateLimit(db,`recovery-email:${data.data.email}`,3,900);
  if(allowed.success){
   const {ctx}=await getCloudflareContext({async:true});
   ctx.waitUntil(requestPasswordReset(db,data.data.email).catch(()=>{console.error('Password recovery background task failed');}));
  }
  return NextResponse.json({message:RECOVERY_MESSAGE},{headers});
 }catch{return NextResponse.json({error:'Account recovery is temporarily unavailable. Please try again shortly.'},{status:503,headers});}
}
