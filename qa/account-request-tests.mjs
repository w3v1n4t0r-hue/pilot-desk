import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/account.js','utf8');
const line=name=>source.split('\n').find(x=>x.startsWith('async function '+name+'('));
let requestCount=0,statusText='',verification='',resetCount=0;
const button={disabled:false,textContent:'Create account',setAttribute(){},removeAttribute(){}};
const controls={'#pdCreateEmail':{value:'test@example.invalid'},'#pdCreatePassword':{value:'example-password'},'#pdPasswordEmail':{value:'not-an-email',checkValidity:()=>false},'#pdForgotPassword':button};
let release;
const state={client:{auth:{signUp:async()=>{requestCount++;await new Promise(resolve=>release=resolve);return {data:{session:null},error:null};},resetPasswordForEmail:async()=>{resetCount++;return {error:null};}}}};
const context={state,$:key=>controls[key],status:value=>statusText=value,showVerification:value=>verification=value,redirectUrl:()=> 'https://test.invalid/account.html',renderSession:async()=>{},window:{},console,authError:()=> 'Test authentication failure'};
vm.createContext(context);
const emailGuards=source.slice(source.indexOf('const authEmailUntil='),source.indexOf('function callbackError('));
vm.runInContext(emailGuards+'\n'+line('withBusy')+'\n'+line('createAccount')+'\n'+line('requestPasswordReset')+'\n'+line('resetPassword'),context);
const event={preventDefault(){},submitter:button};
const first=vm.runInContext('createAccount(event)',vm.createContext({...context,event}));
await Promise.resolve();
await vm.runInContext('createAccount(event)',vm.createContext({...context,event}));
assert.equal(requestCount,1);assert.equal(button.disabled,true);
release();await first;assert.equal(button.disabled,false);assert.equal(verification,'test@example.invalid');assert.match(statusText,/confirm your PilotDesk account/);
controls['#pdCreatePassword'].value='short';await vm.runInContext('createAccount(event)',vm.createContext({...context,event}));assert.equal(requestCount,1);assert.match(statusText,/at least 6/);
await vm.runInContext('resetPassword()',context);assert.equal(resetCount,0);assert.match(statusText,/valid email/);
context.location={origin:'https://test.invalid'};context.URL=URL;
await vm.runInContext("requestPasswordReset('test@example.invalid',null)",context);assert.equal(resetCount,1);assert.match(statusText,/If this email has an account/);
console.log('Account request checks passed: duplicate signup blocked, confirmation state, weak password, invalid reset email, and recovery request.');

// A checkout return is not proof that the subscription webhook has completed.
const paymentSource=source.slice(source.indexOf('async function refreshPaymentStatus('),source.indexOf('async function openBillingPortal('));
let paid=false,paymentMessage='',queued=[];
const paymentContext={state:{session:{user:{id:'test-user'}}},window:{PilotDeskBilling:{refresh:async()=>({isPro:paid})}},renderBilling(){},billingStatus:text=>paymentMessage=text,setTimeout:fn=>queued.push(fn)};
vm.createContext(paymentContext);vm.runInContext(paymentSource,paymentContext);
await vm.runInContext('refreshPaymentStatus()',paymentContext);assert.match(paymentMessage,/Waiting for subscription confirmation/);assert.equal(queued.length,1);
paid=true;await queued.shift()();assert.match(paymentMessage,/confirmed and available/);
paid=false;await vm.runInContext('refreshPaymentStatus(4)',paymentContext);assert.match(paymentMessage,/do not start another checkout/);
console.log('Payment-return checks passed: pending is distinct from confirmed subscription access.');

// Exercise actual email handlers with one shared tab, including success cooldown,
// expiration, failed delivery, confirmation/resend sharing and storage failure.
let clock=100000,magicCalls=0,recoveryCalls=0,signupCalls=0,resendCalls=0,failMagic=false;
const records=new Map(),emailButton=()=>({disabled:false,textContent:'Send',setAttribute(){},removeAttribute(){}});
const emailControls={'#pdEmail':{value:'pilot@example.invalid'},'#pdCreateEmail':{value:'pilot@example.invalid'},'#pdCreatePassword':{value:'example-password'},'#pdConfirmationEmail':{value:'pilot@example.invalid',checkValidity:()=>true},'#pdResendConfirmation':emailButton()};
const emailContext={Map,Set,Number,Math,Date:{now:()=>clock},URL,location:{origin:'https://test.invalid'},sessionStorage:{getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v)},state:{client:{auth:{signInWithOtp:async()=>{magicCalls++;return {error:failMagic?{message:'outage'}:null}},resetPasswordForEmail:async()=>{recoveryCalls++;return {error:null}},signUp:async()=>{signupCalls++;return {data:{session:null},error:null}},resend:async()=>{resendCalls++;return {error:null}}}}},$:k=>emailControls[k],status:msg=>{statusText=msg},showVerification(){},renderSession:async()=>{},redirectUrl:()=> 'https://test.invalid/account.html',window:{},console,authError:()=> 'Delivery failed'};
vm.createContext(emailContext);vm.runInContext(emailGuards+'\n'+line('withBusy')+'\n'+line('sendMagicLink')+'\n'+line('createAccount')+'\n'+line('requestPasswordReset')+'\n'+line('resendConfirmation')+'\n'+source.split('\n').find(x=>x.startsWith('function updateResend(')),emailContext);
const run=code=>vm.runInContext(code,emailContext);emailContext.event={preventDefault(){},submitter:emailButton()};
await run('sendMagicLink(event)');await run('sendMagicLink(event)');assert.equal(magicCalls,1);assert.match(statusText,/already requested/);
clock+=60001;failMagic=true;await run('sendMagicLink(event)');failMagic=false;await run('sendMagicLink(event)');assert.equal(magicCalls,3,'failed send must allow a retry');
await run("requestPasswordReset('pilot@example.invalid',null)");await run("requestPasswordReset('pilot@example.invalid',null)");assert.equal(recoveryCalls,1,'forgot/change-password must share reset cooldown');
await run('createAccount(event)');await run('resendConfirmation()');assert.equal(signupCalls,1);assert.equal(resendCalls,0,'signup and confirmation resend share cooldown');
clock+=60001;await run('resendConfirmation()');assert.equal(resendCalls,1);
emailContext.sessionStorage={getItem(){throw Error('blocked storage')},setItem(){throw Error('blocked storage')}};clock+=60001;await run('sendMagicLink(event)');await run('sendMagicLink(event)');assert.equal(magicCalls,4,'memory guard survives blocked storage');assert.equal(emailContext.event.submitter.disabled,false);
console.log('Auth email cooldown checks passed: successful sends, expiration, retry after failure, shared reset/confirmation guards, and blocked storage.');
