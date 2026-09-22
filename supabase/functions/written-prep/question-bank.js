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


const FAA_SAMPLE_URLS={
  ppl:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/test_questions/par_questions.pdf',
  ira:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/test_questions/ira_questions.pdf',
  cpl:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/test_questions/cax_questions.pdf',
  cfi:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/test_questions/fia_questions.pdf',
  atp:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/test_questions/atm_questions.pdf'
};
const FAA_SUPPLEMENTS={
  ppl:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/sport_rec_private_akts.pdf',
  ira:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/instrument_rating_akts.pdf',
  cpl:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/commercial_akts.pdf',
  cfi:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/flight_ground_instructor_akts.pdf',
  atp:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/atp_akts.pdf',
  cfii:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/instrument_rating_akts.pdf'
};
const faaSample=(track,id,area,code,prompt,options,correct,explanation,reference,extra={})=>{
  const st=STANDARDS[track];
  return {id:`faa-${track}-${id}`,area,prompt,options,correct,explanation,reference,
    source:'faa-sample-exact',sourceUrl:FAA_SAMPLE_URLS[track],standardCode:code,
    standardDoc:st.doc,standardType:st.type,difficulty:'applied',experienceLevel:track,
    reviewedAt:'2026-09-22',...extra};
};
const officialSamples={
  ppl:[
    faaSample('ppl','par-001','Airworthiness','PA.I.B.K1b',
      'Maintenance records show the last transponder inspection was performed on September 1, 2014. The next inspection will be due no later than',
      ['September 30, 2015.','September 1, 2016.','September 30, 2016.'],2,
      'A transponder used under the applicable rule must be inspected within the preceding 24 calendar months. A September 2014 inspection remains current through the end of September 2016.',
      'FAA PAR sample question 1; 14 CFR 91.413',
      {choiceExplanations:[
        'Incorrect. This allows only 12 calendar months.',
        'Incorrect. Calendar-month compliance runs through the last day of the applicable month.',
        'Correct. Twenty-four calendar months after September 2014 runs through September 30, 2016.'
      ]}),
    faaSample('ppl','par-002','Pilot Qualifications','PA.I.A.K1',
      'With respect to the certification of airmen, which are categories of aircraft?',
      ['Gyroplane, helicopter, airship, free balloon.','Airplane, rotorcraft, glider, lighter-than-air.','Single-engine land and sea, multiengine land and sea.'],1,
      'Airplane, rotorcraft, glider, and lighter-than-air are aircraft categories. Items such as single-engine land and multiengine land are classes within the airplane category.',
      'FAA PAR sample question 2; 14 CFR 1.1 / Part 61',
      {choiceExplanations:[
        'Incorrect. Several of these are classes within broader categories.',
        'Correct. These are aircraft categories used in airman certification.',
        'Incorrect. These are airplane classes, not aircraft categories.'
      ]}),
    faaSample('ppl','par-003','Airport Operations','PA.III.A.K3',
      'A flashing white light signal from the control tower to a taxiing aircraft is an indication to',
      ['taxi at a faster speed.','taxi only on taxiways and not cross runways.','return to the starting point on the airport.'],2,
      'For an aircraft on the ground, a flashing white light gun signal means return to the starting point on the airport.',
      'FAA PAR sample question 3; AIM light gun signals',
      {choiceExplanations:[
        'Incorrect. A flashing white signal does not authorize increased taxi speed.',
        'Incorrect. This is not the meaning assigned to the flashing white signal.',
        'Correct. Flashing white to an aircraft on the ground means return to the starting point.'
      ]}),
    faaSample('ppl','par-020','Airport Operations','PA.II.D.K3',
      '(Refer to FAA-CT-8080-2H, Figure 48.) The portion of the runway identified by the letter A may be used for',
      ['landing.','taxiing and takeoff.','taxiing and landing.'],1,
      'The marked portion is a displaced-threshold area. It may be available for taxi and takeoff while not being available for touchdown from that direction.',
      'FAA PAR sample question 20; FAA-CT-8080-2H Figure 48',
      {figureRef:{supplement:'FAA-CT-8080-2H',figure:'48',url:FAA_SUPPLEMENTS.ppl},choiceExplanations:[
        'Incorrect. The displaced portion is not available for touchdown from that approach direction.',
        'Correct. The area may be used for taxi and takeoff.',
        'Incorrect. Landing touchdown is not permitted on the displaced portion from that direction.'
      ]}),
    faaSample('ppl','par-044','Performance','PA.I.F.K2a',
      '(Refer to FAA-CT-8080-2H, Figure 8.) What is the effect of a temperature increase from 35 to 50°F on the density altitude if the pressure altitude remains at 3,000 feet MSL?',
      ['1,000-foot increase.','1,100-foot decrease.','1,300-foot increase.'],0,
      'With pressure altitude unchanged, warmer air increases density altitude. Figure 8 shows approximately a 1,000-foot increase for the stated temperature change.',
      'FAA PAR sample question 44; FAA-CT-8080-2H Figure 8',
      {figureRef:{supplement:'FAA-CT-8080-2H',figure:'8',url:FAA_SUPPLEMENTS.ppl},choiceExplanations:[
        'Correct. The warmer temperature raises density altitude by about 1,000 feet.',
        'Incorrect. Increasing temperature does not lower density altitude when pressure altitude is unchanged.',
        'Incorrect. This overstates the change shown by the FAA figure.'
      ]})
  ],
  ira:[
    faaSample('ira','ira-001','Pilot Qualifications','IR.I.A.K1',
      'To act as pilot in command of an aircraft under IFR, what is the minimum instrument flight experience you must have logged during the preceding six months, in the same category of aircraft?',
      ['Holding procedures, intercepting and tracking courses through the use of navigation systems, and six instrument approaches.','Six hours of instrument time in any aircraft, and six instrument approaches.','Six instrument approaches, three of which must be in the same category and class of aircraft to be flown, and 6 hours of instrument time in any aircraft.'],0,
      'The recent-instrument-experience rule requires six instrument approaches plus holding procedures/tasks and intercepting/tracking courses using navigation systems within the prescribed period and category.',
      'FAA IRA sample question 1; 14 CFR 61.57(c)',
      {choiceExplanations:[
        'Correct. This lists the required recent instrument tasks.',
        'Incorrect. The regulation does not use a six-hour instrument-time requirement for this currency rule.',
        'Incorrect. The rule is not structured around three approaches in class plus six instrument hours.'
      ]}),
    faaSample('ira','ira-003','IFR Flight Planning','IR.I.C.R3',
      'When is an IFR clearance required during VFR weather conditions?',
      ['When operating in the Class E airspace.','When operating in a Class A airspace.','When operating in airspace above 14,500 feet.'],1,
      'Class A airspace is operated under IFR. VFR weather does not remove the requirement for an IFR clearance there.',
      'FAA IRA sample question 3; 14 CFR 91.135',
      {choiceExplanations:[
        'Incorrect. Class E does not by itself require an IFR clearance in VFR conditions.',
        'Correct. Operations in Class A airspace are conducted under IFR.',
        'Incorrect. Altitude alone at 14,500 feet does not create the Class A requirement.'
      ]}),
    faaSample('ira','ira-017','Airport Operations','IR.VI.E.K2',
      'Which type of runway lighting consists of a pair of synchronized flashing lights, one on each side of the runway threshold?',
      ['MALSR.','HIRL.','REIL.'],2,
      'Runway End Identifier Lights (REIL) are synchronized flashing lights installed laterally at the runway threshold.',
      'FAA IRA sample question 17; AIM runway lighting',
      {choiceExplanations:[
        'Incorrect. MALSR is an approach-light system.',
        'Incorrect. HIRL are runway edge lights.',
        'Correct. REIL uses a synchronized flashing-light pair at the threshold.'
      ]}),
    faaSample('ira','ira-044','Airport Operations','IR.VI.E.K2',
      '(Refer to FAA-CT-8080-3F, Figure 254.) Which of the signs in the figure is a mandatory instruction sign?',
      ['Top red.','Middle yellow.','Bottom yellow.'],0,
      'Mandatory instruction signs use a red background with white inscription.',
      'FAA IRA sample question 44; FAA-CT-8080-3F Figure 254',
      {figureRef:{supplement:'FAA-CT-8080-3F',figure:'254',url:FAA_SUPPLEMENTS.ira},choiceExplanations:[
        'Correct. The red sign is the mandatory instruction sign.',
        'Incorrect. Yellow signs are not mandatory instruction signs.',
        'Incorrect. Yellow signs are not mandatory instruction signs.'
      ]}),
    faaSample('ira','ira-047','Instrument Approaches','IR.VI.A.K1',
      '(Refer to FAA-CT-8080-3F, Figure 242 and Legend 27.) You have been cleared for the RNAV (GPS) RWY 36 approach to LIT. At a groundspeed of 105 knots, what is the vertical descent angle and rate of descent on final approach?',
      ['2.82 degrees and 524 feet per minute.','3.00 degrees and 557 feet per minute.','4.00 degrees and 550 feet per nautical mile.'],1,
      'The procedure depicts a 3.00° vertical path. At 105 knots groundspeed, the corresponding descent rate is about 557 feet per minute.',
      'FAA IRA sample question 47; FAA-CT-8080-3F Figure 242 and Legend 27',
      {figureRef:{supplement:'FAA-CT-8080-3F',figure:'242 / Legend 27',url:FAA_SUPPLEMENTS.ira},choiceExplanations:[
        'Incorrect. This does not match the depicted vertical path and rate for 105 knots.',
        'Correct. The published path is 3.00° and the table gives approximately 557 FPM.',
        'Incorrect. This mixes an incorrect angle with feet-per-nautical-mile wording rather than the requested descent rate.'
      ]})
  ],
  cpl:[
    faaSample('cpl','cax-001','Navigation','CA.VI.A.R1',
      'When in the vicinity of a VOR which is being used for navigation on VFR flights, it is important to',
      ['make 90° left and right turns to scan for other traffic.','exercise sustained vigilance to avoid aircraft that may be converging on the VOR from other directions.','pass the VOR on the right side of the radial to allow room for aircraft flying in the opposite direction on the same radial.'],1,
      'VORs can concentrate traffic from multiple directions. The risk-management point is sustained visual vigilance for converging aircraft.',
      'FAA CAX sample question 1; FAA-S-ACS-7B CA.VI.A.R1',
      {choiceExplanations:[
        'Incorrect. Large scanning turns are not the recommended traffic-avoidance technique.',
        'Correct. Navigation facilities can create traffic convergence, requiring sustained vigilance.',
        'Incorrect. There is no standard rule assigning the right side of a VOR radial for opposite-direction traffic.'
      ]}),
    faaSample('cpl','cax-004','Preflight Planning','CA.I.C.K3',
      'You are pilot-in-command of a VFR flight that you think will be within the fuel range of your aircraft. As part of your preflight planning you must',
      ['be familiar with all instrument approaches at the destination airport.','list an alternate airport on the flight plan, and confirm adequate takeoff and landing performance at the destination airport.','obtain weather reports, forecasts, and fuel requirements for the flight.'],2,
      'Preflight action requires becoming familiar with available information appropriate to the flight, including weather and fuel requirements.',
      'FAA CAX sample question 4; 14 CFR 91.103',
      {choiceExplanations:[
        'Incorrect. VFR preflight action does not require familiarity with every instrument approach.',
        'Incorrect. A VFR flight does not automatically require filing an alternate.',
        'Correct. Weather information and fuel requirements are core preflight information.'
      ]}),
    faaSample('cpl','cax-031','National Airspace System','CA.I.E.K2',
      '(Refer to FAA-CT-8080-1E, Figure 53, Area 2.) What is indicated by the star next to the "L" in the airport information box for the MADERA (MAE) airport north of area 2?',
      ['Special VFR is prohibited.','There is a rotating beacon at the field.','Lighting limitations exist.'],2,
      'The star associated with the airport lighting notation indicates that lighting limitations or special activation information apply and should be checked in the Chart Supplement.',
      'FAA CAX sample question 31; FAA-CT-8080-1E Figure 53',
      {figureRef:{supplement:'FAA-CT-8080-1E',figure:'53, Area 2',url:FAA_SUPPLEMENTS.cpl},choiceExplanations:[
        'Incorrect. This symbol is not the notation for a Special VFR prohibition.',
        'Incorrect. The star is tied to lighting information, not simply the existence of a rotating beacon.',
        'Correct. The star indicates lighting limitations/special lighting information.'
      ]}),
    faaSample('cpl','cax-032','National Airspace System','CA.I.E.K3',
      '(Refer to FAA-CT-8080-1E, Figure 54, Area 3.) What is the significance of R-2531? This is a restricted area',
      ['for IFR aircraft.','where aircraft may never operate.','where often invisible hazards exist.'],2,
      'Restricted areas contain activity considered hazardous to nonparticipating aircraft, which may not be readily visible.',
      'FAA CAX sample question 32; FAA-CT-8080-1E Figure 54',
      {figureRef:{supplement:'FAA-CT-8080-1E',figure:'54, Area 3',url:FAA_SUPPLEMENTS.cpl},choiceExplanations:[
        'Incorrect. Restricted areas are not defined as areas reserved for IFR aircraft.',
        'Incorrect. Flight may be authorized when the area is not active or with controlling-agency permission as applicable.',
        'Correct. Restricted areas identify unusual, often invisible hazards to aircraft.'
      ]}),
    faaSample('cpl','cax-044','National Airspace System','CA.I.E.K1',
      '(Refer to FAA-CT-8080-1E, Figure 52, Area 2.) When departing the RIO LINDA (L36) airport to the northwest at an altitude of 1,000 feet, AGL, you',
      ['must make contact with MC CLELLAN (MCC) control tower as soon as practical after takeoff.','are not required to contact any ATC facilities if you do not enter the Class C Airspace','must make contact with the SACRAMENTO INTL (SMF) control tower immediately after takeoff.'],1,
      'The departure described can remain outside the depicted Class C airspace. Two-way communication is required before entering Class C, not merely because the airport is nearby.',
      'FAA CAX sample question 44; FAA-CT-8080-1E Figure 52',
      {figureRef:{supplement:'FAA-CT-8080-1E',figure:'52, Area 2',url:FAA_SUPPLEMENTS.cpl},choiceExplanations:[
        'Incorrect. Contact with that tower is not required solely by the described departure.',
        'Correct. If the flight remains outside Class C and no other rule requires contact, ATC communication is not required solely for the departure.',
        'Incorrect. Immediate contact with the Class C primary airport tower is not required while remaining outside the Class C airspace.'
      ]})
  ]
};


