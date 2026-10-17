import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {AccountRecoveryForm} from '@/components/account-recovery-form';
import {ClientAuthForm} from '@/components/client-auth-form';
import {clientSession} from '@/lib/server/client-auth';
import {isAdministrator} from '@/lib/server/sites';
type Props={params:Promise<{path?:string[]}>;searchParams:Promise<{return_to?:string;message?:string}>};
export const metadata:Metadata={title:'Client account'};
export const dynamic='force-dynamic';
function safeReturnTo(value:string|undefined){return value?.startsWith('/')&&!value.startsWith('//')&&!/[\\\r\n]/.test(value)?value:'/account';}
export default async function AuthPage({params,searchParams}:Props){
 const route=(await params).path?.[0]??'login';if(!['login','signup','forgot-password','reset-password'].includes(route))notFound();
 const query=await searchParams,identity=await clientSession(),returnTo=safeReturnTo(query.return_to),signup=route==='signup';
 if(route==='forgot-password'||route==='reset-password')return <section className="page-shell account-access"><div className="account-intro"><p className="eyebrow">E-MEDIA · Account recovery</p><h1 className="section-heading">Back to<br/>your projects.</h1><p className="detail-copy">Recover access to your account. Your bookings, quotes and galleries stay with you.</p></div><div className="auth-card account-card"><h2>{route==='reset-password'?'Choose a new password.':'Forgot your password?'}</h2><AccountRecoveryForm reset={route==='reset-password'}/></div></section>;
 const destination=query.return_to?returnTo:await isAdministrator(identity)?'/admin':'/account';
 return <section className="page-shell account-access"><div className="account-intro"><p className="eyebrow">E-MEDIA · Client space</p><h1 className="section-heading">{signup?<>Your project.<br/>Your space.</>:<>Welcome<br/>back.</>}</h1><p className="detail-copy">A private place for your project, from your first request to the final delivery.</p><ol className="account-benefits"><li>Request a date and track our availability review.</li><li>Review your personal quote and pay your deposit.</li><li>Preview your gallery and download your files after final payment.</li></ol><Link href="/" className="button button-quiet">← Back to E-MEDIA</Link></div><div className="auth-card account-card"><p className="eyebrow">{identity?'Signed in':signup?'Sign up':'Log in'}</p><h2>{identity?'You’re ready to continue.':signup?'Create your client account.':'Access your client account.'}</h2>{query.message&&<p className="notice">{query.message}</p>}{identity?<div className="stack"><p>Signed in as <strong>{identity.fullName||identity.email}</strong>.</p><Link className="button button-primary" href={destination}>{destination.startsWith('/book')?'Continue to booking':destination==='/admin'?'Open administration':'Open my projects'} →</Link><form action="/api/auth/logout" method="post"><button className="button">Sign out</button></form></div>:<ClientAuthForm signup={signup} returnTo={returnTo}/>}</div></section>;
}
