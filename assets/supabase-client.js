// Every feature on the page shares one auth client and refresh lifecycle.
let pending;
export function getClient() {
  if (!pending) pending = import('https://esm.sh/@supabase/supabase-js@2.57.4')
    .then(({createClient}) => createClient(
      'https://hqqgcfiaxcrzyuhtkzqg.supabase.co',
      'sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ',
      {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
    ))
    .catch(error => { pending = undefined; throw error; });
  return pending;
}
