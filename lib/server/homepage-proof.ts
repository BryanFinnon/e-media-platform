import 'server-only';
import {getDatabase} from './sites';
export type Brand={id:string;name:string;relationship:string;logo_media_id:string|null;published:number};
export type Review={id:string;name:string;company:string;quote:string;stars:number;published:number};
export async function homepageProof(){
 try{const db=await getDatabase();const [b,r]=await Promise.all([db.prepare('SELECT id,name,relationship,logo_media_id,published FROM homepage_brands WHERE published=1 AND permission=1 ORDER BY created_at LIMIT 30').all<Brand>(),db.prepare('SELECT id,name,company,quote,stars,published FROM homepage_reviews WHERE published=1 AND permission=1 ORDER BY created_at DESC LIMIT 12').all<Review>()]);return {brands:b.results??[],reviews:r.results??[]};}catch{return {brands:[],reviews:[]};}
}
