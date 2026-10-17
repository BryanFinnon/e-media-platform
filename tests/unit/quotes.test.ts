import {describe,it,expect} from '../../tooling/node_modules/vitest/dist/index.js';
import {rates,buildQuote,fromPrice,paymentDue,canDownload} from '@/lib/domain/quotes';
describe('price-guide quotes',()=>{
 const portrait=rates.find(r=>r.name==='Outdoor portrait')!;
 const base={rateId:portrait.id,quantity:1,durationMinutes:60,extras:[],priority:false,notes:''};
 it('calculates half deposit and reconciled balance in pennies',()=>{const q=buildQuote(base);expect(q.totalMinor).toBe(10000);expect(q.depositMinor).toBe(5000);expect(q.balanceMinor).toBe(5000);});
 it('uses per-image minimums rather than a misleading single-image starting price',()=>{const r=rates.find(r=>r.name==='Product packshot')!;expect(()=>buildQuote({...base,rateId:r.id,quantity:1})).toThrow('Minimum');expect(buildQuote({...base,rateId:r.id,quantity:10}).totalMinor).toBe(75000);expect(fromPrice('photography')).toBe('From £100.00');});
 it.each([[120,20000],[180,30000],[90,15000]])('prices %i minutes from the duration without extra-hours charges',(durationMinutes,total)=>{const q=buildQuote({...base,durationMinutes});expect(q.totalMinor).toBe(total);expect(q.depositMinor).toBe(total/2);});
 it('does not multiply the hours twice when quantity was already set to three',()=>{expect(buildQuote({...base,quantity:3,durationMinutes:180}).totalMinor).toBe(30000);});
 it('scales multi-hour packages proportionally',()=>{const r=rates.find(r=>r.name==='Event photography / 2h')!;expect(buildQuote({...base,rateId:r.id,durationMinutes:180}).totalMinor).toBe(45000);});
 it('keeps the minimum package price for shorter sessions',()=>{expect(buildQuote({...base,durationMinutes:30}).totalMinor).toBe(10000);});
 it('itemises extras and priority charge without guessing hourly rates',()=>{const q=buildQuote({...base,extras:[{label:'Additional hour',amountMinor:5000}],priority:true});expect(q.totalMinor).toBe(19500);expect(q.lines.at(-1)?.amountMinor).toBe(4500);});
 it('requires a real custom price',()=>{const r=rates.find(r=>r.amountMinor===null)!;expect(()=>buildQuote({...base,rateId:r.id})).toThrow('custom');});
});
describe('payment and delivery gates',()=>{
 it('blocks premature balance and all unpaid downloads',()=>{const q={depositMinor:5000,balanceMinor:5000,depositPaid:false,balancePaid:false,galleryReady:true};expect(paymentDue(q,'balance')).toBe(0);expect(canDownload(q)).toBe(false);expect(paymentDue({...q,depositPaid:true},'balance')).toBe(5000);expect(paymentDue({...q,depositPaid:true},'deposit')).toBe(0);expect(canDownload({...q,depositPaid:true,balancePaid:true})).toBe(true);expect(canDownload({...q,depositPaid:true,balancePaid:true,galleryReady:false})).toBe(false);});
});

 describe('duration pricing across service categories',()=>{
  it.each([['Filming only / 2h',360,60000],['Audio podcast / on location',240,100000],['Single-camera livestream',240,300000],['Photo + video event / 4h',480,300000]])('scales %s from its published duration',(name,durationMinutes,total)=>{const rate=rates.find(r=>r.name===name)!;const q=buildQuote({rateId:rate.id,quantity:1,durationMinutes,extras:[],priority:false,notes:''});expect(q.totalMinor).toBe(total);});
  it('uses quantity for a fixed-price design service',()=>{const rate=rates.find(r=>r.name==='Logo design')!;const q=buildQuote({rateId:rate.id,quantity:2,durationMinutes:180,extras:[],priority:false,notes:''});expect(q.totalMinor).toBe(120000);});
 });
