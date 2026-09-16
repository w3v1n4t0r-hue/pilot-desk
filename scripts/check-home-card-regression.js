const fs=require('fs');
const home=fs.readFileSync('src/pages/index.astro','utf8');
const css=fs.readFileSync('assets/experience.css','utf8');
const data=fs.readFileSync('src/data/site.mjs','utf8');
const failures=[];
const need=(text,value,label)=>{if(!text.includes(value))failures.push(`${label}: ${value}`)};
for(const value of ['pd-home-actions','pd-home-action','pd-home-action-icon','pd-popular-grid','pd-popular-tool'])need(home,value,'homepage markup missing');
for(const value of ['Plan a Flight','Use a Calculator','Study for a Written'])need(data,value,'homepage task data missing');
for(const value of ['.pd-home-actions{','.pd-home-action{','.pd-home-action svg{','.pd-popular-grid{','.pd-popular-tool{'])need(css,value,'experience.css missing');
need(css,'@media(max-width:800px)','experience.css missing responsive breakpoint');
need(css,'.pd-home-actions{grid-template-columns:1fr}','experience.css missing mobile task-card stack');
need(css,'.pd-home-action-icon{display:none}','experience.css missing compact mobile icon treatment');
if(failures.length){console.error('Homepage card regression check failed:',failures);process.exit(1)}
console.log('Astro homepage task cards, icons, popular tools, and mobile stacking safeguards are present.');
