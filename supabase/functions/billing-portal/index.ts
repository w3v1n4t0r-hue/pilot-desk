import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:cors});
const envKey=(modern:string,legacy:string)=>{try{const raw=Deno.env.get(modern);if(raw){const parsed=JSON.parse(raw);if(parsed?.default)return String(parsed.default)}}catch{}return Deno.env.get(legacy)||""};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});if(req.method!=="POST")return json(405,{error:"Method not allowed"});
 const base=(Deno.env.get("SUPABASE_URL")||"").replace(/\/+$/,""),pub=envKey("SUPABASE_PUBLISHABLE_KEYS","SUPABASE_ANON_KEY"),admin=envKey("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY"),stripeKey=Deno.env.get("STRIPE_SECRET_KEY")||"";
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();if(!base||!pub||!admin||!stripeKey)return json(503,{error:"Billing management is not configured yet.",code:"billing_not_configured"});if(!token)return json(401,{error:"Sign in required."});
 try{
  const userRes=await fetch(base+"/auth/v1/user",{headers:{apikey:pub,Authorization:"Bearer "+token}});if(!userRes.ok)return json(401,{error:"Session expired. Sign in again."});const user=await userRes.json();if(!user?.id)return json(401,{error:"Invalid account."});
  const ah=admin.startsWith("sb_secret_")?{apikey:admin}:{apikey:admin,Authorization:"Bearer "+admin};
  const br=await fetch(base+"/rest/v1/billing_subscriptions?select=stripe_customer_id&user_id=eq."+encodeURIComponent(user.id)+"&limit=1",{headers:ah});const rows=br.ok?await br.json():[];const customer=Array.isArray(rows)?rows[0]?.stripe_customer_id:"";
  if(!customer)return json(404,{error:"No billing profile exists for this account yet."});
  const site=(Deno.env.get("PILOTDESK_SITE_URL")||"https://www.pilot-desk.com").replace(/\/+$/,"");
  const form=new URLSearchParams({customer:String(customer),return_url:site+"/account.html?billing=return"});
  const sr=await fetch("https://api.stripe.com/v1/billing_portal/sessions",{method:"POST",headers:{Authorization:"Bearer "+stripeKey,"Content-Type":"application/x-www-form-urlencoded"},body:form});const data=await sr.json().catch(()=>({}));if(!sr.ok)throw new Error(data?.error?.message||"Unable to open Stripe billing portal.");if(!data?.url)throw new Error("Stripe did not return a portal URL.");
  return json(200,{url:data.url});
 }catch(error){console.error("billing-portal",error);return json(500,{error:error instanceof Error?error.message:"Unable to open billing management."})}
});