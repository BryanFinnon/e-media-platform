import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import type {D1Database,D1Statement} from '@/lib/server/sites';
export function uploadDatabase(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
 for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())sqlite.exec(readFileSync(`drizzle/${name}`,'utf8'));
 type Statement=D1Statement&{execute:()=>{success:boolean;meta:{changes:number}}};
 const db={prepare:(sql:string)=>{let values:unknown[]=[];const statement={bind:(...args:unknown[])=>{values=args;return statement;},first:async()=>sqlite.prepare(sql).get(...values as (string|number|null)[])??null,all:async()=>({success:true,results:sqlite.prepare(sql).all(...values as (string|number|null)[])}),execute:()=>({success:true,meta:{changes:Number(sqlite.prepare(sql).run(...values as (string|number|null)[]).changes)}}),run:async()=>statement.execute()} as Statement;return statement;},batch:async(statements:D1Statement[])=>{sqlite.exec('BEGIN');try{const result=statements.map(s=>(s as Statement).execute());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}} as D1Database;
 return {db,sqlite};
}