const faaParallel=(track,id,area,code,prompt,options,correct,explanation,reference,figureRef,choiceExplanations,difficulty='applied',calibratedFrom='')=>{
  const st=STANDARDS[track];
  return {id:`parallel-${track}-${id}`,area,prompt,options,correct,explanation,reference,
    source:'pilotdesk-faa-parallel',sourceUrl:figureRef?.url||st.url,standardCode:code,
    standardDoc:st.doc,standardType:st.type,difficulty,experienceLevel:track,
    figureRef,choiceExplanations,reviewedAt:'2026-09-22',authoring:'curated-manual',
    calibratedFrom};
};
const figureParallelQuestions={
  ppl:[
    faaParallel('ppl','fig48-touchdown','Airport Operations','PA.II.D.K3',
      '(Refer to FAA-CT-8080-2H, Figure 48.) For an arrival from the direction of the displaced threshold, which operation is NOT permitted on the pavement identified by A?',
      ['Taxiing across the area.','Beginning a takeoff roll from the area when otherwise authorized.','Touching down in the area before the displaced threshold.'],2,
      'A displaced threshold moves the beginning of the landing touchdown area. Pavement before the threshold may still be usable for taxi and takeoff as depicted, but not for touchdown from that approach direction.',
      'FAA-CT-8080-2H Figure 48; AIM runway markings',
      {supplement:'FAA-CT-8080-2H',figure:'48',url:FAA_SUPPLEMENTS.ppl},
      ['Incorrect. The pavement before a displaced threshold may remain available for taxi.',
       'Incorrect. The pavement may remain available for takeoff when otherwise authorized.',
       'Correct. Touchdown must occur at or beyond the displaced threshold for an arrival from that direction.'],
      'applied','FAA PAR sample question 20'),
    faaParallel('ppl','fig48-meaning','Airport Operations','PA.II.D.K3',
      '(Refer to FAA-CT-8080-2H, Figure 48.) What is the best interpretation of the threshold displacement shown at A?',
      ['The runway is permanently closed beyond A.','The landing threshold has been moved, while some pavement before it can remain usable for other operations.','The pavement before A is a blast pad and may never be used for taxi or takeoff.'],1,
      'A displaced threshold does not mean the runway is closed. It means touchdown from that direction begins at the displaced threshold; the preceding pavement can remain available for other approved uses.',
      'FAA-CT-8080-2H Figure 48; AIM airport markings',
      {supplement:'FAA-CT-8080-2H',figure:'48',url:FAA_SUPPLEMENTS.ppl},
      ['Incorrect. A displaced threshold is not a runway-closure marking.',
       'Correct. The threshold is displaced for landing while preceding pavement may retain other approved uses.',
       'Incorrect. A blast pad/stopway has different markings and operating limitations.'],
      'advanced','FAA PAR sample question 20'),
    faaParallel('ppl','fig8-reverse','Performance','PA.I.F.K2a',
      '(Refer to FAA-CT-8080-2H, Figure 8.) Pressure altitude remains 3,000 feet MSL. If temperature decreases from 50°F to 35°F, approximately what happens to density altitude?',
      ['It decreases about 1,000 feet.','It increases about 1,000 feet.','It remains essentially unchanged because pressure altitude did not change.'],0,
      'This is the reverse of the FAA sample comparison using the same chart. With pressure altitude fixed, lowering temperature from 50°F to 35°F reduces density altitude by about 1,000 feet.',
      'FAA-CT-8080-2H Figure 8; FAA-S-ACS-6C PA.I.F.K2a',
      {supplement:'FAA-CT-8080-2H',figure:'8',url:FAA_SUPPLEMENTS.ppl},
      ['Correct. Cooler air lowers density altitude when pressure altitude is unchanged.',
       'Incorrect. That reverses the temperature effect.',
       'Incorrect. Density altitude changes with temperature even when pressure altitude remains fixed.'],
      'applied','FAA PAR sample question 44'),
    faaParallel('ppl','fig8-compare','Performance','PA.I.F.K2a',
      '(Refer to FAA-CT-8080-2H, Figure 8.) Two airports have the same pressure altitude of 3,000 feet. One is 35°F and the other is 50°F. Which airport has the higher density altitude?',
      ['The 35°F airport.','The 50°F airport.','They are equal because pressure altitude is equal.'],1,
      'At the same pressure altitude, the warmer airport has the higher density altitude. The FAA figure shows the difference is roughly 1,000 feet for these temperatures.',
      'FAA-CT-8080-2H Figure 8; PHAK density altitude',
      {supplement:'FAA-CT-8080-2H',figure:'8',url:FAA_SUPPLEMENTS.ppl},
      ['Incorrect. Cooler temperature lowers density altitude.',
       'Correct. Warmer temperature raises density altitude.',
       'Incorrect. Equal pressure altitude does not imply equal density altitude when temperature differs.'],
      'foundation','FAA PAR sample question 44')
  ],
  ira:[
    faaParallel('ira','fig254-color','Airport Operations','IR.VI.E.K2',
      '(Refer to FAA-CT-8080-3F, Figure 254.) Which visual feature identifies the mandatory instruction sign?',
      ['Red background with white inscription.','Yellow background with black inscription.','Black background with yellow inscription.'],0,
      'Mandatory instruction signs use a red background with white inscription. Yellow and black combinations are used for other airport sign functions such as direction, destination, or location.',
      'FAA-CT-8080-3F Figure 254; AIM airport signs',
      {supplement:'FAA-CT-8080-3F',figure:'254',url:FAA_SUPPLEMENTS.ira},
      ['Correct. Red with white inscription identifies a mandatory instruction sign.',
       'Incorrect. Yellow with black is used for directional/destination information.',
       'Incorrect. Black with yellow is associated with location information.'],
      'foundation','FAA IRA sample question 44'),
    faaParallel('ira','fig254-action','Airport Operations','IR.VI.E.K2',
      '(Refer to FAA-CT-8080-3F, Figure 254.) Compared with the yellow signs shown, the red sign should be interpreted as',
      ['advisory guidance that may be ignored when the airport is familiar.','a mandatory instruction associated with a runway, critical area, or prohibited entry point.','a location sign identifying the taxiway the aircraft is currently on.'],1,
      'Red airport signs convey mandatory instructions. They require compliance and commonly identify runway holding positions, ILS critical areas, or no-entry points.',
      'FAA-CT-8080-3F Figure 254; AIM airport signs',
      {supplement:'FAA-CT-8080-3F',figure:'254',url:FAA_SUPPLEMENTS.ira},
      ['Incorrect. Red signs are not merely advisory.',
       'Correct. Red signs convey mandatory instructions.',
       'Incorrect. Location signs use a black background with yellow inscription.'],
      'applied','FAA IRA sample question 44'),
    faaParallel('ira','fig242-90kt','Instrument Approaches','IR.VI.A.K1',
      '(Refer to FAA-CT-8080-3F, Figure 242 and Legend 27.) The RNAV (GPS) RWY 36 final approach path is 3.00°. At a groundspeed of 90 knots, approximately what rate of descent will maintain that path?',
      ['478 feet per minute.','318 feet per minute.','637 feet per minute.'],0,
      'A 3.00° path is about 318 feet per nautical mile. At 90 knots, that produces approximately 478 feet per minute.',
      'FAA-CT-8080-3F Figure 242 and Legend 27; FAA-S-ACS-8C IR.VI.A.K1',
      {supplement:'FAA-CT-8080-3F',figure:'242 / Legend 27',url:FAA_SUPPLEMENTS.ira},
      ['Correct. 90 knots on a 3° path is approximately 478 FPM.',
       'Incorrect. About 318 is feet per nautical mile for a 3° path, not FPM at 90 knots.',
       'Incorrect. About 637 FPM corresponds to roughly 120 knots on a 3° path.'],
      'applied','FAA IRA sample question 47'),
    faaParallel('ira','fig242-120kt','Instrument Approaches','IR.VI.A.K1',
      '(Refer to FAA-CT-8080-3F, Figure 242 and Legend 27.) The RNAV (GPS) RWY 36 final approach path is 3.00°. At a groundspeed of 120 knots, approximately what rate of descent will maintain that path?',
      ['557 feet per minute.','637 feet per minute.','720 feet per minute.'],1,
      'A 3.00° path is approximately 318 feet per nautical mile. At 120 knots, the corresponding descent rate is about 637 feet per minute.',
      'FAA-CT-8080-3F Figure 242 and Legend 27; FAA-S-ACS-8C IR.VI.A.K1',
      {supplement:'FAA-CT-8080-3F',figure:'242 / Legend 27',url:FAA_SUPPLEMENTS.ira},
      ['Incorrect. About 557 FPM corresponds to the FAA sample at 105 knots.',
       'Correct. 120 knots on a 3° path is approximately 637 FPM.',
       'Incorrect. This overstates the required descent rate for a 3° path at 120 knots.'],
      'advanced','FAA IRA sample question 47'),
    faaParallel('ira','fig242-gradient','Instrument Approaches','IR.VI.A.K1',
      '(Refer to FAA-CT-8080-3F, Figure 242 and Legend 27.) A 3.00° final approach path corresponds most closely to which descent gradient?',
      ['Approximately 318 feet per nautical mile.','Approximately 200 feet per nautical mile.','Approximately 550 feet per nautical mile.'],0,
      'A 3.00° glidepath is approximately 318 feet per nautical mile. Descent rate in feet per minute then depends on groundspeed.',
      'FAA-CT-8080-3F Figure 242 and Legend 27; Instrument Procedures Handbook',
      {supplement:'FAA-CT-8080-3F',figure:'242 / Legend 27',url:FAA_SUPPLEMENTS.ira},
      ['Correct. A 3° path is approximately 318 ft/NM.',
       'Incorrect. 200 ft/NM is too shallow for a 3° path.',
       'Incorrect. This confuses descent rate in FPM with geometric gradient in ft/NM.'],
      'advanced','FAA IRA sample question 47')
  ],
  cpl:[
    faaParallel('cpl','fig53-lighting-source','National Airspace System','CA.I.E.K2',
      '(Refer to FAA-CT-8080-1E, Figure 53, Area 2.) The star associated with the lighting notation at MADERA (MAE) tells you that lighting limitations exist. Where should you check the details?',
      ['The Chart Supplement.','The aircraft equipment list.','The destination airport TAF remarks.'],0,
      'A chart notation indicating lighting limitations directs the pilot to airport information in the Chart Supplement for the specific limitation or activation information.',
      'FAA-CT-8080-1E Figure 53; Chart Supplement guidance',
      {supplement:'FAA-CT-8080-1E',figure:'53, Area 2',url:FAA_SUPPLEMENTS.cpl},
      ['Correct. The Chart Supplement provides the airport lighting details and limitations.',
       'Incorrect. The aircraft equipment list does not describe airport lighting limitations.',
       'Incorrect. A TAF is a weather forecast, not the controlling airport-lighting reference.'],
      'applied','FAA CAX sample question 31'),
    faaParallel('cpl','fig54-restricted-status','National Airspace System','CA.I.E.K3',
      '(Refer to FAA-CT-8080-1E, Figure 54, Area 3.) Before planning a route through R-2531, what information is most important to verify?',
      ['Whether the restricted area is active and what authorization or controlling-agency coordination is required.','Whether the flight is VFR or IFR, because restricted areas apply only to IFR aircraft.','Whether the airplane has a transponder, because that alone authorizes entry.'],0,
      'Restricted areas may contain hazardous activity. Before penetration, the pilot must determine the area’s status and comply with applicable authorization or controlling-agency requirements.',
      'FAA-CT-8080-1E Figure 54; AIM special use airspace',
      {supplement:'FAA-CT-8080-1E',figure:'54, Area 3',url:FAA_SUPPLEMENTS.cpl},
      ['Correct. Activity status and authorization/coordination determine whether the area may be entered.',
       'Incorrect. Restricted areas are not limited to IFR operations.',
       'Incorrect. A transponder does not itself authorize entry into an active restricted area.'],
      'advanced','FAA CAX sample question 32'),
    faaParallel('cpl','fig52-classc-entry','National Airspace System','CA.I.E.K1',
      '(Refer to FAA-CT-8080-1E, Figure 52, Area 2.) If the northwest departure from RIO LINDA (L36) is changed so that the flight will enter the nearby Class C airspace, what must occur before entry?',
      ['Two-way radio communication must be established with the appropriate ATC facility.','The pilot must hear the exact words “cleared into Class C.”','No communication is required if the aircraft remains below 1,200 feet AGL.'],0,
      'Before entering Class C airspace, two-way radio communication must be established with the appropriate ATC facility. An explicit “cleared into Class C” phrase is not the Class C entry standard.',
      'FAA-CT-8080-1E Figure 52; 14 CFR 91.130',
      {supplement:'FAA-CT-8080-1E',figure:'52, Area 2',url:FAA_SUPPLEMENTS.cpl},
      ['Correct. Two-way radio communication is required before Class C entry.',
       'Incorrect. Class C does not require the explicit Class B-style clearance phrase.',
       'Incorrect. The communication rule is tied to Class C entry, not a blanket 1,200-foot AGL exception.'],
      'applied','FAA CAX sample question 44'),
    faaParallel('cpl','fig52-outside-classc','National Airspace System','CA.I.E.K1',
      '(Refer to FAA-CT-8080-1E, Figure 52, Area 2.) If the RIO LINDA (L36) departure remains outside the depicted Class C airspace and no other rule requires ATC contact, which statement is correct?',
      ['ATC communication is not required solely because the flight is near Class C airspace.','The pilot must contact the Class C primary airport tower immediately after takeoff.','The pilot must obtain an explicit Class C clearance even while remaining outside the airspace.'],0,
      'Proximity to Class C does not by itself create an ATC communication requirement. The communication requirement applies before entry into the Class C airspace.',
      'FAA-CT-8080-1E Figure 52; 14 CFR 91.130',
      {supplement:'FAA-CT-8080-1E',figure:'52, Area 2',url:FAA_SUPPLEMENTS.cpl},
      ['Correct. Remaining outside Class C avoids the Class C entry communication requirement.',
       'Incorrect. Immediate tower contact is not required solely because of proximity.',
       'Incorrect. An entry requirement does not apply when the flight remains outside the airspace.'],
      'foundation','FAA CAX sample question 44')
  ]
};


