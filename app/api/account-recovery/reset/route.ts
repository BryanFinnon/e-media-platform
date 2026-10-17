import {NextResponse} from 'next/server';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {getDatabase,checkDatabaseRateLimit} from '@/lib/server/sites';
import {resetAccountPassword,notifyPasswordChanged} from '@/lib/server/account-recovery';
import {tokenHash,SESSION_COOKIE} from '@/lib/server/client-auth';
import {recoveryResetSchema} from '@/lib/domain/account-recovery';
const headers={'cache-control':'no-store','referrer-policy':'no-referrer'};
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 const data=recoveryResetSchema.safeParse(await request.json().catch(()=>null));
 if(!data.success)return NextResponse.json({error:'Use at least 12 characters and enter the same password twice. Open the reset link from your email.'},{status:400,headers});
 try{
  const db=await getDatabase(),ip=request.headers.get('cf-connecting-ip')??'unknown';
  if(!(await checkDatabaseRateLimit(db,`reset-ip:${ip}`,20,900)).success)return NextResponse.json({error:'Too many attempts. Please try again in 15 minutes.'},{status:429,headers});
  if(!await resetAccountPassword(db,data.data.token,data.data.password))return NextResponse.json({error:'This reset link has expired or has already been used. Request a new link.'},{status:400,headers});
  // Email delivery must never undo a completed password change.
  try{
   const owner=await db.prepare('SELECT a.email FROM client_accounts a JOIN password_reset_tokens t ON t.account_id=a.id WHERE t.token_hash=?').bind(await tokenHash(data.data.token)).first<{email:string}>();
   if(owner){const {ctx}=await getCloudflareContext({async:true});ctx.waitUntil(notifyPasswordChanged(owner.email).catch(()=>{console.error('Password change notification failed');}));}
  }catch{console.error('Password change notification could not be queued');}
  const response=NextResponse.json({message:'Your password has been changed. Sign in with your new password.'},{headers});
  response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0});
  return response;
 }catch{return NextResponse.json({error:'Unable to reset your password right now. Please try again.'},{status:503,headers});}
}
