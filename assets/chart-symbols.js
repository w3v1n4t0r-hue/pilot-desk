(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PilotDeskChartSymbols=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shapes={
 airport:'<circle cx="12" cy="12" r="8"/><path d="M7 17 17 7M8 7h4M17 12v4"/>',
 navaid:'<path d="m12 4 7 4v8l-7 4-7-4V8Z"/>',
 vordme:'<rect x="3" y="3" width="18" height="18"/><path d="m12 4 7 4v8l-7 4-7-4V8Z"/>',
 dme:'<rect x="5" y="5" width="14" height="14"/>',
 vortac:'<path d="m12 4 7 4v8l-7 4-7-4V8Z"/><path d="M9 1h6v4H9ZM18 14l4 2-3 5-4-2ZM6 14l-4 2 3 5 4-2Z" fill="currentColor"/>',
 heliport:'<circle cx="12" cy="12" r="8"/><path d="M8 7v10M16 7v10M8 12h8"/>',
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
function svg(kind,color='#f0efe9',negative=false){const shape=(shapes[kind]||shapes.report).replace(/currentColor/g,color),slash=negative?'<path d="m3 21 18-18"/>':'';return '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><g fill="none" stroke="#08090b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">'+shape+slash+'</g><g fill="none" stroke="'+color+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+shape+slash+'</g></svg>';}
function section(raw,name){return raw.match(new RegExp('/'+name+'\\s+([^/]+)','i'))?.[1]?.trim()||'';}
function severity(text){if(/\b(EXTRM|EXTREME)\b/.test(text))return 4;if(/\b(SEV|SVR|SEVERE|HVY|HEAVY)\b/.test(text))return 3;if(/\b(MOD|MDT|MODERATE)\b/.test(text))return 2;if(/\b(LGT|LIGHT|LT)\b/.test(text))return 1;if(/\b(TRC|TR|TRACE)\b/.test(text))return .5;if(/\b(NEG|NEGATIVE|NONE|SMOOTH|NIL)\b/.test(text))return 0;return null;}
function describe(text){return text.replace(/\bEXTRM\b/g,'extreme').replace(/\bSEV\b|\bSVR\b/g,'severe').replace(/\bMOD\b|\bMDT\b/g,'moderate').replace(/\bLGT\b|\bLT\b/g,'light').replace(/\bTRC\b|\bTR\b/g,'trace').replace(/\bNEG\b/g,'negative').toLowerCase();}
// Independently drawn vectors matched against ForeFlight Legends Guide §2.10.11.
// Standard intensity glyphs encode severity; trace icing uses the light glyph.
function weatherSvg(kind,level){
 const negative='<circle cx="12" cy="12" r="7"/><path d="m5 19 14-14"/>';
 const ice=['','M5 7v10h14V7M12 12v9','M5 7v10h14V7M9 12v9M15 12v9','M5 6v11h14V6M8 11v10M12 11v10M16 11v10'];
 const turb=['','m7 18 5-12 5 12','M4 18h4l4-12 4 12h4','M4 20h4l4-10 4 10h4M8 10l4-6 4 6','M4 20h16M8 10l4-6 4 6'];
 const eye='<path d="M3 12q9-13 18 0-9 13-18 0Z" fill="white" stroke="none"/><circle cx="12" cy="12" r="4" fill="#505b69" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="white" stroke="none"/>';
 const color=kind==='icing'?'#5145ff':kind==='turbulence'?'#ff8500':'#505b69';
 const shape=kind==='turbulence'&&level===4?'<path d="m8 20 4-10 4 10Z" fill="white"/><path d="M4 20h16M8 10l4-6 4 6"/>':kind==='skyweather'?eye:level===0?negative:level===null?'<path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4M12 18h.01"/>':'<path d="'+(kind==='icing'?ice[Math.min(3,Math.ceil(level))]:turb[Math.min(4,Math.ceil(level))])+'"/>';
 return '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><rect x="1" y="1" width="22" height="22" rx="4" fill="'+color+'" stroke="#27303b" stroke-opacity=".55"/><g fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+shape+'</g></svg>';
}
function pirep(properties={}){
 const p=properties,raw=String(p.rawOb||p.raw_text||p.raw||'').toUpperCase(),items=[];
 for(const [kind,prefix,code]of [['icing','ic','IC'],['turbulence','tb','TB']]){
  const structured=[p[prefix+'Int1'],p[prefix+'Int2']].filter(v=>v!==undefined&&v!==null&&v!=='').join(' / ').toUpperCase(),text=structured||section(raw,code);
  if(!text)continue;const level=severity(text);
  items.push({kind,level,displayLevel:level===.5?1:level,negative:level===0,label:kind[0].toUpperCase()+kind.slice(1)+': '+describe(text)});
 }
 const wx=String(p.wxString||p.wx||section(raw,'WX')).toUpperCase(),sky=section(raw,'SK')||[p.cloudCvg1,p.cloudCvg2,p.cloudCvg].filter(Boolean).join(' ');
 if(!items.length)items.push({kind:'skyweather',level:null,label:[wx?'Weather: '+wx:'',sky?'Sky: '+sky:''].filter(Boolean).join('; ')||'Pilot report: no classified weather condition'});
 const urgent=/\bUUA\b/.test(raw)||String(p.reportType||p.pirepType||'').toUpperCase()==='UUA'||items.some(x=>x.level>=3);
 const label=[...new Set(items.map(x=>x.label)),...(wx&&items[0].kind!=='skyweather'?['Weather: '+wx]:[]),...(sky&&items[0].kind!=='skyweather'?['Sky: '+sky]:[])].join('; ')+(urgent?'; urgent/severe PIREP':'');
 const html=items.map(x=>'<span class="rp-pirep-condition" data-condition="'+x.kind+'">'+weatherSvg(x.kind,x.level)+'</span>').join('')+(urgent?'<strong class="rp-pirep-urgent" aria-hidden="true"><svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#ce0024"/><path d="M7 3v5M7 10h.01" stroke="white" stroke-width="1.7" stroke-linecap="round"/></svg></strong>':'');
 const altitude=Number(p.fltlvl??p.fltLvl);
 const altitudeLabel=Number.isFinite(altitude)&&altitude>=0&&p.fltlvl!==null&&p.fltLvl!==null&&(p.fltlvl!==undefined||p.fltLvl!==undefined)?String(altitude).padStart(3,'0'):'';
 return{items,urgent,label,html:html+(altitudeLabel?'<span class="rp-pirep-altitude">'+altitudeLabel+'</span>':''),width:items.length*28};
}
function navigation(key,p={}){
 const type=String(p.TYPE_CODE||p.TYPE||p.type||p.NAVAID_TYPE||'').toUpperCase().replace(/[ _/-]/g,'');
 let kind=key==='airports'?(/HELIPORT|HELI/.test(type)?'heliport':'airport'):key==='navaids'?(/NDB/.test(type)?'ndb':/VORTAC/.test(type)?'vortac':/VOR.*DME/.test(type)?'vordme':type==='DME'?'dme':'navaid'):key==='fixes'?'fix':key==='obstacles'?'obstacle':'report';
 const labels={airport:'Airport',heliport:'Heliport',ndb:'NDB',navaid:type==='VOR'?'VOR':'Navaid',vordme:'VOR/DME',vortac:'VORTAC',dme:'DME',fix:'Fix',obstacle:'Obstacle',report:'Chart point'};
 return{kind,label:labels[kind],html:svg(kind)};
}
function reportTime(properties={},now=Date.now()){
 const raw=properties.obsTime??properties.observationTime??properties.reportTime??properties.time;
 if(raw===null||raw===undefined||raw==='')return 'Observation time unavailable';
 const numeric=typeof raw==='number'||/^\d+(?:\.\d+)?$/.test(String(raw))?Number(raw):NaN;
 const at=Number.isFinite(numeric)?numeric*(numeric<1e11?1000:1):Date.parse(raw);
 if(!Number.isFinite(at)||at>now+300000)return 'Observation time unavailable';
 const age=Math.max(0,Math.floor((now-at)/60000));
 return 'Observed '+new Date(at).toISOString().slice(0,16).replace('T',' ')+' UTC · '+age+' min ago'+(age>=120?' · Older report; verify current conditions':'');
}

return{pirep,navigation,svg,weatherSvg,reportTime,escape};
});
