import {z} from 'zod';
export const loginSchema=z.object({email:z.email().max(254).transform(v=>v.trim().toLowerCase()),password:z.string().min(1).max(128)});
export const signupSchema=loginSchema.extend({fullName:z.string().trim().min(2).max(120),phone:z.string().trim().min(7).max(30).regex(/^[+\d\s().-]+$/),address:z.string().trim().min(5).max(500),password:z.string().min(12).max(128),consent:z.literal(true)});
export function safeAccountReturn(value:unknown){return typeof value==='string'&&value.startsWith('/')&&!value.startsWith('//')&&!/[\\\r\n]/.test(value)?value:'/account';}
export function ownsClientProject(identity:{email:string;accountId?:string},project:{client_email:string;client_account_id?:string|null}){return identity.accountId?project.client_account_id===identity.accountId:!project.client_account_id&&project.client_email.toLowerCase()===identity.email;}
