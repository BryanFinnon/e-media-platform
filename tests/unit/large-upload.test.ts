import {beforeEach,afterEach,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/server/sites',()=>({createId:(p:string)=>`${p}_${crypto.randomUUID()}`}));
import {createUpload,findUpload,putPart,completeUpload,uploadStatus,} from '@/lib/server/large-upload';
import {PART_BYTES,MAX_FILE_BYTES,parseRange,uploadSchema,partSize,uploadHeaderType} from '@/lib/domain/large-upload';
import {uploadDatabase} from '../helpers/upload-database';
import type {R2Bucket} from '@/lib/server/sites';
let fixture:ReturnType<typeof uploadDatabase>,bucket:R2Bucket,parts:Map<number,Uint8Array>,object:Uint8Array|null;
let complete:ReturnType<typeof vi.fn>,put:ReturnType<typeof vi.fn>;
const actor='admin@example.com';
const mp4=(size=32)=>{const bytes=new Uint8Array(size);bytes.set([0,0,0,24,102,116,121,112],0);return bytes;};
beforeEach(()=>{
 fixture=uploadDatabase();parts=new Map();object=null;
 put=vi.fn(async(number:number,bytes:ArrayBuffer)=>{parts.set(number,new Uint8Array(bytes));return {partNumber:number,etag:`etag-${number}`};});
 complete=vi.fn(async()=>{const data=[...parts.entries()].sort((a,b)=>a[0]-b[0]).map(p=>p[1]);object=new Uint8Array(data.reduce((n,p)=>n+p.length,0));let start=0;for(const p of data){object.set(p,start);start+=p.length;}return {size:object.length};});
 const upload={uploadId:'r2-upload',uploadPart:put,complete,abort:vi.fn()};
 bucket={createMultipartUpload:async()=>upload,resumeMultipartUpload:()=>upload,head:async()=>object?{size:object.length}:null,get:async(_key,options)=>{if(!object)return null;const bytes=options?object.slice(options.range.offset,options.range.offset+options.range.length):object;return {size:object.length,body:new Blob([bytes]).stream()};},put:vi.fn(),delete:vi.fn()};
});
afterEach(()=>fixture.sqlite.close());
async function start(size=32){const u=await createUpload(fixture.db,bucket,actor,{purpose:'public',filename:'sample.mp4',mimeType:'video/mp4',size});return (await findUpload(fixture.db,u.id,actor))!;}
it('creates a private multipart session owned by its administrator',async()=>{const row=await start();expect(row.state).toBe('pending');expect(row.storage_key).toMatch(/^uploads\//);expect(await findUpload(fixture.db,row.id,'other@example.com')).toBeNull();});
it('resumes persisted chunks and completes an upload only once',async()=>{const row=await start();await putPart(fixture.db,bucket,row,1,mp4().buffer);expect((await uploadStatus(fixture.db,row)).parts).toEqual([1]);await completeUpload(fixture.db,bucket,row);const finished=(await findUpload(fixture.db,row.id,actor))!;await completeUpload(fixture.db,bucket,finished);expect(complete).toHaveBeenCalledTimes(1);expect(finished.state).toBe('complete');});
it('retries the same chunk without rewriting and rejects changed chunk bytes',async()=>{const row=await start();await putPart(fixture.db,bucket,row,1,mp4().buffer);await putPart(fixture.db,bucket,row,1,mp4().buffer);expect(put).toHaveBeenCalledTimes(1);const changed=mp4();changed[20]=1;await expect(putPart(fixture.db,bucket,row,1,changed.buffer)).rejects.toThrow('differs');});
it('rejects wrong-size and out-of-range chunks before storage writes',async()=>{const row=await start();await expect(putPart(fixture.db,bucket,row,1,mp4(31).buffer)).rejects.toThrow('size');await expect(putPart(fixture.db,bucket,row,2,mp4().buffer)).rejects.toThrow('number');expect(put).not.toHaveBeenCalled();});
it('rejects a forged MIME type',async()=>{const row=await start();await expect(putPart(fixture.db,bucket,row,1,new Uint8Array(32).buffer)).rejects.toThrow('media type');expect(put).not.toHaveBeenCalled();});
it('does not publish incomplete or expired uploads',async()=>{const row=await start();await expect(completeUpload(fixture.db,bucket,row)).rejects.toThrow('missing');await expect(putPart(fixture.db,bucket,{...row,expires_at:'2000'},1,mp4().buffer)).rejects.toThrow('expired');expect(complete).not.toHaveBeenCalled();});
it('validates a stored file before marking it complete',async()=>{const row=await start();await putPart(fixture.db,bucket,row,1,mp4().buffer);object=new Uint8Array(32);await expect(completeUpload(fixture.db,bucket,row)).rejects.toThrow('media validation');expect((await findUpload(fixture.db,row.id,actor))!.state).toBe('pending');});
it('accepts multi-gigabyte files but rejects files above the configured ceiling',()=>{expect(uploadSchema.safeParse({purpose:'public',filename:'film.mp4',mimeType:'video/mp4',size:10*1024**3}).success).toBe(true);expect(uploadSchema.safeParse({purpose:'public',filename:'film.mp4',mimeType:'video/mp4',size:MAX_FILE_BYTES+1}).success).toBe(false);expect(partSize(PART_BYTES+10,2)).toBe(10);});
it('recognises a large JPEG header without requiring its trailer in the first chunk',()=>{expect(uploadHeaderType(new Uint8Array([255,216,255,0,0]),100_000_000)).toBe('image/jpeg');});
it('binds private upload sessions to a booking',()=>{expect(uploadSchema.safeParse({purpose:'original',filename:'film.mp4',mimeType:'video/mp4',size:32}).success).toBe(false);});
it('supports browser seeking, suffix ranges, and rejects invalid or multiple ranges',()=>{expect(parseRange('bytes=10-19',100)).toEqual({offset:10,length:10});expect(parseRange('bytes=-20',100)).toEqual({offset:80,length:20});expect(parseRange('bytes=90-',100)).toEqual({offset:90,length:10});for(const r of ['bytes=101-','bytes=20-10','bytes=0-1,3-4','bytes=-0'])expect(parseRange(r,100)).toBe('invalid');});

it('assembles a file larger than the old 25 MB limit from independently verified chunks',async()=>{const total=PART_BYTES*2+32,row=await start(total);await putPart(fixture.db,bucket,row,1,mp4(PART_BYTES).buffer);await putPart(fixture.db,bucket,row,2,new Uint8Array(PART_BYTES).buffer);await expect(completeUpload(fixture.db,bucket,row)).rejects.toThrow('missing');await putPart(fixture.db,bucket,row,3,new Uint8Array(32).buffer);await completeUpload(fixture.db,bucket,row);expect(object?.length).toBe(total);expect((await findUpload(fixture.db,row.id,actor))!.state).toBe('complete');});
