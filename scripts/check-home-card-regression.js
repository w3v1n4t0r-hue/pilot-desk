const fs=require('fs');
const css=fs.readFileSync('assets/home-avionics-final.css','utf8');
const must=[
  '.pd-home-command-center .category .tool-card',
  'padding:42px 18px 18px!important',
  '.pd-home-command-center #pdQuickStart .pd-task-icon svg{display:none!important}',
  '[data-home-task="airport"] .pd-task-icon',
  '[data-home-task="route"] .pd-task-icon',
  '[data-home-task="flight-workspace"] .pd-task-icon',
  '[data-home-task="weather"] .pd-task-icon',
  '[data-home-task="weight-balance"] .pd-task-icon'
];
const missing=must.filter(x=>!css.includes(x));
if(missing.length){console.error('Homepage card regression check failed:',missing);process.exit(1)}
console.log('Homepage card spacing and simplified icon overrides present.');
