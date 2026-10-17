import {NextResponse} from 'next/server';
import {uploadSchema} from '@/lib/domain/large-upload';
import {getDatabase,getFileStorage,requireAdministrator,checkDatabaseRateLimit} from '@/lib/server/sites';
import {project} from '@/lib/server/projects';
import {createUpload} from '@/lib/server/large-upload';
export async function POST(req:Request){
 const a=await requireAdministrator(req);if(a.status!==200||!a.identity)return NextResponse.json({error:'Staff access required'},{status:a.status});
 if(req.headers.get('origin')!==new URL(req.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403});
 const input=uploadSchema.safeParse(await req.json().catch(()=>null));if(!input.success)return NextResponse.json({error:'Use a supported image or MP4/WebM video up to 100 GiB.'},{status:400});
 const db=await getDatabase();
 if(!(await checkDatabaseRateLimit(db,`uploads:${a.identity.email}`,150,3600)).success)return NextResponse.json({error:'Upload creation limit reached. Resume existing uploads or retry later.'},{status:429});
 if(input.data.bookingId){const p=await project(db,input.data.bookingId);if(!p?.deposit_paid||p.status==='CANCELLED')return NextResponse.json({error:'A paid deposit and active booking are required.'},{status:409});}
 return NextResponse.json(await createUpload(db,await getFileStorage(),a.identity.email,input.data),{headers:{'cache-control':'no-store'}});
}
