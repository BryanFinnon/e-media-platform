import {it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/env',()=>({env:{STRIPE_SECRET_KEY:'rk_test_transport_only'}}));
import {getStripe} from '@/lib/server/stripe';
it('sends Checkout requests through fetch in the Workers runtime',async()=>{
 const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:'cs_test_transport',object:'checkout.session',status:'open'}),{headers:{'content-type':'application/json'}}));
 vi.stubGlobal('fetch',fetchMock);
 try {
  const session=await getStripe()!.checkout.sessions.retrieve('cs_test_transport');
  expect(session.status).toBe('open');
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(String(fetchMock.mock.calls[0][0])).toContain('/v1/checkout/sessions/cs_test_transport');
 }finally{vi.unstubAllGlobals();}
});