const curatedQuestion=(track,id,area,code,prompt,options,correct,explanation,reference,extra={})=>{
  const st=STANDARDS[track];
  return {id:`curated-${track}-${id}`,area,prompt,options,correct,explanation,reference,
    source:'pilotdesk-curated',sourceUrl:st.url,standardCode:code,standardDoc:st.doc,
    standardType:st.type,difficulty:extra.difficulty||'applied',experienceLevel:track,
    reviewedAt:'2026-09-22',authoring:'curated-manual',...extra};
};

const curatedCfi=[
  curatedQuestion('cfi','assessment-open-ended','Assessment & Testing','FI.I.D.K6a',
    'During a stage check, an instructor asks, “What would make you discontinue this approach before reaching DA?” Why is this a stronger assessment question than asking whether the learner knows the missed-approach point?',
    ['It requires the learner to apply judgment and identify conditions that change the plan.','It removes the need to evaluate factual knowledge.','It guarantees only one possible response and therefore eliminates instructor judgment.'],0,
    'A strong instructor question requires application and decision-making, not just recognition or recall. The learner must connect procedure, weather, aircraft state, and risk controls to a decision.',
    'FAA-S-ACS-25 FI.I.D.K6a; Aviation Instructor’s Handbook',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. The question probes application, judgment, and decision criteria.',
      'Incorrect. Higher-order assessment complements factual knowledge; it does not replace it.',
      'Incorrect. Good scenario questions can have several defensible considerations while still testing whether the learner applies the standard correctly.'
    ]}),
  curatedQuestion('cfi','assessment-leading','Assessment & Testing','FI.I.D.K6b',
    'An instructor asks, “You know the stall speed increases in a steep turn, right?” What is the primary weakness in that question?',
    ['It is leading and lets the learner agree without demonstrating understanding.','It is too difficult because stall speed is not appropriate for oral questioning.','It is invalid because instructors may only use written questions for aerodynamics.'],0,
    'A leading question supplies the expected conclusion. It can hide a misconception because the learner can simply agree.',
    'FAA-S-ACS-25 FI.I.D.K6b; Aviation Instructor’s Handbook',
    {difficulty:'applied',choiceExplanations:[
      'Correct. The wording cues the answer instead of requiring the learner to explain the relationship.',
      'Incorrect. Aerodynamic relationships are appropriate oral-assessment material.',
      'Incorrect. Oral questioning is a normal instructional and assessment tool.'
    ]}),
  curatedQuestion('cfi','lesson-objective','Course Development & Lesson Plans','FI.I.C.K3',
    'You are building a lesson on short-field landings. Which lesson objective is written to a useful performance standard?',
    ['“Given the aircraft POH and current conditions, the learner will plan and perform a short-field landing to the applicable ACS standards while explaining the major risks.”','“The learner will understand short-field landings.”','“The instructor will discuss every short-field landing fact in the handbook.”'],0,
    'A useful objective states what the learner will do, the conditions, and the standard or measurable outcome.',
    'FAA-S-ACS-25 FI.I.C.K3; Aviation Instructor’s Handbook',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. It gives conditions, learner performance, and an objective standard.',
      'Incorrect. “Understand” is not directly measurable.',
      'Incorrect. This describes instructor activity rather than learner performance.'
    ]}),
  curatedQuestion('cfi','method-demonstration','Teaching Methods','FI.I.C.K5',
    'A learner is seeing steep turns for the first time. The instructor explains the setup, demonstrates one while narrating key cues, has the learner perform the maneuver, then evaluates the result. Which method is being used?',
    ['Demonstration-performance.','Guided discussion only.','Drill and practice without demonstration.'],0,
    'The demonstration-performance method follows explanation, demonstration, learner performance, and instructor evaluation.',
    'FAA-S-ACS-25 FI.I.C.K5; Aviation Instructor’s Handbook',
    {difficulty:'applied',choiceExplanations:[
      'Correct. The sequence matches demonstration-performance.',
      'Incorrect. Discussion may be part of the lesson, but it does not describe the full sequence.',
      'Incorrect. The scenario specifically includes an instructor demonstration.'
    ]}),
  curatedQuestion('cfi','communication-jargon','Effective Communication','FI.I.A.K4b',
    'A new pre-solo learner hears an avionics explanation filled with terms they have never encountered and leaves with the wrong mental picture. Which communication problem is most directly involved?',
    ['Lack of common experience and imprecise terminology for the learner’s level.','Positive transfer of learning.','Overlearning caused by too much practice.'],0,
    'Communication fails when the sender and receiver do not share the same meaning for the words and symbols being used.',
    'FAA-S-ACS-25 FI.I.A.K4b; Aviation Instructor’s Handbook',
    {difficulty:'applied',choiceExplanations:[
      'Correct. The learner cannot interpret jargon without a shared frame of reference.',
      'Incorrect. Positive transfer helps new learning rather than blocking communication.',
      'Incorrect. The problem occurred during explanation, not excessive practice.'
    ]}),
  curatedQuestion('cfi','negative-transfer','Learning Process','FI.I.B.K16',
    'A learner consistently carries a tailwind-landing correction technique into a short-field landing where it produces an inappropriate control response. Which learning concept best describes the problem?',
    ['Negative transfer.','Positive transfer.','Primacy.'],0,
    'Negative transfer occurs when previously learned behavior interferes with correct performance of a new or different task.',
    'FAA-S-ACS-25 FI.I.B.K16; Aviation Instructor’s Handbook',
    {difficulty:'applied',choiceExplanations:[
      'Correct. Prior learning is interfering with the new task.',
      'Incorrect. Positive transfer helps rather than interferes.',
      'Incorrect. Primacy concerns the persistence of what is learned first, not the transfer relationship itself.'
    ]}),
  curatedQuestion('cfi','learning-plateau','Learning Process','FI.I.B.K9d',
    'An instrument learner’s scan performance stops improving for several lessons even though effort remains high. Which instructor response is most appropriate?',
    ['Diagnose the plateau, vary practice and presentation, and continue measuring performance before assuming learning has stopped.','Increase criticism until the learner breaks through the plateau.','Repeat the identical lesson indefinitely because any change would interfere with primacy.'],0,
    'Learning plateaus can occur during skill development. The instructor should diagnose the cause and adjust practice rather than treating the plateau as permanent failure.',
    'FAA-S-ACS-25 FI.I.B.K9d; Aviation Instructor’s Handbook',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. Diagnosis and varied, purposeful practice are appropriate responses.',
      'Incorrect. Punitive criticism does not address the learning cause.',
      'Incorrect. Repeating an ineffective approach can reinforce the problem.'
    ]}),
  curatedQuestion('cfi','learner-centered-debrief','Assessment & Testing','FI.I.D.K3a',
    'After a weak landing, the instructor first asks the learner to compare the approach with the stated standard, then adds specific observations and agrees on one change for the next attempt. What type of assessment is this?',
    ['Learner-centered assessment.','A punitive critique.','A norm-referenced test.'],0,
    'Learner-centered assessment involves the learner in analyzing performance against objective standards and planning the next improvement.',
    'FAA-S-ACS-25 FI.I.D.K3a; Aviation Instructor’s Handbook',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. The learner participates in evaluation against the standard.',
      'Incorrect. The feedback is specific and improvement-oriented rather than punitive.',
      'Incorrect. The performance is being compared with a standard, not other learners.'
    ]}),
  curatedQuestion('cfi','endorsement-practical','Instructor Responsibilities','AI.III.A.K1',
    'Before recommending an applicant for a practical test, which instructor action is the most defensible?',
    ['Verify the required training, aeronautical experience, knowledge-test prerequisites, and applicable endorsements before signing.','Sign the recommendation whenever the applicant requests it because the evaluator determines eligibility.','Use a generic endorsement without identifying the applicable regulatory basis.'],0,
    'A recommending instructor is certifying that required preparation and prerequisites have been met. The recommendation is not a clerical formality.',
    'FAA-S-ACS-25 AI.III.A.K1; 14 CFR part 61; AC 61-65',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. The instructor must verify eligibility and preparation before recommending the applicant.',
      'Incorrect. The instructor has an independent certification responsibility.',
      'Incorrect. Endorsements should match the applicable regulatory requirement.'
    ]}),
  curatedQuestion('cfi','solo-records','Instructor Responsibilities','AI.III.A.K1',
    'You complete required training and authorize a student pilot for solo operation. Which recordkeeping practice is correct?',
    ['Make the required learner logbook endorsements and retain the instructor records required by regulation.','Only the learner keeps records; the instructor has no recordkeeping obligation.','A verbal authorization is sufficient if the solo flight remains in the local practice area.'],0,
    'Solo authorization and instructor recordkeeping are regulatory responsibilities. Required endorsements and instructor records cannot be replaced by verbal permission.',
    'FAA-S-ACS-25 AI.III.A.K1; 14 CFR part 61; AC 61-65',
    {difficulty:'applied',choiceExplanations:[
      'Correct. Required endorsements and instructor records must be completed and retained as applicable.',
      'Incorrect. Instructors have specific recordkeeping obligations.',
      'Incorrect. Verbal permission does not replace required endorsements.'
    ]})
];

