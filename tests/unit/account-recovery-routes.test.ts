import {beforeEach,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const m=vi.hoisted(()=>({limit:vi.fn(),request:vi.fn(),reset:vi.fn(),wait:vi.fn(),first:vi.fn()}));
vi.mock('@opennextjs/cloudflare',()=>({getCloudflareContext:async()=>({ctx:{waitUntil:m.wait}})}));
vi.mock('@/lib/server/sites',()=>({checkDatabaseRateLimit:m.limit,getDatabase:async()=>({prepare:()=>({bind:()=>({first:m.first})})})}));
vi.mock('@/lib/server/account-recovery',()=>({recoveryOrigin:()=> 'https://weareemedia.co.uk',requestPasswordReset:m.request,resetAccountPassword:m.reset,notifyPasswordChanged:vi.fn()}));
vi.mock('@/lib/server/client-auth',()=>({tokenHash:async()=> 'digest',SESSION_COOKIE:'__Host-emedia_session'}));
import {POST as requestReset} from '@/app/api/account-recovery/request/route';
import {POST as reset} from '@/app/api/account-recovery/reset/route';
function req(body:unknown,origin='https://weareemedia.co.uk'){return new Request('https://weareemedia.co.uk/api/account-recovery/request',{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.1'},body:JSON.stringify(body)});}
beforeEach(()=>{vi.clearAllMocks();m.limit.mockResolvedValue({success:true});m.request.mockResolvedValue(undefined);m.reset.mockResolvedValue(true);m.first.mockResolvedValue(null);});
it('returns identical no-store responses for known and unknown accounts and queues lookup asynchronously',async()=>{const first=await requestReset(req({email:'known@example.com'})),second=await requestReset(req({email:'unknown@example.com'}));expect(first.status).toBe(200);expect(await first.json()).toEqual(await second.json());expect(first.headers.get('cache-control')).toBe('no-store');expect(m.wait).toHaveBeenCalledTimes(2);});
it('does not disclose per-email throttling',async()=>{m.limit.mockResolvedValueOnce({success:true}).mockResolvedValueOnce({success:false});const r=await requestReset(req({email:'known@example.com'}));expect(r.status).toBe(200);expect(m.request).not.toHaveBeenCalled();});
it('limits abusive IP requests before any account lookup',async()=>{m.limit.mockResolvedValue({success:false});expect((await requestReset(req({email:'known@example.com'}))).status).toBe(429);expect(m.request).not.toHaveBeenCalled();});
it('rejects cross-origin recovery and password-change requests',async()=>{expect((await requestReset(req({email:'known@example.com'},'https://other.example'))).status).toBe(403);expect((await reset(req({},'https://other.example'))).status).toBe(403);expect(m.request).not.toHaveBeenCalled();expect(m.reset).not.toHaveBeenCalled();});
it('rejects malformed email addresses without queuing a message',async()=>{expect((await requestReset(req({email:'not-an-email'}))).status).toBe(400);expect(m.request).not.toHaveBeenCalled();});
it('requires a strong matching password before accessing the reset service',async()=>{expect((await reset(req({token:'a'.repeat(64),password:'short',confirmPassword:'short'}))).status).toBe(400);expect(m.reset).not.toHaveBeenCalled();});
it('reports expired or used links without signing the user in',async()=>{m.reset.mockResolvedValue(false);const r=await reset(req({token:'a'.repeat(64),password:'long-password-123',confirmPassword:'long-password-123'}));expect(r.status).toBe(400);expect(r.headers.get('set-cookie')).toBeNull();});
it('clears the existing cookie after reset and requires a new login',async()=>{const r=await reset(req({token:'a'.repeat(64),password:'long-password-123',confirmPassword:'long-password-123'}));expect(r.status).toBe(200);expect(r.headers.get('set-cookie')).toContain('Max-Age=0');expect(r.headers.get('set-cookie')).toContain('HttpOnly');expect(r.headers.get('cache-control')).toBe('no-store');});
