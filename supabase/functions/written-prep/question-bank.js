const FAA_ACS='https://www.faa.gov/training_testing/testing/acs';
const STANDARDS={
  ppl:{doc:'FAA-S-ACS-6C',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf'},
  ira:{doc:'FAA-S-ACS-8C',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/instrument_rating_airplane_acs_8.pdf'},
  cpl:{doc:'FAA-S-ACS-7B',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/commercial_airplane_acs_7.pdf'},
  cfi:{doc:'FAA-S-ACS-25',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/cfi_airplane_acs_25.pdf'},
  atp:{doc:'FAA-S-ACS-11A',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/atp_airplane_acs_11.pdf'},
  cfii:{doc:'FAA-S-8081-9E',type:'PTS',url:'https://www.faa.gov/training_testing/testing/acs/cfi_instrument_pts_9.pdf'}
};
export const trackMeta={
  ppl:{label:'Private Pilot Airplane',testCode:'PAR',officialQuestions:60,officialMinutes:120,passingScore:70,description:'Private pilot regulations, weather, navigation, performance, systems, airport operations, and ADM.'},
  ira:{label:'Instrument Rating Airplane',testCode:'IRA',officialQuestions:60,officialMinutes:120,passingScore:70,description:'IFR regulations, weather, instruments, navigation, clearances, holding, and approaches.'},
  cpl:{label:'Commercial Pilot Airplane',testCode:'CAX',officialQuestions:100,officialMinutes:150,passingScore:70,description:'Commercial privileges, operations, performance, aerodynamics, weather, systems, and advanced planning.'},
  cfi:{label:'Flight Instructor Airplane',testCode:'FIA',officialQuestions:100,officialMinutes:150,passingScore:70,description:'Fundamentals of instructing, endorsements, lesson planning, assessment, maneuvers, and risk management.'},
  cfii:{label:'Flight Instructor Instrument Airplane',testCode:'FII',officialQuestions:50,officialMinutes:150,passingScore:70,description:'Instrument instruction, IFR regulations, systems, weather, procedures, approaches, and common student errors.'},
  atp:{label:'Airline Transport Pilot Multiengine',testCode:'ATM',officialQuestions:125,officialMinutes:210,passingScore:70,description:'Air-carrier regulations, turbine systems, high-altitude aerodynamics, IFR operations, weather, and CRM.'}
};
export const publicSources=[
 {label:'FAA Airman Certification Standards',url:FAA_ACS},
 {label:'Private Pilot Airplane ACS FAA-S-ACS-6C',url:STANDARDS.ppl.url},
 {label:'Instrument Rating Airplane ACS FAA-S-ACS-8C',url:STANDARDS.ira.url},
 {label:'Commercial Pilot Airplane ACS FAA-S-ACS-7B',url:STANDARDS.cpl.url},
 {label:'Flight Instructor Airplane ACS FAA-S-ACS-25',url:STANDARDS.cfi.url},
 {label:'ATP / Type Rating Airplane ACS FAA-S-ACS-11A',url:STANDARDS.atp.url},
 {label:'CFII Airplane/Helicopter PTS FAA-S-8081-9E',url:STANDARDS.cfii.url}
];
const r1=x=>Math.round(x*10)/10;
const r0=x=>Math.round(x);
const pad=n=>String(n).padStart(3,'0');
const diff=n=>n<25?'foundation':n<70?'applied':'advanced';
const q=(track,family,n,area,code,prompt,options,correct,explanation,reference,extra={})=>{
  const s=STANDARDS[track];
  return {id:`${track}-${family}-${pad(n+1)}`,area,prompt,options,correct,explanation,reference,source:'pilotdesk-faa-aligned',sourceUrl:s.url,standardCode:code,standardDoc:s.doc,standardType:s.type,difficulty:diff(n),experienceLevel:track,...extra};
};
const airports=['Bismarck','Fargo','Grand Forks','Minot','Rapid City','Billings','Helena','Duluth','Aberdeen','Sioux Falls'];
const fmtTime=min=>`${Math.floor(min/60)} hr ${Math.round(min%60)} min`;
const numericOptions=(correct,a,b,unit='')=>[`${correct}${unit}`,`${a}${unit}`,`${b}${unit}`];
const rotate=(arr,n)=>arr[n%arr.length];

function pplFuel(n){
 const night=n%2===1,burn=r1(7.4+(n%13)*.45),mins=70+(n*11)%150,res=night?45:30,need=r1(burn*(mins+res)/60),wrong1=r1(burn*(mins+(night?30:45))/60),wrong2=r1(burn*(mins+60)/60);
 return q('ppl','fuel',n,'Cross-Country Planning','PA.I.D.K3c',`A ${night?'night':'day'} VFR flight is planned for ${mins} minutes at ${burn.toFixed(1)} GPH. Ignoring taxi and unusable fuel, what is the minimum usable fuel that satisfies the regulatory reserve?`,numericOptions(need.toFixed(1),wrong1.toFixed(1),wrong2.toFixed(1),' gal'),0,`Day VFR requires 30 minutes reserve; night VFR requires 45 minutes at normal cruise. The required fuel is trip fuel plus the applicable reserve.`,'14 CFR 91.151; FAA-S-ACS-6C PA.I.D.K3c');
}
function pplTsd(n){
 const dist=75+(n*13)%285,gs=82+(n*9)%74,mins=r0(dist/gs*60),d1=r0(dist/(gs+10)*60),d2=r0(dist/(gs-10)*60);
 return q('ppl','tsd',n,'Cross-Country Planning','PA.I.D.K3a',`Your planned leg is ${dist} NM and the forecast groundspeed is ${gs} knots. Approximately how long will the leg take?`,[fmtTime(mins),fmtTime(d1),fmtTime(d2)],0,`Time equals distance divided by groundspeed. ${dist} ÷ ${gs} × 60 ≈ ${mins} minutes.`,'FAA-S-ACS-6C PA.I.D.K3a; FAA-H-8083-25');
}
function pplPressure(n){
 const elev=400+(n*137)%5200,setting=r1(28.92+((n*17)%180)/100),pa=r0((elev+(29.92-setting)*1000)/10)*10,sign=r0((elev-(29.92-setting)*1000)/10)*10,noadj=elev;
 return q('ppl','pressure-alt',n,'Performance','PA.I.F.K2a',`Airport elevation is ${elev} ft MSL and the altimeter setting is ${setting.toFixed(2)} inHg. Using the standard 1,000 ft per inch approximation, what is the pressure altitude?`,numericOptions(pa,sign,noadj,' ft'),0,`Pressure altitude is approximately field elevation + (29.92 − altimeter setting) × 1,000. That gives about ${pa} ft.`,'FAA-S-ACS-6C PA.I.F.K2a; FAA-H-8083-25');
}
function pplWb(n){
 const ew=1450+(n*11)%260,ea=38+(n%5),pax=150+(n*7)%80,pa=37+((n*3)%12),fuel=180+(n*13)%180,fa=48+((n*5)%8);
 const wt=ew+pax+fuel,m=ew*ea+pax*pa+fuel*fa,cg=r1(m/wt),d1=r1((m-pax*pa)/wt),d2=r1((m+fuel*4)/wt);
 return q('ppl','wb',n,'Performance & Weight/Balance','PA.I.F.K2f',`An airplane has ${ew} lb at ${ea} in, occupants/baggage totaling ${pax} lb at ${pa} in, and fuel weighing ${fuel} lb at ${fa} in. What is the loaded CG?`,numericOptions(cg.toFixed(1),d1.toFixed(1),d2.toFixed(1),' in'),0,`Add all moments, then divide total moment by total weight. The resulting CG is about ${cg.toFixed(1)} inches.`,'FAA-S-ACS-6C PA.I.F.K2f; FAA-H-8083-1');
}
const pplAirspaceCases=[
 ['Class B','ATC says your callsign followed by “standby.”','remain outside until ATC explicitly clears you into Class B','enter because your callsign was acknowledged','enter if Mode C is operating'],
 ['Class C','you have established two-way radio communications before entry','you may enter while maintaining the required communications','you must also hear the words “cleared into Class C”','you may enter only after receiving a discrete transponder code'],
 ['Class D','the tower replies with your full callsign and “standby”','two-way communications are established; comply with any instruction and remain alert','you must stay outside until the tower says “cleared into Class D”','you may enter only if the airport is reporting VFR'],
 ['Class E','you are operating VFR below 10,000 MSL','no ATC clearance is normally required solely to enter Class E','a specific Class E entry clearance is required','a transponder is always required everywhere in Class E'],
 ['Class G','you remain outside controlled airspace','ATC authorization is not required solely because the airspace is Class G','a Class G clearance is required above 1,200 AGL','two-way radio communications are required in all Class G']
];
function pplAirspace(n){
 const [cls,sit,c,a,b]=pplAirspaceCases[n%pplAirspaceCases.length];
 return q('ppl','airspace',n,'National Airspace System','PA.I.E.K1',`You are VFR near ${airports[n%airports.length]} in ${cls} airspace. ${sit} Which statement is correct?`,[c,a,b],0,`The applicable entry and communication requirement follows the rules for ${cls}.`,'FAA-S-ACS-6C PA.I.E.K1; 14 CFR parts 71 and 91; AIM');
}
const vfrMins=[
 {name:'Class E below 10,000 MSL',vis:3,cloud:'500 below, 1,000 above, 2,000 horizontal'},
 {name:'Class C',vis:3,cloud:'500 below, 1,000 above, 2,000 horizontal'},
 {name:'Class D',vis:3,cloud:'500 below, 1,000 above, 2,000 horizontal'},
 {name:'Class G daytime at or below 1,200 AGL',vis:1,cloud:'clear of clouds'},
 {name:'Class G nighttime at or below 1,200 AGL',vis:3,cloud:'500 below, 1,000 above, 2,000 horizontal'}
];
function pplVfrMins(n){
 const x=vfrMins[n%vfrMins.length];
 const wrongVis=x.vis===1?3:1, wrongCloud=x.cloud==='clear of clouds'?'500 below, 1,000 above, 2,000 horizontal':'clear of clouds';
 return q('ppl','vfr-mins',n,'National Airspace System','PA.I.E.K1',`For VFR in ${x.name}, which minimum visibility/cloud-clearance combination applies in the stated condition?`,[`${x.vis} SM; ${x.cloud}`,`${wrongVis} SM; ${x.cloud}`,`${x.vis} SM; ${wrongCloud}`],0,`The basic VFR weather minimum for this scenario is ${x.vis} SM with ${x.cloud}.`,'FAA-S-ACS-6C PA.I.E.K1; 14 CFR 91.155');
}
function pplMetar(n){
 const dir=(30+(n*20)%330),spd=6+(n*3)%24,gust=spd+5+(n%8),base=20+(n*7)%65;
 const group=`${String(dir).padStart(3,'0')}${String(spd).padStart(2,'0')}G${String(gust).padStart(2,'0')}KT`,ceil=`BKN${String(base).padStart(3,'0')}`;
 return q('ppl','metar',n,'Weather Information','PA.I.C.K2a',`A METAR contains “${group} ${ceil}”. Which interpretation is correct?`,[`Wind from ${dir}° true at ${spd} kt gusting ${gust}; broken ceiling ${base*100} ft AGL`,`Wind from ${dir}° magnetic at ${gust} kt; broken clouds ${base*10} ft MSL`,`Wind to ${dir}° true at ${spd} kt; visibility ${base} SM`],0,`METAR winds are reported from the stated direction in degrees true, and BKN is a ceiling layer with height reported in hundreds of feet AGL.`,'FAA-S-ACS-6C PA.I.C.K2a; Aviation Weather Handbook');
}
const wxHaz=[
 ['a fast-moving cold front with a narrow line of towering cumulus','expect the greatest concern to be turbulence, wind shifts, and convective development','assume smooth stratiform conditions because the front is moving quickly','expect no significant wind change after passage','PA.I.C.K3h'],
 ['freezing rain reported along the route','treat it as a serious icing threat because large supercooled droplets can overwhelm many protection systems','continue if the pitot heat works because freezing rain affects only the windshield','descend into the precipitation because freezing rain cannot exist below cloud base','PA.I.C.K3i'],
 ['stable moist air over a broad area','expect smoother air, stratiform clouds, and more widespread visibility restrictions','expect strong convective turbulence with scattered towering cumulus','expect clear skies because stable air prevents cloud formation','PA.I.C.K3a'],
 ['a temperature-dew point spread shrinking toward zero near sunset','anticipate increased fog/low-cloud risk if other factors are favorable','expect density altitude to fall below field elevation regardless of pressure','expect thunderstorms solely because the spread is small','PA.I.C.K3j']
];
function pplWeather(n){
 const [s,c,a,b,code]=wxHaz[n%wxHaz.length];
 return q('ppl','weather-hazard',n,'Weather Theory',code,`During preflight near ${airports[n%airports.length]}, you note ${s}. What is the best interpretation?`,[c,a,b],0,'The correct choice matches the FAA weather principles for the condition described.','FAA-S-ACS-6C '+code+'; Aviation Weather Handbook');
}
const sysCases=[
 ['pitot opening and drain hole are blocked while static remains open','the airspeed indicator can behave like an altimeter, increasing in a climb and decreasing in a descent','the altimeter freezes while airspeed remains normal','the VSI indicates zero while all other instruments remain normal','PA.I.G.K1h'],
 ['static port is blocked while pitot remains open','altimeter freezes near the blockage altitude and VSI trends to zero','airspeed immediately reads zero in all phases of flight','magnetic compass freezes at the current heading','PA.I.G.K1h'],
 ['alternator output is lost in a typical single-alternator airplane','the battery can power electrical loads only for a limited time, so load shedding and the checklist matter','the engine must stop immediately because magnetos require alternator power','all pitot-static instruments become unusable immediately','PA.I.G.K1f'],
 ['vacuum pump fails in a legacy six-pack that uses vacuum attitude and heading indicators','the attitude and heading indicators are the primary instruments threatened','the altimeter and VSI are the primary instruments threatened','the magnetic compass and tachometer both become inoperative','PA.I.G.K1h']
];
function pplSystems(n){
 const [s,c,a,b,code]=sysCases[n%sysCases.length];
 return q('ppl','systems',n,'Operation of Systems',code,`In flight, ${s}. Which indication or consequence is most consistent with that failure?`,[c,a,b],0,'The failure effects depend on the pressure or electrical source used by the affected instruments and systems.','FAA-S-ACS-6C '+code+'; FAA-H-8083-25');
}
const equipCases=[
 ['the landing light is inoperative for a day VFR flight in an aircraft not operated for hire','determine whether it is required by the type design, KOEL, AD, or another rule; if not, deactivate/placard as required','it is automatically legal because the flight is during daylight','the aircraft is automatically unairworthy until the bulb is replaced'],
 ['the position lights are inoperative for a planned night flight','the flight cannot depart at night unless the equipment requirement is otherwise legally satisfied','depart if a flashlight is carried','depart if the transponder and landing light work'],
 ['a required inspection is overdue','the aircraft is not legal for the operation until the applicable inspection requirement is satisfied or another specific authorization applies','a private pilot may extend any inspection by 10 hours','the inspection can be ignored if the flight remains in the local area'],
 ['an inoperative item is listed as required by an applicable AD','the item cannot simply be deferred under the basic 91.213(d) process','placarding it INOP always makes the flight legal','it may be ignored on any VFR flight']
];
function pplEquipment(n){
 const [s,c,a,b]=equipCases[n%equipCases.length];
 return q('ppl','equipment',n,'Airworthiness','PA.I.B.K3a',`Before flight, ${s}. What is the best regulatory conclusion?`,[c,a,b],0,'Inoperative-equipment decisions require checking all applicable requirements rather than relying on VFR status alone.','FAA-S-ACS-6C PA.I.B.K3a; 14 CFR 91.213');
}

function iraFuel(n){
 const toDest=60+(n*9)%150,toAlt=20+(n*7)%75,burn=r1(8.5+(n%11)*.55),mins=toDest+toAlt+45,correct=r1(burn*mins/60),d1=r1(burn*(toDest+toAlt+30)/60),d2=r1(burn*(toDest+45)/60);
 return q('ira','fuel',n,'IFR Flight Planning','IR.I.C.K3c',`An IFR flight requires an alternate. Time to destination is ${toDest} min, destination-to-alternate is ${toAlt} min, and cruise fuel flow is ${burn.toFixed(1)} GPH. Ignoring taxi/climb differences, what minimum usable fuel satisfies the basic Part 91 IFR reserve?`,numericOptions(correct.toFixed(1),d1.toFixed(1),d2.toFixed(1),' gal'),0,'Under the basic Part 91 IFR rule, fuel must cover destination, alternate when required, plus 45 minutes at normal cruise.','FAA-S-ACS-8C IR.I.C.K3c; 14 CFR 91.167');
}
function iraAlternate(n){
 const ceiling=1400+((n*300)%1800),vis=2+((n*7)%30)/10,required=ceiling<2000||vis<3;
 const c=required?'An alternate is required under the basic 1-2-3 rule':'An alternate is not required under the basic 1-2-3 rule';
 const a=required?'No alternate is required because visibility is at least 2 SM':'An alternate is required because the ceiling is below 3,000 ft';
 const b='The rule is based only on current weather at departure, so the forecast window does not matter';
 return q('ira','alternate',n,'IFR Flight Planning','IR.I.C.K1d',`From 1 hour before to 1 hour after ETA, the destination forecast calls for a ${ceiling}-ft ceiling and ${vis.toFixed(1)} SM visibility. Under the basic Part 91 “1-2-3” rule, what is the result?`,[c,a,b],0,'An alternate is not required by the basic rule only when the forecast ceiling is at least 2,000 ft and visibility at least 3 SM throughout the specified window.','FAA-S-ACS-8C IR.I.C.K1d; 14 CFR 91.169');
}
function iraHoldSpeed(n){
 const alt=3000+(n*700)%18000,limit=alt<=6000?200:alt<=14000?230:265;
 const opts=limit===200?['200 KIAS','230 KIAS','265 KIAS']:limit===230?['230 KIAS','200 KIAS','265 KIAS']:['265 KIAS','230 KIAS','200 KIAS'];
 return q('ira','hold-speed',n,'Holding Procedures','IR.III.B.K1',`Unless otherwise published, what is the standard maximum holding airspeed at ${alt.toLocaleString()} ft MSL?`,opts,0,`The standard maximum is ${limit} KIAS for this altitude band.`,'FAA-S-ACS-8C IR.III.B.K1; AIM 5-3-8');
}
const lostRoutes=[
 ['assigned a route, then told “expect direct JERES after 10 minutes,” with no vector in effect','fly the assigned route until the expected route becomes applicable under 91.185','proceed direct JERES immediately because it was expected','fly the originally filed route regardless of later ATC instructions'],
 ['being radar vectored to intercept V12 when communications fail','continue the vector to the point/fix/route specified in the vector clearance, then follow AVEF priority','immediately turn direct to the destination','return to the last filed airway even if that conflicts with the vector instruction'],
 ['cleared direct ABC, then “expect DEF after ABC,” and communications fail before ABC','continue the assigned direct ABC, then use the expected route when applicable','skip ABC and proceed direct DEF immediately','descend and continue VFR regardless of conditions']
];
function iraLostComms(n){
 const [s,c,a,b]=lostRoutes[n%lostRoutes.length];
 return q('ira','lost-comms',n,'ATC Clearances','IR.III.A.K3',`While IMC, you are ${s}. Which route action best matches the lost-communications priority?`,[c,a,b],0,'Route priority under 14 CFR 91.185 is commonly remembered as Assigned, Vectored, Expected, Filed, applied to the actual clearance situation.','FAA-S-ACS-8C IR.III.A.K3; 14 CFR 91.185');
}
function iraPitot(n){
 const cases=[
 ['static system becomes blocked while pitot remains open','altimeter freezes near the blockage altitude; VSI trends to zero; airspeed becomes unreliable with altitude changes','airspeed reads zero while altimeter and VSI remain normal','all gyroscopic instruments tumble immediately'],
 ['pitot opening and drain hole are blocked while static remains open','airspeed can increase in a climb and decrease in a descent like an altimeter','airspeed remains frozen at the blockage value regardless of altitude','altimeter reads zero while VSI remains normal'],
 ['vacuum source fails in a traditional vacuum-driven attitude/heading system','attitude and heading indicators are the primary instruments threatened','turn coordinator and magnetic compass are the primary instruments threatened','altimeter and airspeed indicator are the primary instruments threatened']
 ]; const [s,c,a,b]=cases[n%cases.length];
 return q('ira','pitot-static',n,'Flight Instruments','IR.II.B.K1a',`During instrument flight, ${s}. Which indication is most consistent with the failure?`,[c,a,b],0,'Instrument indications follow the pressure or power source available to each instrument.','FAA-S-ACS-8C IR.II.B.K1a; Instrument Flying Handbook');
}
function iraVor(n){
 const check=rotate(['VOT','ground checkpoint','airborne checkpoint'],n),tol=check==='airborne checkpoint'?6:4,err=1+(n*3)%8,pass=err<=tol;
 return q('ira','vor',n,'Navigation Equipment','IR.II.B.K2a',`A VOR check is performed at an FAA-designated ${check} and shows ${err}° error. Is that result within the standard tolerance for IFR use?`,[pass?`Yes; the allowable error is ±${tol}°`:`No; the allowable error is ±${tol}°`,pass?`No; only ±2° is allowed`:`Yes; ±10° is allowed`,`The result is acceptable only if the check was performed within 90 days`],0,`The standard tolerance for this check is ±${tol}°. IFR VOR checks must also meet the recency requirement in 14 CFR 91.171.`,'FAA-S-ACS-8C IR.II.B.K2a; 14 CFR 91.171');
}
function iraApproach(n){
 const gs=85+(n*5)%55,gradient=300+(n%7)*18,vs=r0(gs*gradient/60),d1=r0(gs*gradient/100),d2=r0((gs+20)*gradient/60);
 return q('ira','approach',n,'Instrument Approaches','IR.VI.B.K1',`On final, groundspeed is ${gs} kt and the published descent gradient is ${gradient} ft/NM. Approximately what descent rate is required?`,numericOptions(vs,d1,d2,' fpm'),0,`Descent rate ≈ groundspeed × gradient ÷ 60. ${gs} × ${gradient} ÷ 60 ≈ ${vs} fpm.`,'FAA-S-ACS-8C IR.VI.B.K1; Terminal Procedures Publications');
}
const missedCases=[
 ['at DA with none of the required visual references distinctly visible','initiate the missed approach immediately','continue 100 ft below DA to look for the runway','level at DA and continue indefinitely until the runway appears'],
 ['before the MAP, the approach becomes unstabilized and cannot be corrected promptly','execute a missed approach/go-around rather than forcing the approach','continue because a missed approach is only permitted at the MAP','descend below MDA to regain a normal descent angle'],
 ['ATC issues an instruction during the missed approach that you cannot safely comply with','advise ATC that you are unable and request an alternative','deviate silently and explain after landing','stop the climb until ATC issues another clearance']
];
function iraMissed(n){
 const [s,c,a,b]=missedCases[n%missedCases.length];
 return q('ira','missed',n,'Missed Approach','IR.VI.C.K1',`During an instrument approach, ${s}. What is the best action?`,[c,a,b],0,'Missed-approach decisions protect obstacle clearance and stabilized-flight margins and must comply with the published procedure or ATC clearance unless unable.','FAA-S-ACS-8C IR.VI.C.K1; AIM 5-4');
}
function iraIcing(n){
 const cases=[
 ['freezing rain is reported along the route','treat it as a severe icing warning sign and avoid the area with substantial margin','assume approved pitot heat makes the route acceptable','continue if the OAT is below freezing because liquid water cannot exist'],
 ['tops are above the aircraft ceiling and moderate icing is forecast through the entire altitude band','re-plan to avoid the icing exposure rather than relying on an escape climb','accept the route if the autopilot is operative','depart because forecast icing is not operationally relevant until ice is observed'],
 ['an icing encounter begins degrading airspeed and climb performance','use the aircraft procedures and exit the icing conditions promptly','wait for a large accumulation so the deice system has more to remove','reduce power to minimize ram-air impact']
 ];const [s,c,a,b]=cases[n%cases.length];
 return q('ira','icing',n,'IFR Weather','IR.I.B.K3i',`For an IFR flight, ${s}. Which response best reflects the hazard?`,[c,a,b],0,'Icing risk requires respecting aircraft limitations, forecasts, escape options, and the limitations of anti-ice/deice systems.','FAA-S-ACS-8C IR.I.B.K3i; Aviation Weather Handbook');
}
function iraPlanning(n){
 const dist=110+(n*17)%420,gs=95+(n*11)%80,burn=r1(9+(n%12)*.6),mins=r0(dist/gs*60),fuel=r1(burn*mins/60);
 return q('ira','planning',n,'IFR Flight Planning','IR.I.C.K3a',`An IFR leg is ${dist} NM. Planned groundspeed is ${gs} kt and cruise fuel flow is ${burn.toFixed(1)} GPH. Which pair is closest to the en route time and cruise fuel for that leg, before reserve?`,[`${mins} min / ${fuel.toFixed(1)} gal`,`${r0(dist/(gs+15)*60)} min / ${r1(burn*dist/(gs+15)).toFixed(1)} gal`,`${r0(dist/(gs-15)*60)} min / ${r1(burn*dist/(gs-15)).toFixed(1)} gal`],0,'Use groundspeed—not TAS—to compute time, then multiply hours by cruise fuel flow.','FAA-S-ACS-8C IR.I.C.K3a; FAA-H-8083-25');
}

const holdingOutCases=[
 ['advertises sightseeing flights to the general public using an airplane the pilot provides','this can involve holding out/common carriage and may require an operating certificate beyond a commercial pilot certificate','a commercial certificate alone authorizes any transportation for compensation','it is private carriage because each passenger buys a separate seat'],
 ['flies an employer’s airplane carrying company employees as an incidental part of the pilot’s job','this can be permissible commercial-pilot activity depending on the operation and applicable rules','this is automatically common carriage because passengers are carried','this always requires a Part 121 certificate'],
 ['offers pilot services only, while the customer furnishes and controls the airplane','this is materially different from providing both pilot and aircraft; the specific operation still must meet applicable rules','this automatically becomes scheduled air-carrier service','a commercial certificate prohibits being paid unless the pilot owns the airplane']
];
function cplPrivileges(n){
 const [s,c,a,b]=holdingOutCases[n%holdingOutCases.length];
 return q('cpl','privileges',n,'Commercial Privileges','CA.I.A.K2',`A commercial pilot ${s}. Which statement is most accurate?`,[c,a,b],0,'A commercial pilot certificate grants pilot privileges, but it is not itself an operating certificate. Holding out, common carriage, and who provides operational control matter.','FAA-S-ACS-7B CA.I.A.K2; 14 CFR parts 61, 91, 119');
}
function cplAirworthy(n){
 const cases=[
 ['an anti-collision light required by the aircraft’s KOEL is inoperative','the item cannot be ignored merely because the flight is daytime VFR; the applicable equipment/KOEL requirements control','placard it INOP and depart because all lights are optional in daylight','remove the bulb and no further action is required'],
 ['an AD requires inspection every 100 hours and the interval has expired','the airplane is not airworthy for the affected operation until the AD requirement is complied with or a specific provision permits otherwise','the PIC may extend any AD interval by 10 percent','an AD does not apply to privately operated aircraft'],
 ['a nonrequired cabin convenience light fails and no MEL applies','use the 91.213 process to determine whether it may be deactivated/placarded and the aircraft safely operated','all electrical equipment must be operative on a commercial-pilot flight','the discrepancy may be ignored without documentation']
 ];const [s,c,a,b]=cases[n%cases.length];
 return q('cpl','airworthy',n,'Airworthiness','CA.I.B.K3a',`During preflight, ${s}. Which conclusion is best?`,[c,a,b],0,'Commercial-level airworthiness decisions require checking the aircraft documents, regulations, ADs, KOEL/MEL, and safe-operation requirements.','FAA-S-ACS-7B CA.I.B.K3a; 14 CFR 91.213');
}
function cplFuel(n){
 const mins=90+(n*13)%210,burn=r1(9.5+(n%14)*.6),night=n%2,res=night?45:30,need=r1(burn*(mins+res)/60),d1=r1(burn*(mins+(night?30:45))/60),d2=r1(burn*(mins+60)/60);
 return q('cpl','fuel',n,'Cross-Country Planning','CA.I.D.K3c',`For a ${night?'night':'day'} VFR commercial cross-country, cruise time is ${mins} min at ${burn.toFixed(1)} GPH. Ignoring taxi/climb differences, what is the minimum usable fuel under the basic VFR reserve rule?`,numericOptions(need.toFixed(1),d1.toFixed(1),d2.toFixed(1),' gal'),0,'The reserve is 30 minutes by day and 45 minutes by night at normal cruise, in addition to fuel to the first intended landing.','FAA-S-ACS-7B CA.I.D.K3c; 14 CFR 91.151');
}
function cplAirspace(n){
 const [cls,sit,c,a,b]=pplAirspaceCases[(n+2)%pplAirspaceCases.length];
 return q('cpl','airspace',n,'National Airspace System','CA.I.E.K1',`A commercial-pilot flight is approaching ${cls}. ${sit} Which statement is correct?`,[c,a,b],0,'The same underlying airspace entry and equipment rules apply regardless of the pilot holding a commercial certificate.','FAA-S-ACS-7B CA.I.E.K1; 14 CFR parts 71 and 91; AIM');
}
function cplPerformance(n){
 const base=900+(n*37)%1700,weightPct=1+((n%11)-5)/100,daPenalty=.8+((n*7)%17)/100,windFactor=.9+((n*3)%9)/100;
 const result=r0(base*weightPct*daPenalty*windFactor/10)*10,omit=r0(result*1.08/10)*10,wrong=r0(result*.92/10)*10;
 return q('cpl','performance',n,'Performance & Limitations','CA.I.F.K1',`A POH interpolation gives a ${base}-ft baseline takeoff distance. Applying the scenario’s weight factor ${weightPct.toFixed(2)}, density-altitude factor ${daPenalty.toFixed(2)}, and runway/wind factor ${windFactor.toFixed(2)}, what adjusted distance is closest?`,numericOptions(result,omit,wrong,' ft'),0,'Performance adjustments must be applied to the correct baseline in the manner specified by the approved data. Multiplying the stated factors gives the closest listed value.','FAA-S-ACS-7B CA.I.F.K1; POH/AFM');
}
function cplWb(n){
 const wt=2200+(n*19)%800,cg=39+((n*7)%50)/10,move=80+(n*11)%220,dist=20+(n*5)%45,shift=r1(move*dist/wt),aft=n%2===0,newcg=r1(cg+(aft?shift:-shift));
 const d1=r1(cg+(aft?-shift:shift)),d2=r1(cg+(aft?shift*2:-shift*2));
 return q('cpl','wb-shift',n,'Performance & Limitations','CA.I.F.K2e',`An airplane weighs ${wt} lb with a CG of ${cg.toFixed(1)} in. ${move} lb is moved ${dist} in ${aft?'aft':'forward'}. Approximately where will the new CG be?`,numericOptions(newcg.toFixed(1),d1.toFixed(1),d2.toFixed(1),' in'),0,'CG shift ≈ weight moved × distance moved ÷ total weight, in the direction the weight is moved.','FAA-S-ACS-7B CA.I.F.K2e; FAA-H-8083-1');
}
function cplAero(n){
 const bank=rotate([30,45,60,50,55],n),rad=bank*Math.PI/180,load=1/Math.cos(rad),stall=50+(n%9),newVs=r1(stall*Math.sqrt(load));
 const d1=r1(stall*load),d2=r1(stall/Math.sqrt(load));
 return q('cpl','aero',n,'Aerodynamics','CA.I.F.K3',`An airplane stalls at ${stall} KIAS in unaccelerated 1-G flight. In a coordinated level ${bank}° bank turn, approximately what is the accelerated stall speed?`,numericOptions(newVs.toFixed(1),d1.toFixed(1),d2.toFixed(1),' KIAS'),0,'In level banked flight, load factor is about 1/cos(bank), and stall speed varies with the square root of load factor.','FAA-S-ACS-7B CA.I.F.K3; FAA-H-8083-3');
}
function cplSystems(n){
 const cases=[
 ['an alternator fails in a piston airplane with magneto ignition','the engine can continue running because the magnetos are engine-driven, but battery endurance and electrical loads become critical','the engine stops immediately because ignition power is lost','the pitot tube stops producing pressure'],
 ['the static source becomes blocked','the altimeter can freeze and the VSI trends to zero while airspeed becomes altitude-sensitive','all gyroscopic instruments tumble immediately','the tachometer reads zero'],
 ['a constant-speed propeller governor commands a lower RPM','it increases blade angle (coarsens pitch) to reduce RPM','it decreases blade angle toward low pitch to reduce RPM','it changes mixture automatically to reduce RPM']
 ];const [s,c,a,b]=cases[n%cases.length];
 const code=s.includes('static')?'CA.I.G.K1h':s.includes('propeller')?'CA.I.G.K1c':'CA.I.G.K1f';
 return q('cpl','systems',n,'Operation of Systems',code,`During commercial-level systems review, ${s}. Which statement is correct?`,[c,a,b],0,'The correct response follows the operating principle of the affected aircraft system.','FAA-S-ACS-7B '+code+'; FAA-H-8083-3');
}
function cplWeather(n){
 const [s,c,a,b,raw]=wxHaz[(n+1)%wxHaz.length],code=raw.replace('PA.','CA.');
 return q('cpl','weather',n,'Weather Theory',code,`You are evaluating a commercial flight and note ${s}. Which interpretation best preserves operational margins?`,[c,a,b],0,'Commercial decision-making should identify the hazard and preserve a practical escape or avoidance margin rather than relying on equipment as a substitute for weather avoidance.','FAA-S-ACS-7B '+code+'; Aviation Weather Handbook');
}
const admCases=[
 ['a customer repeatedly pressures you to depart before a line of storms reaches the airport','recognize external pressure and continuation bias; reset the decision using objective limits and alternatives','depart sooner so the pressure is removed','raise the maximum acceptable crosswind because the customer is waiting'],
 ['the avionics display matches what you expected, but a raw-data indication disagrees','cross-check independent information and consider confirmation/expectation bias','ignore the raw data because the automation is normally more accurate','continue until a second automated alert appears'],
 ['you are legally current but have not flown the aircraft type in months','treat currency and proficiency as separate questions and add margin or training as needed','assume legal currency proves proficiency','reduce preflight planning because the flight is familiar']
];
function cplAdm(n){
 const [s,c,a,b]=admCases[n%admCases.length];
 return q('cpl','adm',n,'Human Factors & ADM','CA.I.H.K4',`Before or during a commercial flight, ${s}. What is the best ADM response?`,[c,a,b],0,'Commercial-level ADM requires recognizing biases and external pressures, then deliberately protecting safety margins.','FAA-S-ACS-7B CA.I.H.K4; FAA-H-8083-2');
}

const defense=[
 ['a learner blames the instructor for every poor landing while refusing to discuss control inputs','projection','rationalization','compensation'],
 ['a learner says “the checkride does not matter to me anyway” immediately after a disappointing mock oral','reaction formation','projection','displacement'],
 ['a learner invents a reasonable-sounding excuse for skipping weather planning after arriving unprepared','rationalization','denial','compensation'],
 ['a learner refuses to acknowledge obvious signs of fatigue before a flight','denial','projection','reaction formation'],
 ['a learner who feels weak in radio work becomes excessively focused on perfect checklist callouts to cover the insecurity','compensation','displacement','denial']
];
function cfiDefense(n){
 const [s,c,a,b]=defense[n%defense.length];
 return q('cfi','defense',n,'Human Behavior','FI.I.A.K1e',`During instruction, ${s}. Which defense mechanism best fits the behavior?`,[c,a,b],0,'The scenario is a practical example of the named defense mechanism. CFI-level preparation should distinguish similar mechanisms by the learner behavior, not by memorizing definitions alone.','FAA-S-ACS-25 FI.I.A.K1e; Aviation Instructor’s Handbook');
}
const barriers=[
 ['you use dense avionics jargon with a new pre-solo learner who does not yet know the terms','lack of common experience / confusing terminology','lack of learner motivation','poor physical aircraft control'],
 ['a learner hears “increase your scan” but interprets that as moving the head faster rather than distributing attention','confusion between symbol and symbolized object / imprecise communication','overlearning','positive transfer'],
 ['the learner is highly anxious about turbulence and stops processing a long explanation','interference from emotional factors and limited attention','primacy','rote learning']
];
function cfiComm(n){
 const [s,c,a,b]=barriers[n%barriers.length];
 return q('cfi','communication',n,'Effective Communication','FI.I.A.K4b',`As an instructor, ${s}. What communication barrier is most relevant?`,[c,a,b],0,'Effective instruction depends on shared meaning, manageable workload, and communication matched to the learner’s experience and state.','FAA-S-ACS-25 FI.I.A.K4b; Aviation Instructor’s Handbook');
}
const theories=[
 ['a learner changes behavior because correct checklist use is consistently reinforced','behaviorism','cognitive theory','negative transfer'],
 ['a learner builds a mental model connecting weather, performance, and route decisions rather than memorizing isolated facts','cognitive theory','behaviorism','drill-only learning'],
 ['a learner practices a response and receives immediate knowledge of results after each attempt','behaviorist reinforcement within skill acquisition','latent inhibition','defense mechanism']
];
function cfiTheory(n){
 const [s,c,a,b]=theories[n%theories.length];
 return q('cfi','learning-theory',n,'Learning Process','FI.I.B.K2',`Which learning-theory concept best describes this training example: ${s}?`,[c,a,b],0,'The best answer matches how the learner is acquiring or modifying knowledge/behavior in the scenario.','FAA-S-ACS-25 FI.I.B.K2; Aviation Instructor’s Handbook');
}
const laws=[
 ['the first procedure a learner practices is taught correctly because the first learned version is especially persistent','primacy','effect','exercise'],
 ['a learner is more likely to retain a skill after meaningful, successful practice that produces a satisfying result','effect','primacy','readiness'],
 ['a learner arrives mentally and physically prepared for a lesson and therefore learns more efficiently','readiness','intensity','recency'],
 ['a vivid, realistic scenario is remembered better than a weak abstract presentation','intensity','exercise','primacy']
];
function cfiLaws(n){
 const [s,c,a,b]=laws[n%laws.length];
 return q('cfi','laws',n,'Learning Process','FI.I.B.K5',`Which law/principle of learning is best illustrated when ${s}?`,[c,a,b],0,'The scenario maps to the named learning principle as described in the Aviation Instructor’s Handbook.','FAA-S-ACS-25 FI.I.B.K5; Aviation Instructor’s Handbook');
}
const domains=[
 ['the learner computes a weight-and-balance problem and explains the result','cognitive','psychomotor','affective'],
 ['the learner physically performs a coordinated steep turn to standards','psychomotor','cognitive','affective'],
 ['the learner adopts a consistent personal commitment to conservative weather minimums','affective','psychomotor','cognitive']
];
function cfiDomains(n){
 const [s,c,a,b]=domains[n%domains.length];
 return q('cfi','domains',n,'Learning Process','FI.I.B.K6',`Which learning domain is primarily being developed when ${s}?`,[c,a,b],0,'Cognitive concerns knowledge/thinking, psychomotor concerns physical skill, and affective concerns attitudes, values, and beliefs.','FAA-S-ACS-25 FI.I.B.K6; Aviation Instructor’s Handbook');
}
const memory=[
 ['a learner applies prior tailwind-landing experience incorrectly to a short-field landing and it interferes with the new task','negative transfer','positive transfer','rote memory'],
 ['a learner recalls a checklist item more reliably because it is used repeatedly in realistic contexts','retention strengthened through meaningful use','sensory memory only','defense mechanism'],
 ['a learner initially plateaus during instrument scan practice despite continued effort','a learning plateau that calls for diagnosis and varied practice, not punishment','proof that learning has stopped permanently','negative transfer by definition']
];
function cfiMemory(n){
 const [s,c,a,b]=memory[n%memory.length],code=n%3===0?'FI.I.B.K16':n%3===1?'FI.I.B.K15':'FI.I.B.K9d';
 return q('cfi','memory-transfer',n,'Learning Process',code,`During training, ${s}. Which concept best explains the situation?`,[c,a,b],0,'The scenario should be diagnosed using the applicable learning, retention, or transfer concept rather than a superficial label.','FAA-S-ACS-25 '+code+'; Aviation Instructor’s Handbook');
}
function cfiLesson(n){
 const scenario=rotate(['short-field landing','cross-country diversion','power-off stall','instrument scan','runway-incursion avoidance'],n);
 const c=`state a measurable objective and completion standard for the ${scenario}, then choose content and practice that support that objective`;
 return q('cfi','lesson',n,'Course Development & Lesson Plans','FI.I.C.K3',`You are writing a lesson for ${scenario}. Which planning step best matches an ACS-based performance lesson?`,[c,`list every fact you know about ${scenario} first and decide the objective after the lesson`,`avoid stating a completion standard so the learner does not feel evaluated`],0,'An effective lesson starts with clear objectives and completion standards, then organizes teaching and practice around them.','FAA-S-ACS-25 FI.I.C.K3; Aviation Instructor’s Handbook');
}
const methods=[
 ['you first explain and show a steep turn, the learner performs it while you supervise, and then you evaluate the result','demonstration-performance','lecture only','drill and practice without demonstration'],
 ['you want learners to analyze several weather options and defend a go/no-go decision to the group','guided discussion','pure lecture','rote drill'],
 ['a learner already understands a radio-call format and now needs repeated accurate practice','drill and practice','discovery learning only','lecture']
];
function cfiMethods(n){
 const [s,c,a,b]=methods[n%methods.length];
 return q('cfi','methods',n,'Teaching Methods','FI.I.C.K5',`Which teaching method best fits this instructional need: ${s}?`,[c,a,b],0,'The method should match the objective, learner readiness, and type of knowledge or skill being developed.','FAA-S-ACS-25 FI.I.C.K5; Aviation Instructor’s Handbook');
}
const assess=[
 ['“What would make you discontinue this approach before reaching DA?”','an effective higher-order question because it probes judgment and application','a yes/no question that measures only recall','a trick question because more than one condition could exist'],
 ['an instructor gives specific, objective feedback tied to the stated completion standard and asks the learner to self-assess','an effective learner-centered assessment','a punitive critique','an invalid assessment because learners should never participate'],
 ['the instructor asks “You know the stall speed is 50 knots, right?”','a leading question that should be avoided when assessing knowledge','an ideal open-ended question','an authentic scenario-based assessment']
];
function cfiAssess(n){
 const [s,c,a,b]=assess[n%assess.length],code=n%3===0?'FI.I.D.K6a':n%3===1?'FI.I.D.K3a':'FI.I.D.K6b';
 return q('cfi','assessment',n,'Assessment & Testing',code,`Consider this assessment example: ${s} Which evaluation is most accurate?`,[c,a,b],0,'CFI assessment should use valid, objective, appropriately challenging questions and feedback that supports learner self-assessment and standards-based improvement.','FAA-S-ACS-25 '+code+'; Aviation Instructor’s Handbook');
}
const cfiRecordCases=[
 ['you provide required training and an endorsement for a student pilot solo operation','make the required logbook/record entries and retain instructor records for the applicable period','only the student keeps records; the instructor never retains any','a verbal authorization is sufficient if the flight is local'],
 ['you endorse an applicant for a practical test','verify the required training, aeronautical experience, knowledge-test prerequisites, and applicable endorsements before signing','sign whenever the applicant requests it because the evaluator decides eligibility','use a generic endorsement that omits the regulation cited'],
 ['a learner fails a practical test and returns for additional training','document the additional training and endorsement required before retest','no additional endorsement is permitted after a failure','erase the original endorsement and issue a new certificate']
];
function cfiRecords(n){
 const [s,c,a,b]=cfiRecordCases[n%cfiRecordCases.length];
 return q('cfi','records',n,'Instructor Responsibilities','AI.III.A.K1',`As a flight instructor, ${s}. What is the best recordkeeping/endorsement practice?`,[c,a,b],0,'Instructor certification, endorsement, and recordkeeping responsibilities are regulatory and must be documented accurately.','FAA-S-ACS-25 AI.III.A.K1; 14 CFR part 61; AC 61-65');
}

const atpMel=[
 ['an item is inoperative but specifically permitted by the operator’s MEL subject to maintenance and operating procedures','follow the MEL procedures, limitations, placarding, and repair-category requirements before dispatch','use the CDL because all inoperative equipment is a configuration deviation','ignore the MEL if the captain considers the item nonessential'],
 ['an external fairing is missing and the approved CDL contains a performance penalty for that configuration','apply the CDL limitation/performance adjustment and required procedures','treat it as an MEL item with no aerodynamic effect','dispatch with no documentation because the part is external'],
 ['a required system is not listed as deferrable in the applicable MEL','it cannot simply be deferred under the MEL; another specific authorization or repair is required','the captain may add it to the MEL for one flight','the dispatcher can verbally waive the MEL']
];
function atpMelQ(n){
 const [s,c,a,b]=atpMel[n%atpMel.length];
 return q('atp','mel-cdl',n,'Aircraft Systems & MEL/CDL','AA.I.A.K17',`In an air-carrier context, ${s}. Which action is correct?`,[c,a,b],0,'MEL and CDL authority comes from approved documents and specified procedures; crews cannot invent deferrals.','FAA-S-ACS-11A AA.I.A.K17; approved MEL/CDL');
}
function atpPerformance(n){
 const v1=120+(n%18),vr=v1+3+(n%5),v2=vr+7+(n%6),rwy=6500+(n*137)%4500,contam=n%3===0;
 return q('atp','performance',n,'Performance & Limitations','AA.I.B.K3',`For a transport-category departure, calculated V1/VR/V2 are ${v1}/${vr}/${v2} kt and runway available is ${rwy} ft${contam?' with reported contamination':''}. Which planning principle is most important before accepting the numbers?`,[`Use the operator’s approved performance data with the actual runway, weather, configuration${contam?', contamination/RCAM data':''}, and aircraft weight`,`Use the dry-runway numbers because V-speeds already include every runway condition`,`Use the highest published V2 for the fleet regardless of actual weight`],0,'Transport performance must come from approved data for the actual configuration, weight, environment, and runway condition.','FAA-S-ACS-11A AA.I.B.K3; AFM/operator performance system');
}
const atpIce=[
 ['light freezing precipitation is falling during the holdover-time window and precipitation intensity increases','reassess holdover validity and perform required contamination checks rather than assuming the original time remains valid','extend the holdover time because colder fluid lasts longer regardless of precipitation','depart as long as engine anti-ice is on'],
 ['the wing has a small amount of adhering frost before takeoff','apply the clean-wing concept and remove contamination as required before takeoff','depart because a thin roughness layer improves low-speed lift','use a higher V2 instead of removing the contamination'],
 ['runway condition codes deteriorate after performance was calculated','obtain the updated runway condition information and recalculate/verify performance under the operator’s procedures','keep the original data because RCAM only affects landing','use maximum reverse thrust as a substitute for recalculation']
];
function atpIcing(n){
 const [s,c,a,b]=atpIce[n%atpIce.length],code=n%3===2?'AA.I.B.K9':'AA.I.B.K7';
 return q('atp','icing-rcam',n,'Icing & Runway Condition',code,`During preflight, ${s}. What is the best response?`,[c,a,b],0,'The clean-wing concept, holdover guidance, and runway-condition assessment require current conditions and approved procedures.','FAA-S-ACS-11A '+code+'; AC 120-60 / RCAM guidance');
}
const highAlt=[
 ['weight increases at the same high-altitude temperature','the airplane’s maximum usable altitude and buffet margin generally decrease','the high-speed and low-speed buffet boundaries move farther apart','stall angle of attack increases enough to remove low-speed buffet risk'],
 ['altitude increases while indicated airspeed is held constant in the high-altitude regime','true airspeed and Mach number generally increase','true airspeed decreases while Mach remains fixed','Mach decreases because indicated airspeed is constant'],
 ['the airplane is slowed near maximum altitude at high weight','low-speed buffet/stall margin can become very small while high-speed buffet remains nearby','the operating margin always expands as airspeed decreases','VMO/MMO no longer limits the airplane above FL180'],
 ['bank angle is increased substantially at high altitude','load factor rises and the low-speed buffet/stall boundary moves to a higher speed','load factor falls because true airspeed is high','only the high-speed buffet boundary is affected']
];
function atpHighAlt(n){
 const [s,c,a,b]=highAlt[n%highAlt.length],code=rotate(['AA.I.D.K5','AA.I.D.K3','AA.I.D.K6','AA.I.D.K4'],n);
 return q('atp','high-alt',n,'High-Altitude Aerodynamics',code,`At high altitude, ${s}. Which statement is correct?`,[c,a,b],0,'High-altitude margins depend on Mach, weight, temperature, load factor, and the convergence of low- and high-speed buffet boundaries.','FAA-S-ACS-11A '+code+'; AC 61-107 / FAA-H-8083-3');
}
const turbine=[
 ['a high-bypass turbofan suffers a compressor stall','possible indications include bangs, vibration, EGT rise, and thrust loss; apply the aircraft abnormal procedure','the only reliable indication is an oil quantity increase','increase thrust rapidly because compressor stalls are corrected by maximum fuel flow'],
 ['reverse thrust is selected after landing','the system redirects/changes thrust to aid deceleration but remains subject to strict speed/configuration limits','reverse thrust is considered primary stopping energy and replaces wheel brakes','reverse thrust increases lift to unload the main gear'],
 ['engine anti-ice is used in icing conditions','bleed-air or electrical demand can reduce available performance and must be considered','anti-ice always increases maximum thrust','anti-ice has no performance effect on turbine aircraft']
];
function atpTurbine(n){
 const [s,c,a,b]=turbine[n%turbine.length];
 return q('atp','turbine',n,'Air Carrier Operations','AA.I.E.K1',`In a turbine-powered transport, ${s}. Which statement is most accurate?`,[c,a,b],0,'Turbine-engine and thrust-reverser operation must be understood together with the aircraft’s abnormal procedures and performance effects.','FAA-S-ACS-11A AA.I.E.K1; FAA-H-8083-3 / AFM');
}
const automation=[
 ['the FMS route is correct but the active lateral mode annunciation is not the mode the crew expected','prioritize flightpath control, verify the active/armed modes, and intervene or revert to a simpler mode if necessary','assume the FMS route guarantees the autopilot will follow it','reprogram multiple pages before checking the flight director mode'],
 ['ATC issues a late runway change during arrival','manage heads-down programming workload, confirm the new lateral/vertical path, and maintain crew cross-check','have both pilots program simultaneously to save time','accept any automation mode that appears to reduce workload without verbal cross-check'],
 ['an automation command produces an unexpected pitch change','disconnect or change the automation as appropriate while maintaining the desired flightpath, then diagnose','continue following the command until the system self-corrects','focus on the FMS scratchpad before controlling pitch']
];
function atpAutomation(n){
 const [s,c,a,b]=automation[n%automation.length],code=n%2?'AA.I.E.K3':'AA.I.E.K2';
 return q('atp','automation',n,'Automation & Navigation',code,`During line operations, ${s}. What is the best crew response?`,[c,a,b],0,'Automation management starts with controlling and monitoring the flightpath, understanding active/armed modes, and using CRM to manage programming workload.','FAA-S-ACS-11A '+code+'; AFM/FOM');
}
const warnings=[
 ['TCAS issues a resolution advisory that conflicts with an ATC vertical instruction','respond to the RA as required and advise ATC as soon as practical','ignore the RA because ATC instructions always take priority','disconnect the transponder to stop the RA'],
 ['TAWS issues a valid “PULL UP” warning','execute the operator/manufacturer terrain-escape response immediately unless the warning is positively known to be spurious under approved guidance','continue the approach until the warning repeats twice','level off only if ATC confirms terrain'],
 ['a traffic advisory appears without an RA','use it to acquire traffic and increase vigilance without making an abrupt vertical maneuver solely for the TA','immediately climb 1,000 ft without ATC clearance','turn off TCAS to prevent nuisance alerts']
];
function atpWarnings(n){
 const [s,c,a,b]=warnings[n%warnings.length];
 return q('atp','warnings',n,'Flightpath Warning Systems','AA.I.E.K4',`In a transport aircraft, ${s}. What is the correct priority?`,[c,a,b],0,'TCAS/TAWS warnings have specific response logic designed to protect the flightpath; crews must know the operator and manufacturer procedures.','FAA-S-ACS-11A AA.I.E.K4; TCAS/TAWS guidance');
}
const press=[
 ['cabin altitude begins climbing rapidly and the warning activates at cruise','don oxygen masks as required, establish crew communication, and execute the rapid-depressurization/checklist actions','wait to see whether passengers report symptoms before using oxygen','descend only after completing all non-normal checklist items from memory'],
 ['the aircraft climbs to an altitude where the operator’s procedure requires quick-donning oxygen availability/use','comply with the applicable oxygen-mask requirement and crew procedure','the requirement can be ignored if cabin altitude remains below 10,000 ft','supplemental oxygen rules apply only to unpressurized aircraft'],
 ['one pack fails and cabin pressure is still controllable','evaluate system capability, limitations, weather/terrain, and diversion options using the abnormal procedure','assume no further action is required because one pack is always sufficient','immediately depressurize the cabin manually']
];
function atpPress(n){
 const [s,c,a,b]=press[n%press.length],code=n%3===0?'AA.I.E.K6':'AA.I.E.K5';
 return q('atp','pressurization',n,'Pressurization & Oxygen',code,`At altitude, ${s}. Which response is most appropriate?`,[c,a,b],0,'Pressurization and oxygen events demand immediate protection from hypoxia, followed by disciplined checklist and diversion/altitude decisions.','FAA-S-ACS-11A '+code+'; AFM/FOM');
}
const crm=[
 ['the first officer notices the captain has selected the wrong approach frequency but the captain is busy briefing','clearly state the discrepancy and verify/correct it using standard crew communication','remain silent to avoid interrupting the captain','change the frequency without saying anything'],
 ['both pilots become focused on troubleshooting an FMC message during descent','one pilot must remain explicitly responsible for flying/monitoring while the other manages the problem','both pilots should troubleshoot because two people solve problems faster','transfer control to the autopilot and stop monitoring the flightpath'],
 ['a runway change creates uncertainty about taxi routing after landing','brief the expected exit/taxi plan and use progressive instructions if needed rather than guessing','continue taxi while both pilots search the chart','accept any route that seems shorter to reduce runway occupancy']
];
function atpCrm(n){
 const [s,c,a,b]=crm[n%crm.length],code=n%2?'AA.I.E.K8':'AA.I.E.K12';
 return q('atp','crm',n,'Crew Resource Management',code,`During multi-crew operations, ${s}. Which CRM response is best?`,[c,a,b],0,'Effective CRM uses explicit communication, monitoring, workload distribution, and challenge-and-response when safety margins are threatened.','FAA-S-ACS-11A '+code+'; AC 120-51');
}
const regs=[
 ['a Part 121 flightcrew member is evaluating flight/duty/rest legality','Part 117 requirements are central to the applicable flightcrew fatigue/duty analysis','Part 91 VFR fuel rules replace Part 117 for domestic flights','the MEL determines crew rest legality'],
 ['an air carrier operation is conducted under Part 121','the crew must apply the operator’s Part 121 procedures and operations specifications in addition to general operating rules','a commercial pilot certificate alone defines the operating rules','Part 135 automatically governs whenever fewer than 30 passengers are aboard'],
 ['a pilot is scheduled while not fit for duty due to fatigue','fitness-for-duty responsibility is not erased merely because the schedule itself is legal','a legal schedule guarantees the pilot is fit for duty','only dispatch can determine whether fatigue is relevant']
];
function atpRegs(n){
 const [s,c,a,b]=regs[n%regs.length],code=n%3===0||n%3===2?'AA.I.G.K3':'AA.I.G.K4';
 return q('atp','regs',n,'Air Carrier Regulations',code,`For an ATP-level operation, ${s}. Which statement is most accurate?`,[c,a,b],0,'ATP operations require applying the specific operating and fatigue rules that govern the certificate holder and crew, not just general Part 91 concepts.','FAA-S-ACS-11A '+code+'; 14 CFR parts 117 and 121');
}

const cfiiCases=[
 ['a student chases the localizer with large alternating corrections','teach smaller trend-based corrections and emphasize sensing/scan rather than waiting for full-scale movement','teach larger corrections so the CDI centers faster','have the student stop cross-checking attitude until established'],
 ['a student fixates on the attitude indicator during partial-panel training','redirect the scan to the remaining reliable instruments and emphasize control/performance relationships','cover all remaining instruments to reduce distraction','restore the failed instrument immediately and end partial-panel practice'],
 ['a student descends below MDA while trying to see the runway','stop the descent, reinforce the published minimum and required visual-reference rule, and debrief the decision chain','continue because the student needs to learn what the runway environment looks like','allow another 100 ft because training flights are not revenue operations']
];
function cfiiSupplement(n){
 const [s,c,a,b]=cfiiCases[n%cfiiCases.length];
 return q('cfii','pts-supplement',n,'Instrument Instruction','PTS Area/Task',`During instrument instruction, ${s}. What is the best instructional response?`,[c,a,b],0,'CFII instruction should protect instrument-procedure standards while diagnosing the learner’s scan, interpretation, and decision-making errors.','FAA-S-8081-9E Flight Instructor Instrument PTS; Instrument Flying Handbook',{standardType:'PTS'});
}

const FAMILIES={
 ppl:[pplFuel,pplTsd,pplPressure,pplWb,pplAirspace,pplVfrMins,pplMetar,pplWeather,pplSystems,pplEquipment],
 ira:[iraFuel,iraAlternate,iraHoldSpeed,iraLostComms,iraPitot,iraVor,iraApproach,iraMissed,iraIcing,iraPlanning],
 cpl:[cplPrivileges,cplAirworthy,cplFuel,cplAirspace,cplPerformance,cplWb,cplAero,cplSystems,cplWeather,cplAdm],
 cfi:[cfiDefense,cfiComm,cfiTheory,cfiLaws,cfiDomains,cfiMemory,cfiLesson,cfiMethods,cfiAssess,cfiRecords],
 atp:[atpMelQ,atpPerformance,atpIcing,atpHighAlt,atpTurbine,atpAutomation,atpWarnings,atpPress,atpCrm,atpRegs]
};
function buildTrack(track){
 const out=[];
 for(const fn of FAMILIES[track]) for(let n=0;n<100;n++) out.push(fn(n));
 return out;
}
export const banks={
 ppl:buildTrack('ppl'),
 ira:buildTrack('ira'),
 cpl:buildTrack('cpl'),
 cfi:buildTrack('cfi'),
 cfii:Array.from({length:250},(_,n)=>cfiiSupplement(n)),
 atp:buildTrack('atp')
};
export const bankManifest={
 acsQuestionCount:['ppl','ira','cpl','cfi','atp'].reduce((s,t)=>s+banks[t].length,0),
 supplementalPtsQuestionCount:banks.cfii.length,
 totalQuestionCount:Object.values(banks).reduce((s,a)=>s+a.length,0),
 byTrack:Object.fromEntries(Object.entries(banks).map(([k,v])=>[k,v.length])),
 standards:STANDARDS,
 generatedAt:'2026-09-15'
};
