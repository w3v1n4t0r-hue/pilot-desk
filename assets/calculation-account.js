(()=>{
'use strict';
if(window.PilotDeskSavedCalculations)return;
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
let clientPromise;
async function client(){
  if(!clientPromise)clientPromise=import('https://esm.sh/@supabase/supabase-js@2.57.4').then(mod=>mod.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
  return clientPromise;
}
function nextUrl(){return '/account.html?next='+encodeURIComponent(location.pathname+location.search)}
async function saveCalculation(payload={}){
  try{
    const supabase=await client();
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.user?.id)return {ok:false,reason:'signin',url:nextUrl()};
    const row={
      user_id:session.user.id,
      tool_slug:String(payload.toolSlug||'calculator').slice(0,80),
      title:String(payload.title||'PilotDesk calculation').slice(0,120),
      inputs:payload.inputs&&typeof payload.inputs==='object'?payload.inputs:{},
      result:payload.result&&typeof payload.result==='object'?payload.result:{}
    };
    const {error}=await supabase.from('saved_calculations').insert(row);
    if(error)throw error;
    return {ok:true};
  }catch(error){
    return {ok:false,reason:'error',message:error?.message||'Unable to save calculation'};
  }
}
window.PilotDeskSavedCalculations={save:saveCalculation,signInUrl:nextUrl};
})();