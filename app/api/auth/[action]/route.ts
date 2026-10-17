import {authenticateConfiguredAdmin} from '@/lib/server/admin-auth';
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {loginSchema,signupSchema,safeAccountReturn} from '@/lib/domain/client-auth';
import {getDatabase,checkDatabaseRateLimit,createId} from '@/lib/server/sites';
import {SESSION_COOKIE,SESSION_SECONDS,randomToken,tokenHash,passwordHash,equalHashes} from '@/lib/server/client-auth';
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
 const origin=new URL(request.url).origin;if(request.headers.get('origin')!==origin)return NextResponse.json({error:'Invalid origin'},{status:403});
 const {action}=await params;if(!['signup','login','logout'].includes(action))return NextResponse.json({error:'Not found'},{status:404});
 try{
 const db=await getDatabase();
 if(action==='logout'){const token=(await cookies()).get(SESSION_COOKIE)?.value;if(token)await db.prepare('DELETE FROM client_sessions WHERE token_hash=?').bind(await tokenHash(token)).run();const response=NextResponse.redirect(new URL('/',origin),303);response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0});return response;}
 const ip=request.headers.get('cf-connecting-ip')??request.headers.get('x-forwarded-for')?.split(',')[0]??'unknown';
 if(!(await checkDatabaseRateLimit(db,`auth-ip:${ip}`,20,900)).success)return NextResponse.json({error:'Too many attempts. Please try again in 15 minutes.'},{status:429});
 const body=await request.json().catch(()=>null);const parsed=(action==='signup'?signupSchema:loginSchema).safeParse(body);if(!parsed.success)return NextResponse.json({error:action==='signup'?'Check your details. Use a password of at least 12 characters and accept the privacy notice.':'Enter a valid email and password.'},{status:400});
 const {email,password}=parsed.data;if(!(await checkDatabaseRateLimit(db,`auth-email:${email}`,10,900)).success)return NextResponse.json({error:'Too many attempts. Please try again in 15 minutes.'},{status:429});
 let accountId:string;
 if(action==='signup'){
 const data=signupSchema.parse(body);const existing=await db.prepare('SELECT id FROM client_accounts WHERE email=?').bind(email).first();if(existing)return NextResponse.json({error:'Unable to create this account. If you already registered, please log in.'},{status:409});
 accountId=createId('client');const salt=randomToken(),hash=await passwordHash(password,salt),now=new Date().toISOString();
 await db.prepare('INSERT INTO client_accounts(id,email,full_name,phone,address,password_hash,password_salt,consent_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(accountId,email,data.fullName,data.phone,data.address,hash,salt,now,now).run();
 }else{
 const administrator=await authenticateConfiguredAdmin(db,email,password);
 if(administrator.reserved&&!administrator.accountId)return NextResponse.json({error:'Email or password is incorrect.'},{status:401});
 if(administrator.accountId){accountId=administrator.accountId;}else{
 const row=await db.prepare('SELECT id,password_hash,password_salt FROM client_accounts WHERE email=?').bind(email).first<{id:string;password_hash:string;password_salt:string}>();const hash=await passwordHash(password,row?.password_salt??'emedia-invalid-account-dummy-salt');if(!row||!equalHashes(hash,row.password_hash))return NextResponse.json({error:'Email or password is incorrect.'},{status:401});accountId=row.id;
 }}
 // A reset racing with sign-in must not create a session for the old password.
 const credentialState=await db.prepare('SELECT password_hash,password_salt FROM client_accounts WHERE id=?').bind(accountId).first<{password_hash:string;password_salt:string}>();
 if(!credentialState||!equalHashes(await passwordHash(password,credentialState.password_salt),credentialState.password_hash))return NextResponse.json({error:'Email or password is incorrect.'},{status:401});
 const token=randomToken(),now=new Date();const saved=await db.prepare('INSERT INTO client_sessions(token_hash,account_id,expires_at,created_at) SELECT ?,id,?,? FROM client_accounts WHERE id=? AND password_hash=?').bind(await tokenHash(token),new Date(now.getTime()+SESSION_SECONDS*1000).toISOString(),now.toISOString(),accountId,credentialState.password_hash).run();
 if(saved.meta?.changes!==1)return NextResponse.json({error:'Your account changed during sign-in. Please try again.'},{status:401});
 const returnTo=safeAccountReturn(body?.returnTo);const response=NextResponse.json({returnTo});response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:SESSION_SECONDS});return response;
 }catch{return NextResponse.json({error:'Account service is temporarily unavailable. Please try again.'},{status:503});}
}