const exactAtpSamples=[
  faaSample('atp','atm-001','Air Carrier Regulations','AA.I.G.K4',
    'As required by Part 121, an airport may be listed as an alternate in the flight release only if the weather forecast indicates that conditions will be at or above the',
    ['alternate weather minima specified in the operation specifications at the time of arrival.','lowest available IAP minima at the time of arrival.','lowest available IAP minima for 1 hour before to 1 hour after the time of arrival.'],0,
    'Part 121 alternate planning uses the alternate minima specified by the certificate holder’s operations specifications, not simply the lowest charted approach minima.',
    'FAA ATM sample question 1; 14 CFR part 121; operations specifications',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. The applicable alternate minima come from the operations specifications.',
      'Incorrect. Published IAP minima are not automatically the Part 121 alternate planning minima.',
      'Incorrect. This substitutes an unsupported timing rule for the applicable alternate minima.'
    ]}),
  faaSample('atp','atm-009','Holding','AA.VI.J.K1',
    'When using a flight director system, what rate of turn or bank angle should a pilot observe during turns in a holding pattern?',
    ['3° per second or 25° bank, whichever is less.','1-1/2° per second or 25° bank, whichever is less.','3° per second or 30° bank, whichever is less.'],0,
    'Holding turns are made at 3° per second or 30° of bank, whichever requires less bank, unless using a flight director system, in which case 25° is used.',
    'FAA ATM sample question 9; AIM holding procedures',
    {difficulty:'applied',choiceExplanations:[
      'Correct. With a flight director, use 3° per second or 25° bank, whichever is less.',
      'Incorrect. The standard holding turn is not based on 1-1/2° per second.',
      'Incorrect. The flight-director limitation in this question is 25°, not 30°.'
    ]}),
  faaSample('atp','atm-010','Aircraft Performance','AA.I.B.K2c',
    'How does an increase in an aircraft’s weight affect its climb performance?',
    ['The aircraft will climb at a lower angle of attack, which allows for a higher TAS and higher rate of climb.','Both parasite and induced drag are increased, which will lower the reserve thrust available to climb.','A higher aircraft weight requires that the aircraft is configured for climb earlier in the departure which allows a greater climb gradient.'],1,
    'Higher weight requires more lift and increases drag, reducing excess thrust or power available for climb.',
    'FAA ATM sample question 10; FAA-S-ACS-11A AA.I.B.K2c',
    {difficulty:'advanced',choiceExplanations:[
      'Incorrect. Increased weight does not create a higher climb rate through a lower angle of attack.',
      'Correct. Increased drag reduces the excess thrust available for climb.',
      'Incorrect. Configuration timing does not reverse the performance penalty of added weight.'
    ]}),
  faaSample('atp','atm-016','Instrument Approaches','AA.VI.E.K2',
    'To conduct an RNAV (GPS) approach to LPV minimums, the aircraft must be furnished with',
    ['a GPS/WAAS receiver approved for an LPV approach by the AFM.','a GPS (TSO-C129) receiver certified for IFR operations.','an IFR approach-certified system with required navigation performance (RNP) of 0.5.'],0,
    'LPV guidance requires approved WAAS-capable equipment and the aircraft approval/documentation necessary for LPV operations.',
    'FAA ATM sample question 16; FAA-S-ACS-11A AA.VI.E.K2',
    {difficulty:'applied',choiceExplanations:[
      'Correct. LPV requires appropriately approved WAAS capability.',
      'Incorrect. A basic TSO-C129 GPS does not by itself provide LPV capability.',
      'Incorrect. An RNP 0.5 statement is not the equipment approval described for LPV.'
    ]}),
  faaSample('atp','atm-025','High-Altitude Aerodynamics','AA.I.B.K4',
    'When piloting a turbojet transport airplane, what is a possible result when operating at speeds 5-10 percent above the critical Mach number?',
    ['Increased aerodynamic efficiency.','Decreased control surface effectiveness.','Occasional low speed Mach buffet warnings.'],1,
    'Above critical Mach, shock-wave effects and associated flow separation can reduce control effectiveness and increase drag.',
    'FAA ATM sample question 25; FAA-S-ACS-11A AA.I.B.K4',
    {difficulty:'advanced',choiceExplanations:[
      'Incorrect. Compressibility effects do not produce a simple increase in aerodynamic efficiency.',
      'Correct. Shock-related separation can reduce control effectiveness.',
      'Incorrect. This describes a low-speed buffet concept rather than the high-Mach effect asked about.'
    ]}),
  faaSample('atp','atm-026','High-Altitude Aerodynamics','AA.I.D.K9',
    'While operating a turbojet transport airplane at high altitude, which condition is most likely to cause a low speed Mach buffet?',
    ['Reducing the angle of attack after a high speed Mach buffet.','Flying too fast for the aircraft weight and altitude.','Flying too slow for the aircraft weight and altitude.'],2,
    'Low-speed buffet occurs when the airplane approaches the high-altitude stall boundary at excessive angle of attack for its weight and altitude.',
    'FAA ATM sample question 26; FAA-S-ACS-11A AA.I.D.K9',
    {difficulty:'advanced',choiceExplanations:[
      'Incorrect. Reducing angle of attack moves away from the low-speed stall boundary.',
      'Incorrect. Excessive speed is associated with the high-speed buffet boundary.',
      'Correct. Too little speed for the weight and altitude moves the airplane toward the low-speed buffet boundary.'
    ]}),
  faaSample('atp','atm-030','Weather / Weather Charts','AA.I.C.K2',
    '(Refer to FAA-CT-8080-7D, Appendix 2, Figure 149.) What is the forecasted wind direction, speed, and temperature over ABI at 30,000 feet?',
    ['240°, 108 knots, -33°C.','240°, 8 knots, -33°C.','240°, 8 knots, 33°C.'],0,
    'The winds-aloft coding indicates 240° true at 108 knots with a temperature of -33°C; high wind speeds use the coded direction adjustment.',
    'FAA ATM sample question 30; FAA-CT-8080-7D Figure 149',
    {difficulty:'advanced',figureRef:{supplement:'FAA-CT-8080-7D',figure:'Appendix 2, Figure 149',url:FAA_SUPPLEMENTS.atp},choiceExplanations:[
      'Correct. The encoded wind represents 240° true at 108 knots and -33°C.',
      'Incorrect. This misses the high-wind-speed coding convention.',
      'Incorrect. This misses both the high-wind-speed coding and the negative temperature.'
    ]}),
  faaSample('atp','atm-033','RNAV / WAAS','AA.VI.D.K2',
    '(Refer to FAA-CT-8080-7D, Appendix 2, Figure 258.) As you approach DEPEW in a WAAS-equipped aircraft on the RNAV (GPS) RWY 32 approach, the CDI needle shows increasing deviation to the left with no increase in cross-track distance. What does this indicate?',
    ['Immediately execute the missed approach.','The CDI sensitivity has increased.','Turn right solely to re-center the CDI needle.'],1,
    'WAAS approach sensitivity scales as the aircraft progresses through the procedure. Greater displayed needle movement without greater cross-track error indicates increased sensitivity.',
    'FAA ATM sample question 33; FAA-CT-8080-7D Figure 258',
    {difficulty:'advanced',figureRef:{supplement:'FAA-CT-8080-7D',figure:'Appendix 2, Figure 258',url:FAA_SUPPLEMENTS.atp},choiceExplanations:[
      'Incorrect. Increased sensitivity alone is not a reason to execute the missed approach.',
      'Correct. The same cross-track error produces greater needle displacement as sensitivity increases.',
      'Incorrect. The question asks what the indication means, not for a blind correction without considering course guidance.'
    ]}),
  faaSample('atp','atm-039','Departure Procedures','AA.VI.C.K1',
    '(Refer to FAA-CT-8080-7D, Appendix 2, Figure 269.) You are cleared from the SENIC ONE Departure direct LAHAB before reaching MOXIE and then realize you cannot cross LAHAB at 15,000 feet. What should you do in IMC?',
    ['Enter holding at LAHAB until reaching 15,000 feet.','Advise Departure Control that you cannot make the clearance and request another clearance or vectors.','Turn temporarily toward Long Beach and continue climbing without advising ATC.'],1,
    'If an assigned clearance cannot be complied with, the crew should advise ATC promptly and obtain an amended clearance rather than improvising a route or holding pattern.',
    'FAA ATM sample question 39; FAA-CT-8080-7D Figure 269',
    {difficulty:'advanced',figureRef:{supplement:'FAA-CT-8080-7D',figure:'Appendix 2, Figure 269',url:FAA_SUPPLEMENTS.atp},choiceExplanations:[
      'Incorrect. The crew should not invent a hold that was not cleared.',
      'Correct. Advise ATC immediately and obtain an amended clearance.',
      'Incorrect. An uncoordinated course deviation in IMC is not the proper response.'
    ]})
];

