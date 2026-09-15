import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('account.html','utf8');
const code=fs.readFileSync('assets/account.js','utf8').replace(/if\(document.readyState==='loading'\)[\s\S]*?else init\(\);/,`window.test={state,setAuthMode,submitAuth,setPassword,signOut,renderSession,returnToTool};`);
function harness(){
 const elements=new Map();const controls=[];
 for(const id of [...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]))elements.set('#'+id,{value:'',textContent:'',hidden:false,disabled:false,dataset:{},classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this[k]=v},reset(){this.value=''},focus(){},scrollIntoView(){}});
 for(const mode of ['login','signup','recover','magic'])controls.push({dataset:{authMode:mode},setAttribute(k,v){this[k]=v}});
 const calls=[],location={href:'https://www.pilot-desk.com/account.html?next=/weather.html',origin:'https://www.pilot-desk.com',hash:'',assign(p){calls.push(['redirect',p])}};
 const sandbox={URL,URLSearchParams,console,setTimeout,location,sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},document:{querySelector:s=>elements.get(s),querySelectorAll:s=>s==='[data-auth-mode]'?controls:[],readyState:'complete'},window:{}};
 vm.runInNewContext(code,sandbox);const api=sandbox.window.test;
 api.state.client={auth:{signInWithPassword:async args=>{calls.push(['login',args]);return {error:{code:'invalid_credentials'}}},signUp:async args=>{calls.push(['signup',args]);return {data:{session:null},error:null}},resetPasswordForEmail:async email=>{calls.push(['recover',email]);return {error:null}},signInWithOtp:async args=>{calls.push(['magic',args]);return {error:null}},updateUser:async args=>{calls.push(['password',args]);return {error:null}},signOut:async()=>({error:{message:'Network unavailable'}})}};
 return {api,e:s=>elements.get(s),calls};
}
const event={preventDefault(){}};
{
 const {api,e,calls}=harness();api.setAuthMode('login');e('#pdAuthEmail').value='pilot@example.test';e('#pdAuthPassword').value='test-only';await api.submitAuth(event);assert.equal(calls[0][0],'login');assert.equal(calls.length,1);assert.match(e('#pdAccountStatus').textContent,/did not match/);
 api.setAuthMode('signup');e('#pdAuthPassword').value='test-password-long';e('#pdAuthConfirm').value='different';await api.submitAuth(event);assert.equal(calls.length,1);e('#pdAuthConfirm').value='test-password-long';await api.submitAuth(event);assert.equal(calls[1][0],'signup');assert.equal(e('#pdAuthPassword').value,'');
 api.setAuthMode('magic');await api.submitAuth(event);assert.equal(calls[2][1].options.shouldCreateUser,false);
 api.setAuthMode('recover');await api.submitAuth(event);assert.equal(calls[3][0],'recover');
 api.state.session={user:{id:'test'}};api.state.recovery=true;e('#pdNewPassword').value='test-password-long';e('#pdConfirmPassword').value='wrong';await api.setPassword(event);assert.equal(calls.length,4);e('#pdConfirmPassword').value='test-password-long';await api.setPassword(event);assert.equal(calls[4][0],'password');assert.equal(api.state.recovery,false);
 await api.signOut();assert.match(e('#pdAccountStatus').textContent,/Network unavailable/);assert.ok(api.state.session);
 api.state.client.auth.signOut=async()=>({error:null});api.state.mode='recover';await api.signOut();assert.equal(api.state.session,null);assert.equal(api.state.mode,'login');
 api.state.recovery=true;api.returnToTool();assert.equal(calls.length,5);api.state.recovery=false;api.returnToTool();assert.equal(calls[5][0],'redirect');
}
{
 const {api,e,calls}=harness();let finish;api.state.client.auth.signInWithPassword=()=>new Promise(r=>finish=r);api.setAuthMode('login');e('#pdAuthEmail').value='test@example.test';e('#pdAuthPassword').value='test';const first=api.submitAuth(event);assert.equal(api.state.busy,true);await api.submitAuth(event);finish({error:{code:'invalid_credentials'}});await first;assert.equal(api.state.busy,false);
}
const signedOutStart=html.indexOf('id="pdSignedOut"'),signedInStart=html.indexOf('id="pdSignedIn"');assert.ok(html.indexOf('id="pdAuthForm"')>signedOutStart&&html.indexOf('id="pdAuthForm"')<signedInStart);assert.ok(!html.includes('pdCreateAccountForm'));assert.ok(code.includes("event==='PASSWORD_RECOVERY'"));
console.log('Account flow PASS: login does not send email; signup validation; existing-user magic link; recovery; password matching/update; signout errors; safe redirects; submission lock. Tests use mocked auth, not production accounts.');

// Concurrent features must share one client, including its URL recovery handler.
{
 const sdk='data:text/javascript;base64,'+Buffer.from('let calls=0; export function createClient(url,key,options){return {instance:++calls,options}}').toString('base64');
 const source=fs.readFileSync('assets/supabase-client.js','utf8').replace('https://esm.sh/@supabase/supabase-js@2.57.4',sdk);
 const {getClient}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const [header,account]=await Promise.all([getClient(),getClient()]);assert.equal(header,account);assert.equal(account.instance,1);assert.equal(account.options.auth.detectSessionInUrl,true);
 console.log('Shared auth client PASS: concurrent account and header initialization use one instance.');
}
