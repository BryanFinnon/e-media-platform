import 'server-only';
import {cookies} from 'next/headers';
import {getDatabase} from './sites';
export const SESSION_COOKIE='__Host-emedia_session';
export const SESSION_SECONDS=7*24*60*60;
const encode=(value:Uint8Array)=>Array.from(value,b=>b.toString(16).padStart(2,'0')).join('');
export const randomToken=()=>encode(crypto.getRandomValues(new Uint8Array(32)));
export async function tokenHash(value:string){return encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));}
export async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return encode(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256)));}
export function equalHashes(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
export async function clientSession(){const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const row=await (await getDatabase()).prepare('SELECT u.id,u.email,u.full_name,u.phone,u.address FROM client_sessions s JOIN client_accounts u ON u.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?').bind(await tokenHash(token),new Date().toISOString()).first<{id:string;email:string;full_name:string;phone:string;address:string}>();return row?{email:row.email,fullName:row.full_name,accountId:row.id,phone:row.phone,address:row.address}:null;}