const curatedCfii=[
  curatedQuestion('cfii','fig242-teaching','Instrument Approach Instruction','PTS Area/Task',
    '(Refer to FAA-CT-8080-3F, Figure 242 and Legend 27.) A learner says, “A 3.00° path means about 550 feet per nautical mile, so 550 FPM is correct at any groundspeed.” What is the best instructor correction?',
    ['A 3.00° path is about 318 feet per NM; the required FPM changes with groundspeed.','The learner is correct because a 3.00° path always requires the same FPM.','The only error is that 550 feet per NM should be rounded to 600.'],0,
    'The geometric descent gradient is approximately 318 ft/NM for a 3° path, while the descent rate in FPM changes with groundspeed.',
    'FAA-S-8081-9E; FAA-CT-8080-3F Figure 242 and Legend 27',
    {difficulty:'advanced',figureRef:{supplement:'FAA-CT-8080-3F',figure:'242 / Legend 27',url:FAA_SUPPLEMENTS.cfii},choiceExplanations:[
      'Correct. It separates path geometry from speed-dependent descent rate.',
      'Incorrect. FPM varies directly with groundspeed for a fixed descent angle.',
      'Incorrect. The fundamental issue is confusing ft/NM with FPM.'
    ]}),
  curatedQuestion('cfii','fig254-signs','Airport / Taxi Instruction','PTS Area/Task',
    '(Refer to FAA-CT-8080-3F, Figure 254.) A learner identifies the yellow sign as the mandatory instruction sign because it appears more prominent. What should the instructor correct first?',
    ['Mandatory instruction signs are identified by a red background with white inscription.','Mandatory instruction signs are always yellow with black inscription.','The sign color is irrelevant if the airport diagram is available.'],0,
    'Airport sign color and inscription conventions carry operational meaning. Mandatory instruction signs use red with white inscription.',
    'FAA-S-8081-9E; FAA-CT-8080-3F Figure 254; AIM',
    {difficulty:'applied',figureRef:{supplement:'FAA-CT-8080-3F',figure:'254',url:FAA_SUPPLEMENTS.cfii},choiceExplanations:[
      'Correct. Red/white is the mandatory-instruction convention.',
      'Incorrect. Yellow/black is used for other sign functions.',
      'Incorrect. Pilots must understand and comply with signs regardless of whether an airport diagram is available.'
    ]}),
  curatedQuestion('cfii','lost-comms-teach','IFR Instruction','PTS Area/Task',
    'A learner recites AVEF correctly but cannot explain when the rule would actually matter or how altitude selection is handled after a communications failure. What is the best next instructional step?',
    ['Give a realistic route and clearance scenario and require the learner to apply both route and altitude priorities.','Have the learner repeat the acronym faster until recall is automatic.','Move on because recalling AVEF proves satisfactory lost-communications knowledge.'],0,
    'Instrument instruction should move from recall to application. A realistic clearance forces the learner to combine route priority, altitude requirements, timing, and practical judgment.',
    'FAA-S-8081-9E; AIM lost communications',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. Scenario application exposes whether the learner can use the rule.',
      'Incorrect. Faster rote recall does not fix an application gap.',
      'Incorrect. Knowing the acronym alone does not demonstrate operational understanding.'
    ]}),
  curatedQuestion('cfii','partial-panel-diagnosis','Instrument Instruction','PTS Area/Task',
    'During partial-panel work, the learner fixates on the failed attitude indication and begins chasing supporting instruments. What should the instructor emphasize first?',
    ['Identify the unreliable source through cross-check, stabilize the airplane with reliable information, then simplify the scan.','Cover every remaining instrument so the learner stops fixating.','Restore the failed instrument immediately because diagnosis is not part of instrument instruction.'],0,
    'The teaching objective is recognition of unreliable information, aircraft control using reliable sources, and workload management.',
    'FAA-S-8081-9E; Instrument Flying Handbook',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. Diagnose, control, and simplify the scan using reliable information.',
      'Incorrect. Removing all information creates an artificial problem instead of teaching diagnosis.',
      'Incorrect. Failure recognition and partial-panel control are core instrument-instruction skills.'
    ]}),
  curatedQuestion('cfii','weather-decision','Weather Instruction','PTS Area/Task',
    'A learner can decode every line of a TAF but still launches without identifying what forecast change would trigger a delay or diversion. What is the instructional deficiency?',
    ['The learner is demonstrating decoding knowledge without applying it to risk-management decisions.','The learner needs more practice memorizing weather abbreviations only.','The learner should ignore forecast trends and rely on the departure METAR.'],0,
    'Instrument weather instruction must connect products to decisions, trends, margins, and escape options rather than stop at decoding.',
    'FAA-S-8081-9E; Aviation Weather Handbook',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. The missing skill is application and decision-making.',
      'Incorrect. More abbreviation recall does not address the decision gap.',
      'Incorrect. A single observation cannot replace forecast and trend analysis.'
    ]}),
  curatedQuestion('cfii','holding-reasoning','Holding Instruction','PTS Area/Task',
    'A learner can name direct, teardrop, and parallel entries but cannot determine the protected side of an unfamiliar hold. What should the instructor teach next?',
    ['Build the hold from the clearance and protected side first, then treat the entry as a way to join that pattern.','Memorize more entry-angle diagrams without drawing the clearance.','Always use a direct entry because ATC will correct it if necessary.'],0,
    'Holding instruction should prioritize clearance interpretation, protected airspace, and aircraft control rather than treating the entry label as the objective.',
    'FAA-S-8081-9E; AIM holding procedures',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. Understanding the hold geometry makes entry selection meaningful.',
      'Incorrect. More memorization does not fix the underlying spatial understanding.',
      'Incorrect. Entry and containment remain pilot responsibilities.'
    ]}),
  curatedQuestion('cfii','currency-vs-proficiency','Instructor Responsibilities','PTS Area/Task',
    'A pilot has completed the regulatory tasks needed for recent instrument experience but has not flown actual or simulated IMC in months. Which instructional point is most important?',
    ['Currency is a legal threshold; proficiency must still be evaluated separately for the planned operation.','Meeting recent-experience requirements proves the pilot is proficient for any IFR operation.','An IPC is prohibited while the pilot remains legally current.'],0,
    'A pilot can be legally current yet not proficient for a demanding operation. Instrument instructors should distinguish legal eligibility from operational proficiency.',
    'FAA-S-8081-9E; 14 CFR 61.57; FAA risk-management guidance',
    {difficulty:'advanced',choiceExplanations:[
      'Correct. Legal currency and operational proficiency are different questions.',
      'Incorrect. Recent-experience compliance does not guarantee proficiency in every condition.',
      'Incorrect. Additional proficiency training or an IPC can be appropriate even when not legally required.'
    ]}),
  curatedQuestion('cfii','waas-sensitivity','RNAV / GPS Instruction','PTS Area/Task',
    '(Refer to FAA-CT-8080-7D, Appendix 2, Figure 258.) A learner sees larger CDI movement while cross-track error remains essentially unchanged on a WAAS approach. What concept should the instructor reinforce?',
    ['Approach CDI sensitivity scales as the aircraft progresses through the procedure.','The GPS has necessarily failed and the missed approach must begin immediately.','Cross-track distance always increases in direct proportion to CDI deflection.'],0,
    'WAAS approach course sensitivity increases through the approach, so the same physical cross-track error can produce greater displayed deflection.',
    'FAA-S-8081-9E; FAA-CT-8080-7D Figure 258',
    {difficulty:'advanced',figureRef:{supplement:'FAA-CT-8080-7D',figure:'Appendix 2, Figure 258',url:FAA_SUPPLEMENTS.atp},choiceExplanations:[
      'Correct. Increased CDI sensitivity explains greater deflection without greater cross-track error.',
      'Incorrect. Scaling by itself is normal and is not a failure indication.',
      'Incorrect. Display sensitivity can change while the physical cross-track error does not.'
    ]})
];

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
const productionSampleIds={
 ppl:new Set(['faa-ppl-par-001','faa-ppl-par-020','faa-ppl-par-044']),
 ira:new Set(['faa-ira-ira-001','faa-ira-ira-003','faa-ira-ira-044','faa-ira-ira-047']),
 cpl:new Set(['faa-cpl-cax-004','faa-cpl-cax-031','faa-cpl-cax-032','faa-cpl-cax-044'])
};
const productionSamples=track=>(officialSamples[track]||[]).filter(q=>productionSampleIds[track]?.has(q.id));
export const banks={
 ppl:[...productionSamples('ppl'),...figureParallelQuestions.ppl],
 ira:[...productionSamples('ira'),...figureParallelQuestions.ira],
 cpl:[...productionSamples('cpl'),...figureParallelQuestions.cpl],
 cfi:curatedCfi,
 cfii:curatedCfii,
 atp:exactAtpSamples
};
export const bankManifest={
 acsQuestionCount:['ppl','ira','cpl','cfi','atp'].reduce((s,t)=>s+banks[t].length,0),
 supplementalPtsQuestionCount:banks.cfii.length,
 totalQuestionCount:Object.values(banks).reduce((s,a)=>s+a.length,0),
 byTrack:Object.fromEntries(Object.entries(banks).map(([k,v])=>[k,v.length])),
 standards:STANDARDS,
 generatedAt:'2026-09-22',
 legacyGeneratedFamiliesExcluded:true
};
