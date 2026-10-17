import 'server-only';
import {env} from '@/lib/env';
import {RESET_LIFETIME_MS} from '@/lib/domain/account-recovery';
import {randomToken,tokenHash,passwordHash} from './client-auth';
import {createId,type D1Database} from './sites';
import {sendTransactionalEmail} from './email';

export function recoveryOrigin(){
 const origin=new URL(env.ACCOUNT_RECOVERY_ORIGIN||env.NEXT_PUBLIC_SITE_URL||'');
 if(origin.protocol!=='https:')throw new Error('Account recovery requires a configured HTTPS origin.');
 return origin.origin;
}

/** Called in a background task so email lookup and provider timing cannot enumerate accounts. */
export async function requestPasswordReset(db:D1Database,email:string){
 const account=await db.prepare('SELECT id,email,password_hash FROM client_accounts WHERE email=?').bind(email).first<{id:string;email:string;password_hash:string}>();
 if(!account)return;
 const token=randomToken(),digest=await tokenHash(token),created=new Date().toISOString();
 const link=`${recoveryOrigin()}/auth/reset-password#token=${token}`;
 await db.batch([
  db.prepare('DELETE FROM password_reset_tokens WHERE expires_at<=?').bind(created),
  db.prepare('INSERT INTO password_reset_tokens(token_hash,account_id,password_hash_at_issue,created_at,expires_at) VALUES(?,?,?,?,?)').bind(digest,account.id,account.password_hash,created,new Date(Date.now()+RESET_LIFETIME_MS).toISOString()),
 ]);
 const result=await sendTransactionalEmail({to:account.email,kind:'ACCOUNT_SUPPORT',subject:'Reset your E-MEDIA password',preview:'Your password reset link expires in 30 minutes.',heading:'Choose a new password.',paragraphs:['We received a request to reset your E-MEDIA password. Use the button below within 30 minutes. This link can only be used once.','If you did not request this, you can ignore this email. Your password has not changed.'],action:{label:'Reset my password',href:link},idempotencyKey:`password-reset-${digest}`});
 if(result.status!=='sent'){
  await db.prepare('DELETE FROM password_reset_tokens WHERE token_hash=?').bind(digest).run();
  console.error('Password reset email not accepted',{reason:result.reason});
 }
}

export async function resetAccountPassword(db:D1Database,token:string,password:string):Promise<boolean>{
 const digest=await tokenHash(token),now=new Date().toISOString();
 const account=await db.prepare(`SELECT a.id,a.email FROM password_reset_tokens t JOIN client_accounts a ON a.id=t.account_id
  WHERE t.token_hash=? AND t.consumed_at IS NULL AND t.expires_at>? AND a.password_hash=t.password_hash_at_issue`).bind(digest,now).first<{id:string;email:string}>();
 if(!account)return false;
 const salt=randomToken(),hash=await passwordHash(password,salt),claim=createId('reset');
 // One transactional claim guards every mutation, including concurrent attempts.
 const results=await db.batch([
  db.prepare(`UPDATE password_reset_tokens SET consumed_at=?,consumption_id=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?
   AND EXISTS(SELECT 1 FROM client_accounts a WHERE a.id=password_reset_tokens.account_id AND a.password_hash=password_reset_tokens.password_hash_at_issue)`).bind(now,claim,digest,now),
  db.prepare(`UPDATE client_accounts SET password_hash=?,password_salt=? WHERE id=(SELECT account_id FROM password_reset_tokens WHERE token_hash=? AND consumption_id=?)`).bind(hash,salt,digest,claim),
  db.prepare('DELETE FROM client_sessions WHERE account_id=(SELECT account_id FROM password_reset_tokens WHERE token_hash=? AND consumption_id=?)').bind(digest,claim),
  db.prepare('DELETE FROM password_reset_tokens WHERE token_hash<>? AND account_id=(SELECT account_id FROM password_reset_tokens WHERE token_hash=? AND consumption_id=?)').bind(digest,digest,claim),
  db.prepare(`INSERT INTO audit_log(id,actor_email,action,entity_type,entity_id,created_at)
   SELECT ?,a.email,'account.password_reset','account',a.id,? FROM client_accounts a JOIN password_reset_tokens t ON t.account_id=a.id WHERE t.token_hash=? AND t.consumption_id=?`).bind(createId('audit'),now,digest,claim),
 ]);
 return results[0]?.meta?.changes===1;
}

export async function notifyPasswordChanged(email:string){
 await sendTransactionalEmail({to:email,kind:'ACCOUNT_SUPPORT',subject:'Your E-MEDIA password has changed',preview:'Your password was reset and existing sessions were signed out.',heading:'Your password has changed.',paragraphs:['Your E-MEDIA password was reset. All previous sessions have been signed out. Your bookings, quotes and files are unchanged.','If you did not make this change, contact E-MEDIA immediately.'],idempotencyKey:`password-changed-${createId('notice')}`});
}
