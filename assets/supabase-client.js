const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
let clientPromise;
export function getPilotDeskClient(){
 if(!clientPromise){
  clientPromise=import('https://esm.sh/@supabase/supabase-js@2.57.4').then(({createClient})=>{
   const client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{
    persistSession:true,autoRefreshToken:true,detectSessionInUrl:location.pathname==='/account.html'
   }});
   window.__pilotDeskSupabase=client;
   return client;
  }).catch(error=>{clientPromise=null;throw error});
 }
 return clientPromise;
}
