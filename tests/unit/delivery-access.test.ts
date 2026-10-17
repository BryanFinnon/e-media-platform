import {it,expect,vi,beforeEach} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/server/video-processing',()=>({videoPlayerURL:vi.fn()}));
const mocks=vi.hoisted(()=>({identity:null as {email:string;fullName:null}|null,row:null as Record<string,unknown>|null,admin:false,storage:vi.fn(),get:vi.fn()}));
vi.mock('@/lib/server/sites',()=>({getCurrentIdentity:async()=>mocks.identity,getDatabase:async()=>({prepare:()=>({bind:()=>({first:async()=>mocks.row})})}),getFileStorage:mocks.storage,isAdministrator:async()=>mocks.admin}));
import {GET} from '@/app/api/deliverables/[id]/route';
import {videoPlayerURL} from '@/lib/server/video-processing';
const read=(download=true)=>GET(new Request(`https://weareemedia.co.uk/api/deliverables/asset${download?'?download=1':''}`),{params:Promise.resolve({id:'asset'})});
beforeEach(()=>{mocks.identity={email:'owner@example.com',fullName:null};mocks.admin=false;mocks.row={client_email:'owner@example.com',status:'COMPLETED',deposit_paid:1,balance_paid:0,gallery_ready:1,original_key:'original',preview_key:'preview',mime_type:'image/jpeg',preview_mime:'image/jpeg',filename:'a.jpg',original_size:3,preview_size:3};mocks.storage.mockReset();mocks.get.mockReset();mocks.get.mockImplementation(async()=>({body:new ReadableStream({start(c){c.enqueue(new Uint8Array([1,2,3]));c.close();}})}));mocks.storage.mockResolvedValue({get:mocks.get});});
it('rejects anonymous access before reading private storage',async()=>{mocks.identity=null;expect((await read()).status).toBe(401);expect(mocks.storage).not.toHaveBeenCalled();});
it('hides assets from another client even when fully paid',async()=>{mocks.identity={email:'other@example.com',fullName:null};mocks.row!.balance_paid=1;expect((await read()).status).toBe(404);expect(mocks.storage).not.toHaveBeenCalled();});
it('enforces balance on direct original URLs',async()=>{expect((await read()).status).toBe(403);expect(mocks.storage).not.toHaveBeenCalled();});
it('serves only previews before final payment',async()=>{const r=await read(false);expect(r.status).toBe(200);expect(r.headers.get('content-disposition')).toBe('inline');expect(r.headers.get('cache-control')).toContain('no-store');expect(mocks.get).toHaveBeenCalledWith('preview');});
it('releases originals only after verified payment',async()=>{mocks.row!.balance_paid=1;const r=await read();expect(r.status).toBe(200);expect(r.headers.get('content-disposition')).toContain('attachment');});
it('blocks unpublished and cancelled galleries',async()=>{mocks.row!.gallery_ready=0;expect((await read(false)).status).toBe(403);mocks.row!.gallery_ready=1;mocks.row!.status='CANCELLED';expect((await read(false)).status).toBe(403);});

it('shows a clean original inline only after the balance is verified',async()=>{mocks.row!.balance_paid=1;const r=await read(false);expect(r.status).toBe(200);expect(r.headers.get('content-disposition')).toBe('inline');expect(mocks.get).toHaveBeenCalledWith('original');});

it('checks ownership before issuing signed video-preview access',async()=>{mocks.identity={email:'other@example.com',fullName:null};mocks.row!.preview_key='stream/'+'a'.repeat(32);expect((await read(false)).status).toBe(404);expect(videoPlayerURL).not.toHaveBeenCalled();});
it('serves a signed protected video preview without exposing or reading the original',async()=>{mocks.row!.preview_key='stream/'+'a'.repeat(32);mocks.row!.stream_host='customer-abc.cloudflarestream.com';vi.mocked(videoPlayerURL).mockResolvedValue('https://customer-abc.cloudflarestream.com/signed/iframe');const r=await read(false);expect(r.status).toBe(302);expect(r.headers.get('cache-control')).toBe('private, no-store');expect(mocks.storage).not.toHaveBeenCalled();});
