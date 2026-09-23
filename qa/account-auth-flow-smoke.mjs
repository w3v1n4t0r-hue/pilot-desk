import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../assets/account.js',import.meta.url),'utf8');
const functionSource=source.split('\n').find(line=>line.startsWith('async function updatePassword('));
if(!functionSource)throw Error('Password recovery handler missing');
const controls={
  '#pdNewPassword':{value:'test-only-password'},
  '#pdConfirmPassword':{value:'test-only-password'},
  '#pdRecoveryForm button[type="submit"]':{}
};
let updated='',signedOut=false,statusText='',historyPath='';
const state={recoveryMode:true,client:{auth:{updateUser:async({password})=>{updated=password;return{error:null}},signOut:async()=>{signedOut=true;return{error:null}}}}};
const context={
  state,
  $:selector=>controls[selector],
  withBusy:async(_button,work)=>work(),
  status:text=>{statusText=text},
  history:{replaceState:(_state,_title,path)=>{historyPath=path}},
  location:{pathname:'/account.html'},
  renderSignedOut:()=>{},
  console
};
const updatePassword=vm.runInNewContext(`(${functionSource.replace('async function updatePassword','async function')})`,context);
let prevented=false;
await updatePassword({preventDefault:()=>{prevented=true},submitter:{}});
if(!prevented||updated!=='test-only-password'||!signedOut||state.recoveryMode||statusText!=='Password updated. Sign in with your new password.'||historyPath!=='/account.html'||controls['#pdNewPassword'].value||controls['#pdConfirmPassword'].value){
  throw Error('Recovery success did not update, sign out, and return to sign-in cleanly');
}
updated='';signedOut=false;controls['#pdNewPassword'].value='test-only-password';controls['#pdConfirmPassword'].value='different-password';
await updatePassword({preventDefault:()=>{},submitter:{}});
if(updated||signedOut||statusText!=='The new passwords do not match.')throw Error('Mismatched passwords were not blocked');
console.log('Account password recovery flow smoke passed.');
