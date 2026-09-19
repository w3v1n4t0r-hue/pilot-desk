import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:cors});
const envKey=(modern:string,legacy:string)=>{try{const raw=Deno.env.get(modern);if(raw){const parsed=JSON.parse(raw);if(parsed?.default)return String(parsed.default)}}catch{}return Deno.env.get(legacy)||""};
const stripePost=async(path:string,data:Record<string,string>)=>{const key=Deno.env.get("STRIPE_SECRET_KEY")||"";const body=new URLSearchParams(data);const r=await fetch("https://api.stripe.com"+path,{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/x-www-form-urlencoded"},body});const out=await r.json().catch(()=>({}));if(!r.ok)throw new Error(out?.error?.message||("Stripe request failed ("+r.status+")"));return out};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(!["GET","POST"].includes(req.method))return json(405,{error:"Method not allowed"});
 const base=(Deno.env.get("SUPABASE_URL")||"").replace(/\/+$/,""),pub=envKey("SUPABASE_PUBLISHABLE_KEYS","SUPABASE_ANON_KEY"),admin=envKey("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY");
 const stripeKey=Deno.env.get("STRIPE_SECRET_KEY")||"",proPrice=Deno.env.get("STRIPE_PRO_PRICE_ID")||"",schoolPrice=Deno.env.get("STRIPE_SCHOOL_PRICE_ID")||"";
 if(req.method==="GET")return json(200,{configured:Boolean(base&&pub&&admin&&stripeKey&&proPrice),schoolConfigured:Boolean(base&&pub&&admin&&stripeKey&&schoolPrice)});
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!base||!pub||!admin)return json(503,{error:"Billing backend is unavailable."});
 if(!stripeKey||!proPrice)return json(503,{error:"PilotDesk checkout is not connected to Stripe yet.",code:"billing_not_configured"});
 if(!token)return json(401,{error:"Sign in required."});
 try{
  const userRes=await fetch(base+"/auth/v1/user",{headers:{apikey:pub,Authorization:"Bearer "+token}});
  if(!userRes.ok)return json(401,{error:"Session expired. Sign in again."});
  const user=await userRes.json();if(!user?.id)return json(401,{error:"Invalid account."});
  const body=await req.json().catch(()=>({}));const plan=String(body?.plan||"pro").toLowerCase();
  if(!["pro","school"].includes(plan))return json(400,{error:"Unknown plan."});
  const price=plan==="school"?schoolPrice:proPrice;if(!price)return json(503,{error:"That PilotDesk plan is not configured for checkout yet.",code:"plan_not_configured"});
  const adminHeaders=admin.startsWith("sb_secret_")?{apikey:admin}:{apikey:admin,Authorization:"Bearer "+admin};
  const existingRes=await fetch(base+"/rest/v1/billing_subscriptions?select=stripe_customer_id,plan,status&user_id=eq."+encodeURIComponent(user.id)+"&limit=1",{headers:adminHeaders});
  const existingRows=existingRes.ok?await existingRes.json():[];const existing=Array.isArray(existingRows)?existingRows[0]:null;
  if(existing&&["active","trialing"].includes(String(existing.status))&&existing.plan===plan)return json(409,{error:"This account already has an active "+plan+" subscription.",code:"already_subscribed"});
  let customerId=existing?.stripe_customer_id||"";
  if(!customerId){
   const customer=await stripePost("/v1/customers",{"email":String(user.email||""),"metadata[supabase_user_id]":user.id,"metadata[pilotdesk]":"true"});
   customerId=String(customer.id||"");if(!customerId)throw new Error("Stripe did not return a customer.");
   const up=await fetch(base+"/rest/v1/billing_subscriptions?on_conflict=user_id",{method:"POST",headers:{...adminHeaders,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:user.id,stripe_customer_id:customerId,plan:"free",status:"inactive",updated_at:new Date().toISOString()})});
   if(!up.ok)throw new Error("Unable to save billing customer.");
  }
  const site=(Deno.env.get("PILOTDESK_SITE_URL")||"https://www.pilot-desk.com").replace(/\/+$/,"");
  const session=await stripePost("/v1/checkout/sessions",{
   "mode":"subscription","customer":customerId,"client_reference_id":user.id,
   "success_url":site+"/account.html?billing=success&session_id={CHECKOUT_SESSION_ID}",
   "cancel_url":site+"/pricing.html?billing=cancelled",
   "line_items[0][price]":price,"line_items[0][quantity]":"1",
   "metadata[supabase_user_id]":user.id,"metadata[pilotdesk_plan]":plan,
   "subscription_data[metadata][supabase_user_id]":user.id,"subscription_data[metadata][pilotdesk_plan]":plan,
   "allow_promotion_codes":"true"
  });
  if(!session?.url)throw new Error("Stripe did not return a checkout URL.");
  return json(200,{url:session.url});
 }catch(error){console.error("billing-checkout",error);return json(500,{error:error instanceof Error?error.message:"Unable to start checkout."})}
});