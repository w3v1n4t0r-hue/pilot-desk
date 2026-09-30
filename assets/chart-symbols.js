(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PilotDeskChartSymbols=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shapes={
 airport:'<circle cx="12" cy="12" r="8"/><path d="M7 17 17 7M8 7h4M17 12v4"/>',
 navaid:'<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><circle cx="12" cy="12" r="3"/>',
 ndb:'<circle cx="12" cy="12" r="8" stroke-dasharray="1 3"/><circle cx="12" cy="12" r="2"/>',
 fix:'<path d="m12 4 9 16H3Z"/>',
 obstacle:'<path d="M12 3v18M5 21l7-13 7 13M7 17h10M8 6l4-3 4 3"/>',
 turbulence:'<path d="M2 12q2-8 5 0t5 0t5 0t5 0"/>',
 icing:'<path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M17 19l-1-4 4-1M4 14l4 1-1 4M17 5l-1 4 4 1"/>',
 cloud:'<path d="M6 18h13a4 4 0 0 0 0-8 6 6 0 0 0-11-2 5 5 0 0 0-2 10Z"/>',
 rain:'<path d="M5 13h14a4 4 0 0 0-1-8 5 5 0 0 0-9 0 4 4 0 0 0-4 8ZM7 16l-2 5M13 16l-2 5M19 16l-2 5"/>',
 snow:'<path d="M5 12h14a4 4 0 0 0-1-7 5 5 0 0 0-9 0 4 4 0 0 0-4 7ZM6 15v7M3 18.5h6M15 15v7M12 18.5h6"/>',
 hail:'<circle cx="6" cy="8" r="2"/><circle cx="17" cy="8" r="2"/><circle cx="12" cy="17" r="2"/>',
 thunderstorm:'<path d="M5 13h14a4 4 0 0 0-1-8 5 5 0 0 0-9 0 4 4 0 0 0-4 8ZM13 13l-5 5h5l-3 5 8-7h-5l3-3"/>',
 visibility:'<path d="M3 6h18M3 10h18M3 14h18M3 18h18"/>',
 clear:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
 report:'<path d="m12 3 2 7 7 4v2l-7-2v5l2 2h-8l2-2v-5l-7 2v-2l7-4Z"/>'
};
function svg(kind,color='#f0efe9',negative=false){const shape=shapes[kind]||shapes.report,slash=negative?'<path d="m3 21 18-18"/>':'';return '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><g fill="none" stroke="#08090b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">'+shape+slash+'</g><g fill="none" stroke="'+color+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+shape+slash+'</g></svg>';}
function section(raw,name){return raw.match(new RegExp('/'+name+'\\s+([^/]+)','i'))?.[1]?.trim()||'';}
function severity(text){if(/\b(EXTRM|EXTREME)\b/.test(text))return 4;if(/\b(SEV|SEVERE|HVY|HEAVY)\b/.test(text))return 3;if(/\b(MOD|MODERATE)\b/.test(text))return 2;if(/\b(LGT|LIGHT|LT)\b/.test(text))return 1;if(/\b(TRC|TRACE)\b/.test(text))return .5;if(/\b(NEG|NEGATIVE|NONE|SMOOTH|NIL)\b/.test(text))return 0;return null;}
function describe(text){return text.replace(/\bEXTRM\b/g,'extreme').replace(/\bSEV\b/g,'severe').replace(/\bMOD\b/g,'moderate').replace(/\bLGT\b|\bLT\b/g,'light').replace(/\bTRC\b/g,'trace').replace(/\bNEG\b/g,'negative').toLowerCase();}
function pirep(properties={}){
const p=properties,raw=String(p.rawOb||p.raw_text||p.raw||'').toUpperCase(),items=[];
for(const [kind,prefix,code]of [['turbulence','tb','TB'],['icing','ic','IC']]){const structured=[p[prefix+'Int1'],p[prefix+'Int2']].filter(v=>v!==undefined&&v!==null&&v!=='').join(' / ').toUpperCase(),text=structured||section(raw,code);if(!text)continue;const level=severity(text);items.push({kind,level,negative:level===0,label:kind[0].toUpperCase()+kind.slice(1)+': '+describe(text),badge:level===0?'NEG':level===.5?'TR':level===1?'L':level===2?'M':level===3?'S':level===4?'X':'?'});}
const wx=String(p.wxString||p.wx||section(raw,'WX')).toUpperCase();
if(wx){const kinds=[];if(/\b(?:[+-]?TS[A-Z]*|THUNDERSTORM[S]?)\b/.test(wx))kinds.push('thunderstorm');if(/SN|SG|PL/.test(wx))kinds.push('snow');if(/GS|GR|HAIL/.test(wx))kinds.push('hail');if(/RA|DZ/.test(wx))kinds.push('rain');if(/FG|BR|HZ|FU|DU|SA/.test(wx))kinds.push('visibility');if(!kinds.length)kinds.push('report');for(const kind of kinds)items.push({kind,label:'Weather: '+wx,level:null});}
const sky=section(raw,'SK')||[p.cloudCvg1,p.cloudCvg2,p.cloudCvg].filter(Boolean).join(' ');if(sky){const clear=/\b(SKC|CLR)\b/.test(sky)&&! /\b(FEW|SCT|BKN|OVC)(?=\d|\b)/.test(sky);items.push({kind:clear?'clear':'cloud',level:null,label:'Sky: '+sky});}
if(!items.length)items.push({kind:'report',level:null,label:'Pilot report: no classified weather condition'});
const urgent=/\bUUA\b/.test(raw)||String(p.reportType||'').toUpperCase()==='UUA',label=[...new Set(items.map(x=>x.label))].join('; ')+(urgent?'; urgent PIREP':'');
const html=items.map(x=>{const color=x.level>=3?'#f58c88':x.level>=1?'#f0cd76':x.level===0?'#c7d0d9':x.kind==='icing'?'#a2cef5':'#f0efe9';return '<span class="rp-pirep-condition" data-condition="'+x.kind+'">'+svg(x.kind,color,x.negative)+(x.badge?'<b style="color:'+color+'">'+x.badge+'</b>':'')+'</span>';}).join('')+(urgent?'<strong class="rp-pirep-urgent">!</strong>':'');
return{items,urgent,label,html,width:items.length*28+(urgent?12:0)};
}
function navigation(key,p={}){const type=String(p.TYPE_CODE||p.TYPE||p.type||'').toUpperCase();const kind=key==='airports'?'airport':key==='navaids'?/NDB/.test(type)?'ndb':'navaid':key==='fixes'?'fix':key==='obstacles'?'obstacle':'report';return{kind,label:kind==='ndb'?'NDB':key==='navaids'?'Navaid':key==='airports'?'Airport':key==='fixes'?'Fix':key==='obstacles'?'Obstacle':'Chart point',html:svg(kind)};}
return{pirep,navigation,svg,escape};
});
