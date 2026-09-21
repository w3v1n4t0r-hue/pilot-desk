import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
const envKey=(modern:string,legacy:string)=>{try{const raw=Deno.env.get(modern);if(raw){const parsed=JSON.parse(raw);if(parsed?.default)return String(parsed.default)}}catch{}return Deno.env.get(legacy)||""};
const hex=(b:ArrayBuffer)=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
const secureEq=(a:string,b:string)=>{if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0};
async function validStripeSignature(payload:string,header:string,secret:string){const parts=header.split(",").map(x=>x.trim()),t=parts.find(x=>x.startsWith("t="))?.slice(2)||"",sigs=parts.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));const ts=Number(t);if(!ts||Math.abs(Date.now()/1000-ts)>300||!sigs.length)return false;const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const mac=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(t+"."+payload)));return sigs.some(s=>secureEq(mac,s))}
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return json(405,{error:"Method not allowed"});
 const base=(Deno.env.get("SUPABASE_URL")||"").replace(/\/+$/,""),admin=envKey("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY"),stripeKey=Deno.env.get("STRIPE_SECRET_KEY")||"",secret=Deno.env.get("STRIPE_WEBHOOK_SECRET")||"",proPrice=Deno.env.get("STRIPE_PRO_PRICE_ID")||"price_1UHzEB02i4B03RL4C9qiFaZA",schoolPrice=Deno.env.get("STRIPE_SCHOOL_PRICE_ID")||"";
 if(!base||!admin||!stripeKey||!secret)return json(503,{error:"Webhook is not configured."});
 const raw=await req.text(),sig=req.headers.get("Stripe-Signature")||"";if(!(await validStripeSignature(raw,sig,secret)))return json(400,{error:"Invalid signature"});
 let event:any;try{event=JSON.parse(raw)}catch{return json(400,{error:"Invalid payload"})}
 const ah=admin.startsWith("sb_secret_")?{apikey:admin}:{apikey:admin,Authorization:"Bearer "+admin};
 const stripeGet=async(path:string)=>{const r=await fetch("https://api.stripe.com"+path,{headers:{Authorization:"Bearer "+stripeKey}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||("Stripe fetch failed "+r.status));return d};
 const rowByCustomer=async(customer:string)=>{const r=await fetch(base+"/rest/v1/billing_subscriptions?select=user_id&stripe_customer_id=eq."+encodeURIComponent(customer)+"&limit=1",{headers:ah});const rows=r.ok?await r.json():[];return Array.isArray(rows)?rows[0]:null};
 const sync=async(sub:any,userHint="")=>{
  const customer=typeof sub.customer==="string"?sub.customer:sub.customer?.id||"";const subId=String(sub.id||"");const price=String(sub.items?.data?.[0]?.price?.id||"");let userId=String(sub.metadata?.supabase_user_id||userHint||"");
  if(!userId&&customer){const row=await rowByCustomer(customer);userId=String(row?.user_id||"")}
  if(!userId)return;
  const status=String(sub.status||"inactive");const active=["active","trialing"].includes(status);let plan=String(sub.metadata?.pilotdesk_plan||"");
  if(price&&price===schoolPrice)plan="school";else if(price&&price===proPrice)plan="pro";if(!active&&status==="canceled")plan="free";if(!["free","pro","school"].includes(plan))plan=active?"pro":"free";
  const end=sub.current_period_end?new Date(Number(sub.current_period_end)*1000).toISOString():null;
  const body={user_id:userId,stripe_customer_id:customer||null,stripe_subscription_id:subId||null,stripe_price_id:price||null,plan,status,current_period_end:end,cancel_at_period_end:Boolean(sub.cancel_at_period_end),updated_at:new Date().toISOString()};
  const r=await fetch(base+"/rest/v1/billing_subscriptions?on_conflict=user_id",{method:"POST",headers:{...ah,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(body)});if(!r.ok)throw new Error("Billing sync failed "+r.status);
 };
 try{
  const obj=event?.data?.object||{};
  if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type))await sync(obj);
  else if(event.type==="checkout.session.completed"&&obj?.subscription){
   const sub=await stripeGet("/v1/subscriptions/"+encodeURIComponent(String(obj.subscription)));await sync(sub,String(obj.client_reference_id||obj.metadata?.supabase_user_id||""));
  }
  return json(200,{received:true});
 }catch(error){console.error("stripe-webhook",event?.type,error);return json(500,{error:"Webhook processing failed"})}
});