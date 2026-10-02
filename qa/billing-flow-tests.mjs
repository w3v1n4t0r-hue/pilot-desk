import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
let source=fs.readFileSync('assets/billing.js','utf8');
source=source.replace("const {getPilotDeskClient}=await import('/assets/supabase-client.js');","const getPilotDeskClient=async()=>window.mockClient;");
source=source.replace('})();','window.testBilling={refresh,navigateStripe};})();');
let lookupError=null,assigned='',requests=0,release;
const window={mockClient:{auth:{getSession:async()=>({data:{session:{user:{id:'test-user'},access_token:'test-token'}}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:lookupError?null:{plan:'pro',status:'active'},error:lookupError})})})})}};
const context={window,document:{readyState:'loading',documentElement:{dataset:{}},querySelectorAll:()=>[],dispatchEvent(){},addEventListener(){}},CustomEvent:class{},URL,location:{assign:u=>assigned=u},console,fetch:async()=>{requests++;await new Promise(resolve=>release=resolve);return {ok:true,json:async()=>({url:'https://checkout.stripe.com/c/pay/test-only'})};}};
vm.runInNewContext(source,context); // Inspect availability through the authenticated refresh without using real Stripe.
// Avoid fetching the configuration so the test can focus on subscription and checkout behavior.
const configSource=source.replace('configured:null','configured:true');
delete window.PilotDeskBilling;vm.runInNewContext(configSource,context);
assert.equal((await window.testBilling.refresh()).isPro,true);
lookupError=Error('Test database outage');await assert.rejects(window.testBilling.refresh(),/Subscription status is unavailable/);
assert.equal(window.PilotDeskBilling.snapshot().isPro,true,'A lookup outage must not turn an already verified Pro session into Free');
lookupError=null;
const checkout=window.PilotDeskBilling.checkout();await Promise.resolve();await new Promise(r=>setTimeout(r,0));
await window.PilotDeskBilling.checkout();assert.equal(requests,1,'Repeated clicks must not issue another checkout');release();await checkout;
assert.equal(assigned,'https://checkout.stripe.com/c/pay/test-only');
assert.throws(()=>window.testBilling.navigateStripe('https://example.com/pay','checkout.stripe.com'),/could not be verified/);
// Execute the actual edge handler against an unavailable subscription lookup and an existing paid plan.
let edge,existing={ok:false,status:503},stripeCalls=0;
const edgeCode=stripTypeScriptTypes(fs.readFileSync('supabase/functions/billing-checkout/index.ts','utf8').replace(/^import[^\n]+\n/,''));
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'test-public',SUPABASE_SERVICE_ROLE_KEY:'test-admin',STRIPE_SECRET_KEY:'test-stripe',STRIPE_PRO_PRICE_ID:'test-price',PILOTDESK_BILLING_ENABLED:'true'};
vm.runInNewContext(edgeCode,{Deno:{env:{get:k=>env[k]},serve:fn=>edge=fn},Response,URLSearchParams,console:{error(){}},fetch:async url=>{if(url.includes('/auth/v1/user'))return {ok:true,json:async()=>({id:'test-user',email:'test@example.invalid'})};if(url.includes('/rest/v1/'))return {...existing,json:async()=>[{plan:'school',status:'active',stripe_customer_id:'test-customer'}]};stripeCalls++;throw Error('Stripe should not be reached');}});
const req={method:'POST',headers:new Headers({Authorization:'Bearer test-token'}),json:async()=>({plan:'pro'})};
assert.equal((await edge(req)).status,500);assert.equal(stripeCalls,0);
existing={ok:true};assert.equal((await edge(req)).status,409);assert.equal(stripeCalls,0);
console.log('Billing flow checks passed: lookup outages, duplicate-click guard, verified Stripe destinations, backend failures, and existing paid-plan protection.');
