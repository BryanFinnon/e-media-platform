import 'server-only';
import {getAdminLoginCredential,type D1Database,createId} from './sites';
import {passwordHash,equalHashes} from './client-auth';
/** Only a server-configured credential may grant the admin role. */
export async function authenticateConfiguredAdmin(database:D1Database,email:string,password:string):Promise<{reserved:boolean;accountId:string|null}>{
 const credential=await getAdminLoginCredential();
 if(!credential||credential.email!==email)return {reserved:false,accountId:null};
 const existing=await database.prepare('SELECT id,password_hash,password_salt,role FROM client_accounts WHERE email=?').bind(email).first<{id:string;password_hash:string;password_salt:string;role:string}>();
 // Once bootstrapped, the local credential is authoritative, including after recovery.
 if(existing?.role==='admin'){
  const localHash=await passwordHash(password,existing.password_salt);
  return {reserved:true,accountId:equalHashes(localHash,existing.password_hash)?existing.id:null};
 }
 const hash=await passwordHash(password,credential.salt);
 if(!equalHashes(hash,credential.hash))return {reserved:true,accountId:null};
 const accountId=existing?.id??createId('admin'),now=new Date().toISOString();
 if(!existing){await database.prepare("INSERT INTO client_accounts(id,email,full_name,phone,address,password_hash,password_salt,consent_at,created_at,role) VALUES(?,?,'E-MEDIA Administrator','','',?,?,?,?,'admin')").bind(accountId,email,hash,credential.salt,now,now).run();}
 else if(existing.role!=='admin'||existing.password_hash!==hash){await database.batch([
 database.prepare("UPDATE client_accounts SET password_hash=?,password_salt=?,role='admin' WHERE id=?").bind(hash,credential.salt,accountId),
 database.prepare('DELETE FROM client_sessions WHERE account_id=?').bind(accountId),
 ]);}
 return {reserved:true,accountId};
}
