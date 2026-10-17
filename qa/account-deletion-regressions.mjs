import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import test from 'node:test';

function fixture(options={}){
 const calls=[],subscriptions=options.subscriptions||[{id:'sub_active',customer:'cus_user',status:'active'}];
 let handler,deletionAttempts=0;
 const env={SUPABASE_URL:'https://local.invalid',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',STRIPE_SECRET_KEY:'sk_test_fixture',...options.env};
 const json=(body,status=200)=>Response.json(body,{status});
 const transport=async(url,init={})=>{
  calls.push({url,method:init.method||'GET'});
  if(url.endsWith('/auth/v1/user'))return json({id:'own-user'},options.invalidAuth?401:200);
  if(url.includes('/billing_subscriptions?'))return options.dbFailure?json({},503):json(options.rows??[{stripe_customer_id:'cus_user',stripe_subscription_id:'sub_active',status:'active'}]);
  if(url.startsWith('https://api.stripe.com/v1/subscriptions?')){
   if(options.badList)return json({data:null});
   const after=new URL(url).searchParams.get('starting_after'),data=options.paginate?(after?subscriptions.slice(1):subscriptions.slice(0,1)):subscriptions;
   return json({data,has_more:!!options.paginate&&!after});
  }
  if(url.startsWith('https://api.stripe.com/v1/subscriptions/')){
   const sub=subscriptions.find(s=>s.id===decodeURIComponent(url.split('/').at(-1)));
   if(!sub)return json({},404);
   if(init.method==='DELETE'){
    if(options.cancelFailure)return json({error:{message:'Stripe unavailable'}},503);
    sub.status='canceled';return json(sub);
   }
   return json(sub);
  }
  if(url.includes('/auth/v1/admin/users/')){deletionAttempts++;return options.failFirstDelete&&deletionAttempts===1?json({},503):json({id:'own-user'});}
  throw Error('Unexpected request '+url);
 };
 const source=fs.readFileSync('supabase/functions/delete-account/index.ts','utf8').replace(/^import[^\n]*\n/gm,'');
 vm.runInNewContext(stripTypeScriptTypes(source),{Deno:{env:{get:key=>env[key]},serve:fn=>handler=fn},fetch:transport,Response,URL,URLSearchParams,Set,console:{error(){}},encodeURIComponent});
 const request=()=>handler(new Request('https://local.invalid/delete',{method:'POST',headers:{Authorization:'Bearer user-session'},body:JSON.stringify({userId:'someone-else',customer:'cus_other'})}));
 return{calls,request};
}
const authDeletes=f=>f.calls.filter(c=>c.method==='DELETE'&&c.url.includes('/auth/'));
const cancellations=f=>f.calls.filter(c=>c.method==='DELETE'&&c.url.includes('api.stripe.com'));
test('cancel all ongoing subscriptions before deleting authenticated owner',async()=>{
 const f=fixture({paginate:true,subscriptions:[{id:'sub_active',customer:'cus_user',status:'active'},{id:'sub_trial',customer:'cus_user',status:'trialing'},{id:'sub_due',customer:'cus_user',status:'past_due'}]});
 assert.equal((await f.request()).status,200);assert.equal(cancellations(f).length,3);
 const deletion=f.calls.findIndex(c=>c.url.includes('/auth/v1/admin/'));
 assert(f.calls.every((c,i)=>!c.url.includes('api.stripe.com')||i<deletion));
 assert(f.calls.find(c=>c.url.includes('/billing_subscriptions?')).url.includes('user_id=eq.own-user'));
 assert(f.calls.every(c=>!c.url.includes('cus_other')));
});
test('billing lookup and Stripe failures preserve account and its billing linkage',async()=>{
 for(const options of [{dbFailure:true},{cancelFailure:true},{badList:true},{env:{STRIPE_SECRET_KEY:''}}]){
  const f=fixture(options);assert((await f.request()).status>=400);assert.equal(authDeletes(f).length,0);
 }
});
test('free accounts without a billing record can be deleted without Stripe configuration',async()=>{
 const f=fixture({rows:[],env:{STRIPE_SECRET_KEY:''}});assert.equal((await f.request()).status,200);assert.equal(cancellations(f).length,0);assert.equal(authDeletes(f).length,1);
});
test('already terminal subscriptions need no second cancellation',async()=>{
 const f=fixture({subscriptions:[{id:'sub_active',customer:'cus_user',status:'canceled'},{id:'sub_expired',customer:'cus_user',status:'incomplete_expired'}]});
 assert.equal((await f.request()).status,200);assert.equal(cancellations(f).length,0);
});
test('retry after auth deletion failure does not recancel an already canceled subscription',async()=>{
 const f=fixture({failFirstDelete:true});assert.equal((await f.request()).status,500);assert.equal((await f.request()).status,200);assert.equal(cancellations(f).length,1);assert.equal(authDeletes(f).length,2);
});
test('expired sessions cannot inspect billing or cancel subscriptions',async()=>{
 const f=fixture({invalidAuth:true});assert.equal((await f.request()).status,401);assert.equal(f.calls.length,1);
});
