import {z} from 'zod';
export const RESET_LIFETIME_MS=30*60*1000;
export const RECOVERY_MESSAGE='If an account exists for this email address, we will send a password reset link. Check your inbox and spam folder.';
export const recoveryRequestSchema=z.object({email:z.string().trim().toLowerCase().pipe(z.email().max(254))});
export const recoveryResetSchema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(12).max(128),confirmPassword:z.string().min(12).max(128)}).refine(v=>v.password===v.confirmPassword,{path:['confirmPassword'],message:'Passwords must match.'});
