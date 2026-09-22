(()=>{
'use strict';
if(window.PilotDeskTrainingStandards)return;
const FAA={
 acs:'https://www.faa.gov/training_testing/testing/acs',
 pts:'https://www.faa.gov/training_testing/testing/test_standards',
 supplements:'https://www.faa.gov/training_testing/testing/supplements',
 ppl:'https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf',
 ira:'https://www.faa.gov/training_testing/testing/acs/instrument_rating_airplane_acs_8.pdf',
 cpl:'https://www.faa.gov/training_testing/testing/acs/commercial_airplane_acs_7.pdf',
 cfi:'https://www.faa.gov/training_testing/testing/acs/cfi_airplane_acs_25.pdf',
 cfii:'https://www.faa.gov/training_testing/testing/acs/cfi_instrument_pts_9.pdf',
 atp:'https://www.faa.gov/training_testing/testing/acs/atp_airplane_acs_11.pdf',
 pplSupplement:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/sport_rec_private_akts.pdf',
 iraSupplement:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/instrument_rating_akts.pdf',
 cplSupplement:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/commercial_akts.pdf',
 cfiSupplement:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/flight_ground_instructor_akts.pdf',
 atpSupplement:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/atp_akts.pdf'
};
const cluster=(id,title,codes,sources,figures=[],oral=[])=>({id,title,codes,sources,figures,oral});
const tracks={
 ppl:{
  key:'ppl',title:'Private Pilot',short:'PPL',standard:'FAA-S-ACS-6C',standardType:'ACS',standardUrl:FAA.ppl,testCode:'PAR',knowledgeTest:true,questionTarget:250,
  clusters:[
   cluster('qualifications','Pilot qualifications & privileges',['PA.I.A'],['14 CFR Part 61',FAA.ppl],[],['privileges']),
   cluster('airworthiness','Airworthiness & required equipment',['PA.I.B','PA.II.A'],['14 CFR Part 91','POH/AFM',FAA.ppl],[],['airworthiness']),
   cluster('weather','Weather information & aeromedical weather decisions',['PA.I.C'],['Aviation Weather Handbook','AIM',FAA.ppl],[{supplement:'FAA-CT-8080-2H',figures:['17']}],['weather']),
   cluster('planning','Cross-country planning & navigation',['PA.I.D','PA.VI'],['PHAK','current sectional/chart data',FAA.ppl],[{supplement:'FAA-CT-8080-2H',figures:['25','26','52']}],['planning']),
   cluster('airspace','Airspace, airport operations & markings',['PA.I.E','PA.III','PA.II.D'],['14 CFR Part 91','AIM',FAA.ppl],[{supplement:'FAA-CT-8080-2H',figures:['20','26','47','48','52','64','78']}],['airspace']),
   cluster('performance','Performance, W&B & limitations',['PA.I.F'],['POH/AFM','PHAK',FAA.ppl],[{supplement:'FAA-CT-8080-2H',figures:['8','32','33','35','38']}],['performance']),
   cluster('systems','Systems & aerodynamics',['PA.I.G','PA.VII'],['POH/AFM','PHAK','AFH',FAA.ppl],[],['systems']),
   cluster('human','Human factors & risk management',['PA.I.H'],['PHAK','FAA risk-management guidance',FAA.ppl],[],['risk']),
   cluster('abnormal','Emergency, abnormal & night operations',['PA.IX','PA.X','PA.XI'],['POH/AFM','AFH','AIM',FAA.ppl],[],['risk'])
  ]
 },
 ira:{
  key:'ira',title:'Instrument Rating',short:'IRA',standard:'FAA-S-ACS-8C',standardType:'ACS',standardUrl:FAA.ira,testCode:'IRA',knowledgeTest:true,questionTarget:300,
  clusters:[
   cluster('qualifications','Instrument privileges, currency & logging',['IR.I.A'],['14 CFR Part 61',FAA.ira],[],['currency']),
   cluster('weather','IFR weather, icing & convective hazards',['IR.I.B'],['Aviation Weather Handbook','AIM',FAA.ira],[],['weather']),
   cluster('planning','IFR cross-country, alternates, fuel & departures',['IR.I.C','IR.V.B'],['14 CFR Part 91','AIM','current charts/procedures',FAA.ira],[],['weather','clearance']),
   cluster('systems','IFR aircraft systems, instruments & avionics',['IR.II'],['POH/AFM','avionics supplements',FAA.ira],[],['aircraft','navigation']),
   cluster('clearances','ATC clearances, holding & lost-route reasoning',['IR.III'],['AIM',FAA.ira],[],['clearance','holding']),
   cluster('instruments','Flight by reference to instruments',['IR.IV'],['Instrument Flying Handbook',FAA.ira],[],['failures']),
   cluster('navigation','Navigation systems, departures, enroute & arrivals',['IR.V'],['AIM','current IFR charts',FAA.ira],[{supplement:'FAA-CT-8080-3F',figures:['174','175']}],['navigation','clearance']),
   cluster('approaches','Instrument approaches, missed & circling',['IR.VI'],['AIM','current procedures',FAA.ira],[{supplement:'FAA-CT-8080-3F',figures:['158','162','187','242','254']}],['approach']),
   cluster('emergencies','IFR emergencies, failures & lost communications',['IR.VII'],['AIM','POH/AFM',FAA.ira],[],['failures'])
  ]
 },
 cpl:{
  key:'cpl',title:'Commercial Pilot',short:'CPL',standard:'FAA-S-ACS-7B',standardType:'ACS',standardUrl:FAA.cpl,testCode:'CAX',knowledgeTest:true,questionTarget:300,
  clusters:[
   cluster('privileges','Commercial privileges, limitations & operating authority',['CA.I.A'],['14 CFR Parts 61, 91, 119',FAA.cpl],[],['privileges']),
   cluster('airworthiness','Airworthiness, maintenance & operational judgment',['CA.I.B'],['14 CFR Part 91','POH/AFM',FAA.cpl],[],['airworthiness']),
   cluster('weather','Weather products, theory & mission decisions',['CA.I.C'],['Aviation Weather Handbook','AIM',FAA.cpl],[],['weather']),
   cluster('planning','Cross-country planning, airspace & navigation',['CA.I.D','CA.I.E','CA.VI'],['AIM','current charts','PHAK',FAA.cpl],[{supplement:'FAA-CT-8080-1E',figures:['52','53','54']}],['weather']),
   cluster('performance','Performance, W&B & limitations',['CA.I.F'],['POH/AFM','PHAK',FAA.cpl],[{supplement:'FAA-CT-8080-1E',figures:['38']}],['performance']),
   cluster('systems','Systems, high-altitude & aircraft knowledge',['CA.I.G','CA.VIII'],['POH/AFM','PHAK',FAA.cpl],[],['systems']),
   cluster('aerodynamics','Aerodynamics, stalls & commercial maneuvers',['CA.V','CA.VII'],['AFH','PHAK',FAA.cpl],[],['aerodynamics','pivotal']),
   cluster('human','Human factors, external pressure & ADM',['CA.I.H'],['FAA risk-management guidance','PHAK',FAA.cpl],[],['weather']),
   cluster('abnormal','Emergency & abnormal operations',['CA.IX'],['POH/AFM','AFH',FAA.cpl],[],['abnormal']),
   cluster('multi','Commercial multiengine operations',['CA.IX.E','CA.IX.F','CA.IX.G','CA.X'],['POH/AFM','AFH',FAA.cpl],[],['critical','vmc','vyse','performance','zero','prop','systems','flow'])
  ]
 },
 multi:{
  key:'multi',title:'Multi-Engine Add-On',short:'MULTI',standard:'FAA-S-ACS-7B / FAA-S-ACS-6C applicable AMEL tasks',standardType:'ACS',standardUrl:FAA.cpl,testCode:'NO SEPARATE KNOWLEDGE TEST',knowledgeTest:false,questionTarget:160,
  note:'An airplane multiengine class add-on is driven by the applicable AMEL practical-test tasks; PilotDesk does not invent a separate FAA knowledge test.',
  clusters:[
   cluster('aero','Critical engine, VMC & asymmetric aerodynamics',['CA.X','AMEL applicable tasks'],['AFH','POH/AFM',FAA.cpl],[],['critical','vmc','vyse','zero']),
   cluster('performance','Single-engine performance & service ceiling',['CA.I.F','CA.X'],['POH/AFM performance section','AFH',FAA.cpl],[],['performance','vyse']),
   cluster('prop','Propeller/governor/feathering systems',['CA.I.G','CA.X'],['POH/AFM','AFH',FAA.cpl],[],['prop']),
   cluster('systems','Fuel, electrical, gear & crossfeed',['CA.I.G'],['POH/AFM',FAA.cpl],[],['systems']),
   cluster('takeoff','Engine failure during takeoff & after liftoff',['CA.IX.E','CA.IX.F'],['POH/AFM emergency procedures',FAA.cpl],[],['flow']),
   cluster('landing','OEI approach & landing',['CA.IX.G','CA.X.D'],['POH/AFM','current procedures',FAA.cpl],[],['flow','performance']),
   cluster('instrument','OEI instrument flight & approach',['CA.X.C','CA.X.D','IR.VII.B','IR.VII.C'],['Instrument ACS','POH/AFM',FAA.ira,FAA.cpl],[],['flow','performance']),
   cluster('decision','Identification, verification & risk decisions',['CA.X','CA.IX'],['POH/AFM','AFH','FAA risk-management guidance',FAA.cpl],[],['flow'])
  ]
 },
 cfi:{
  key:'cfi',title:'Flight Instructor',short:'CFI',standard:'FAA-S-ACS-25',standardType:'ACS',standardUrl:FAA.cfi,testCode:'FIA',knowledgeTest:true,questionTarget:300,
  clusters:[
   cluster('foi','Fundamentals of instructing',['FI.I'],['Aviation Instructor’s Handbook',FAA.cfi],[],['learning','lesson','debrief']),
   cluster('technical','Technical subject areas',['FI.II','AI.II'],['PHAK','AFH','AIM','14 CFR',FAA.cfi],[{supplement:'FAA-CT-8080-5H',figures:['30','45']}],['aero','airworthiness']),
   cluster('endorsements','Endorsements, logbooks & instructor responsibilities',['FI.II.K','AI.III'],['14 CFR Part 61','AC 61-65',FAA.cfi],[],['responsibility']),
   cluster('preflight','Preflight preparation & weather',['FI.III','AI.III'],['14 CFR','Aviation Weather Handbook',FAA.cfi],[],['risk','airworthiness']),
   cluster('lesson','Maneuver lesson development & presentation',['FI.IV'],['Aviation Instructor’s Handbook','AFH',FAA.cfi],[],['lesson','maneuver']),
   cluster('airport','Airport operations & runway-incursion instruction',['FI.V','FI.VI'],['AIM','AFH',FAA.cfi],[],['maneuver']),
   cluster('maneuvers','Takeoffs, landings, maneuvers & stalls',['FI.VII','FI.VIII','FI.IX','FI.X'],['AFH',FAA.cfi],[],['maneuver','aero']),
   cluster('navigation','Navigation & cross-country instruction',['FI.II.H','FI.II.I'],['AIM','PHAK',FAA.cfi],[],['risk']),
   cluster('emergency','Emergency instruction & risk management',['FI.XII','FI.XIII'],['AFH','POH/AFM',FAA.cfi],[],['risk','debrief'])
  ]
 },
 cfii:{
  key:'cfii',title:'Flight Instructor Instrument',short:'CFII',standard:'FAA-S-8081-9E',standardType:'PTS',standardUrl:FAA.cfii,testCode:'FII',knowledgeTest:true,questionTarget:250,
  clusters:[
   cluster('foi','Fundamentals of instructing',['PTS Area I'],['Aviation Instructor’s Handbook',FAA.cfii],[],['privileges']),
   cluster('technical','Instrument technical subject areas',['PTS Area II'],['Instrument Flying Handbook','AIM','14 CFR',FAA.cfii],[],['scan','legality','weather','automation']),
   cluster('preflight','Preflight preparation',['PTS Area III'],['14 CFR','AIM','Aviation Weather Handbook',FAA.cfii],[],['legality','weather']),
   cluster('lesson','Preflight lesson on maneuver/procedure',['PTS Area IV'],['Aviation Instructor’s Handbook',FAA.cfii],[],['holding','approach']),
   cluster('clearances','ATC clearances & procedures',['PTS Area V'],['AIM',FAA.cfii],[],['holding']),
   cluster('instruments','Flight by reference to instruments',['PTS Area VI'],['Instrument Flying Handbook',FAA.cfii],[],['scan','failure']),
   cluster('navigation','Navigation systems',['PTS Area VII'],['AIM','avionics supplements',FAA.cfii],[],['automation']),
   cluster('approaches','Instrument approach procedures',['PTS Area VIII'],['AIM','current procedures',FAA.cfii],[{supplement:'FAA-CT-8080-3F',figures:['242','254']}],['approach']),
   cluster('emergencies','Emergency operations & partial panel',['PTS Area IX'],['Instrument Flying Handbook','POH/AFM',FAA.cfii],[],['failure'])
  ]
 },
 atp:{
  key:'atp',title:'Airline Transport Pilot',short:'ATP',standard:'FAA-S-ACS-11A',standardType:'ACS',standardUrl:FAA.atp,testCode:'ATM',knowledgeTest:true,questionTarget:350,
  clusters:[
   cluster('systems','Transport aircraft systems',['AA.I.A'],['AFM/FCOM','FAA handbooks',FAA.atp],[],[]),
   cluster('performance','Performance, W&B & limitations',['AA.I.B'],['AFM performance data','FAA handbooks',FAA.atp],[{supplement:'FAA-CT-8080-7D',figures:['419']}],[]),
   cluster('weather','Weather information & hazards',['AA.I.C'],['Aviation Weather Handbook','AIM',FAA.atp],[{supplement:'FAA-CT-8080-7D',figures:['149']}],[]),
   cluster('highalt','High-altitude aerodynamics',['AA.I.D'],['Airplane Flying Handbook','FAA-S-ACS-11A',FAA.atp],[],[]),
   cluster('carrier','Air carrier operations, dispatch & safety programs',['AA.I.E','AA.I.G'],['14 CFR Parts 91/117/121/135 as applicable','company manuals',FAA.atp],[],[]),
   cluster('human','Human factors, CRM & ADM',['AA.I.F'],['FAA human-factors guidance',FAA.atp],[],[]),
   cluster('departures','Preflight, takeoff & departure procedures',['AA.II','AA.III','AA.VI.A','AA.VI.B'],['AFM/FCOM','current procedures',FAA.atp],[{supplement:'FAA-CT-8080-7D',figures:['269']}],[]),
   cluster('instrument','Arrival, approach, holding & missed procedures',['AA.VI'],['AIM','current procedures',FAA.atp],[{supplement:'FAA-CT-8080-7D',figures:['258','269']}],[]),
   cluster('emergency','Transport-category emergency operations',['AA.VII'],['AFM/QRH','FAA-S-ACS-11A',FAA.atp],[],[])
  ]
 }
};
const aliases={private:'ppl',instrument:'ira',commercial:'cpl',multiengine:'multi'};
function getTrack(key){const k=aliases[key]||key;return tracks[k]||tracks.ppl}
function matchCluster(trackKey,{standardCode='',area=''}={}){
 const t=getTrack(trackKey),code=String(standardCode||''),name=String(area||'').toLowerCase();
 return t.clusters.find(c=>c.codes.some(p=>code.startsWith(p)))||
        t.clusters.find(c=>name&&c.title.toLowerCase().split(/[,&]/).some(x=>x.trim().length>4&&name.includes(x.trim())))||null;
}
window.PilotDeskTrainingStandards={FAA,tracks,getTrack,matchCluster,aliases,reviewedAt:'2026-09-22'};
})();