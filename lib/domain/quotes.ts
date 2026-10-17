import ratesJson from './rate-card.json';
import { calculatePricing, formatMoney } from './pricing';
export type Rate = { id: string; serviceSlug: string; category: string; name: string; amountMinor: number | null; unit: string; minimumQuantity: number; includedMinutes: number | null; scope: string; delivery: string; note: string; requiresReview: boolean };
export const rates: Rate[] = ratesJson;
export const ratesFor = (slug: string) => rates.filter(r => r.serviceSlug === slug);
export const isTimedRate = (rate: Rate) => rate.unit === 'package' && !!rate.includedMinutes;
export function billableQuantity(rate: Rate, quantity: number, durationMinutes: number) {
 return isTimedRate(rate) ? Math.max(rate.minimumQuantity, durationMinutes / rate.includedMinutes!) : quantity;
}
export function fromPrice(slug: string) {
 const values = ratesFor(slug).filter(r => r.amountMinor !== null);
 if (!values.length) return 'Custom quote';
 const rate = values.reduce((a,b) => (a.amountMinor ?? Infinity) * a.minimumQuantity < (b.amountMinor ?? Infinity) * b.minimumQuantity ? a : b);
 return `From ${formatMoney((rate.amountMinor ?? 0) * rate.minimumQuantity)}${rate.unit === 'month' ? '/month' : ''}`;
}
export type QuoteLine = { label: string; quantity: number; unitMinor: number; amountMinor: number };
export function buildQuote(input: { rateId: string; quantity: number; durationMinutes: number; customMinor?: number; extras: { label: string; amountMinor: number }[]; priority: boolean; notes: string }) {
 const rate = rates.find(r => r.id === input.rateId);
 if (!rate) throw new Error('Select a rate from the price guide.');
 if (!Number.isInteger(input.quantity) || input.quantity < rate.minimumQuantity || input.quantity > 10000) throw new Error(`Minimum quantity: ${rate.minimumQuantity}.`);
 if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 30 || input.durationMinutes > 1440) throw new Error('Choose a duration between 30 minutes and 24 hours.');
 const unitMinor = rate.amountMinor ?? input.customMinor;
 if (!unitMinor || !Number.isSafeInteger(unitMinor) || unitMinor < 0) throw new Error('Set the custom production price.');
 const quantity = billableQuantity(rate, input.quantity, input.durationMinutes);
 const label = isTimedRate(rate) ? `${rate.name} (${rate.includedMinutes! / 60}h rate)` : `${rate.name} (${rate.unit})`;
 const lines: QuoteLine[] = [{label, quantity, unitMinor, amountMinor: Math.round(unitMinor * quantity)}];
 for (const extra of input.extras) {
  if (!extra.label.trim() || !Number.isSafeInteger(extra.amountMinor) || extra.amountMinor <= 0) throw new Error('Additional costs need a description and a positive amount.');
  lines.push({ label: extra.label, quantity: 1, unitMinor: extra.amountMinor, amountMinor: extra.amountMinor });
 }
 if (input.priority) { const amount = Math.round(lines.reduce((s,l)=>s+l.amountMinor,0)*0.3); lines.push({label:'Priority delivery (+30%)',quantity:1,unitMinor:amount,amountMinor:amount}); }
 const pricing = calculatePricing({packageAmountMinor:lines.reduce((s,l)=>s+l.amountMinor,0), addonAmountsMinor:[],depositRule:{type:'PERCENTAGE',percentage:50}});
 return {...pricing, lines, scope:rate.scope, delivery:rate.delivery, notes:input.notes, rateId:rate.id, rateSource:'E-MEDIA price guide supplied 14 October 2026',durationMinutes:input.durationMinutes};
}
export function paymentDue(q: {depositMinor:number;balanceMinor:number;depositPaid:boolean;balancePaid:boolean;galleryReady:boolean}, stage: 'deposit'|'balance') {
 if(stage==='deposit') return !q.depositPaid ? q.depositMinor : 0;
 return q.depositPaid && q.galleryReady && !q.balancePaid ? q.balanceMinor : 0;
}
export function canDownload(q: {depositPaid:boolean;balancePaid:boolean;galleryReady:boolean}) {return q.depositPaid && q.balancePaid && q.galleryReady;}
