const FAA_ACS='https://www.faa.gov/training_testing/testing/acs';
const STANDARDS={
  foi:{doc:'FAA-H-8083-9',type:'Handbook',url:'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook'},
  ppl:{doc:'FAA-S-ACS-6C',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf'},
  ira:{doc:'FAA-S-ACS-8C',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/instrument_rating_airplane_acs_8.pdf'},
  cpl:{doc:'FAA-S-ACS-7B',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/commercial_airplane_acs_7.pdf'},
  cfi:{doc:'FAA-S-ACS-25',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/cfi_airplane_acs_25.pdf'},
  atp:{doc:'FAA-S-ACS-11A',type:'ACS',url:'https://www.faa.gov/training_testing/testing/acs/atp_airplane_acs_11.pdf'},
  cfii:{doc:'FAA-S-8081-9E',type:'PTS',url:'https://www.faa.gov/training_testing/testing/acs/cfi_instrument_pts_9.pdf'}
};
export const trackMeta={
  foi:{label:'Fundamentals of Instructing',testCode:'FOI',officialQuestions:50,officialMinutes:90,passingScore:70,description:'Human behavior, learning, communication, teaching, assessment, lesson planning and instructor responsibilities.'},
  ppl:{label:'Private Pilot Airplane',testCode:'PAR',officialQuestions:60,officialMinutes:120,passingScore:70,description:'Private pilot regulations, weather, navigation, performance, systems, airport operations, and ADM.'},
  ira:{label:'Instrument Rating Airplane',testCode:'IRA',officialQuestions:60,officialMinutes:120,passingScore:70,description:'IFR regulations, weather, instruments, navigation, clearances, holding, and approaches.'},
  cpl:{label:'Commercial Pilot Airplane',testCode:'CAX',officialQuestions:100,officialMinutes:150,passingScore:70,description:'Commercial privileges, operations, performance, aerodynamics, weather, systems, and advanced planning.'},
  cfi:{label:'Flight Instructor Airplane',testCode:'FIA',officialQuestions:100,officialMinutes:150,passingScore:70,description:'Fundamentals of instructing, endorsements, lesson planning, assessment, maneuvers, and risk management.'},
  cfii:{label:'Flight Instructor Instrument Airplane',testCode:'FII',officialQuestions:50,officialMinutes:150,passingScore:70,description:'Instrument instruction, IFR regulations, systems, weather, procedures, approaches, and common student errors.'},
  atp:{label:'Airline Transport Pilot Multiengine',testCode:'ATM',officialQuestions:125,officialMinutes:210,passingScore:70,description:'Air-carrier regulations, turbine systems, high-altitude aerodynamics, IFR operations, weather, and CRM.'}
};
export const publicSources=[
 {label:'Fundamentals of Instructing: Aviation Instructor’s Handbook',url:STANDARDS.foi.url},
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

// Original scenario practice: distinct concepts, FAA references, no generated families.
const scenarioQuestions={
ppl:[
curatedQuestion("ppl","load-factor-stall","Aerodynamics","PA.VII.A","An airplane stalls at 50 KIAS in unaccelerated flight. At the same weight and configuration, approximately what is its stall speed in a coordinated, level 60-degree bank?",["50 KIAS", "71 KIAS", "100 KIAS"],1,"A level 60-degree bank requires a load factor of 2. Stall speed increases with the square root of load factor: 50 × √2 is about 71 KIAS. The wing still stalls at its critical angle of attack.","PHAK Chapter 5: load factors and accelerated stalls",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Maintaining altitude in this bank raises the load factor above 1.", "Correct. √2 times the original stall speed is approximately 71 KIAS.", "Incorrect. Stall speed scales with the square root of load factor, not directly with load factor."]}),
curatedQuestion("ppl","aft-cg-stability","Weight & Balance","PA.I.F","Moving baggage aft keeps an airplane inside its approved CG envelope. Compared with the original forward loading, what change should the pilot expect?",["Greater longitudinal stability.", "Less longitudinal stability and lighter pitch control forces.", "An unchanged pitch response because the loading remains legal."],1,"Moving the CG aft generally reduces longitudinal stability and pitch control forces. Staying inside the approved envelope establishes compliance with limits; it does not make handling identical throughout that envelope.","PHAK Chapters 5 and 10: CG and longitudinal stability",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. A more forward CG generally provides greater longitudinal stability.", "Correct. An aft shift generally reduces stability and the pitch force needed.", "Incorrect. Legal CG positions can still have different handling characteristics."]}),
curatedQuestion("ppl","pitot-open-drain","Flight Instruments","PA.I.G","During cruise, the pitot inlet becomes blocked while its drain hole and the static ports remain clear. What happens to a conventional airspeed indicator?",["It freezes at the speed when the blockage occurred.", "It begins indicating altitude instead of airspeed.", "Its indication falls toward zero."],2,"With no new ram pressure entering and an open drain allowing pressure to escape, the pitot pressure approaches ambient pressure. The indicator loses the pressure difference it uses to display airspeed and trends toward zero.","PHAK Chapter 8: blocked pitot system",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. An open drain prevents ram pressure from remaining trapped.", "Incorrect. The altimeter-like response requires a blocked pitot inlet AND blocked drain, with the static source clear.", "Correct. The pressure difference disappears as pressure vents through the drain."]}),
curatedQuestion("ppl","carb-ice-rpm","Aircraft Systems","PA.I.G","A carbureted airplane with a fixed-pitch propeller develops a gradual RPM loss in conditions favorable for carburetor ice. After full carburetor heat is applied, roughness initially increases before RPM recovers. What best explains this?",["Melting ice and water temporarily disturb combustion as the obstruction clears.", "Carburetor heat always increases air density, so RPM must rise immediately.", "The roughness proves carburetor ice was absent."],0,"Carburetor heat introduces warmer, less dense air and may initially reduce power. As accumulated ice melts, roughness can temporarily increase before operation improves. Follow the airplane’s approved procedure rather than removing heat solely because of that initial response.","PHAK Chapter 7: induction systems and carburetor icing",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Ice clearing can produce transient roughness before recovery.", "Incorrect. Heated air is less dense, and recovery need not be immediate.", "Incorrect. Initial roughness can accompany removal of carburetor ice."]}),
],
ira:[
curatedQuestion("ira","early-missed-path","Instrument Approaches","IR.VI","Before reaching the MAP, a pilot abandons a nonprecision approach with no intervening maximum-altitude restriction and no alternate ATC instructions. What is the appropriate lateral path?",["Turn immediately toward the missed-approach holding fix.", "Continue the approach’s lateral path to the MAP before making the published missed-approach turn.", "Remain level at the FAF until ATC supplies radar vectors."],1,"An early missed approach does not authorize an early turn. Continue the instrument procedure’s lateral path to the MAP and follow the published missed approach, including applicable altitude restrictions. Advise ATC; different ATC instructions can change the required path.","AIM 5-5-5: missed approach responsibilities",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_5.html", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. An early turn can leave the protected procedure path.", "Correct. Early abandonment preserves the lateral path to the MAP before the published turn.", "Incorrect. The procedure remains applicable without waiting for vectors."]}),
curatedQuestion("ira","static-block-climb","Instrument Failures","IR.II","The static source of conventional pitot-static instruments becomes fully blocked in level flight. The pitot source stays clear. After the airplane climbs and settles at a higher altitude, what indications are expected?",["Altimeter and VSI both indicate a continuing climb.", "Altimeter freezes, VSI settles at zero, and ASI reads lower than it would with a clear static source.", "Altimeter freezes and ASI reads higher than it would with a clear static source."],1,"Trapped static pressure prevents the altimeter from sensing the climb. The VSI returns to zero after transients. At a higher altitude, trapped static pressure exceeds actual ambient pressure, reducing the differential seen by the ASI and causing an underread.","PHAK Chapter 8: blocked static system",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Both altitude instruments require changes in static pressure.", "Correct. Trapped static pressure causes these three related indications above the blockage altitude.", "Incorrect. With a clear pitot source, the ASI underreads above the altitude where static pressure was trapped."]}),
curatedQuestion("ira","vector-approach-altitude","Approach Clearances","IR.VI","While being radar vectored, you receive an approach clearance but are not yet established on a published procedure segment. No other descent instruction is given. Which altitude governs?",["The last assigned altitude until established on a published segment, then the applicable published altitude.", "The final approach MDA immediately upon receiving the clearance.", "Any altitude above terrain that the GPS terrain display shows as clear."],0,"An approach clearance does not by itself permit immediate descent to final minimums while still on vectors. Maintain the last assigned altitude until established on an applicable published segment, then comply with the procedure’s restrictions.","AIM 5-5-4: instrument approach responsibilities",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_5.html", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Establishment on the published segment determines when its altitude restrictions become applicable.", "Incorrect. MDA applies to the final approach segment, not arbitrary vector positions.", "Incorrect. A terrain display does not replace assigned or published altitudes."]}),
curatedQuestion("ira","contact-approach-request","IFR Procedures","IR.VI","A controller offers a visual approach, but the airport is not in sight. You can remain clear of clouds with at least one mile flight visibility and reasonably expect to reach the airport in those conditions. Who must initiate a contact-approach request?",["ATC must initiate it because you are on an IFR clearance.", "Either party may initiate it as an automatic substitute for a visual approach.", "The pilot must request it and accepts responsibility for obstruction clearance."],2,"A contact approach must be requested by the pilot; a controller does not solicit it. It has separate conditions from a visual approach and shifts obstruction-clearance responsibility to the pilot. It is not an automatic fallback when the airport is not visible.","AIM 5-5-3: contact approaches",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_5.html", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Controllers do not initiate or solicit a contact approach.", "Incorrect. It requires a pilot request and applicable conditions.", "Correct. The pilot requests the contact approach and assumes obstruction-clearance responsibility."]}),
],
cpl:[
curatedQuestion("cpl","vmc-not-climb","Multiengine Aerodynamics","CA.X","A light twin is above its published VMC after an engine failure, yet it is descending despite full available power on the operating engine. Which conclusion is correct?",["VMC concerns directional control under specified conditions and does not guarantee a climb.", "The airspeed indication must be wrong because flight above VMC guarantees level flight.", "The red radial line represents best single-engine rate-of-climb speed."],0,"VMC is a control-related speed, not a climb guarantee. Single-engine performance depends on weight, altitude, configuration and other conditions. Use the AFM/POH for applicable speeds, procedures and actual performance.","Airplane Flying Handbook Chapter 13: VMC and single-engine performance",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/14_afh_ch13.pdf", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Directional controllability and positive climb performance are different requirements.", "Incorrect. Being above VMC does not ensure enough excess power to maintain altitude.", "Incorrect. The blue line commonly identifies VYSE; the red radial line identifies VMC."]}),
curatedQuestion("cpl","windmill-drag","Multiengine Performance","CA.X","After a verified engine failure in a feather-capable light twin, why can feathering the failed engine’s propeller improve single-engine climb performance?",["It increases power produced by the operating engine.", "It removes the need to maintain directional control.", "It reduces drag from the failed engine’s windmilling propeller."],2,"A windmilling propeller can impose substantial drag. Feathering, when called for by the aircraft’s approved procedure after identification and verification, reduces that drag. It does not increase the operating engine’s power or eliminate asymmetric thrust.","Airplane Flying Handbook Chapter 13: propeller drag and feathering",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/14_afh_ch13.pdf", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Feathering changes failed-propeller drag, not the operating engine’s available power.", "Incorrect. Asymmetric thrust still requires directional control.", "Correct. Reduced propeller drag improves the excess thrust available."]}),
curatedQuestion("cpl","lighter-va","Maneuvering Speed","CA.I.F","An airplane is substantially lighter than the weight used for its published maneuvering speed. What should a commercial pilot do before turbulence penetration?",["Use a higher maneuvering speed because the airplane has less inertia.", "Determine the appropriate lower maneuvering speed for the actual weight from approved aircraft guidance.", "Treat the published maximum-weight VA as protection against repeated full control reversals."],1,"Maneuvering speed decreases as weight decreases. Lower weight means the wing can reach the limiting load factor at a lower airspeed. VA does not guarantee protection from every combination of gusts, multiple-axis inputs or repeated control reversals.","PHAK Chapter 5: maneuvering speed and weight",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Lower weight calls for a lower, not higher, maneuvering speed.", "Correct. Use the weight-appropriate speed and the aircraft’s approved guidance.", "Incorrect. VA is not a blanket structural-protection guarantee for arbitrary inputs."]}),
curatedQuestion("cpl","forward-cg-tail","Weight & Balance","CA.I.F","At the same weight and configuration, shifting the CG forward usually requires more downward tail force. What performance effect can follow?",["The wing needs less lift because the tail supports more weight.", "The wing must produce more lift, increasing induced drag and potentially reducing performance.", "Induced drag disappears because longitudinal stability improves."],1,"In a conventional airplane, increased downward tail force adds to the lift the wing must generate. That can increase induced drag and adversely affect performance, even though the forward CG generally increases longitudinal stability.","PHAK Chapters 5 and 10: balance, tail force and performance",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Downward tail force adds to, rather than supports, the load carried by the wing.", "Correct. Additional required wing lift can increase induced drag.", "Incorrect. Stability and induced drag are different effects; improved stability does not eliminate drag."]}),
],
cfi:[
curatedQuestion("cfi","primacy-correction","Learning Theory","FI.I","A learner was initially taught an incorrect checklist sequence and repeatedly returns to it after correction. Which learning principle best explains the persistent habit?",["Recency: the newest experience always replaces earlier learning.", "Primacy: initial learning can establish a strong, difficult-to-replace pattern.", "Intensity: quiet repetition cannot form a lasting habit."],1,"Primacy describes the strong influence of initial learning. Correct initial demonstrations and practice help establish sound habits; correcting an established incorrect pattern requires deliberate, accurate repetition and assessment.","Aviation Instructor’s Handbook Chapter 3: laws of learning",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Recency affects recall but does not guarantee that a newer correction replaces an older habit.", "Correct. First-learned procedures can persist and require deliberate retraining.", "Incorrect. Habit formation is not limited to dramatic or intense experiences."]}),
curatedQuestion("cfi","adverse-yaw-teach","Aerodynamics Instruction","FI.II","During a roll into a left turn, a learner notices the nose initially yawing right when aileron is applied without appropriate rudder. What aerodynamic explanation should the instructor give?",["The down-going right aileron increases lift and drag on the right wing, producing adverse yaw.", "The yaw proves that the airplane has already entered a spin.", "Both ailerons increase drag equally, so the effect comes only from the elevator."],0,"Aileron deflection changes lift and drag differently on the two wings. The wing with the down-going aileron tends to create more drag, yawing the nose opposite the intended roll. Coordinated rudder counters adverse yaw.","PHAK Chapter 6: ailerons and adverse yaw",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Increased drag on the wing with the down-going aileron yaws the nose opposite the roll.", "Incorrect. Adverse yaw during roll entry is not proof of a stall or spin.", "Incorrect. The unequal aileron drag is central to this effect."]}),
curatedQuestion("cfi","stall-aoa-teach","Stall Instruction","FI.II","A learner proposes applying full power while maintaining the same excessive angle of attack to recover from a stall. What essential correction should the instructor make?",["Power alone always unstalls the wing before any attitude change.", "The critical angle of attack must be reduced; power and other actions support the aircraft-specific recovery.", "The first priority is to return the airplane to its exact pre-stall altitude."],1,"A wing stalls when its critical angle of attack is exceeded. Reducing angle of attack is essential to recovery; adding power does not substitute for that reduction. Apply the aircraft’s approved recovery procedure and accept the altitude loss needed to recover safely.","PHAK Chapter 5: stalls and angle of attack",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Power does not remove the need to reduce excessive angle of attack.", "Correct. Reducing angle of attack is fundamental, with other actions following approved guidance.", "Incorrect. Insisting on altitude retention can prevent the necessary angle-of-attack reduction."]}),
curatedQuestion("cfi","ground-effect-teach","Takeoff Instruction","FI.II","A learner lifts off early and accelerates close to the runway, then finds the airplane will not climb after leaving ground effect. What should the instructor explain?",["Leaving ground effect reduces induced drag and increases climb capability.", "Ground effect guarantees climb once the airplane becomes airborne.", "Reduced induced drag near the surface can permit flight before enough energy and performance exist for sustained climb outside ground effect."],2,"Ground effect reduces induced drag near the surface. An airplane may become airborne there before it has adequate airspeed and excess power to climb away. Follow the approved takeoff speeds and procedures instead of assuming that initial liftoff proves climb capability.","PHAK Chapter 5: ground effect",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Induced drag increases as the airplane leaves ground effect.", "Incorrect. Being airborne in ground effect does not guarantee climb performance above it.", "Correct. The near-surface drag benefit can temporarily mask insufficient climb capability."]}),
],
cfii:[
curatedQuestion("cfii","back-course-cdi","Navigation Instruction","PTS Area II","On a published localizer back-course approach, a conventional CDI without back-course compensation deflects left. How should a CFII explain the needed correction?",["Correct right because the conventional localizer CDI has reverse sensing on the back course.", "Correct left exactly as on the front course.", "Rotate the OBS until the CDI reverses its localizer sensing."],0,"A conventional localizer CDI gives reverse sensing while flying inbound on the back course. Correct opposite the needle unless the installed system provides approved compensation. Rotating a conventional CDI’s OBS does not reverse a localizer signal’s sensing.","Instrument Flying Handbook: localizer back-course navigation",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/FAA-H-8083-15B.pdf", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. With the stated uncompensated CDI, a left deflection calls for a right correction.", "Incorrect. Following the needle applies to normal front-course sensing, not this stated installation.", "Incorrect. A conventional localizer CDI’s sensing is not changed by rotating the OBS."]}),
curatedQuestion("cfii","map-timing-groundspeed","Approach Instruction","PTS Area VIII","A nonprecision approach identifies its MAP with published timing from the FAF. A strong headwind develops on final. Which speed should the learner use to select the appropriate timing?",["Indicated airspeed, because the clock measures airflow over the wing.", "Groundspeed, because the timing represents travel over a fixed ground distance.", "True airspeed without a wind correction, because the procedure is instrument-based."],1,"FAF-to-MAP timing represents travel along a fixed ground distance. Use the published timing method and the applicable groundspeed. A headwind reduces groundspeed and increases the time required; IAS or TAS alone does not account for that effect.","Instrument Flying Handbook: nonprecision approach timing",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/FAA-H-8083-15B.pdf", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. IAS does not directly determine time over a ground distance.", "Correct. Groundspeed includes the wind effect relevant to FAF-to-MAP travel.", "Incorrect. TAS alone omits the headwind component."]}),
curatedQuestion("cfii","vor-angular-distance","Navigation Instruction","PTS Area II","A learner observes the same VOR CDI angular deflection at 40 NM and 10 NM from the station. How does the lateral distance from the selected course compare?",["It is the same because the needle deflection is the same.", "It is greater at 10 NM because VOR sensitivity decreases near the station.", "It is greater at 40 NM because the same angle spans more distance farther from the station."],2,"A VOR CDI represents an angular course error. For a fixed angular error, lateral displacement grows with distance from the station. The same needle position therefore represents a smaller physical displacement closer to the station.","Instrument Flying Handbook: VOR course deviation and sensitivity",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/FAA-H-8083-15B.pdf", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The same angular error does not mean the same lateral distance.", "Incorrect. A fixed angle spans less lateral distance closer to the station.", "Correct. Greater station distance produces greater lateral displacement for the same angle."]}),
curatedQuestion("cfii","crosscheck-attitude","Instrument Instruction","PTS Area VI","In simulated instrument flight, the attitude indicator suddenly shows a bank while the turn indicator, heading and other independent indications remain consistent with straight flight. What should the CFII teach?",["Cross-check independent indications and diagnose the discrepancy before chasing the suspect display.", "Immediately make a large roll correction based only on the attitude indicator.", "Ignore every instrument because disagreement proves that all instruments failed."],0,"Instrument cross-checking uses independent indications to recognize a possible failure. Compare the indications and aircraft response, identify the suspect source, and apply the appropriate aircraft procedures rather than reacting with a large correction to one conflicting display.","Instrument Flying Handbook: instrument cross-check and failure recognition",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/FAA-H-8083-15B.pdf", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Independent indications help distinguish actual attitude changes from a suspect instrument.", "Incorrect. Chasing a failed display can create an actual upset.", "Incorrect. One disagreement does not establish that every instrument has failed."]}),
],
atp:[
curatedQuestion("atp","mach-tuck-shift","High-Altitude Aerodynamics","AA.I.D","As a swept-wing jet approaches its critical Mach region, shock-related changes move the center of pressure aft. What tendency is associated with that change?",["A nose-up pitch tendency that always increases longitudinal stability.", "A nose-down tendency commonly called Mach tuck.", "A yaw tendency caused solely by unequal engine thrust."],1,"An aft shift in the wing’s center of pressure can increase the nose-down pitching moment as compressibility effects develop. This is associated with Mach tuck. The approved aircraft limits and procedures govern avoidance and recovery.","PHAK Chapter 5: compressibility and Mach tuck",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The described aft shift is associated with a nose-down tendency.", "Correct. Mach tuck describes the resulting nose-down pitching tendency.", "Incorrect. The described cause is aerodynamic compressibility, not asymmetric thrust."]}),
curatedQuestion("atp","buffet-turn-margin","High-Altitude Performance","AA.I.D","A transport airplane cruises near its high-altitude buffet boundary. Why can a level turn reduce the remaining buffet margin?",["The turn increases load factor and the lift required, moving the airplane closer to its buffet limits.", "Banking reduces the lift needed to maintain altitude.", "Buffet margin depends only on altitude and cannot change with maneuvering."],0,"Maintaining altitude in a turn requires additional lift and load factor. At high altitude, where the usable speed margin may already be narrow, maneuvering can reduce the margin to buffet. Respect the aircraft’s weight, altitude, speed and maneuvering guidance.","PHAK Chapter 5: load factor and high-speed flight",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Increased lift demand and load factor reduce the available margin.", "Incorrect. Total lift must increase to preserve its vertical component in a level turn.", "Incorrect. Weight, speed and load factor also affect the margin."]}),
curatedQuestion("atp","pressure-differential","Pressurization Systems","AA.I.A","A cabin-pressure controller holds cabin absolute pressure steady while the airplane climbs and outside pressure decreases. What happens to cabin differential pressure?",["It decreases because outside pressure is decreasing.", "It stays constant because cabin pressure is constant.", "It increases because the difference between cabin and outside pressure grows."],2,"Cabin differential pressure is cabin pressure minus outside pressure. With cabin pressure fixed and outside pressure decreasing, the differential increases. The aircraft’s pressurization limits and relief systems constrain the allowable differential.","PHAK Chapter 7: cabin pressurization and differential pressure",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Subtracting a smaller outside pressure increases the difference.", "Incorrect. Differential depends on both pressures, not cabin pressure alone.", "Correct. The gap between the fixed cabin pressure and falling outside pressure increases."]}),
curatedQuestion("atp","crm-challenge","Crew Resource Management","AA.I.F","The monitoring pilot notices an approach altitude discrepancy, but the flying pilot dismisses it without checking. Which crew response best supports safe operation?",["Remain silent because only the flying pilot may question the flight path.", "Clearly state the discrepancy, seek a cross-check and escalate using the operator’s standard procedures.", "Delay the discussion until after landing to avoid interrupting the approach."],1,"Effective crew resource management relies on timely communication, monitoring and assertive challenge when safety is in question. Use clear information and established crew procedures to resolve the discrepancy while there is still time to act.","Aviation Instructor’s Handbook Chapter 2: communication and crew resource management",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Monitoring includes identifying and communicating safety concerns.", "Correct. A clear challenge and procedural escalation promote shared awareness and corrective action.", "Incorrect. A present altitude discrepancy needs timely resolution, not a postflight-only discussion."]}),
],
};
const productionSampleIds={
 ppl:new Set(['faa-ppl-par-001','faa-ppl-par-020','faa-ppl-par-044']),
 ira:new Set(['faa-ira-ira-001','faa-ira-ira-003','faa-ira-ira-044','faa-ira-ira-047']),
 cpl:new Set(['faa-cpl-cax-004','faa-cpl-cax-031','faa-cpl-cax-032','faa-cpl-cax-044'])
};
const productionSamples=track=>(officialSamples[track]||[]).filter(q=>productionSampleIds[track]?.has(q.id));

// Original expansion: independent scenarios, never numeric template variants.
const expandedQuestions={
 ppl:[
  curatedQuestion("ppl","expansion-01","Aerodynamics","PA.I.F","An airplane enters a coordinated level turn at unchanged weight. Why does its stall speed increase as bank steepens?",["The required load factor increases.", "Bank reduces the critical angle of attack.", "The wing area decreases in a turn."],0,"A level turn requires greater total lift to maintain the vertical lift component. Increasing load factor increases stall speed even though the critical angle of attack remains essentially unchanged.","PHAK Chapter 5: Aerodynamics of Flight",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. A level turn requires greater total lift to maintain the vertical lift component. Increasing load factor increases stall speed even though the critical angle of attack remains essentially unchanged.", "Incorrect. Bank alone does not redefine the wing’s critical angle of attack.", "Incorrect. The physical wing area is unchanged."]}),
  curatedQuestion("ppl","expansion-02","Aerodynamics","PA.I.F","A pilot raises the flaps at low speed shortly after takeoff without adjusting pitch. Which risk requires attention?",["Elimination of induced drag at every angle of attack.", "A loss of lift and reduced stall margin.", "A guaranteed increase in lift at the same speed."],1,"Flap retraction changes the wing’s lift characteristics and increases the clean-configuration stall speed. Follow the aircraft procedure and maintain an adequate airspeed and climb margin.","PHAK Chapter 5: Aerodynamics of Flight",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Induced drag still exists whenever the wing produces lift.", "Correct. Flap retraction changes the wing’s lift characteristics and increases the clean-configuration stall speed. Follow the aircraft procedure and maintain an adequate airspeed and climb margin.", "Incorrect. Retracting flaps does not guarantee more lift at unchanged speed and attitude."]}),
  curatedQuestion("ppl","expansion-03","Aircraft Systems","PA.I.G","A carbureted engine loses RPM in humid air at a moderate temperature. Why should carburetor ice remain a possibility?",["Carburetor ice requires an outside temperature below freezing.", "Only visible airframe ice can cause carburetor ice.", "Fuel vaporization and pressure reduction can cool the carburetor below freezing."],2,"Cooling inside the carburetor can cause icing when outside air is well above freezing. Apply the aircraft’s carburetor-heat procedure and evaluate the engine indications.","PHAK Chapter 7: Aircraft Systems",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Internal cooling permits ice at above-freezing outside temperatures.", "Incorrect. Carburetor icing can occur without visible airframe icing.", "Correct. Cooling inside the carburetor can cause icing when outside air is well above freezing. Apply the aircraft’s carburetor-heat procedure and evaluate the engine indications."]}),
  curatedQuestion("ppl","expansion-04","Aircraft Systems","PA.I.G","An engine-driven alternator fails but the battery still powers the panel. What should the pilot expect without another electrical source?",["Finite battery endurance requiring the approved load-shedding procedure.", "Unlimited endurance because the battery recharges itself.", "Immediate failure of all magneto ignition systems."],0,"The battery supplies stored energy after charging is lost. Electrical endurance depends on battery condition and loads; follow the aircraft checklist and plan accordingly.","PHAK Chapter 7: Aircraft Systems",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. The battery supplies stored energy after charging is lost. Electrical endurance depends on battery condition and loads; follow the aircraft checklist and plan accordingly.", "Incorrect. A battery cannot replace the lost charging source indefinitely.", "Incorrect. Conventional magnetos operate independently of the aircraft’s battery circuit."]}),
  curatedQuestion("ppl","expansion-05","Weather","PA.I.C","A warm moist air mass flows over a colder surface. Which fog mechanism is most directly involved?",["Steam fog from cold air moving over warm water.", "Advection fog.", "Radiation fog caused only by overnight cooling in calm air."],1,"Advection fog forms as moist air moves over a colder surface and cools toward saturation. The movement of the air mass distinguishes it from radiation fog.","PHAK Chapter 12: Weather Theory",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Steam fog describes the opposite temperature arrangement.", "Correct. Advection fog forms as moist air moves over a colder surface and cools toward saturation. The movement of the air mass distinguishes it from radiation fog.", "Incorrect. Radiation fog primarily follows surface cooling and is not the described transport mechanism."]}),
  curatedQuestion("ppl","expansion-06","Weather","PA.I.C","Air flows across a mountain ridge in strong winds. Where can hazardous rotor turbulence occur?",["Only far above every wave crest.", "Exclusively on the upwind side at sea level.", "On the downwind side beneath the mountain-wave system."],2,"Mountain waves can produce severe turbulence in rotors on the lee side. Cloud absence does not establish that the wave or rotor hazard is absent.","PHAK Chapter 12: Weather Theory",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Rotors can affect low altitudes beneath the wave.", "Incorrect. The lee side is a principal rotor-risk location.", "Correct. Mountain waves can produce severe turbulence in rotors on the lee side. Cloud absence does not establish that the wave or rotor hazard is absent."]}),
  curatedQuestion("ppl","expansion-07","Weight and Balance","PA.I.F","Baggage is moved aft without changing total airplane weight. What changes?",["The center of gravity moves aft.", "The center of gravity remains fixed because weight is unchanged.", "The empty weight increases by the baggage weight."],0,"Moving weight changes its moment and therefore the center of gravity. Verify the new loading against approved limits, even when total weight stays the same.","PHAK Chapter 10: Weight and Balance",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Moving weight changes its moment and therefore the center of gravity. Verify the new loading against approved limits, even when total weight stays the same.", "Incorrect. Center of gravity depends on moments as well as total weight.", "Incorrect. Relocating existing baggage does not change empty weight."]}),
  curatedQuestion("ppl","expansion-08","Navigation","PA.VI","A pilot turns the airplane’s heading into a crosswind while maintaining the intended ground track. What is being corrected?",["The difference between indicated and true airspeed.", "Wind drift.", "Magnetic deviation caused by avionics."],1,"A wind-correction angle offsets the lateral effect of wind so the ground track follows the desired course. Heading and track need not coincide.","PHAK Chapter 16: Navigation",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. An airspeed correction does not directly cancel lateral drift.", "Correct. A wind-correction angle offsets the lateral effect of wind so the ground track follows the desired course. Heading and track need not coincide.", "Incorrect. Compass deviation is a separate magnetic error."]}),
  curatedQuestion("ppl","expansion-09","Aeromedical Factors","PA.I.H","During a night flight, a pilot sees a stationary light appear to move when staring at it. Which illusion is most likely?",["Coriolis illusion from a rapid head movement.", "A false horizon caused by sloping clouds.", "Autokinesis."],2,"Autokinesis can make a fixed light appear to move after prolonged staring in darkness. Use other visual references and avoid fixating on one light.","PHAK Chapter 17: Aeromedical Factors",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The scenario does not describe the head movement associated with Coriolis illusion.", "Incorrect. There is no sloping visual horizon in the scenario.", "Correct. Autokinesis can make a fixed light appear to move after prolonged staring in darkness. Use other visual references and avoid fixating on one light."]}),
  curatedQuestion("ppl","expansion-10","Aeromedical Factors","PA.I.H","A pilot relies on body sensations after entering cloud and feels level despite a bank indication. Which reference should guide control?",["A disciplined cross-check of reliable flight instruments.", "The sensation of seat pressure alone.", "The apparent direction of engine noise."],0,"The vestibular system can mislead a pilot without reliable visual references. Use trained instrument procedures and cross-check rather than trusting bodily sensations.","PHAK Chapter 17: Aeromedical Factors",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. The vestibular system can mislead a pilot without reliable visual references. Use trained instrument procedures and cross-check rather than trusting bodily sensations.", "Incorrect. Seat pressure can support a compelling but false sensation.", "Incorrect. Engine noise does not provide a reliable attitude reference."]}),
 ],
 ira:[
  curatedQuestion("ira","expansion-01","Instrument Systems","IR.II","The pitot inlet is blocked but its drain remains open. What happens to a conventional airspeed indicator?",["It tends toward zero because pitot pressure vents.", "It behaves like an altimeter in every climb.", "It continues to show correct airspeed from static pressure alone."],0,"With the pitot inlet blocked and the drain open, trapped pressure cannot be maintained. The airspeed indicator loses its normal pressure difference and tends toward zero.","PHAK Chapter 8: Flight Instruments",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. With the pitot inlet blocked and the drain open, trapped pressure cannot be maintained. The airspeed indicator loses its normal pressure difference and tends toward zero.", "Incorrect. Altimeter-like behavior requires trapped pitot pressure, including a blocked drain.", "Incorrect. Airspeed measurement requires both total and static pressure."]}),
  curatedQuestion("ira","expansion-02","Instrument Systems","IR.II","The static source becomes blocked during level flight. What does the conventional altimeter do?",["It reads zero regardless of field elevation.", "It remains near the altitude at which the blockage occurred.", "It automatically switches to GPS altitude."],1,"The altimeter responds to static-pressure changes. A blocked source traps the pressure and prevents normal altitude indication; follow the approved alternate-static procedure if available.","PHAK Chapter 8: Flight Instruments",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The trapped pressure corresponds to the blockage altitude, not necessarily zero.", "Correct. The altimeter responds to static-pressure changes. A blocked source traps the pressure and prevents normal altitude indication; follow the approved alternate-static procedure if available.", "Incorrect. A conventional pressure altimeter does not automatically use GPS."]}),
  curatedQuestion("ira","expansion-03","IFR Navigation","IR.V.A","Why can a DME distance differ from horizontal chart distance when close to a station at high altitude?",["DME subtracts altitude automatically.", "DME always measures distance along the planned airway.", "DME measures slant range."],2,"DME measures straight-line distance between the aircraft and station. The vertical separation becomes a larger fraction of that distance near the station.","PHAK Chapter 16: Navigation",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Standard DME does not remove vertical separation.", "Incorrect. The measurement is not a sum along an airway.", "Correct. DME measures straight-line distance between the aircraft and station. The vertical separation becomes a larger fraction of that distance near the station."]}),
  curatedQuestion("ira","expansion-04","IFR Navigation","IR.V.A","An ILS localizer indication is centered but the glideslope is unavailable. What determines the applicable landing minimums?",["The authorized localizer procedure and its published minimums.", "The original ILS DA without any change.", "The GPS advisory glidepath regardless of authorization."],0,"Without usable glideslope guidance, do not assume ILS precision minimums remain available. Confirm that a localizer procedure is authorized and use its published restrictions and minimums.","PHAK Chapter 16: Navigation",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Without usable glideslope guidance, do not assume ILS precision minimums remain available. Confirm that a localizer procedure is authorized and use its published restrictions and minimums.", "Incorrect. An ILS DA depends on the required precision guidance being usable.", "Incorrect. An advisory path does not itself authorize lower minimums."]}),
  curatedQuestion("ira","expansion-05","Approaches","IR.VI","What is the function of a visual descent point on a nonprecision straight-in approach?",["It replaces the missed-approach point.", "It identifies a point for a normal descent from MDA when the required visual references are available.", "It automatically authorizes descent below MDA in cloud."],1,"A VDP helps plan a normal visual descent from MDA. Required visual conditions and all other descent-below-minimums requirements still apply.","Instrument Procedures Handbook: Approaches",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The missed-approach point has a separate function.", "Correct. A VDP helps plan a normal visual descent from MDA. Required visual conditions and all other descent-below-minimums requirements still apply.", "Incorrect. A VDP supplies no authorization to descend without the required visual conditions."]}),
  curatedQuestion("ira","expansion-06","Approaches","IR.VI","A circling approach puts the runway in sight, but the pilot loses required visual reference while maneuvering. What is the appropriate response?",["Continue a blind descent toward the last observed runway position.", "Hold the last bank angle until the runway reappears.", "Execute the applicable missed approach while accounting for the circling position."],2,"Losing the required visual reference during circling requires a missed approach. The aircraft may be displaced from the final approach course; use the prescribed circling missed-approach technique.","Instrument Procedures Handbook: Approaches",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. A last known runway position cannot justify a blind descent.", "Incorrect. Holding bank without reliable guidance can increase terrain risk.", "Correct. Losing the required visual reference during circling requires a missed approach. The aircraft may be displaced from the final approach course; use the prescribed circling missed-approach technique."]}),
  curatedQuestion("ira","expansion-07","Weather","IR.I.B","What makes freezing rain particularly hazardous to an airplane with approved icing equipment?",["Large supercooled drops can freeze beyond protected surfaces.", "Approval for icing makes all freezing rain harmless.", "Freezing rain forms only at temperatures below minus 40 degrees Celsius."],0,"Large droplets may strike and freeze outside protected areas and can overwhelm ice-protection capability. Aircraft limitations and escape procedures govern the response.","PHAK Chapter 12: Weather Theory",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Large droplets may strike and freeze outside protected areas and can overwhelm ice-protection capability. Aircraft limitations and escape procedures govern the response.", "Incorrect. Icing approval has specific limitations; it is not blanket protection.", "Incorrect. Freezing rain commonly involves liquid drops in subfreezing air, not that extreme threshold."]}),
  curatedQuestion("ira","expansion-08","Instrument Flight","IR.IV","An instrument pilot repeatedly stares at one display and misses a developing trend elsewhere. Which scan error is illustrated?",["Normal instrument interpretation with no scan error.", "Fixation.", "A balanced cross-check."],1,"Fixation concentrates attention on one instrument at the expense of the cross-check. Distribute attention among the indications needed to control attitude, power and performance.","Instrument Flying Handbook: Attitude Instrument Flying",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/FAA-H-8083-15B.pdf", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Missing another developing trend is evidence of an inadequate scan.", "Correct. Fixation concentrates attention on one instrument at the expense of the cross-check. Distribute attention among the indications needed to control attitude, power and performance.", "Incorrect. A balanced cross-check samples the necessary indications."]}),
  curatedQuestion("ira","expansion-09","IFR Planning","IR.I.C","Why must a pilot check obstacle-departure requirements separately from an ATC route clearance?",["ATC clearance guarantees every possible takeoff path clears obstacles.", "Obstacle procedures apply only to turbine airplanes.", "An ordinary route clearance does not necessarily supply obstacle-clearance instructions for departure."],2,"Evaluate applicable departure procedures, performance and obstacle clearance before flight. A route clearance alone is not a substitute for that evaluation.","Instrument Procedures Handbook: Departure Procedures",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. A route clearance does not authorize arbitrary obstacle-unsafe paths.", "Incorrect. Obstacle departure considerations are relevant to more than turbine aircraft.", "Correct. Evaluate applicable departure procedures, performance and obstacle clearance before flight. A route clearance alone is not a substitute for that evaluation."]}),
  curatedQuestion("ira","expansion-10","IFR Planning","IR.I.C","A published climb gradient is expressed in feet per nautical mile. What additional value is needed to compute the required feet per minute?",["Groundspeed.", "Indicated airspeed alone with no wind consideration.", "The runway magnetic number alone."],0,"Required climb rate equals gradient times groundspeed divided by 60 when groundspeed is in knots. The same gradient demands a higher feet-per-minute rate at higher groundspeed.","Instrument Procedures Handbook: Departure Procedures",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Required climb rate equals gradient times groundspeed divided by 60 when groundspeed is in knots. The same gradient demands a higher feet-per-minute rate at higher groundspeed.", "Incorrect. Indicated airspeed is not groundspeed and does not include wind effects.", "Incorrect. A runway designation provides no time-to-distance conversion."]}),
 ],
 cpl:[
  curatedQuestion("cpl","expansion-01","Aerodynamics","CA.I.F","Why can an aft center of gravity reduce longitudinal stability?",["It reduces the restoring tendency after a pitch disturbance.", "It increases the restoring tendency without limit.", "It changes the airplane’s wing area."],0,"Aft loading generally reduces longitudinal stability and can make recovery more difficult. Use the approved loading envelope rather than relying on a perceived performance benefit.","PHAK Chapter 5: Aerodynamics of Flight",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Aft loading generally reduces longitudinal stability and can make recovery more difficult. Use the approved loading envelope rather than relying on a perceived performance benefit.", "Incorrect. Aft loading does not generally strengthen the restoring pitch tendency.", "Incorrect. CG movement does not change wing area."]}),
  curatedQuestion("cpl","expansion-02","Aerodynamics","CA.I.F","An airplane’s weight rises by 21 percent at the same configuration and load factor. Approximately how does stall speed change?",["It decreases by about 10 percent.", "It increases by about 10 percent.", "It increases by exactly 21 percent."],1,"Stall speed varies with the square root of weight when configuration and load factor remain the same. The square root of 1.21 is 1.10, giving about a 10-percent increase.","PHAK Chapter 5: Aerodynamics of Flight",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Greater weight requires greater speed for the same maximum lift coefficient.", "Correct. Stall speed varies with the square root of weight when configuration and load factor remain the same. The square root of 1.21 is 1.10, giving about a 10-percent increase.", "Incorrect. The relationship is a square root, not a direct percentage increase."]}),
  curatedQuestion("cpl","expansion-03","Aerodynamics","CA.I.F","Why does an airplane experience reduced induced drag close to the ground?",["Ground effect eliminates parasite drag.", "The airplane becomes lighter near the runway.", "The ground alters the downwash and wingtip-vortex pattern."],2,"Ground effect changes the airflow around the wing and reduces induced drag. An airplane may become airborne but still lack sufficient performance to climb away from ground effect.","PHAK Chapter 5: Aerodynamics of Flight",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Parasite drag is not eliminated by ground effect.", "Incorrect. Aircraft weight does not fall near the ground.", "Correct. Ground effect changes the airflow around the wing and reduces induced drag. An airplane may become airborne but still lack sufficient performance to climb away from ground effect."]}),
  curatedQuestion("cpl","expansion-04","Aircraft Systems","CA.I.G","What does a constant-speed propeller governor primarily control within its operating range?",["Blade angle to maintain selected RPM.", "Aircraft pitch attitude to maintain altitude.", "Mixture to maintain exhaust-gas temperature."],0,"The governor adjusts propeller blade angle in response to RPM changes to maintain the selected rotational speed within system limits.","PHAK Chapter 7: Aircraft Systems",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. The governor adjusts propeller blade angle in response to RPM changes to maintain the selected rotational speed within system limits.", "Incorrect. Aircraft pitch attitude is controlled separately.", "Incorrect. Mixture and EGT are not the propeller governor’s controlled variables."]}),
  curatedQuestion("cpl","expansion-05","Aircraft Systems","CA.I.G","Why can abrupt power reduction at altitude produce a different indicated engine response in a turbocharged airplane than expected from a normally aspirated one?",["The propeller governor automatically prevents every boost exceedance.", "Turbocharger and wastegate behavior must be considered under the approved procedure.", "Turbocharging eliminates all manifold-pressure limits."],1,"Turbocharged engines have system-specific power-setting procedures and limitations. Turbocharger response and wastegate control affect manifold pressure; use the aircraft’s approved guidance.","PHAK Chapter 7: Aircraft Systems",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The propeller governor controls RPM and does not guarantee safe boost pressure.", "Correct. Turbocharged engines have system-specific power-setting procedures and limitations. Turbocharger response and wastegate control affect manifold pressure; use the aircraft’s approved guidance.", "Incorrect. Turbocharged engines retain important pressure and temperature limits."]}),
  curatedQuestion("cpl","expansion-06","Performance","CA.I.F","A performance chart covers a maximum pressure altitude lower than the departure airport’s conditions. What is the sound planning choice?",["Extend the chart linearly and treat the result as approved.", "Use sea-level performance because the runway length is unchanged.", "Obtain approved applicable data or change the plan rather than extrapolating casually."],2,"Published chart boundaries define the conditions supported by the data. Unsupported extrapolation may hide a performance shortfall; obtain applicable guidance or choose a feasible alternative.","PHAK Chapter 11: Aircraft Performance",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Linear extrapolation is not automatically valid or approved.", "Incorrect. Runway length does not cancel the effects of altitude and temperature.", "Correct. Published chart boundaries define the conditions supported by the data. Unsupported extrapolation may hide a performance shortfall; obtain applicable guidance or choose a feasible alternative."]}),
  curatedQuestion("cpl","expansion-07","Performance","CA.I.F","How does a tailwind generally affect takeoff ground roll?",["It increases the ground speed needed to reach a given airspeed and increases ground roll.", "It decreases ground roll because ground speed is higher.", "It has no effect if indicated liftoff speed is unchanged."],0,"A tailwind requires greater ground speed for the same airspeed and generally lengthens takeoff roll. Use approved wind corrections and limitations.","PHAK Chapter 11: Aircraft Performance",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. A tailwind requires greater ground speed for the same airspeed and generally lengthens takeoff roll. Use approved wind corrections and limitations.", "Incorrect. Higher required ground speed adds acceleration distance rather than reducing it.", "Incorrect. An unchanged airspeed target does not mean unchanged ground distance."]}),
  curatedQuestion("cpl","expansion-08","Weather","CA.I.C","A thunderstorm is in its mature stage. Which airflow characteristic should be expected?",["Only light turbulence once precipitation starts.", "Both updrafts and downdrafts.", "Only a steady uniform updraft with no precipitation."],1,"The mature stage includes precipitation and both updrafts and downdrafts. Severe turbulence, hail, lightning and wind shear may accompany it.","PHAK Chapter 12: Weather Theory",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Precipitation does not make the storm’s turbulence benign.", "Correct. The mature stage includes precipitation and both updrafts and downdrafts. Severe turbulence, hail, lightning and wind shear may accompany it.", "Incorrect. Downdrafts develop as precipitation falls in the mature stage."]}),
  curatedQuestion("cpl","expansion-09","Risk Management","CA.I.H","A passenger’s schedule creates pressure to continue into deteriorating weather. Which PAVE category contains this pressure?",["Aircraft.", "EnVironment alone.", "External pressures."],2,"PAVE separates Pilot, Aircraft, enVironment and External pressures. A passenger’s schedule is an external pressure; evaluate it explicitly so it does not override safe weather and fuel decisions.","PHAK Chapter 2: Aeronautical Decision-Making",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Aircraft concerns involve the aircraft’s capability and condition.", "Incorrect. Weather is environmental, but schedule pressure belongs to a different category.", "Correct. PAVE separates Pilot, Aircraft, enVironment and External pressures. A passenger’s schedule is an external pressure; evaluate it explicitly so it does not override safe weather and fuel decisions."]}),
  curatedQuestion("cpl","expansion-10","Navigation","CA.VI","A diversion requires a new destination while airborne. What should accompany the new heading?",["A revised estimate of time, fuel and landing suitability.", "Only a new heading because the original fuel plan remains valid.", "A decision based solely on straight-line distance."],0,"A diversion changes the time and fuel calculation and may introduce new airport, weather and terrain constraints. Reassess the whole plan rather than treating it as a heading change only.","PHAK Chapter 16: Navigation",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. A diversion changes the time and fuel calculation and may introduce new airport, weather and terrain constraints. Reassess the whole plan rather than treating it as a heading change only.", "Incorrect. Fuel endurance depends on the revised route and conditions.", "Incorrect. The closest point is not necessarily a suitable landing airport."]}),
 ],
 cfi:[
  curatedQuestion("cfi","expansion-01","Flight Instruction","FI.I.F","During a control transfer, the learner says they have control but the instructor has not confirmed release. What should the instructor teach?",["An unambiguous positive exchange with confirmation.", "Silent transfer whenever the learner moves the controls.", "Both pilots should manipulate controls independently until the maneuver ends."],0,"A positive exchange prevents uncertainty about who is flying. Teach and use a clear verbal transfer and confirmation while ensuring the receiving pilot actually has control.","Aviation Instructor’s Handbook Chapter 9: Techniques of Flight Instruction",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. A positive exchange prevents uncertainty about who is flying. Teach and use a clear verbal transfer and confirmation while ensuring the receiving pilot actually has control.", "Incorrect. Movement alone does not establish a clear transfer.", "Incorrect. Independent simultaneous inputs create confusion and can compromise control."]}),
  curatedQuestion("cfi","expansion-02","Flight Instruction","FI.I.F","A learner performs a maneuver accurately only when the instructor gives each control input. What should the next assessment emphasize?",["Removing all supervision during the next flight.", "Independent performance appropriate to the lesson’s completion standard.", "Counting the prompted performance as complete mastery."],1,"Prompted success does not establish independent proficiency. Reduce assistance appropriately and observe performance against the stated standard while retaining necessary supervision.","Aviation Instructor’s Handbook Chapter 9: Techniques of Flight Instruction",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Less prompting does not mean abandoning safety supervision.", "Correct. Prompted success does not establish independent proficiency. Reduce assistance appropriately and observe performance against the stated standard while retaining necessary supervision.", "Incorrect. The prompts may be supplying the decisions being assessed."]}),
  curatedQuestion("cfi","expansion-03","Flight Instruction","FI.I.F","A learner repeatedly looks inside during a VFR maneuver. What should the instructor reinforce?",["Continuous fixation on the attitude indicator.", "Ignoring flight instruments entirely.", "An outside visual scan integrated with necessary instrument checks."],2,"VFR maneuver instruction should preserve traffic awareness and outside references while using instruments appropriately. Demonstrate a suitable scan and correct fixation early.","Aviation Instructor’s Handbook Chapter 9: Techniques of Flight Instruction",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Continuous instrument fixation degrades outside awareness.", "Incorrect. Instruments still provide useful performance information.", "Correct. VFR maneuver instruction should preserve traffic awareness and outside references while using instruments appropriately. Demonstrate a suitable scan and correct fixation early."]}),
  curatedQuestion("cfi","expansion-04","Risk Management Instruction","FI.I.G","Why should a lesson include a realistic decision to discontinue an approach?",["It lets the learner apply risk management before the situation becomes unsafe.", "It teaches that every approach must end in landing.", "It replaces the need to learn aircraft control."],0,"A realistic go-around decision links conditions, limits and action. Risk-management instruction should include recognizing a deteriorating situation and choosing an appropriate alternative.","Aviation Instructor’s Handbook Chapter 10: Teaching Practical Risk Management",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. A realistic go-around decision links conditions, limits and action. Risk-management instruction should include recognizing a deteriorating situation and choosing an appropriate alternative.", "Incorrect. Landing is not mandatory when conditions become unsuitable.", "Incorrect. Decision making and aircraft control are complementary skills."]}),
  curatedQuestion("cfi","expansion-05","Risk Management Instruction","FI.I.G","A learner consistently underestimates the risk of marginal weather. Which instructional response best develops judgment?",["Assess only memorized weather abbreviations.", "Compare forecast uncertainties and alternatives in a realistic flight scenario.", "Provide a universal visibility number for every flight."],1,"Scenario discussion can expose assumptions and connect weather information to margins, aircraft capability and alternatives. A single threshold cannot replace context-sensitive risk assessment.","Aviation Instructor’s Handbook Chapter 10: Teaching Practical Risk Management",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Abbreviation recall alone does not demonstrate weather judgment.", "Correct. Scenario discussion can expose assumptions and connect weather information to margins, aircraft capability and alternatives. A single threshold cannot replace context-sensitive risk assessment.", "Incorrect. A universal number ignores terrain, capability and changing conditions."]}),
  curatedQuestion("cfi","expansion-06","Aerodynamic Instruction","FI.II","A learner says a stall can occur only at the airspeed printed on the indicator. Which correction is essential?",["Stalls require an engine failure.", "Stall angle changes whenever the pilot banks.", "A stall occurs at the critical angle of attack; indicated stall speed changes with conditions."],2,"Explain the critical angle of attack and how weight, load factor and configuration affect the speed at which it is reached. Airspeed alone does not define the stall condition.","PHAK Chapter 5: Aerodynamics of Flight",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Engine power is not a necessary condition for a stall.", "Incorrect. Bank can change load factor without redefining the basic critical angle.", "Correct. Explain the critical angle of attack and how weight, load factor and configuration affect the speed at which it is reached. Airspeed alone does not define the stall condition."]}),
  curatedQuestion("cfi","expansion-07","Aerodynamic Instruction","FI.II","A learner tries to correct a skidding base-to-final turn with more rudder while raising the nose. What teaching point is most urgent?",["Coordination, angle of attack and the risk of an accelerated stall and spin.", "Rudder alone guarantees a tighter safe turn.", "A stall cannot happen while descending."],0,"A skidding turn with increasing angle of attack can lead to a stall and spin close to the ground. Teach recognition, coordinated control and an early decision to go around.","PHAK Chapter 5: Aerodynamics of Flight",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. A skidding turn with increasing angle of attack can lead to a stall and spin close to the ground. Teach recognition, coordinated control and an early decision to go around.", "Incorrect. Rudder does not remove stall and spin risk.", "Incorrect. An airplane can stall in a descent if critical angle of attack is exceeded."]}),
  curatedQuestion("cfi","expansion-08","Instructor Responsibilities","FI.I.E","A learner asks for a readiness endorsement despite inconsistent performance. What should guide the instructor’s decision?",["The number of lessons regardless of performance.", "Demonstrated preparation and applicable requirements.", "The learner’s preferred test date alone."],1,"An endorsement represents the instructor’s determination that applicable preparation and readiness requirements are met. Scheduling pressure does not substitute for demonstrated competence.","Aviation Instructor’s Handbook Chapter 8: Instructor Responsibilities",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Lesson count does not by itself establish competence.", "Correct. An endorsement represents the instructor’s determination that applicable preparation and readiness requirements are met. Scheduling pressure does not substitute for demonstrated competence.", "Incorrect. A preferred date does not establish readiness."]}),
  curatedQuestion("cfi","expansion-09","Lesson Planning","FI.I.C","What makes a maneuver lesson’s completion standard useful?",["It lists only the instructor’s speaking topics.", "It promises proficiency after a fixed number of minutes.", "It states observable performance and the acceptable level of proficiency."],2,"Completion standards tell the learner and instructor how successful performance will be recognized. Align practice and assessment with those observable expectations.","Aviation Instructor’s Handbook Chapter 7: Planning Instructional Activity",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. A topic list does not define successful performance.", "Incorrect. Elapsed time alone is not proof of proficiency.", "Correct. Completion standards tell the learner and instructor how successful performance will be recognized. Align practice and assessment with those observable expectations."]}),
  curatedQuestion("cfi","expansion-10","Lesson Planning","FI.I.C","A learner struggles with a complex maneuver because prerequisite skills are weak. What should the instructor do?",["Return to the prerequisites and rebuild the skill sequence.", "Increase complexity to prevent boredom.", "Skip the maneuver and endorse proficiency anyway."],0,"Instruction should progress from known skills to new combinations. Addressing the weak prerequisites supports later application and prevents repeated errors from becoming habits.","Aviation Instructor’s Handbook Chapter 7: Planning Instructional Activity",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Instruction should progress from known skills to new combinations. Addressing the weak prerequisites supports later application and prevents repeated errors from becoming habits.", "Incorrect. More complexity can overload a learner who lacks prerequisites.", "Incorrect. An endorsement cannot replace actual preparation."]}),
 ],
 cfii:[
  curatedQuestion("cfii","expansion-01","Instrument Flight Instruction","PTS Area VI","A learner chases every small altitude indication with large pitch changes. What is the best correction?",["Teach small appropriate corrections and observe the resulting trend.", "Increase control movement until the needle stops instantly.", "Ignore attitude and use altitude alone for control."],0,"Overcontrol can produce oscillations. Teach coordinated attitude, power and performance cross-checks, with corrections suited to the size and trend of the deviation.","Instrument Flying Handbook: Attitude Instrument Flying",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/FAA-H-8083-15B.pdf", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Overcontrol can produce oscillations. Teach coordinated attitude, power and performance cross-checks, with corrections suited to the size and trend of the deviation.", "Incorrect. Aggressive changes can worsen oscillation.", "Incorrect. Altitude is a performance indication and cannot replace attitude control."]}),
  curatedQuestion("cfii","expansion-02","Instrument Flight Instruction","PTS Area VI","A learner memorizes scan order but cannot identify which instrument has failed. What should the next lesson require?",["Cover all reliable instruments simultaneously.", "Cross-check independent indications in a controlled failure scenario.", "Repeat the same scan order without interpreting the readings."],1,"Instrument scan requires interpretation and comparison, not merely a fixed eye-movement pattern. A controlled scenario can assess recognition and response while retaining safe supervision.","Instrument Flying Handbook: Attitude Instrument Flying",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/FAA-H-8083-15B.pdf", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Removing all reliable references prevents the intended cross-check exercise.", "Correct. Instrument scan requires interpretation and comparison, not merely a fixed eye-movement pattern. A controlled scenario can assess recognition and response while retaining safe supervision.", "Incorrect. Memorized order alone does not resolve inconsistent information."]}),
  curatedQuestion("cfii","expansion-03","Navigation Instruction","PTS Area VII","A learner treats DME as horizontal distance during a high-altitude station passage. What concept should the instructor demonstrate?",["Compass deviation.", "Static-system position error.", "Slant-range geometry."],2,"DME measures straight-line distance to the station. Near passage, altitude creates a significant difference from horizontal distance; relate the indication to simple geometry.","PHAK Chapter 16: Navigation",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Compass deviation concerns magnetic heading.", "Incorrect. Static-source error does not explain DME geometry.", "Correct. DME measures straight-line distance to the station. Near passage, altitude creates a significant difference from horizontal distance; relate the indication to simple geometry."]}),
  curatedQuestion("cfii","expansion-04","Navigation Instruction","PTS Area VII","A learner follows a GPS advisory vertical path below an LNAV MDA in cloud. What must the instructor correct?",["Advisory vertical guidance does not authorize descent below the published minimums.", "Any displayed glidepath converts LNAV into an ILS.", "A centered advisory path cancels visibility requirements."],0,"The procedure’s authorized minimums and descent requirements control. An advisory path is a planning aid and does not supply authorization to descend below MDA without required conditions.","PHAK Chapter 16: Navigation",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. The procedure’s authorized minimums and descent requirements control. An advisory path is a planning aid and does not supply authorization to descend below MDA without required conditions.", "Incorrect. LNAV does not become an ILS because the display shows a vertical path.", "Incorrect. Visibility and visual-reference requirements still apply."]}),
  curatedQuestion("cfii","expansion-05","Approach Instruction","PTS Area VIII","What is a strong way to assess understanding of a missed-approach point?",["Treat reaching MDA as always reaching the MAP.", "Require the learner to locate it and explain the applicable action on the actual procedure.", "Ask only whether the acronym MAP is familiar."],1,"Procedure interpretation connects the point’s identification to navigation, timing and missed-approach action. MDA is an altitude and is not necessarily the missed-approach point.","Instrument Procedures Handbook: Approaches",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Altitude and along-track position serve different functions.", "Correct. Procedure interpretation connects the point’s identification to navigation, timing and missed-approach action. MDA is an altitude and is not necessarily the missed-approach point.", "Incorrect. Acronym familiarity is only recall."]}),
  curatedQuestion("cfii","expansion-06","Approach Instruction","PTS Area VIII","A learner begins turning toward the missed-approach course before the published MAP during an early missed approach. What needs emphasis?",["Early turns are always protected because climb has begun.", "The last assigned heading always replaces the published missed procedure.", "Published obstacle protection and the procedure’s turn location."],2,"An early missed approach does not automatically permit an early turn. Follow applicable procedure and ATC instructions, including the published turn location and altitude requirements.","Instrument Procedures Handbook: Approaches",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Climbing alone does not guarantee protection for an early turn.", "Incorrect. The controlling instructions must be evaluated; an old heading is not a universal substitute.", "Correct. An early missed approach does not automatically permit an early turn. Follow applicable procedure and ATC instructions, including the published turn location and altitude requirements."]}),
  curatedQuestion("cfii","expansion-07","Preflight Instruction","PTS Area III","A learner computes climb performance using indicated airspeed to convert feet per nautical mile into feet per minute. What should be corrected?",["Use groundspeed for the time-distance conversion.", "Use true heading instead of speed.", "Ignore wind because the gradient is published."],0,"Climb gradient is altitude gained per ground distance. Converting it to a climb rate requires groundspeed, so wind and speed affect the feet-per-minute requirement.","Instrument Procedures Handbook: Departure Procedures",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Climb gradient is altitude gained per ground distance. Converting it to a climb rate requires groundspeed, so wind and speed affect the feet-per-minute requirement.", "Incorrect. Heading does not provide distance per unit time.", "Incorrect. Wind changes groundspeed and therefore the required climb rate."]}),
  curatedQuestion("cfii","expansion-08","Preflight Instruction","PTS Area III","A learner plans an approach with a forecast but no check of procedure NOTAMs. What is missing?",["Nothing, because charts cannot change between publication dates.", "Verification of current procedure and equipment availability.", "Only an estimate of taxi time."],1,"Procedure and equipment NOTAMs can affect availability and minimums. IFR planning requires current operational information in addition to the weather forecast and chart.","Instrument Procedures Handbook: Departure Procedures",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Published charts may be affected by interim changes.", "Correct. Procedure and equipment NOTAMs can affect availability and minimums. IFR planning requires current operational information in addition to the weather forecast and chart.", "Incorrect. Taxi time does not address approach availability."]}),
  curatedQuestion("cfii","expansion-09","IFR Risk Instruction","PTS Area II","A learner meets legal approach minimums but has not flown instruments recently. What should the instructor discuss?",["Legal compliance as proof of adequate proficiency.", "The assumption that automation removes currency concerns.", "Proficiency and personal margins in addition to legal requirements."],2,"Legal qualification and operational proficiency are different considerations. Discuss recent experience, workload, conditions and alternatives rather than assuming legality alone ensures a safe plan.","Aviation Instructor’s Handbook Chapter 10: Risk Management",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Meeting a legal threshold does not establish current skill.", "Incorrect. Automation still requires monitoring and competent operation.", "Correct. Legal qualification and operational proficiency are different considerations. Discuss recent experience, workload, conditions and alternatives rather than assuming legality alone ensures a safe plan."]}),
  curatedQuestion("cfii","expansion-10","Emergency Instruction","PTS Area IX","How should an instructor introduce simulated instrument failures?",["With clear objectives, appropriate safeguards and control of the simulation.", "By secretly disabling essential equipment during actual IMC.", "By removing every usable attitude reference without planning."],0,"Simulations should meet the lesson objective while preserving safe control and equipment use. Plan the exercise, its termination and instructor intervention before introducing failures.","Aviation Instructor’s Handbook Chapter 9: Flight Instruction",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Simulations should meet the lesson objective while preserving safe control and equipment use. Plan the exercise, its termination and instructor intervention before introducing failures.", "Incorrect. Unplanned disabling of essential equipment can create a real emergency.", "Incorrect. A failure exercise needs a defined safe setup and response."]}),
 ],
 atp:[
  curatedQuestion("atp","expansion-01","High-Altitude Aerodynamics","AA.I.D","What happens to true airspeed for a fixed indicated airspeed as air density decreases, ignoring compressibility corrections?",["True airspeed increases.", "True airspeed remains equal to indicated airspeed.", "True airspeed decreases in direct proportion to altitude."],0,"Lower density requires higher true airspeed to produce the same dynamic pressure. At transport speeds, use the appropriate calibrated and compressibility-corrected relationships.","PHAK Chapter 5: High-Speed Flight",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Lower density requires higher true airspeed to produce the same dynamic pressure. At transport speeds, use the appropriate calibrated and compressibility-corrected relationships.", "Incorrect. IAS and TAS are not generally equal away from standard sea-level conditions.", "Incorrect. The described density change increases the required true speed."]}),
  curatedQuestion("atp","expansion-02","High-Altitude Aerodynamics","AA.I.D","Why can high-altitude turbulence be particularly demanding near a narrow usable speed range?",["Mach limits cease to apply in turbulence.", "Disturbances can reduce the margin to low- or high-speed buffet.", "Turbulence eliminates the low-speed boundary."],1,"At high altitude the usable speed range may be constrained by both low- and high-speed boundaries. Follow approved turbulence guidance and avoid assumptions that one limit disappears.","PHAK Chapter 5: High-Speed Flight",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Mach limitations still apply.", "Correct. At high altitude the usable speed range may be constrained by both low- and high-speed boundaries. Follow approved turbulence guidance and avoid assumptions that one limit disappears.", "Incorrect. The low-speed boundary remains relevant."]}),
  curatedQuestion("atp","expansion-03","Transport Aircraft Systems","AA.I.A","What is a principal concern after rapid cabin decompression at altitude?",["Only passenger discomfort with no time-critical crew risk.", "A guaranteed increase in engine thrust.", "Hypoxia requiring immediate use of the approved oxygen and emergency procedures."],2,"Loss of cabin pressure can rapidly compromise useful consciousness. Immediate oxygen use and the aircraft’s decompression and descent procedures take priority.","PHAK Chapter 7: Aircraft Systems",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Crew incapacitation can be time critical.", "Incorrect. Cabin pressure loss does not guarantee an engine-thrust increase.", "Correct. Loss of cabin pressure can rapidly compromise useful consciousness. Immediate oxygen use and the aircraft’s decompression and descent procedures take priority."]}),
  curatedQuestion("atp","expansion-04","Transport Aircraft Systems","AA.I.A","A turbine engine experiences an abnormal temperature rise during start. What governs the crew’s response?",["The approved start limits and abnormal-start procedure.", "A universal temperature limit for every turbine engine.", "Waiting for the engine to stabilize regardless of its limits."],0,"Turbine start limits and abort procedures are engine and aircraft specific. Monitor the required indications and apply the approved abnormal-start procedure.","PHAK Chapter 7: Aircraft Systems",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Turbine start limits and abort procedures are engine and aircraft specific. Monitor the required indications and apply the approved abnormal-start procedure.", "Incorrect. Different engines have different limits.", "Incorrect. Exceeding a limit cannot be dismissed while waiting for stabilization."]}),
  curatedQuestion("atp","expansion-05","Performance","AA.I.B","Why must landing performance account for a contaminated runway using applicable approved data?",["Reverse thrust makes runway condition irrelevant.", "Contamination can reduce braking and alter landing-distance requirements.", "A wet or icy surface guarantees the same braking as a dry runway."],1,"Runway contamination affects stopping capability and may impose limitations. Use the applicable aircraft and operator data rather than assuming dry-runway performance remains available.","PHAK Chapter 11: Aircraft Performance",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Reverse thrust does not cancel all contamination effects or limitations.", "Correct. Runway contamination affects stopping capability and may impose limitations. Use the applicable aircraft and operator data rather than assuming dry-runway performance remains available.", "Incorrect. Dry and contaminated surfaces do not provide identical braking."]}),
  curatedQuestion("atp","expansion-06","Performance","AA.I.B","Why is an engine-out climb assessment different from an all-engines takeoff assessment?",["All-engine climb rate can be divided by engine count for an approved result.", "Engine failure changes only the noise level.", "It must account for reduced thrust and the specified configuration and obstacle requirements."],2,"Engine-out performance must come from applicable approved data. Thrust loss, drag, configuration and required gradients interact; a simple fraction of all-engine climb performance is unreliable.","PHAK Chapter 11: Aircraft Performance",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The relationship is not a simple division by engine count.", "Incorrect. Loss of thrust materially changes climb capability.", "Correct. Engine-out performance must come from applicable approved data. Thrust loss, drag, configuration and required gradients interact; a simple fraction of all-engine climb performance is unreliable."]}),
  curatedQuestion("atp","expansion-07","Weather","AA.I.C","What makes a microburst encounter during final approach particularly hazardous?",["Rapid wind changes can turn an apparent performance gain into a large airspeed and climb-capability loss.", "The initial headwind increase guarantees adequate performance throughout.", "A microburst contains only smooth horizontal wind."],0,"A microburst can present a headwind, downdraft and then tailwind. The resulting rapid energy and performance changes are especially hazardous close to the ground.","PHAK Chapter 12: Weather Theory",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. A microburst can present a headwind, downdraft and then tailwind. The resulting rapid energy and performance changes are especially hazardous close to the ground.", "Incorrect. The initial gain can be followed by a severe loss.", "Incorrect. Strong vertical and changing horizontal components can occur."]}),
  curatedQuestion("atp","expansion-08","Crew Resource Management","AA.I.F","Two pilots assume the other has checked a revised altitude clearance. Which practice addresses the failure?",["Checking the clearance only after the next level-off.", "Explicit communication, readback and role confirmation.", "Relying on silent assumptions to reduce workload."],1,"Shared situational awareness requires clear communication and verification of changed instructions. Explicit task allocation prevents an important cross-check from being omitted.","Aviation Instructor’s Handbook Chapter 2: Human Behavior",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Delayed verification may allow an altitude deviation.", "Correct. Shared situational awareness requires clear communication and verification of changed instructions. Explicit task allocation prevents an important cross-check from being omitted.", "Incorrect. Silence leaves the allocation ambiguous."]}),
  curatedQuestion("atp","expansion-09","Crew Resource Management","AA.I.F","The crew changes automation modes during a high-workload arrival. What should be monitored?",["Only which button was pressed.", "Only the flight director’s color.", "The actual mode annunciations and resulting flight-path behavior."],2,"Mode selection does not by itself prove the intended mode engaged. Verify the annunciations and aircraft response and intervene using approved procedures if the path is wrong.","Aviation Instructor’s Handbook Chapter 2: Human Behavior",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. A button press may not produce the expected active mode.", "Incorrect. Color alone does not establish the commanded flight path.", "Correct. Mode selection does not by itself prove the intended mode engaged. Verify the annunciations and aircraft response and intervene using approved procedures if the path is wrong."]}),
  curatedQuestion("atp","expansion-10","Emergency Operations","AA.VII","Several warnings occur together during a transport-aircraft abnormal event. What should organize the crew response?",["Aircraft control, task coordination and the applicable prioritized procedures.", "Troubleshooting every message before controlling the flight path.", "Independent conflicting actions by both pilots."],0,"Maintain control and coordinate roles while following the aircraft’s prioritized emergency and abnormal procedures. Avoid allowing diagnostic activity to displace immediate flight-path needs.","PHAK Chapter 2: Aeronautical Decision-Making",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Maintain control and coordinate roles while following the aircraft’s prioritized emergency and abnormal procedures. Avoid allowing diagnostic activity to displace immediate flight-path needs.", "Incorrect. Control cannot be postponed while every alert is diagnosed.", "Incorrect. Conflicting uncoordinated actions can compound the event."]}),
 ],
 foi:[
  curatedQuestion("foi","expansion-01","Learning Process","AIH.3","A learner can repeat a checklist but cannot explain why its steps matter. Which learning level is primarily demonstrated?",["Rote.", "Correlation.", "Independent application."],0,"Rote learning demonstrates recall without necessarily showing understanding. Ask the learner to explain the purpose of each step and later apply it in a suitable scenario.","Aviation Instructor’s Handbook Chapter 3: The Learning Process",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Rote learning demonstrates recall without necessarily showing understanding. Ask the learner to explain the purpose of each step and later apply it in a suitable scenario.", "Incorrect. Correlation integrates learning with related knowledge and decisions.", "Incorrect. Reciting a checklist alone does not demonstrate application."]}),
  curatedQuestion("foi","expansion-02","Learning Process","AIH.3","A learner uses weather, aircraft performance and fuel information together to choose a diversion. Which learning level is best illustrated?",["A conditioned response without understanding.", "Correlation.", "Rote recall only."],1,"Correlation connects separate knowledge and skills to a broader situation. The diversion decision combines several subjects rather than merely repeating one memorized fact.","Aviation Instructor’s Handbook Chapter 3: The Learning Process",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The scenario describes reasoned integration rather than a simple stimulus response.", "Correct. Correlation connects separate knowledge and skills to a broader situation. The diversion decision combines several subjects rather than merely repeating one memorized fact.", "Incorrect. The learner is integrating information, not only recalling it."]}),
  curatedQuestion("foi","expansion-03","Learning Process","AIH.3","An instructor teaches an incorrect technique first and later struggles to replace it. Which learning principle is especially relevant?",["Recency alone.", "Readiness as proof that all first teaching is correct.", "Primacy."],2,"Early learning can create a strong lasting impression. Primacy makes accurate initial instruction important and explains why an incorrect first habit can be difficult to replace.","Aviation Instructor’s Handbook Chapter 3: The Learning Process",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Recency concerns the influence of recent practice, not the initial habit.", "Incorrect. Readiness does not guarantee that the taught material is correct.", "Correct. Early learning can create a strong lasting impression. Primacy makes accurate initial instruction important and explains why an incorrect first habit can be difficult to replace."]}),
  curatedQuestion("foi","expansion-04","Learning Process","AIH.3","A learner practices a correct procedure regularly rather than reviewing it once. Which principle does this support?",["Exercise.", "Repression.", "Rationalization."],0,"Meaningful practice reinforces learning and retention. The principle of exercise supports repeated correct performance, with feedback so practice does not reinforce errors.","Aviation Instructor’s Handbook Chapter 3: The Learning Process",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Meaningful practice reinforces learning and retention. The principle of exercise supports repeated correct performance, with feedback so practice does not reinforce errors.", "Incorrect. Repression is a defense mechanism, not a principle of practice.", "Incorrect. Rationalization explains away behavior and does not describe skill rehearsal."]}),
  curatedQuestion("foi","expansion-05","Learning Process","AIH.3","A learner is distracted by hunger and fatigue during a lesson. What should the instructor recognize?",["Fatigue necessarily improves attention.", "Basic needs can interfere with readiness to learn.", "Motivation makes physical needs irrelevant."],1,"Learning depends partly on the learner’s condition and readiness. Address significant physical needs and adapt the lesson instead of expecting attention to overcome every limitation.","Aviation Instructor’s Handbook Chapter 3: The Learning Process",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Fatigue typically impairs attention and performance.", "Correct. Learning depends partly on the learner’s condition and readiness. Address significant physical needs and adapt the lesson instead of expecting attention to overcome every limitation.", "Incorrect. Motivation does not eliminate physical limitations."]}),
  curatedQuestion("foi","expansion-06","Learning Process","AIH.3","A learner struggles to apply an old response after the aircraft’s control layout changes. What is illustrated?",["A guarantee of positive transfer.", "A complete absence of prior learning.", "Negative transfer."],2,"Prior learning can interfere when an old response conflicts with the new task. Identify the difference and provide deliberate practice in the new context.","Aviation Instructor’s Handbook Chapter 3: The Learning Process",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Prior experience is not beneficial in every new situation.", "Incorrect. The interfering response is evidence of prior learning.", "Correct. Prior learning can interfere when an old response conflicts with the new task. Identify the difference and provide deliberate practice in the new context."]}),
  curatedQuestion("foi","expansion-07","Learning Process","AIH.3","A learner completes individual tasks well but falters when all are combined. What should instruction address?",["Integration and workload through appropriately sequenced practice.", "Only faster memorization of definitions.", "An assumption that individual success proves combined proficiency."],0,"Combining skills adds coordination and workload demands. Build from component skills toward integrated performance and assess the combined task directly.","Aviation Instructor’s Handbook Chapter 3: The Learning Process",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Combining skills adds coordination and workload demands. Build from component skills toward integrated performance and assess the combined task directly.", "Incorrect. Definitions alone do not develop the required coordination.", "Incorrect. Individual proficiency does not automatically establish integrated proficiency."]}),
  curatedQuestion("foi","expansion-08","Human Behavior","AIH.2","A learner blames every error on the equipment despite contrary evidence. Which defense mechanism may be involved?",["Objective performance measurement.", "Projection.", "A balanced self-assessment."],1,"Projection can attribute an individual’s shortcomings to others or external causes. The instructor should address the observed performance constructively rather than label or ridicule the learner.","Aviation Instructor’s Handbook Chapter 2: Human Behavior",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Objective measurement examines the actual facts.", "Correct. Projection can attribute an individual’s shortcomings to others or external causes. The instructor should address the observed performance constructively rather than label or ridicule the learner.", "Incorrect. Repeated blame contrary to evidence is not balanced evaluation."]}),
  curatedQuestion("foi","expansion-09","Human Behavior","AIH.2","A learner supplies plausible excuses for inadequate preparation rather than acknowledging it. Which defense mechanism is most directly illustrated?",["Recency.", "Positive transfer.", "Rationalization."],2,"Rationalization uses explanations to justify behavior or avoid an uncomfortable conclusion. Respond with specific expectations and constructive support for preparation.","Aviation Instructor’s Handbook Chapter 2: Human Behavior",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Recency is a learning principle.", "Incorrect. Transfer concerns effects of prior learning on a new task.", "Correct. Rationalization uses explanations to justify behavior or avoid an uncomfortable conclusion. Respond with specific expectations and constructive support for preparation."]}),
  curatedQuestion("foi","expansion-10","Human Behavior","AIH.2","A learner becomes overwhelmed after a stressful event and stops processing instruction. What is a useful response?",["Reduce immediate demands and reassess readiness and safety.", "Increase criticism until the learner responds.", "Assume silence proves comprehension."],0,"Stress can impair attention and performance. Adjust demands, maintain safety and determine whether useful learning can continue before proceeding.","Aviation Instructor’s Handbook Chapter 2: Human Behavior",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Stress can impair attention and performance. Adjust demands, maintain safety and determine whether useful learning can continue before proceeding.", "Incorrect. Criticism can intensify the overload.", "Incorrect. Silence provides no reliable evidence of comprehension."]}),
  curatedQuestion("foi","expansion-11","Communication","AIH.4","An instructor uses unfamiliar abbreviations and the learner misunderstands the procedure. Which barrier is present?",["Excessive positive transfer.", "Lack of a common core of experience and shared terminology.", "A guarantee that the message was understood because it was spoken."],1,"Effective communication requires shared meaning. Define unfamiliar terms, connect them to the learner’s experience and verify understanding through the learner’s response.","Aviation Instructor’s Handbook Chapter 4: Effective Communication",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The scenario concerns communication, not beneficial transfer.", "Correct. Effective communication requires shared meaning. Define unfamiliar terms, connect them to the learner’s experience and verify understanding through the learner’s response.", "Incorrect. Sending a message does not establish that it was understood."]}),
  curatedQuestion("foi","expansion-12","Communication","AIH.4","What is a stronger check of communication than asking “Do you understand?”?",["Repeat the same phrase more loudly.", "Treat a nod as a complete assessment.", "Ask the learner to explain or demonstrate the idea."],2,"An explanation or demonstration reveals how the learner interpreted the message. A yes/no response or nod can hide misunderstandings that matter operationally.","Aviation Instructor’s Handbook Chapter 4: Effective Communication",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Volume does not resolve an unclear concept.", "Incorrect. A nod supplies little evidence of actual understanding.", "Correct. An explanation or demonstration reveals how the learner interpreted the message. A yes/no response or nod can hide misunderstandings that matter operationally."]}),
  curatedQuestion("foi","expansion-13","Communication","AIH.4","A learner’s inaccurate assumption is discovered during a discussion. What communication approach is most useful?",["Listen, clarify the assumption and connect the explanation to observable facts.", "Interrupt every sentence to establish authority.", "Avoid questions to shorten the lesson."],0,"Two-way communication helps expose and correct misunderstandings. Listening and specific clarification let the instructor address the learner’s actual mental model.","Aviation Instructor’s Handbook Chapter 4: Effective Communication",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Two-way communication helps expose and correct misunderstandings. Listening and specific clarification let the instructor address the learner’s actual mental model.", "Incorrect. Constant interruption can prevent the misunderstanding from being identified.", "Incorrect. Questions provide useful evidence of understanding."]}),
  curatedQuestion("foi","expansion-14","Teaching Process","AIH.5","Before demonstrating a new maneuver, what should the instructor establish?",["A promise that watching once creates proficiency.", "The objective, relevant prerequisites and expected performance.", "Only the final grade."],1,"Preparation gives the learner a purpose and connects new material to known skills. Clear expectations help the learner attend to the important parts of the demonstration.","Aviation Instructor’s Handbook Chapter 5: The Teaching Process",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Observation alone does not establish proficiency.", "Correct. Preparation gives the learner a purpose and connects new material to known skills. Clear expectations help the learner attend to the important parts of the demonstration.", "Incorrect. A grade alone does not prepare the learner for the task."]}),
  curatedQuestion("foi","expansion-15","Teaching Process","AIH.5","Why should a demonstration be followed by learner practice?",["Watching a demonstration always completes learning.", "Practice removes the need for assessment.", "Application lets the learner perform the skill and receive feedback."],2,"The teaching process includes application as well as presentation. Supervised practice reveals errors and develops performance beyond passive observation.","Aviation Instructor’s Handbook Chapter 5: The Teaching Process",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Passive observation is not equivalent to demonstrated skill.", "Incorrect. Assessment remains necessary to evaluate learning.", "Correct. The teaching process includes application as well as presentation. Supervised practice reveals errors and develops performance beyond passive observation."]}),
  curatedQuestion("foi","expansion-16","Teaching Process","AIH.5","A lesson introduces many unrelated technical details before its main concept. What improvement is most useful?",["Organize the presentation around the objective and a logical sequence.", "Add more unrelated details to increase intensity.", "Remove all connections to previous learning."],0,"Logical organization helps the learner understand relationships and retain the central concept. Select material that supports the lesson objective and build from relevant prior knowledge.","Aviation Instructor’s Handbook Chapter 5: The Teaching Process",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Logical organization helps the learner understand relationships and retain the central concept. Select material that supports the lesson objective and build from relevant prior knowledge.", "Incorrect. Unrelated detail can obscure rather than strengthen the lesson.", "Incorrect. Connections to prior learning generally support understanding."]}),
  curatedQuestion("foi","expansion-17","Assessment","AIH.6","A test produces consistent scores but measures material unrelated to the course objective. Which quality is deficient?",["Usability solely because the test is short.", "Validity.", "Reliability solely because scores are consistent."],1,"Validity concerns whether a test measures what it is intended to measure. Consistent scores indicate reliability but cannot make irrelevant content a valid assessment.","Aviation Instructor’s Handbook Chapter 6: Assessment",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Test length alone does not define usability or relevance.", "Correct. Validity concerns whether a test measures what it is intended to measure. Consistent scores indicate reliability but cannot make irrelevant content a valid assessment.", "Incorrect. Consistency is associated with reliability, so the described defect is not inconsistency."]}),
  curatedQuestion("foi","expansion-18","Assessment","AIH.6","Two instructors apply the same rubric but assign widely different scores to identical performances. What needs improvement?",["The learner’s memory alone.", "Removal of all performance criteria.", "Scoring reliability and consistent interpretation of the criteria."],2,"Reliable assessment requires reasonably consistent measurements. Clarify the rubric and calibrate its application while retaining the performance standards.","Aviation Instructor’s Handbook Chapter 6: Assessment",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. The disagreement concerns scoring rather than learner recall.", "Incorrect. Removing criteria makes consistency harder to achieve.", "Correct. Reliable assessment requires reasonably consistent measurements. Clarify the rubric and calibrate its application while retaining the performance standards."]}),
  curatedQuestion("foi","expansion-19","Assessment","AIH.6","An instructor says only “That was bad” after a maneuver. Which assessment quality is missing?",["Specific constructive guidance.", "A public ranking of every learner.", "A longer list of unrelated facts."],0,"Useful assessment identifies the actual performance problem and how to improve it. A vague judgment gives the learner no actionable correction and can undermine motivation.","Aviation Instructor’s Handbook Chapter 6: Assessment",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Useful assessment identifies the actual performance problem and how to improve it. A vague judgment gives the learner no actionable correction and can undermine motivation.", "Incorrect. Public ranking does not explain how to correct the maneuver.", "Incorrect. Unrelated facts do not address the observed deficiency."]}),
  curatedQuestion("foi","expansion-20","Assessment","AIH.6","Why should learner self-assessment be included in a debrief?",["It eliminates the need for instructor feedback.", "It develops awareness of performance and supports judgment.", "It transfers all responsibility for instruction to the learner."],1,"Self-assessment invites the learner to compare decisions and performance with standards. The instructor adds guidance, correcting blind spots and supporting more accurate evaluation.","Aviation Instructor’s Handbook Chapter 6: Assessment",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Instructor feedback remains important.", "Correct. Self-assessment invites the learner to compare decisions and performance with standards. The instructor adds guidance, correcting blind spots and supporting more accurate evaluation.", "Incorrect. The instructor retains responsibilities for teaching and safety."]}),
  curatedQuestion("foi","expansion-21","Assessment","AIH.6","A realistic scenario requires a learner to produce a solution and demonstrate a skill. Which assessment category does this illustrate?",["Only a rote recognition test.", "A test that cannot use performance criteria.", "Authentic assessment."],2,"Authentic assessment asks for meaningful application to real-world tasks. Criteria or rubrics define the expected performance and support fair, consistent evaluation.","Aviation Instructor’s Handbook Chapter 6: Assessment",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Producing and demonstrating a solution goes beyond rote recognition.", "Incorrect. Authentic assessment can and should use clear performance criteria.", "Correct. Authentic assessment asks for meaningful application to real-world tasks. Criteria or rubrics define the expected performance and support fair, consistent evaluation."]}),
  curatedQuestion("foi","expansion-22","Planning Instruction","AIH.7","A lesson plan lists activities but has no objective or completion standard. What is the main weakness?",["There is no clear basis for deciding whether the intended learning occurred.", "Activities alone guarantee measurable learning.", "A longer schedule would automatically supply the missing standard."],0,"Objectives and completion standards connect instruction to observable learning. A list of activities does not tell the instructor or learner what successful completion means.","Aviation Instructor’s Handbook Chapter 7: Planning Instructional Activity",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Correct. Objectives and completion standards connect instruction to observable learning. A list of activities does not tell the instructor or learner what successful completion means.", "Incorrect. Participation is not by itself evidence of the intended learning.", "Incorrect. Time allocation cannot replace a performance standard."]}),
  curatedQuestion("foi","expansion-23","Instructor Responsibilities","AIH.8","An instructor makes a factual error during a briefing. What best demonstrates professionalism?",["Ask learners to disregard all future source references.", "Acknowledge it, verify the source and provide the correction.", "Defend the error to preserve authority."],1,"Professional instruction requires accurate information and a willingness to correct mistakes. Verification and a clear correction preserve trust and prevent an error from becoming a learned habit.","Aviation Instructor’s Handbook Chapter 8: Instructor Responsibilities",{"difficulty": "applied", "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook", "reviewedAt": "2026-10-04", "choiceExplanations": ["Incorrect. Reliable source checking remains valuable.", "Correct. Professional instruction requires accurate information and a willingness to correct mistakes. Verification and a clear correction preserve trust and prevent an error from becoming a learned habit.", "Incorrect. Defending a known error undermines reliable instruction."]}),
 ],
};
export const banks={
 foi:expandedQuestions.foi,
 ppl:[...productionSamples('ppl'),...figureParallelQuestions.ppl.filter(q=>q.difficulty!=='foundation'),...scenarioQuestions.ppl,...expandedQuestions.ppl],
 ira:[...productionSamples('ira'),...figureParallelQuestions.ira.filter(q=>q.difficulty!=='foundation'),...scenarioQuestions.ira,...expandedQuestions.ira],
 cpl:[...productionSamples('cpl'),...figureParallelQuestions.cpl.filter(q=>q.difficulty!=='foundation'),...scenarioQuestions.cpl,...expandedQuestions.cpl],
 cfi:[...curatedCfi,...scenarioQuestions.cfi,...expandedQuestions.cfi],
 cfii:[...curatedCfii,...scenarioQuestions.cfii,...expandedQuestions.cfii],
 atp:[...exactAtpSamples,...scenarioQuestions.atp,...expandedQuestions.atp]
};
export const bankManifest={
 acsQuestionCount:['ppl','ira','cpl','cfi','atp'].reduce((s,t)=>s+banks[t].length,0),
 supplementalPtsQuestionCount:banks.cfii.length,
 handbookQuestionCount:banks.foi.length,
 totalQuestionCount:Object.values(banks).reduce((s,a)=>s+a.length,0),
 byTrack:Object.fromEntries(Object.entries(banks).map(([k,v])=>[k,v.length])),
 standards:STANDARDS,
 generatedAt:'2026-10-04',
 legacyGeneratedFamiliesExcluded:true
};
