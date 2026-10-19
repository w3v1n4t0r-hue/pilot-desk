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
// Original applied curriculum. Dates record source checks, not independent instructor sign-off.
const curriculumQuestions={
ppl:[
 curatedQuestion("ppl","curriculum-cg-shift","Weight & Balance","PA.I.F","A 2,300 lb airplane has a 40 lb bag moved 20 inches aft without adding or removing weight. What is the approximate CG change?",["0.35 inch aft.", "0.35 inch forward.", "20 inches aft."],0,"The moment change is 40 × 20 = 800 lb-in. Divide by the unchanged 2,300 lb total weight: 0.348 inch aft. Check the resulting CG against the airplane’s actual limits; this calculation alone does not establish legality.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 10",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. The moment change is 40 × 20 = 800 lb-in. Divide by the unchanged 2,300 lb total weight: 0.348 inch aft. Check the resulting CG against the airplane’s actual limits; this calculation alone does not establish legality.", "Incorrect. The bag moved aft, so the CG moves aft, not forward.", "Incorrect. The whole airplane’s CG does not move as far as a small fraction of its weight."]}),
 curatedQuestion("ppl","curriculum-metar-ceiling","Weather","PA.I.C","A METAR contains SCT008 BKN025 OVC060. Which reported layer establishes the ceiling?",["The scattered layer at 800 ft AGL.", "The broken layer at 2,500 ft AGL.", "The overcast layer at 6,000 ft AGL."],1,"The ceiling is the lowest broken or overcast layer, or vertical visibility into an obscuration. BKN025 is 2,500 ft above the station. SCT008 is a cloud layer but does not establish a ceiling.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 13",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/15_phak_ch13.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Scattered coverage does not constitute a ceiling.", "Correct. The ceiling is the lowest broken or overcast layer, or vertical visibility into an obscuration. BKN025 is 2,500 ft above the station. SCT008 is a cloud layer but does not establish a ceiling.", "Incorrect. The overcast layer is higher than the lower broken ceiling."]}),
 curatedQuestion("ppl","curriculum-wind-vector","Navigation","PA.VI","To maintain a true course of 360° at 100 kt TAS with wind from 270° true at 20 kt, approximately what true heading and groundspeed are required?",["012° and 98 kt.", "348° and 120 kt.", "348° and 98 kt."],2,"Crab toward the west wind. The correction is arcsin(20/100), about 11.5° left. The northward component is √(100² − 20²), about 98 kt; the perpendicular wind is not a 20 kt tailwind.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. A right crab adds eastward drift instead of canceling it.", "Incorrect. The direction is right, but a perpendicular wind does not add 20 kt to groundspeed.", "Correct. Crab toward the west wind. The correction is arcsin(20/100), about 11.5° left. The northward component is √(100² − 20²), about 98 kt; the perpendicular wind is not a 20 kt tailwind."]}),
 curatedQuestion("ppl","curriculum-reserve-budget","Flight Planning","PA.I.D","A simplified planning exercise has 22 usable gallons, an 8 gal/hr burn for every phase, a two-hour trip, and a chosen 45-minute reserve. Ignoring other allowances, how much additional fuel margin remains?",["0 gallons beyond the chosen reserve.", "6 gallons beyond the chosen reserve.", "16 gallons beyond the chosen reserve."],0,"The trip uses 2 × 8 = 16 gallons. The chosen reserve uses 0.75 × 8 = 6 gallons. Together they use all 22 gallons. Taxi, climb, wind changes and uncertainty need separate allowances in a real plan; 45 minutes here is a stated planning assumption.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. The trip uses 2 × 8 = 16 gallons. The chosen reserve uses 0.75 × 8 = 6 gallons. Together they use all 22 gallons. Taxi, climb, wind changes and uncertainty need separate allowances in a real plan; 45 minutes here is a stated planning assumption.", "Incorrect. Six gallons is the reserve itself, not fuel beyond it.", "Incorrect. Sixteen gallons is the trip burn, not the remaining margin."]}),
 curatedQuestion("ppl","curriculum-variation","Navigation","PA.VI","A plotted true course is 075° and local variation is 8° east. Before applying wind correction or compass deviation, what is the magnetic course?",["083°.", "067°.", "075°."],1,"Subtract easterly variation when converting true to magnetic: 075° − 8° = 067°. A magnetic course is the desired ground-track direction; wind correction is still needed to obtain a magnetic heading.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Adding east variation reverses this conversion.", "Correct. Subtract easterly variation when converting true to magnetic: 075° − 8° = 067°. A magnetic course is the desired ground-track direction; wind correction is still needed to obtain a magnetic heading.", "Incorrect. Leaving the value unchanged omits the specified variation."]}),
 curatedQuestion("ppl","curriculum-pitot-sealed","Flight Instruments","PA.I.G","Both the pitot inlet and its drain are sealed, while the static source remains clear. During a climb at unchanged actual airspeed, what erroneous ASI trend is expected?",["It falls to zero as trapped pressure drains away.", "It remains fixed because all instrument pressure is trapped.", "It increases as outside static pressure decreases."],2,"Trapped pitot pressure stays approximately fixed while the clear static source senses decreasing pressure during the climb. The larger pressure difference makes the ASI act like an altimeter and indicate increasing airspeed.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 8",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. The drain is sealed in this scenario; the open-drain failure behaves differently.", "Incorrect. Static pressure is not trapped, so the pressure difference changes with altitude.", "Correct. Trapped pitot pressure stays approximately fixed while the clear static source senses decreasing pressure during the climb. The larger pressure difference makes the ASI act like an altimeter and indicate increasing airspeed."]})
],
ira:[
 curatedQuestion("ira","curriculum-cold-altitude","Flight Instruments","IR.II","With the correct current altimeter setting, an airplane flies at a constant indicated altitude in air much colder than standard. How does true altitude generally compare with indicated altitude?",["True altitude is lower, reducing terrain clearance.", "True altitude is higher, increasing terrain clearance.", "The current setting eliminates all temperature error."],0,"Cold air compresses the pressure levels. Above the setting source, true altitude is lower than indicated in colder-than-standard conditions. A correct pressure setting does not remove this temperature effect; apply required published cold-temperature procedures.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 8",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Cold air compresses the pressure levels. Above the setting source, true altitude is lower than indicated in colder-than-standard conditions. A correct pressure setting does not remove this temperature effect; apply required published cold-temperature procedures.", "Incorrect. Colder-than-standard air produces the opposite relationship.", "Incorrect. The setting corrects the pressure reference, not the vertical spacing of cold pressure levels."]}),
 curatedQuestion("ira","curriculum-dme-overhead","Navigation","IR.IV","An airplane is directly above a DME antenna, 12,000 ft higher than the antenna. Using 6,076 ft per NM, approximately what DME distance should it display?",["0 NM.", "2 NM.", "12 NM."],1,"DME measures slant range, the straight-line distance to the antenna. Directly overhead the horizontal distance is zero, but the vertical separation is 12,000/6,076 ≈ 1.98 NM.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Zero horizontal distance does not make the vertical distance zero.", "Correct. DME measures slant range, the straight-line distance to the antenna. Directly overhead the horizontal distance is zero, but the vertical separation is 12,000/6,076 ≈ 1.98 NM.", "Incorrect. Thousands of feet must be converted to nautical miles, not treated as miles directly."]}),
 curatedQuestion("ira","curriculum-static-alternate","Flight Instruments","IR.II","An airplane’s approved alternate static source draws from cabin air that is lower in pressure than outside air. Immediately after selection, which combination is expected before applying POH corrections?",["Lower indicated altitude and lower indicated airspeed.", "Unchanged altitude and a lasting zero VSI indication.", "Higher indicated altitude, higher indicated airspeed, and a momentary climb indication."],2,"Lower static pressure makes the altimeter read higher and increases the pitot-static pressure difference, making airspeed read higher. The pressure change produces a momentary VSI climb indication. The aircraft’s POH supplies the actual correction.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 8",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Lower sensed static pressure raises these indications rather than lowering them.", "Incorrect. The sudden static-pressure change affects all three instruments; the VSI response is transient.", "Correct. Lower static pressure makes the altimeter read higher and increases the pitot-static pressure difference, making airspeed read higher. The pressure change produces a momentary VSI climb indication. The aircraft’s POH supplies the actual correction."]}),
 curatedQuestion("ira","curriculum-gradient-rate","Departure Procedures","IR.III","A departure requires 400 ft/NM. At a planned groundspeed of 120 kt, what minimum climb rate matches that gradient?",["800 ft/min.", "400 ft/min.", "480 ft/min."],0,"At 120 kt the airplane covers 120/60 = 2 NM per minute. Required climb rate is 400 ft/NM × 2 NM/min = 800 ft/min. Use applicable aircraft performance and actual conditions, not this calculation alone, to decide whether the departure can be flown.","Instrument Procedures Handbook, Chapter 1: Departure Procedures",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook/FAA-H-8083-16B_Chapter_1.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. At 120 kt the airplane covers 120/60 = 2 NM per minute. Required climb rate is 400 ft/NM × 2 NM/min = 800 ft/min. Use applicable aircraft performance and actual conditions, not this calculation alone, to decide whether the departure can be flown.", "Incorrect. Four hundred ft/min supplies the gradient only at 60 kt groundspeed.", "Incorrect. Multiplying by 1.2 treats knots as hundreds of knots instead of converting hours to minutes."]}),
 curatedQuestion("ira","curriculum-time-distance","Navigation","IR.IV","For an approach segment specified as 6 NM long, groundspeed falls from 120 kt to 90 kt. How does estimated time over that segment change?",["From 4 minutes to 3 minutes.", "From 3 minutes to 4 minutes.", "It stays 3 minutes because indicated airspeed is unchanged."],1,"Time uses ground distance and groundspeed. At 120 kt, 6/120 × 60 = 3 minutes; at 90 kt, 6/90 × 60 = 4 minutes. For an actual timed approach, use the chart’s specified timing basis and current groundspeed.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Lower groundspeed takes longer, not less time, to cover the same ground distance.", "Correct. Time uses ground distance and groundspeed. At 120 kt, 6/120 × 60 = 3 minutes; at 90 kt, 6/90 × 60 = 4 minutes. For an actual timed approach, use the chart’s specified timing basis and current groundspeed.", "Incorrect. Groundspeed, not indicated airspeed alone, determines time over the ground."]}),
 curatedQuestion("ira","curriculum-compass-acceleration","Flight Instruments","IR.II","In the Northern Hemisphere, an airplane accelerates on a steady east heading. The conventional magnetic compass briefly indicates a turn north while the attitude and heading instruments show no turn. What explains the discrepancy?",["Magnetic variation changed during acceleration.", "A blocked static source rotated the compass card.", "Magnetic compass acceleration error associated with dip."],2,"On east or west headings in the Northern Hemisphere, acceleration produces a northward compass indication and deceleration a southward indication. Cross-check the stabilized heading and attitude references instead of chasing the transient compass error.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 8",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Variation is a geographic difference between true and magnetic north, not an acceleration transient.", "Incorrect. The magnetic compass does not use the pitot-static system.", "Correct. On east or west headings in the Northern Hemisphere, acceleration produces a northward compass indication and deceleration a southward indication. Cross-check the stabilized heading and attitude references instead of chasing the transient compass error."]})
],
cpl:[
 curatedQuestion("cpl","curriculum-landing-energy","Aircraft Performance","CA.I.F","At the same aircraft mass, ground-relative touchdown speed is 10% higher than planned. Approximately how much more kinetic energy must be dissipated?",["21% more.", "10% more.", "1% more."],0,"Kinetic energy is proportional to speed squared at unchanged mass. The ratio is 1.10² = 1.21, or 21% more energy. This does not establish a precise landing-distance increase because braking, drag and surface conditions also matter.","Airplane Flying Handbook, Chapter 4",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Kinetic energy is proportional to speed squared at unchanged mass. The ratio is 1.10² = 1.21, or 21% more energy. This does not establish a precise landing-distance increase because braking, drag and surface conditions also matter.", "Incorrect. Energy changes with the square of speed, not linearly with speed.", "Incorrect. Squaring the 10% increment alone omits the cross term in the full speed ratio."]}),
 curatedQuestion("cpl","curriculum-bank-stall","Aerodynamics","CA.I.F","An airplane stalls at 50 kt in unaccelerated flight. At the same weight and configuration in a coordinated level 45° bank, approximately what stall speed corresponds to the increased load factor?",["50 kt.", "59 kt.", "71 kt."],1,"The level-turn load factor is 1/cos45° ≈ 1.414. Stall speed scales with its square root: 50 × √1.414 ≈ 59.5 kt. This relationship assumes the stated coordinated level turn and unchanged configuration.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 5",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Maintaining altitude in the turn requires increased lift and increases stall speed.", "Correct. The level-turn load factor is 1/cos45° ≈ 1.414. Stall speed scales with its square root: 50 × √1.414 ≈ 59.5 kt. This relationship assumes the stated coordinated level turn and unchanged configuration.", "Incorrect. Multiplying by the load factor instead of its square root overstates the stall-speed change."]}),
 curatedQuestion("cpl","curriculum-critical-engine","Multiengine Systems","CA.I.G","On a conventional light twin whose propellers both rotate clockwise as viewed from the pilot’s seat, why is the left engine usually critical?",["Its operating propeller always produces less total thrust.", "The left engine is always farther from the centerline.", "With the left engine failed, the operating right engine’s P-factor thrust acts through a longer yawing arm."],2,"At positive angle of attack the descending blade produces more thrust. On the operating right engine that effective thrust is farther from the centerline, producing a greater yawing moment after a left-engine failure. Counter-rotating designs can differ.","Airplane Flying Handbook, Chapter 13",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/14_afh_ch13.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. The critical-engine definition concerns the adverse effect of its failure, not a universal difference in engine output.", "Incorrect. The asymmetric effective thrust location, not an assumed difference in engine mounting distance, explains this case.", "Correct. At positive angle of attack the descending blade produces more thrust. On the operating right engine that effective thrust is farther from the centerline, producing a greater yawing moment after a left-engine failure. Counter-rotating designs can differ."]}),
 curatedQuestion("cpl","curriculum-pivotal-height","Ground Reference Maneuvers","CA.V","During eights on pylons, groundspeed changes from 100 kt to 80 kt. Using pivotal altitude in feet ≈ groundspeed in knots squared ÷ 11.3, how does the calculated height above the pylon change?",["From about 885 ft to 566 ft.", "From about 885 ft to 708 ft.", "It remains 885 ft if indicated airspeed stays constant."],0,"The approximation uses groundspeed squared. At 100 kt: 10,000/11.3 ≈ 885 ft; at 80 kt: 6,400/11.3 ≈ 566 ft. These are heights above the pylon, not MSL altitudes or a substitute for visual technique and safe terrain clearance.","Airplane Flying Handbook, Chapter 7",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/08_afh_ch7.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. The approximation uses groundspeed squared. At 100 kt: 10,000/11.3 ≈ 885 ft; at 80 kt: 6,400/11.3 ≈ 566 ft. These are heights above the pylon, not MSL altitudes or a substitute for visual technique and safe terrain clearance.", "Incorrect. Scaling height linearly by 0.8 misses the squared groundspeed relationship.", "Incorrect. A wind-driven groundspeed change alters pivotal altitude even at unchanged indicated airspeed."]}),
 curatedQuestion("cpl","curriculum-turn-radius","Aerodynamics","CA.I.F","In still air, true airspeed increases while a coordinated level turn retains the same bank angle. What happens to turn radius?",["It decreases because faster airflow tightens the turn.", "It increases because turn radius varies with true airspeed squared at fixed bank.", "It stays fixed because bank angle alone determines radius."],1,"For a coordinated level turn, radius is V²/(g tan bank). At unchanged bank, higher true airspeed produces a larger air-relative radius. The question specifies still air so a wind-altered ground track is not being confused with that radius.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 5",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Higher speed increases the radius at fixed bank; it does not tighten the turn.", "Correct. For a coordinated level turn, radius is V²/(g tan bank). At unchanged bank, higher true airspeed produces a larger air-relative radius. The question specifies still air so a wind-altered ground track is not being confused with that radius.", "Incorrect. Both true airspeed and bank angle enter the radius relationship."]}),
 curatedQuestion("cpl","curriculum-power-loading","Aircraft Performance","CA.I.F","A 200 hp airplane’s weight rises from 2,500 lb to 2,800 lb. What happens to power loading, expressed as pounds per horsepower?",["It decreases from 12.5 to 11.2 lb/hp.", "It stays 12.5 lb/hp because rated horsepower is unchanged.", "It increases from 12.5 to 14 lb/hp."],2,"Power loading is weight divided by horsepower: 2,500/200 = 12.5 and 2,800/200 = 14 lb/hp. Higher power loading generally worsens performance, but actual takeoff and climb capability must come from applicable aircraft data.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 11",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Adding weight at the same horsepower increases, rather than decreases, pounds per horsepower.", "Incorrect. The numerator changed even though the engine’s rated horsepower did not.", "Correct. Power loading is weight divided by horsepower: 2,500/200 = 12.5 and 2,800/200 = 14 lb/hp. Higher power loading generally worsens performance, but actual takeoff and climb capability must come from applicable aircraft data."]})
],
cfi:[
 curatedQuestion("cfi","curriculum-night-approach","Human Factors Instruction","FI.II","A learner approaches a lit runway over dark, featureless terrain and starts lowering the approach despite a normal PAPI indication. What should the instructor emphasize?",["Recognize the visual illusion and verify the descent path with reliable visual or instrument guidance.", "Trust the apparent runway perspective and continue below the PAPI path.", "Increase the descent until nearby ground features become visible."],0,"A featureless-terrain or black-hole approach can lead to a dangerously low approach. Teach cross-checking reliable guidance and the planned altitude profile; discontinue an unsafe approach rather than using a misleading visual impression as the sole reference.","Airplane Flying Handbook, Chapter 11",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/12_afh_ch11.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. A featureless-terrain or black-hole approach can lead to a dangerously low approach. Teach cross-checking reliable guidance and the planned altitude profile; discontinue an unsafe approach rather than using a misleading visual impression as the sole reference.", "Incorrect. The visual impression may be the source of the error; it should not override reliable guidance.", "Incorrect. Descending to obtain ground detail compounds the terrain-clearance risk."]}),
 curatedQuestion("cfi","curriculum-energy-exchange","Aerodynamics Instruction","FI.II","In a brief demonstration with approximately zero net energy gain, the learner pitches up, gains altitude and loses airspeed. Which explanation best connects the observations?",["Pitch has created additional total mechanical energy.", "Energy has been redistributed from kinetic energy to potential energy.", "Engine power must have increased because the airplane climbed."],1,"Over the stated brief interval, the climb can exchange speed for altitude without increasing total mechanical energy. Teach the distinction between energy distribution and the net energy gain needed to sustain a climb at constant speed.","Airplane Flying Handbook, Chapter 4",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Redistribution of existing energy is not creation of additional total energy.", "Correct. Over the stated brief interval, the climb can exchange speed for altitude without increasing total mechanical energy. Teach the distinction between energy distribution and the net energy gain needed to sustain a climb at constant speed.", "Incorrect. A transient climb can use stored speed energy; a climb alone does not prove added engine power."]}),
 curatedQuestion("cfi","curriculum-maneuvering-limits","Aerodynamics Instruction","FI.II","A learner says flying below VA makes repeated full alternating rudder and elevator inputs structurally safe. Which correction is needed?",["VA is a stall speed and has no relationship to structural loading.", "VA protects repeated inputs if each control reaches its stop separately.", "VA does not provide blanket protection for repeated or combined control inputs."],2,"The design maneuvering-speed concept concerns a single control input, one time, in one axis under its assumptions. Repeated reversals or combined inputs can create excessive loads below VA. Teach the aircraft’s actual limitations and smooth control use.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 5",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. VA relates aerodynamic stalling and structural loads; calling it simply a stall speed misses the limitation.", "Incorrect. Separating control stops does not make repeated or combined loading protected.", "Correct. The design maneuvering-speed concept concerns a single control input, one time, in one axis under its assumptions. Repeated reversals or combined inputs can create excessive loads below VA. Teach the aircraft’s actual limitations and smooth control use."]}),
 curatedQuestion("cfi","curriculum-cg-teachback","Weight & Balance Instruction","FI.II","A learner confirms weight is below maximum but has not calculated the moment or CG after loading baggage. What evidence is still needed before concluding the loading is acceptable?",["The total moment, calculated CG, and applicable weight-dependent CG limits.", "Only the empty-aircraft CG, since total weight is legal.", "Only baggage-compartment volume, since the baggage fits."],0,"Maximum weight and CG limits are separate checks. Require the learner to use correct arms and moments, calculate loaded CG, and compare it with the approved envelope and compartment limits. A below-maximum total weight does not establish acceptable balance.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 10",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Maximum weight and CG limits are separate checks. Require the learner to use correct arms and moments, calculate loaded CG, and compare it with the approved envelope and compartment limits. A below-maximum total weight does not establish acceptable balance.", "Incorrect. The empty-aircraft CG does not describe the loaded airplane.", "Incorrect. Physical space is not a balance calculation or an approved loading limit."]}),
 curatedQuestion("cfi","curriculum-reference-frame","Navigation Instruction","FI.II","A learner combines a magnetic course directly with a forecast wind direction given as true. Before evaluating the wind correction, what should the instructor check?",["Whether the wind speed is expressed in statute miles.", "That course and wind direction use the same north reference.", "That compass deviation is added to the wind speed."],1,"Wind-triangle directions must share a reference. Convert the magnetic course to true or the true wind to magnetic using applicable variation before comparing their angle. Compass deviation affects compass heading, not wind speed.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Speed units matter, but the stated directional mismatch is the immediate error.", "Correct. Wind-triangle directions must share a reference. Convert the magnetic course to true or the true wind to magnetic using applicable variation before comparing their angle. Compass deviation affects compass heading, not wind speed.", "Incorrect. Compass deviation is an angular correction and cannot be added to a speed."]}),
 curatedQuestion("cfi","curriculum-hypoxia-awareness","Human Factors Instruction","FI.II","A learner argues that feeling unusually confident at altitude proves there is no hypoxia. What should instruction address?",["Confidence reliably appears only after full oxygen recovery.", "Hypoxia affects vision but leaves judgment intact.", "Hypoxia can cause euphoria and impair judgment, including recognition of one’s own impairment."],2,"Reduced oxygen can impair the brain and produce euphoria or poor judgment. Feeling good is not a dependable safety check. Teach recognition and the appropriate aircraft oxygen and descent procedures rather than waiting for a learner’s subjective assurance.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 17",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/19_phak_ch17.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Unusual confidence can be a symptom of impairment, not proof of recovery.", "Incorrect. Judgment and cognitive performance are among the functions that hypoxia can impair.", "Correct. Reduced oxygen can impair the brain and produce euphoria or poor judgment. Feeling good is not a dependable safety check. Teach recognition and the appropriate aircraft oxygen and descent procedures rather than waiting for a learner’s subjective assurance."]})
],
cfii:[
 curatedQuestion("cfii","curriculum-gradient-assessment","Departure Instruction","PTS Area III","A learner plans 150 kt groundspeed for a departure requiring 500 ft/NM. Available climb rate in the planned conditions is 900 ft/min. Which conclusion follows from those stated values?",["The plan is short of the required 1,250 ft/min; revise it using approved performance data.", "The 900 ft/min capability exceeds the 500 ft/min requirement.", "The plan meets the gradient because 150 kt indicated airspeed is sufficient."],0,"Required climb rate is 500 × (150/60) = 1,250 ft/min. The stated 900 ft/min is insufficient at that groundspeed. Assess units and the performance assumptions; changing speed or routing requires an aircraft-appropriate plan, not merely manipulating the arithmetic.","Instrument Procedures Handbook, Chapter 1: Departure Procedures",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook/FAA-H-8083-16B_Chapter_1.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Required climb rate is 500 × (150/60) = 1,250 ft/min. The stated 900 ft/min is insufficient at that groundspeed. Assess units and the performance assumptions; changing speed or routing requires an aircraft-appropriate plan, not merely manipulating the arithmetic.", "Incorrect. Five hundred is feet per nautical mile, not feet per minute.", "Incorrect. Groundspeed and climb capability determine this comparison; indicated airspeed alone cannot establish compliance."]}),
 curatedQuestion("cfii","curriculum-cold-terrain","Instrument Instruction","PTS Area VI","In a cold-weather lesson, the learner says using the correct altimeter setting guarantees indicated altitude equals true altitude above nearby terrain. What should the instructor demonstrate?",["How the pressure setting cancels the temperature lapse rate.", "How cold pressure-level spacing can put the airplane lower than indicated.", "How colder air raises true altitude above the indicated value."],1,"A correct setting fixes the pressure reference but does not remove nonstandard-temperature error above that reference. In cold air true altitude can be lower than indicated, affecting terrain clearance. Use applicable published temperature-correction procedures.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 8",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. The setting does not make the atmosphere’s temperature profile standard.", "Correct. A correct setting fixes the pressure reference but does not remove nonstandard-temperature error above that reference. In cold air true altitude can be lower than indicated, affecting terrain clearance. Use applicable published temperature-correction procedures.", "Incorrect. Colder-than-standard conditions produce the lower-true-altitude concern."]}),
 curatedQuestion("cfii","curriculum-distance-geometry","Navigation Instruction","PTS Area VII","A learner is 3 NM horizontally from a DME antenna and 4 NM above it, and expects a 3 NM reading. Ignoring small propagation effects, what reading follows from slant-range geometry?",["1 NM.", "7 NM.", "5 NM."],2,"The horizontal and vertical distances form perpendicular sides of a right triangle. Slant range is √(3² + 4²) = 5 NM. DME reports that direct distance, not solely horizontal distance or the sum of the two sides.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Subtracting perpendicular distances does not give the hypotenuse.", "Incorrect. Adding horizontal and vertical distances describes a two-leg path, not the straight-line slant range.", "Correct. The horizontal and vertical distances form perpendicular sides of a right triangle. Slant range is √(3² + 4²) = 5 NM. DME reports that direct distance, not solely horizontal distance or the sum of the two sides."]}),
 curatedQuestion("cfii","curriculum-compass-crosscheck","Instrument Instruction","PTS Area VI","In the Northern Hemisphere, a learner accelerates eastbound and turns south to cancel a transient north indication on the magnetic compass. What should the debrief identify?",["The learner chased acceleration error instead of cross-checking reliable heading and attitude indications.", "The aircraft crossed an isogonic line that required an immediate turn.", "The compass correctly commanded a south turn to hold east."],0,"Acceleration on an east or west heading can create a transient northward compass indication in the Northern Hemisphere. Turning in response creates an actual heading error. Teach dip-related compass errors and appropriate instrument cross-checks.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 8",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Acceleration on an east or west heading can create a transient northward compass indication in the Northern Hemisphere. Turning in response creates an actual heading error. Teach dip-related compass errors and appropriate instrument cross-checks.", "Incorrect. A geographic variation line does not explain an acceleration-linked transient.", "Incorrect. The magnetic compass is an indication, not a turn command; this transient is misleading."]}),
 curatedQuestion("cfii","curriculum-alternate-source-lesson","Instrument Instruction","PTS Area VI","After selecting a lower-pressure cabin alternate static source, a learner sees the altimeter jump upward and immediately pitches down to restore the old reading. What should the instructor address first?",["The assumption that selecting alternate static changes actual altitude instantly.", "The pressure-source error and aircraft-specific correction before treating the jump as a flight-path change.", "The need to use the magnetic compass as the primary altitude reference."],1,"Changing static pressure can change the indication without changing actual altitude. Teach the expected instrument effects, the aircraft’s POH correction and a suitable cross-check. Chasing the uncorrected jump can create an unnecessary descent.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 8",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. The selection changes sensed pressure; it does not instantly move the airplane.", "Correct. Changing static pressure can change the indication without changing actual altitude. Teach the expected instrument effects, the aircraft’s POH correction and a suitable cross-check. Chasing the uncorrected jump can create an unnecessary descent.", "Incorrect. A magnetic compass supplies direction, not altitude information."]}),
 curatedQuestion("cfii","curriculum-timing-teachback","Navigation Instruction","PTS Area VII","A learner computes time for a 4 NM segment at 80 kt as 0.05 minutes. Which correction best targets the actual mistake?",["Substitute indicated airspeed for groundspeed.", "Multiply the distance by the speed.", "Convert the 0.05-hour quotient to 3 minutes."],2,"Distance divided by a speed in nautical miles per hour yields hours. Four divided by 80 is 0.05 hour, and 0.05 × 60 = 3 minutes. Teach unit cancellation so the learner can detect the error on unfamiliar numbers.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Changing the speed reference does not fix the hour-to-minute error.", "Incorrect. Multiplying NM by NM/hr does not produce time.", "Correct. Distance divided by a speed in nautical miles per hour yields hours. Four divided by 80 is 0.05 hour, and 0.05 × 60 = 3 minutes. Teach unit cancellation so the learner can detect the error on unfamiliar numbers."]})
],
atp:[
 curatedQuestion("atp","curriculum-mach-temperature","High-Speed Aerodynamics","AA.I.F","At a constant Mach number, the airplane enters colder air where the local speed of sound is lower. What happens to true airspeed?",["It decreases.", "It increases.", "It stays constant because Mach is constant."],0,"Mach number is true airspeed divided by the local speed of sound. With Mach held constant, a lower speed of sound means lower true airspeed. Temperature, rather than altitude alone, sets this local relationship.","Airplane Flying Handbook, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Mach number is true airspeed divided by the local speed of sound. With Mach held constant, a lower speed of sound means lower true airspeed. Temperature, rather than altitude alone, sets this local relationship.", "Incorrect. At fixed Mach, true airspeed follows the speed of sound in the same direction.", "Incorrect. A fixed ratio does not keep its numerator constant when the denominator changes."]}),
 curatedQuestion("atp","curriculum-energy-speed","Aircraft Performance","AA.I.F","At equal mass, a touchdown at 132 kt groundspeed instead of 120 kt changes kinetic energy by approximately what percentage?",["10% more.", "21% more.", "44% more."],1,"The speed ratio is 132/120 = 1.10. Energy ratio is 1.10² = 1.21, so energy is 21% greater. This physical relationship does not replace approved landing-distance calculations or account for runway condition and braking effectiveness.","Airplane Flying Handbook, Chapter 4",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. This is the speed increase; energy increases with speed squared.", "Correct. The speed ratio is 132/120 = 1.10. Energy ratio is 1.10² = 1.21, so energy is 21% greater. This physical relationship does not replace approved landing-distance calculations or account for runway condition and braking effectiveness.", "Incorrect. A 44% energy increase corresponds to a 20% speed increase, not the stated 10%."]}),
 curatedQuestion("atp","curriculum-hail-anvil","Weather","AA.I.C","The air is visibly clear beneath a thunderstorm’s anvil and outside its main rain shaft. What hazard still makes that corridor unsuitable as evidence of safe storm clearance?",["Hail is confined to the visible rain shaft.", "Visible clear air proves the storm’s updraft has ended.", "Hail can fall outside the storm core, including beneath the anvil."],2,"Thunderstorm hail can be carried away from the core and encountered in apparently clear air beneath an anvil. Lack of visible rain does not establish an absence of hail or other convective hazards; plan appropriate thunderstorm avoidance.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 12",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Hail can extend beyond the visible precipitation core.", "Incorrect. A clear corridor does not demonstrate that the storm’s hazardous circulation has stopped.", "Correct. Thunderstorm hail can be carried away from the core and encountered in apparently clear air beneath an anvil. Lack of visible rain does not establish an absence of hail or other convective hazards; plan appropriate thunderstorm avoidance."]}),
 curatedQuestion("atp","curriculum-mass-energy","Aircraft Performance","AA.I.F","At the same ground-relative touchdown speed, aircraft mass is 20% higher. Ignoring other changes, how much higher is kinetic energy?",["20% higher.", "44% higher.", "It is unchanged because speed is unchanged."],0,"Kinetic energy equals one-half mass times speed squared. At unchanged speed it scales directly with mass, so a 20% mass increase produces 20% more energy. Landing distance still requires the approved performance method for actual conditions.","Airplane Flying Handbook, Chapter 4",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Kinetic energy equals one-half mass times speed squared. At unchanged speed it scales directly with mass, so a 20% mass increase produces 20% more energy. Landing distance still requires the approved performance method for actual conditions.", "Incorrect. Mass enters linearly; the square applies to speed.", "Incorrect. Mass is also part of kinetic energy even when speed stays constant."]}),
 curatedQuestion("atp","curriculum-jet-instrument","Turbine Systems","AA.I.G","A jet engine displays N1 as a percentage. A learner reads 90% N1 as 90% of maximum thrust in all conditions. What is the correct interpretation?",["N1 is the percentage of fuel remaining.", "N1 is a rotational-speed indication; thrust requires the applicable engine and performance relationship.", "N1 directly measures pounds of thrust with no temperature dependence."],1,"N1 reports the rotational speed of an engine section as a percentage of its reference rpm. It is not a universal percentage-of-thrust meter. Ambient conditions and the particular engine’s approved data affect the relationship between speed and thrust.","Airplane Flying Handbook, Chapter 16",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. N1 is an engine rotational-speed indication, not fuel quantity.", "Correct. N1 reports the rotational speed of an engine section as a percentage of its reference rpm. It is not a universal percentage-of-thrust meter. Ambient conditions and the particular engine’s approved data affect the relationship between speed and thrust.", "Incorrect. An rpm percentage is not a direct force measurement; the relationship is engine- and condition-dependent."]}),
 curatedQuestion("atp","curriculum-turn-radius-speed","High-Speed Aerodynamics","AA.I.F","In still air at the same bank angle, true airspeed doubles during a coordinated level turn. How does the idealized turn radius change?",["It halves.", "It doubles.", "It becomes four times as large."],2,"Radius is proportional to true airspeed squared at fixed bank: doubling speed multiplies radius by four. This geometric comparison assumes a coordinated level turn and does not grant permission to exceed aircraft bank, load or speed limits.","Pilot’s Handbook of Aeronautical Knowledge, Chapter 5",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Increasing speed increases the radius at unchanged bank.", "Incorrect. A linear doubling omits the squared-speed term.", "Correct. Radius is proportional to true airspeed squared at fixed bank: doubling speed multiplies radius by four. This geometric comparison assumes a coordinated level turn and does not grant permission to exceed aircraft bank, load or speed limits."]})
],
foi:[
 curatedQuestion("foi","curriculum-distractor-design","Assessment","AIH.6","An instructor writes a conversion question whose wrong choices use common unit mistakes. Why can these distractors improve the item compared with unrelated choices?",["They can reveal specific misunderstandings rather than reward elimination of implausible answers.", "They make the test valid regardless of its stated objective.", "They remove the need to check that there is one best answer."],0,"Plausible distractors based on common errors can distinguish understanding from superficial recognition. They must still fit a clear stem, support the learning objective and leave one defensible keyed answer; plausibility alone does not validate a test.","Aviation Instructor’s Handbook, Appendix B: Developing a Test Item Bank",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/14_aih_appendix_b.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Plausible distractors based on common errors can distinguish understanding from superficial recognition. They must still fit a clear stem, support the learning objective and leave one defensible keyed answer; plausibility alone does not validate a test.", "Incorrect. Item design must still match what the assessment is intended to measure.", "Incorrect. A clear best answer remains essential when several choices look plausible."]}),
 curatedQuestion("foi","curriculum-lesson-conditions","Lesson Planning","AIH.7","An objective states: “Given today’s METAR and a sectional, select a suitable destination and explain two weather risks.” Which part specifies the conditions of performance?",["Select a suitable destination.", "Given today’s METAR and a sectional.", "Explain two weather risks."],1,"The given materials and situation state the conditions under which the learner performs. Selecting and explaining describe the performance; a complete assessment also needs appropriate criteria for judging whether that performance is acceptable.","Aviation Instructor’s Handbook, Chapter 7",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/09_aih_chapter_7.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Selecting a destination is the action to perform, not the supplied conditions.", "Correct. The given materials and situation state the conditions under which the learner performs. Selecting and explaining describe the performance; a complete assessment also needs appropriate criteria for judging whether that performance is acceptable.", "Incorrect. Explaining risks is a required action; the number two partly specifies the expected output."]}),
 curatedQuestion("foi","curriculum-test-breadth","Assessment","AIH.6","A course covers weather, navigation and aircraft systems, but its final test samples only weather. Which test quality is most directly missing if the score is used to assess the whole course?",["Reliability solely because questions are multiple choice.", "Usability solely because weather is familiar.", "Comprehensiveness across the course objectives."],2,"A course-wide assessment needs a representative sampling of its objectives. A weather-only test may provide useful weather evidence, but it cannot establish coverage of navigation and systems. Consistency of scores would not solve the missing breadth.","Aviation Instructor’s Handbook, Chapter 6",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/08_aih_chapter_6.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Multiple-choice format alone does not make a test unreliable.", "Incorrect. Familiarity with a subject does not determine whether the test samples the entire course.", "Correct. A course-wide assessment needs a representative sampling of its objectives. A weather-only test may provide useful weather evidence, but it cannot establish coverage of navigation and systems. Consistency of scores would not solve the missing breadth."]}),
 curatedQuestion("foi","curriculum-memory-grouping","Learning Process","AIH.3","A learner loses pieces of a long clearance. Which learning strategy best supports retention without changing or omitting the clearance?",["Organize meaningful elements into groups, record them and verify the complete message.", "Memorize each word as an unrelated item with no grouping.", "Retain only the destination and reconstruct the other limits later."],0,"Meaningful organization or chunking reduces the burden of treating every element as unrelated information. Recording and verifying the complete clearance preserves accuracy; grouping is a memory aid, not authorization to omit instructions.","Aviation Instructor’s Handbook, Chapter 3",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Meaningful organization or chunking reduces the burden of treating every element as unrelated information. Recording and verifying the complete clearance preserves accuracy; grouping is a memory aid, not authorization to omit instructions.", "Incorrect. Unrelated isolated items increase working-memory demands.", "Incorrect. Reconstructing omitted instructions substitutes a guess for the actual clearance."]}),
 curatedQuestion("foi","curriculum-transfer-check","Learning Process","AIH.3","A learner scores highly on repeated questions but cannot use the same concepts in an unfamiliar flight-planning scenario. What should the instructor assess next?",["Speed of recalling the repeated answer letters.", "Application and transfer in a new context.", "Confidence as a substitute for demonstrated performance."],1,"Recognition of familiar wording does not establish transferable understanding. A new scenario requires the learner to apply concepts, explain relationships and justify a decision, exposing gaps hidden by repeated-question recall.","Aviation Instructor’s Handbook, Chapter 3",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Answer-letter recall reinforces familiarity without checking application.", "Correct. Recognition of familiar wording does not establish transferable understanding. A new scenario requires the learner to apply concepts, explain relationships and justify a decision, exposing gaps hidden by repeated-question recall.", "Incorrect. Confidence does not demonstrate that a concept can be used correctly."]}),
 curatedQuestion("foi","curriculum-communication-noise","Communication","AIH.4","Cockpit noise masks part of an instructor’s message, and the learner begins a different action than intended. What should the instructor do to repair the communication?",["Repeat only the last word and assume the rest was received.", "Give the remaining explanation faster to reduce airtime.", "Reestablish a clear message and confirm what the learner actually received."],2,"Interference can truncate or distort a message. Restore a usable communication channel and obtain feedback that confirms the intended meaning, while maintaining safe aircraft control. Sending a message is not proof of accurate receipt.","Aviation Instructor’s Handbook, Chapter 4",{"difficulty": "advanced", "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/06_aih_chapter_4.pdf", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. The instructor does not yet know which parts were lost; a final word alone may not repair the message.", "Incorrect. Speeding up can worsen clarity rather than repair the disrupted message.", "Correct. Interference can truncate or distort a message. Restore a usable communication channel and obtain feedback that confirms the intended meaning, while maintaining safe aircraft control. Sending a message is not proof of accurate receipt."]})
]
};

// Private Pilot study path: separately authored scenarios across nine study groups.
const privatePathQuestions=[
 curatedQuestion("ppl","private-path-night-currency","Pilot Qualifications","PA.I.A","A private pilot has three recent daytime touch-and-go landings in a tricycle-gear airplane but no recent night landings. A passenger trip is planned two hours after sunset. Assuming no regulatory exception, what experience is still needed?",["Three qualifying night takeoffs and full-stop landings within the preceding 90 days in the appropriate category, class and type if required.", "Three daytime touch-and-go landings already satisfy the night requirement.", "One night landing plus a current flight review replaces the three-landing requirement."],0,"Daytime touch-and-go landings do not satisfy the separate night passenger-carrying rule. The qualifying night takeoffs and full-stop landings must be in the specified one-hour-after-sunset to one-hour-before-sunrise window within 90 days.","14 CFR 61.57(b); FAA-S-ACS-6C PA.I.A",{"sourceUrl": "https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Daytime touch-and-go landings do not satisfy the separate night passenger-carrying rule. The qualifying night takeoffs and full-stop landings must be in the specified one-hour-after-sunset to one-hour-before-sunrise window within 90 days.", "Incorrect. Day currency and the separate night passenger-carrying requirement are different checks.", "Incorrect. A flight review does not replace the specified recent night takeoff and landing experience."]}),
 curatedQuestion("ppl","private-path-cost-share","Pilot Qualifications","PA.I.A","A private pilot and three passengers have a permissible common-purpose flight with $240 in allowable fuel, oil, airport and rental expenses. Considering only the pro-rata payment requirement, what is the least the pilot may pay?",["$0 if a passenger volunteered to pay.", "$60.", "$80."],1,"Four people, including the pilot, share the $240 allowable expenses. The pilot must pay at least 240/4 = $60. This arithmetic assumes the flight otherwise qualifies; a pro-rata payment alone does not make a compensation arrangement permissible.","14 CFR 61.113(c); FAA-S-ACS-6C PA.I.A",{"sourceUrl": "https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. A voluntary offer does not waive the pilot’s minimum share.", "Correct. Four people, including the pilot, share the $240 allowable expenses. The pilot must pay at least 240/4 = $60. This arithmetic assumes the flight otherwise qualifies; a pro-rata payment alone does not make a compensation arrangement permissible.", "Incorrect. Dividing by only the three passengers omits the pilot from the pro-rata group."]}),
 curatedQuestion("ppl","private-path-review-endorsement","Pilot Qualifications","PA.I.A","A pilot completes training toward a flight review, but the instructor has not determined satisfactory completion or made the required endorsement. No alternative qualifying event applies. What establishes completion of that review?",["Paying for the training session.", "Having passenger-carrying landing currency.", "Satisfactory completion and the authorized instructor’s logbook endorsement."],2,"Training time alone does not establish satisfactory flight-review completion. The instructor must determine that the review was satisfactorily completed and provide the required endorsement. Passenger currency is a separate requirement.","14 CFR 61.56(c); FAA-S-ACS-6C PA.I.A",{"sourceUrl": "https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Payment records are not the instructor’s determination or flight-review endorsement.", "Incorrect. Recent landings address passenger currency, not satisfactory completion of this flight review.", "Correct. Training time alone does not establish satisfactory flight-review completion. The instructor must determine that the review was satisfactorily completed and provide the required endorsement. Passenger currency is a separate requirement."]}),
 curatedQuestion("ppl","private-path-annual-date","Airworthiness","PA.I.B","A normally certificated light airplane on the annual-inspection system had an annual completed and approved for return to service on October 6, 2025. With no applicable exception, when does that annual cease to be current?",["After October 31, 2026.", "After October 6, 2026.", "After December 31, 2026."],0,"The annual-inspection interval uses 12 calendar months, not 365 days. An October 2025 annual remains current through the end of October 2026 under the stated inspection system. Other maintenance and airworthiness requirements still apply.","14 CFR 91.409(a); PHAK Chapter 9",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/11_phak_ch9.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. The annual-inspection interval uses 12 calendar months, not 365 days. An October 2025 annual remains current through the end of October 2026 under the stated inspection system. Other maintenance and airworthiness requirements still apply.", "Incorrect. The day of the month does not set the end of a calendar-month interval.", "Incorrect. The annual does not remain current until the end of the whole year."]}),
 curatedQuestion("ppl","private-path-hundred-hour","Airworthiness","PA.I.B","An instructor provides the airplane for paid instruction. Its required 100-hour inspection is due, but the instructor proposes another local training lesson using the ten-hour allowance. What is wrong with that plan?",["A 100-hour inspection is never required for instruction.", "The allowance is for flight en route to where the inspection can be performed, not extra local training.", "The allowance applies only when the annual is expired."],1,"For the specified paid instruction in an instructor-provided airplane, the 100-hour requirement applies. The limited overrun is for reaching a place where the inspection can be performed; it is not a discretionary extension for another lesson.","14 CFR 91.409(b); PHAK Chapter 9",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/11_phak_ch9.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. The airplane-provider condition is specifically part of the inspection requirement.", "Correct. For the specified paid instruction in an instructor-provided airplane, the 100-hour requirement applies. The limited overrun is for reaching a place where the inspection can be performed; it is not a discretionary extension for another lesson.", "Incorrect. The overrun provision concerns the 100-hour interval and does not authorize flight with an expired annual."]}),
 curatedQuestion("ppl","private-path-inop-review","Airworthiness","PA.I.B","A light airplane is eligible for the no-MEL provisions of 91.213(d). A broken installed item is labeled “Inoperative.” What additional review is necessary before that label can be treated as sufficient for dispatch?",["Only whether the pilot expects to use the item.", "Only whether the battery can power the remaining equipment.", "Whether the item is required, whether proper removal or deactivation and records are complete, and whether the failure is a hazard."],2,"The no-MEL process is more than a placard. Check the applicable certification, equipment-list, operating-rule and AD requirements, complete the permitted removal or deactivation and maintenance records, and determine that the failure is not a hazard.","14 CFR 91.213(d); PHAK Chapter 9",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/11_phak_ch9.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Required equipment cannot be waived merely because the pilot does not plan to use it.", "Incorrect. Electrical capability does not establish compliance with the inoperative-equipment provisions.", "Correct. The no-MEL process is more than a placard. Check the applicable certification, equipment-list, operating-rule and AD requirements, complete the permitted removal or deactivation and maintenance records, and determine that the failure is not a hazard."]}),
 curatedQuestion("ppl","private-path-bravo-clearance","Airspace","PA.I.E","Before a VFR airplane reaches a Class B boundary, ATC identifies its callsign and says to standby but does not issue a Class B clearance. What should the pilot do?",["Remain outside Class B until the required clearance is received.", "Enter because callsign acknowledgment is enough for every controlled-airspace class.", "Enter if the transponder displays the assigned code."],0,"Class B entry requires an ATC clearance. Callsign acknowledgment and an assigned code do not supply that clearance. This differs from the two-way-communication entry standard for Class C and D; continue to comply with other applicable requirements.","AIM 3-2-3: Class B Airspace",{"sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap3_section_2.html", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Class B entry requires an ATC clearance. Callsign acknowledgment and an assigned code do not supply that clearance. This differs from the two-way-communication entry standard for Class C and D; continue to comply with other applicable requirements.", "Incorrect. The callsign-acknowledgment test is not a substitute for a Class B clearance.", "Incorrect. A transponder code identifies the aircraft but does not itself authorize Class B entry."]}),
 curatedQuestion("ppl","private-path-charlie-outside","Airspace","PA.I.E","Approach replies, “N123AB, remain outside Class Charlie and standby.” Equipment and weather requirements are met. What does the callsign acknowledgment permit?",["Entry immediately because two-way communication exists.", "Communication is established, but the explicit instruction requires remaining outside.", "Entry below the ceiling because standby cancels the restriction."],1,"The controller used the callsign, establishing two-way communication, but also specifically instructed the airplane to remain outside. Communication establishment does not cancel that restriction; obtain a revised instruction before entering.","AIM 3-2-4: Class C Airspace",{"sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap3_section_2.html", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. This overlooks the accompanying remain-outside instruction.", "Correct. The controller used the callsign, establishing two-way communication, but also specifically instructed the airplane to remain outside. Communication establishment does not cancel that restriction; obtain a revised instruction before entering.", "Incorrect. Standby does not cancel the explicit restriction on entry."]}),
 curatedQuestion("ppl","private-path-shelf-altitude","Airspace","PA.I.E","At the airplane’s horizontal position, a hypothetical Class C shelf extends from 2,300 to 4,000 ft MSL. The airplane is at 2,200 ft MSL. Which conclusion follows from these numbers alone?",["It is inside the shelf because it is within the outer radius.", "It is inside because the 2,300-foot floor must be measured AGL.", "It is below that shelf; other airspace, equipment and terrain requirements still need checking."],2,"Compare altitude with the charted MSL floor. At 2,200 ft MSL the airplane is 100 ft below this hypothetical shelf. Being beneath it does not establish adequate terrain clearance or compliance with every other rule.","AIM 3-2: Controlled Airspace",{"sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap3_section_2.html", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Horizontal position alone is insufficient; the vertical limits also matter.", "Incorrect. The scenario explicitly specifies MSL, not height above the ground.", "Correct. Compare altitude with the charted MSL floor. At 2,200 ft MSL the airplane is 100 ft below this hypothetical shelf. Being beneath it does not establish adequate terrain clearance or compliance with every other rule."]}),
 curatedQuestion("ppl","private-path-tempo-arrival","Weather","PA.I.C","A hypothetical TAF forecasts P6SM and BKN040, with TEMPO 0616/0618 2SM -RA BKN008. The planned arrival is 1700Z on the 6th. What should the pilot include in the VFR decision?",["The temporary two-mile visibility and 800 ft ceiling could affect the arrival, so assess delay or another destination.", "Only P6SM and BKN040 matter because TEMPO is outside the main forecast.", "The temporary conditions are guaranteed to end before 1700Z."],0,"The arrival falls within the specified temporary-condition window. Two miles and an 800 ft ceiling are materially worse than the prevailing forecast. TEMPO does not make the deterioration irrelevant or guarantee a favorable instant at arrival.","PHAK Chapter 13: Aviation Weather Services",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/15_phak_ch13.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. The arrival falls within the specified temporary-condition window. Two miles and an 800 ft ceiling are materially worse than the prevailing forecast. TEMPO does not make the deterioration irrelevant or guarantee a favorable instant at arrival.", "Incorrect. The temporary group is part of the forecast and overlaps the planned arrival.", "Incorrect. The group gives a window, not a promise that the deterioration ends before this arrival time."]}),
 curatedQuestion("ppl","private-path-radiation-fog","Weather","PA.I.C","After a humid day, the forecast is for a clear, calm night and a shrinking temperature–dew-point spread. Which change should a dawn departure plan specifically consider?",["Improved visibility solely because the wind is calm.", "Radiation fog as the surface cools the air toward saturation.", "A guarantee of no cloud because the sky was clear at sunset."],1,"Clear skies favor nighttime surface cooling; light or calm wind and moisture can support radiation fog. A small temperature–dew-point spread indicates reduced separation from saturation, but it is not by itself a fog forecast or a complete briefing.","PHAK Chapter 12: Weather Theory",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Calm conditions can support surface fog rather than guarantee improved visibility.", "Correct. Clear skies favor nighttime surface cooling; light or calm wind and moisture can support radiation fog. A small temperature–dew-point spread indicates reduced separation from saturation, but it is not by itself a fog forecast or a complete briefing.", "Incorrect. Surface cooling can produce fog after an initially clear evening."]}),
 curatedQuestion("ppl","private-path-inversion-haze","Weather","PA.I.C","A shallow temperature inversion lies over a valley with trapped smoke. What combination is consistent with that layer?",["Strong vertical mixing and automatic removal of smoke.", "Excellent visibility because stable air contains no contaminants.", "Relatively stable air with reduced vertical mixing and potentially poor visibility."],2,"Temperature increasing with height inhibits vertical mixing in a surface inversion. Smoke and other contaminants can remain concentrated beneath it. Smooth or stable air therefore does not necessarily mean good visibility.","PHAK Chapter 12: Weather Theory",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. An inversion suppresses, rather than guarantees, vigorous vertical mixing.", "Incorrect. Stability does not remove smoke already present in the valley.", "Correct. Temperature increasing with height inhibits vertical mixing in a surface inversion. Smoke and other contaminants can remain concentrated beneath it. Smooth or stable air therefore does not necessarily mean good visibility."]}),
 curatedQuestion("ppl","private-path-checkpoint-wind","Flight Planning","PA.I.D","A 20 NM checkpoint leg takes 15 minutes instead of the planned 12 minutes. With steady progress on course, what observed groundspeed should be used to reconsider the remaining time and fuel?",["80 kt.", "100 kt.", "75 kt."],0,"Fifteen minutes is 0.25 hour. Observed groundspeed is 20/0.25 = 80 kt, compared with the original 100 kt plan. Recalculate remaining time and fuel with updated conditions rather than treating the original schedule as still valid.","PHAK Chapter 16: Navigation",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Fifteen minutes is 0.25 hour. Observed groundspeed is 20/0.25 = 80 kt, compared with the original 100 kt plan. Recalculate remaining time and fuel with updated conditions rather than treating the original schedule as still valid.", "Incorrect. One hundred knots was the planned speed for 12 minutes, not the observed speed.", "Incorrect. Dividing by the number of minutes without the correct hour conversion leads to a wrong speed."]}),
 curatedQuestion("ppl","private-path-diversion-fuel","Flight Planning","PA.I.D","A simplified diversion is 36 NM away at 90 kt groundspeed. At 9 gal/hr, what cruise fuel is required for that leg, before adding reserve and other allowances?",["2.4 gallons.", "3.6 gallons.", "5.4 gallons."],1,"The leg takes 36/90 = 0.4 hour, or 24 minutes. Cruise fuel is 0.4 × 9 = 3.6 gallons. This is one segment only; separately account for maneuvering, approach, reserve and uncertainty in the actual plan.","PHAK Chapter 16: Navigation",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Twenty-four minutes is 0.4 hour, not a fuel amount of 2.4 gallons.", "Correct. The leg takes 36/90 = 0.4 hour, or 24 minutes. Cruise fuel is 0.4 × 9 = 3.6 gallons. This is one segment only; separately account for maneuvering, approach, reserve and uncertainty in the actual plan.", "Incorrect. Five-point-four gallons corresponds to 0.6 hour at this burn, not the computed 0.4 hour."]}),
 curatedQuestion("ppl","private-path-wind-reference","Navigation","PA.I.D","A runway’s magnetic direction is 180°. A METAR reports wind from 200° true, and variation is 10° east. Before calculating the runway-wind angle, what magnetic wind direction should be used?",["210° magnetic.", "200° magnetic.", "190° magnetic."],2,"METAR wind direction uses true north. Convert to the runway’s magnetic reference by subtracting 10° east variation: 200° true becomes 190° magnetic, giving a 10° difference from the stated runway direction.","PHAK Chapter 13: METAR winds; PHAK Chapter 16: navigation",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/15_phak_ch13.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Adding east variation reverses the true-to-magnetic conversion.", "Incorrect. Leaving the number unchanged mixes true and magnetic reference frames.", "Correct. METAR wind direction uses true north. Convert to the runway’s magnetic reference by subtracting 10° east variation: 200° true becomes 190° magnetic, giving a 10° difference from the stated runway direction."]}),
 curatedQuestion("ppl","private-path-cg-fuel-burn","Weight & Balance","PA.I.F","A hypothetical airplane weighs 2,400 lb with CG at 40 inches. It burns 120 lb of fuel located at a 48-inch arm. What is its new CG, assuming nothing else changes?",["About 39.58 inches.", "Exactly 40 inches.", "About 40.42 inches."],0,"Initial moment is 2,400 × 40 = 96,000 lb-in. Remove fuel moment 120 × 48 = 5,760; remaining weight is 2,280 lb. CG is 90,240/2,280 = 39.58 inches, forward because weight was removed aft of the old CG. Check actual limits.","PHAK Chapter 10: Weight and Balance",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Initial moment is 2,400 × 40 = 96,000 lb-in. Remove fuel moment 120 × 48 = 5,760; remaining weight is 2,280 lb. CG is 90,240/2,280 = 39.58 inches, forward because weight was removed aft of the old CG. Check actual limits.", "Incorrect. Removing weight away from the original CG changes the moment-to-weight ratio.", "Incorrect. Removing aft weight moves the CG forward, not aft."]}),
 curatedQuestion("ppl","private-path-chart-interpolation","Performance","PA.I.F","A hypothetical training table gives takeoff ground roll of 900 ft at 20°C and 1,100 ft at 30°C, all other conditions fixed. If the instructions permit linear interpolation, what estimate applies at 25°C?",["950 ft.", "1,000 ft.", "1,100 ft."],1,"Twenty-five degrees is halfway between the tabulated temperatures, so interpolate halfway between the distances: 900 + 0.5 × 200 = 1,000 ft. This hypothetical ground-roll estimate does not include obstacle-clearance distance or unlisted corrections.","PHAK Chapter 11: Aircraft Performance",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. A 50-foot increase is one quarter of the 200-foot interval, not halfway.", "Correct. Twenty-five degrees is halfway between the tabulated temperatures, so interpolate halfway between the distances: 900 + 0.5 × 200 = 1,000 ft. This hypothetical ground-roll estimate does not include obstacle-clearance distance or unlisted corrections.", "Incorrect. The hotter endpoint is not the linear estimate at the midpoint."]}),
 curatedQuestion("ppl","private-path-obstacle-distance","Performance","PA.I.F","A takeoff chart supplies both ground roll and total distance over a 50 ft obstacle. A departure has a 50 ft obstacle at the runway end. Which quantity is appropriate for the obstacle comparison?",["Ground roll alone because the airplane lifts off before the end.", "The shorter chart number because it is more conservative.", "The applicable total distance over the obstacle, with the chart’s conditions and corrections."],2,"Ground roll ends at liftoff. The obstacle case also requires the airborne distance to reach the stated height. Use the correct total-distance data and applicable corrections, then assess the actual runway, obstacle and operational margins.","PHAK Chapter 11: Aircraft Performance",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Liftoff before the runway end does not establish clearance over the obstacle.", "Incorrect. Selecting the smaller required distance understates the obstacle case rather than making it conservative.", "Correct. Ground roll ends at liftoff. The obstacle case also requires the airborne distance to reach the stated height. Use the correct total-distance data and applicable corrections, then assess the actual runway, obstacle and operational margins."]}),
 curatedQuestion("ppl","private-path-magneto-master","Aircraft Systems","PA.I.G","A conventional piston airplane uses engine-driven magnetos. Why must a pilot not treat switching the electrical master off as proof that the propeller cannot fire the engine?",["Magnetos can supply ignition independently of the aircraft battery and master switch.", "The master switch electrically locks the crankshaft.", "A battery-powered starter is required for every possible ignition event."],0,"Engine-driven magnetos generate ignition power independently of the battery. A master-off condition does not prove ignition is disabled, especially with an ignition-switch or grounding fault. Follow approved propeller-safety procedures.","PHAK Chapter 7: Aircraft Systems",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Engine-driven magnetos generate ignition power independently of the battery. A master-off condition does not prove ignition is disabled, especially with an ignition-switch or grounding fault. Follow approved propeller-safety procedures.", "Incorrect. The electrical master does not mechanically lock the engine.", "Incorrect. Propeller movement can drive a magneto without use of the electric starter."]}),
 curatedQuestion("ppl","private-path-mixture-altitude","Aircraft Systems","PA.I.G","In a normally aspirated piston airplane with manual mixture control, the pilot climbs without adjusting a full-rich mixture. As air density falls, what mixture tendency should be considered using the POH procedure?",["The mixture necessarily becomes leaner because oxygen concentration rises.", "The mixture can become excessively rich relative to the reduced incoming air.", "Manual mixture control affects only electrical consumption."],1,"At altitude the engine receives less air mass. A full-rich setting can provide excessive fuel relative to that air, reducing efficiency or smoothness. Lean only as specified for the aircraft and operating phase; power, cooling and limits also matter.","PHAK Chapter 7: Aircraft Systems",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Reduced air mass does not inherently supply more oxygen relative to fuel.", "Correct. At altitude the engine receives less air mass. A full-rich setting can provide excessive fuel relative to that air, reducing efficiency or smoothness. Lean only as specified for the aircraft and operating phase; power, cooling and limits also matter.", "Incorrect. Mixture control adjusts the fuel-air relationship, not electrical load."]}),
 curatedQuestion("ppl","private-path-static-block","Flight Instruments","PA.I.G","The static source becomes completely blocked while the pitot inlet remains clear. During a climb, what combination is expected from the altimeter and VSI after the initial transient?",["The altimeter tracks the climb and VSI reads the actual rate.", "Both indications rise indefinitely with pitot pressure.", "The altimeter remains at the blockage altitude and VSI tends toward zero."],2,"Both instruments depend on changing static pressure. A complete blockage traps their pressure reference: the altimeter freezes and the VSI settles toward zero. Use the aircraft’s approved alternate-static procedure and instrument cross-checks.","PHAK Chapter 8: Flight Instruments",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. A blocked source no longer supplies the changing outside pressure needed to track the climb.", "Incorrect. The altimeter and VSI do not use pitot pressure to sense altitude or vertical speed.", "Correct. Both instruments depend on changing static pressure. A complete blockage traps their pressure reference: the altimeter freezes and the VSI settles toward zero. Use the aircraft’s approved alternate-static procedure and instrument cross-checks."]}),
 curatedQuestion("ppl","private-path-co-heater","Aeromedical Factors","PA.I.H","In a piston airplane with an exhaust-shroud cabin heater, occupants develop headache and dizziness soon after heat is selected. Which hazard deserves immediate consideration?",["Carbon monoxide entering through a leaking exhaust/heater system.", "A harmless increase in cabin humidity that excludes other causes.", "Magnetic-compass error caused by cabin temperature."],0,"A heater using heat around an exhaust system can admit carbon monoxide if there is a leak. Headache and dizziness are warning signs, not a diagnosis to dismiss. Follow approved procedures to stop exposure, obtain fresh air and land as appropriate; seek medical help for suspected exposure.","PHAK Chapter 17: Aeromedical Factors",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/19_phak_ch17.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. A heater using heat around an exhaust system can admit carbon monoxide if there is a leak. Headache and dizziness are warning signs, not a diagnosis to dismiss. Follow approved procedures to stop exposure, obtain fresh air and land as appropriate; seek medical help for suspected exposure.", "Incorrect. Humidity does not rule out a potentially serious exhaust-gas exposure.", "Incorrect. Compass error does not explain these symptoms in the heater-related scenario."]}),
 curatedQuestion("ppl","private-path-fatigue-plan","Aeromedical Factors","PA.I.H","A pilot slept very little, has trouble concentrating and plans a demanding solo cross-country. Why is postponing until rested more defensible than relying only on coffee?",["Caffeine proves the pilot’s reaction time has returned to baseline.", "A stimulant does not establish recovery of judgment and performance lost to fatigue.", "Solo flight removes the effects of fatigue because there are no passengers."],1,"Fatigue can impair attention, decisions and coordination. A feeling of temporary alertness does not establish that those functions are restored. Assess fitness for the actual demands and choose rest or a different plan rather than using coffee as a clearance to fly.","PHAK Chapter 17: Fatigue and performance",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/19_phak_ch17.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Feeling more alert is not proof that performance has returned to the pilot’s rested baseline.", "Correct. Fatigue can impair attention, decisions and coordination. A feeling of temporary alertness does not establish that those functions are restored. Assess fitness for the actual demands and choose rest or a different plan rather than using coffee as a clearance to fly.", "Incorrect. Flying solo still requires reliable attention, judgment and coordination."]}),
 curatedQuestion("ppl","private-path-pressure-minimums","Risk Management","PA.I.H","A pilot’s written personal minimum is a 2,500 ft ceiling for this route. The forecast falls to 1,800 ft, and a passenger says the appointment cannot be missed. What response best preserves the purpose of that minimum?",["Lower it immediately because the trip has become important.", "Treat the passenger’s schedule as a weather assessment.", "Reassess the risks and use a delay or ground-travel alternative rather than changing the limit only to fit the schedule."],2,"A preselected minimum is meant to support decisions before schedule pressure grows. New information can justify a considered revision, but external pressure alone is not improved weather or capability. Discuss alternatives and the route’s actual terrain, weather and pilot limitations.","FAA-S-ACS-6C PA.I.H and PA.I.D: external pressure",{"sourceUrl": "https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. Making a limit fit the desired departure defeats its value as a prior decision criterion.", "Incorrect. A deadline does not describe visibility, terrain clearance or the pilot’s capability.", "Correct. A preselected minimum is meant to support decisions before schedule pressure grows. New information can justify a considered revision, but external pressure alone is not improved weather or capability. Discuss alternatives and the route’s actual terrain, weather and pilot limitations."]}),
 curatedQuestion("ppl","private-path-glide-elevation","Emergency Planning","PA.IX","An airplane is at 4,000 ft MSL and a candidate landing area is at 1,800 ft MSL. With a hypothetical 9:1 glide ratio in still air, approximately what horizontal distance does the available height represent before maneuvering allowances?",["3.3 NM.", "5.9 NM.", "19.8 NM."],0,"Available height is 4,000 − 1,800 = 2,200 ft. A 9:1 ratio gives 19,800 horizontal feet; divide by about 6,076 ft/NM to obtain 3.26 NM. Wind, turns, terrain and height for landing reduce the practical reach.","PHAK Chapter 5: Glide ratio",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Correct. Available height is 4,000 − 1,800 = 2,200 ft. A 9:1 ratio gives 19,800 horizontal feet; divide by about 6,076 ft/NM to obtain 3.26 NM. Wind, turns, terrain and height for landing reduce the practical reach.", "Incorrect. Using all 4,000 ft ignores the landing area’s elevation.", "Incorrect. Nineteen-thousand-eight-hundred is feet of horizontal travel, not 19.8 nautical miles."]}),
 curatedQuestion("ppl","private-path-glide-wind","Emergency Planning","PA.IX","At the same airspeed and descent performance, a gliding airplane encounters a headwind toward the selected landing area. What happens to its reach over the ground compared with still air?",["It increases because the headwind adds lift without affecting travel.", "It decreases because less ground distance is covered during the available descent time.", "It stays fixed because lift-to-drag ratio alone determines ground range."],1,"An air-relative glide ratio does not include wind. At the stated airspeed and descent rate, the headwind reduces groundspeed, so the airplane covers less ground before using the available height. Apply aircraft procedures and realistic landing margins.","PHAK Chapter 5: Glide performance",{"sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. The question holds airspeed and descent performance fixed; a headwind reduces groundspeed.", "Correct. An air-relative glide ratio does not include wind. At the stated airspeed and descent rate, the headwind reduces groundspeed, so the airplane covers less ground before using the available height. Apply aircraft procedures and realistic landing margins.", "Incorrect. Lift-to-drag performance describes the air-relative glide, while wind changes its ground track and range."]}),
 curatedQuestion("ppl","private-path-emergency-priority","Emergency Planning","PA.IX","After an engine-power loss, a pilot becomes absorbed in troubleshooting while airspeed decays and the landing area passes behind. What priority has been lost?",["Completing every checklist line before selecting a landing area.", "Transmitting a detailed report before restoring airspeed control.", "Maintaining aircraft control and a usable landing plan while applying the approved procedure."],2,"Troubleshooting must not consume the attention needed to control the airplane and preserve landing options. Maintain the aircraft’s appropriate flight condition, select a viable landing plan and use the approved procedure without allowing checklist fixation to create loss of control.","FAA-S-ACS-6C PA.IX: emergency procedures",{"sourceUrl": "https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf", "difficulty": "applied", "reviewedAt": "2026-10-06", "choiceExplanations": ["Incorrect. A checklist does not justify losing control or passing the viable landing area.", "Incorrect. Communication is important but cannot replace control of the airplane.", "Correct. Troubleshooting must not consume the attention needed to control the airplane and preserve landing options. Maintain the aircraft’s appropriate flight condition, select a viable landing plan and use the approved procedure without allowing checklist fixation to create loss of control."]})
];

// Original review batches approved for publication; independent instructor sign-off remains pending.
const reviewedReleaseQuestions={
  "ppl": [
    {
      "id": "PD-DRAFT-PPL-001",
      "area": "Weight and balance",
      "prompt": "An airplane weighs 2,250 lb at a CG of 40.0 inches. A 150 lb passenger is added at station 73.0 inches. What is the new CG?",
      "options": [
        "41.9 inches.",
        "42.1 inches.",
        "42.2 inches."
      ],
      "correct": 1,
      "explanation": "(2,250 × 40 + 150 × 73) ÷ 2,400 = 42.0625 inches, rounded to 42.1.",
      "reference": "PHAK Chapter 10: Weight and balance computations",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf",
      "standardCode": "PA.I.F",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. This lies forward of the calculated weighted average. Use both the new total moment and the new total weight.",
        "Correct. (2,250 × 40 + 150 × 73) ÷ 2,400 = 42.0625 inches, rounded to 42.1.",
        "Incorrect. This results from dividing the passenger moment by the original weight before adding the resulting shift."
      ]
    },
    {
      "id": "PD-DRAFT-PPL-002",
      "area": "Navigation",
      "prompt": "A true course is 082°. The wind correction angle is 6° right, variation is 9° west, and deviation is 2° east. What magnetic-compass heading should be flown?",
      "options": [
        "095°.",
        "097°.",
        "099°."
      ],
      "correct": 0,
      "explanation": "True heading is 088°. Add west variation to obtain 097° magnetic; subtract east deviation to obtain 095° compass.",
      "reference": "PHAK Chapter 16: Magnetic variation; compass deviation",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
      "standardCode": "PA.I.D",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. True heading is 088°. Add west variation to obtain 097° magnetic; subtract east deviation to obtain 095° compass.",
        "Incorrect. 097° is the magnetic heading before deviation is applied.",
        "Incorrect. 099° adds rather than subtracts east deviation."
      ]
    },
    {
      "id": "PD-DRAFT-PPL-003",
      "area": "Wind components",
      "prompt": "For this exercise, runway heading and wind direction are both referenced to magnetic north. The runway heading is 180° and the wind is from 210° at 20 knots. What are the approximate wind components?",
      "options": [
        "10 knots headwind; 17 knots from the right.",
        "17 knots headwind; 10 knots from the left.",
        "17 knots headwind; 10 knots from the right."
      ],
      "correct": 2,
      "explanation": "The 30° angle gives 20 cos 30° = 17.3 knots headwind and 20 sin 30° = 10 knots crosswind from the right.",
      "reference": "PHAK Chapter 11: Crosswind and headwind component charts",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "PA.I.F",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. This interchanges the sine and cosine components.",
        "Incorrect. The magnitudes are correct, but wind from 210° is from the right of a 180° heading.",
        "Correct. The 30° angle gives 20 cos 30° = 17.3 knots headwind and 20 sin 30° = 10 knots crosswind from the right."
      ]
    },
    {
      "id": "PD-DRAFT-PPL-004",
      "area": "Wake turbulence",
      "prompt": "A light airplane will depart behind a large airplane from the same runway. With adequate runway available, which flight path best reduces exposure to the preceding airplane’s wake?",
      "options": [
        "Lift off at its rotation point and remain on its flight path.",
        "Lift off after its rotation point and remain below its flight path.",
        "Lift off before its rotation point and remain above its flight path."
      ],
      "correct": 2,
      "explanation": "Vortices form at rotation and tend to descend. An earlier liftoff and a path above the preceding climb path reduce exposure; wind and separation still require consideration.",
      "reference": "AIM 7-4: Wake Turbulence",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap7_section_4.html",
      "standardCode": "PA.III",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Following the same path does not provide the vertical avoidance sought.",
        "Incorrect. This places the light airplane in the region where descending vortices may be encountered.",
        "Correct. Vortices form at rotation and tend to descend. An earlier liftoff and a path above the preceding climb path reduce exposure; wind and separation still require consideration."
      ]
    },
    {
      "id": "PD-DRAFT-PPL-005",
      "area": "Hydroplaning",
      "prompt": "An airplane encounters reduced braking on a polished, rubber-coated part of a wet runway. The water film is very thin, speed is below that normally associated with dynamic hydroplaning, and the wheels have not locked. Which form of hydroplaning best fits these conditions?",
      "options": [
        "Viscous hydroplaning.",
        "Reverted rubber hydroplaning.",
        "Dynamic hydroplaning."
      ],
      "correct": 0,
      "explanation": "Viscous hydroplaning can occur with a very thin water film on a smooth or rubber-coated surface, at speeds below dynamic hydroplaning.",
      "reference": "AFH Chapter 9: Hydroplaning",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "PA.I.F",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Viscous hydroplaning can occur with a very thin water film on a smooth or rubber-coated surface, at speeds below dynamic hydroplaning.",
        "Incorrect. Reverted rubber hydroplaning follows heating during a prolonged locked-wheel skid, which is not described.",
        "Incorrect. Dynamic hydroplaning is associated with greater speed and enough water to build a supporting wedge; the stated thin-film, smooth-surface conditions favor viscous hydroplaning."
      ]
    },
    {
      "id": "PD-DRAFT-PPL-006",
      "area": "Pressure altitude",
      "prompt": "Airport elevation is 1,500 feet MSL and the altimeter setting is 29.42 inHg. Using 1,000 feet per inHg, what is the approximate pressure altitude?",
      "options": [
        "1,000 feet.",
        "1,500 feet.",
        "2,000 feet."
      ],
      "correct": 2,
      "explanation": "Pressure altitude is approximately field elevation plus the standard-pressure correction: 1,500 + (29.92 − 29.42) × 1,000 = 2,000 feet. This is pressure altitude, not temperature-corrected density altitude.",
      "reference": "PHAK Chapter 11: Pressure altitude",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "PA.I.F",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. This applies the pressure correction in the wrong direction.",
        "Incorrect. Field elevation equals pressure altitude only when the setting is standard under this approximation.",
        "Correct. Pressure altitude is approximately field elevation plus the standard-pressure correction: 1,500 + (29.92 − 29.42) × 1,000 = 2,000 feet. This is pressure altitude, not temperature-corrected density altitude."
      ]
    },
    {
      "id": "PD-DRAFT-PPL-007",
      "area": "Winds aloft",
      "prompt": "A winds and temperatures aloft forecast at 30,000 feet contains the group 754447. What wind and temperature does it represent?",
      "options": [
        "250° true at 44 knots; −47°C.",
        "250° true at 144 knots; −47°C.",
        "250° true at 144 knots; +47°C."
      ],
      "correct": 1,
      "explanation": "For encoded winds of 100 knots or more, subtract 50 from the direction code and add 100 to the speed. Temperatures above 24,000 feet are negative.",
      "reference": "PHAK Chapter 13: Winds and temperatures aloft forecast",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/15_phak_ch13.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. This decodes the direction but omits the added 100 knots.",
        "Correct. For encoded winds of 100 knots or more, subtract 50 from the direction code and add 100 to the speed. Temperatures above 24,000 feet are negative.",
        "Incorrect. The wind is decoded correctly, but temperatures above 24,000 feet are negative in this forecast encoding."
      ]
    },
    {
      "id": "PD-DRAFT-PPL-008",
      "area": "Atmospheric stability",
      "prompt": "Moist air is forced upward over a broad area. The lifted air is cooler than the surrounding air at the same altitude. Which weather is most consistent with this stable condition?",
      "options": [
        "Towering clouds with strong vertical currents.",
        "Isolated cumulonimbus with gust fronts.",
        "Layered clouds with comparatively smooth air."
      ],
      "correct": 2,
      "explanation": "Cooler lifted air tends to resist further vertical displacement, favoring stratiform clouds and comparatively smooth conditions.",
      "reference": "PHAK Chapter 12: Atmospheric stability; cloud types",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Strong vertical development is associated with instability rather than the stated stable condition.",
        "Incorrect. Cumulonimbus and gust fronts indicate convective activity, not the stable lifting described.",
        "Correct. Cooler lifted air tends to resist further vertical displacement, favoring stratiform clouds and comparatively smooth conditions."
      ]
    },
    {
      "id": "PD-DRAFT-PPL-009",
      "area": "Landing performance",
      "prompt": "A POH landing chart gives 1,250 feet over a 50-foot obstacle for the applicable conditions. Its note requires a 10 percent increase for the specified runway condition. The pilot then applies a separate 20 percent planning margin to the corrected distance. What distance is required by this plan?",
      "options": [
        "1,625 feet.",
        "1,650 feet.",
        "1,750 feet."
      ],
      "correct": 1,
      "explanation": "1,250 × 1.10 × 1.20 = 1,650 feet. These are hypothetical chart instructions, not universal corrections.",
      "reference": "PHAK Chapter 11: Performance charts: landing distance",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "PA.I.F",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 1,625 feet adds both percentages to the original distance rather than applying the margin to the corrected distance.",
        "Correct. 1,250 × 1.10 × 1.20 = 1,650 feet. These are hypothetical chart instructions, not universal corrections.",
        "Incorrect. 1,750 feet is not produced by either correction specified in the stem."
      ]
    },
    {
      "id": "PD-DRAFT-PPL-010",
      "area": "Oxygen and night vision",
      "prompt": "At night, a pilot climbs from near sea level to 8,000 feet MSL without supplemental oxygen. Which visual function can deteriorate before the pilot recognizes other symptoms of hypoxia?",
      "options": [
        "Color vision in bright sunlight.",
        "Dark adaptation and night vision.",
        "Near focusing caused by aging."
      ],
      "correct": 1,
      "explanation": "The retina is sensitive to reduced oxygen; night vision can deteriorate at comparatively modest altitudes.",
      "reference": "PHAK Chapter 17: Hypoxia; night vision",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/19_phak_ch17.pdf",
      "standardCode": "PA.I.H",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Bright-light color vision is not the early night-flight vulnerability being tested.",
        "Correct. The retina is sensitive to reduced oxygen; night vision can deteriorate at comparatively modest altitudes.",
        "Incorrect. Presbyopia is an age-related focusing change, not the principal immediate altitude effect."
      ]
    },
    {
      "id": "PD-B02-PPL-011",
      "area": "Humidity",
      "prompt": "An unsaturated air mass cools without gaining or losing water vapor. Before saturation is reached, what happens to its relative humidity?",
      "options": [
        "It increases.",
        "It decreases.",
        "It remains constant."
      ],
      "correct": 0,
      "explanation": "Cooling reduces the saturation capacity, increasing relative humidity.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 12: Relative humidity",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Cooling reduces the saturation capacity, increasing relative humidity.",
        "Incorrect. Warming, rather than cooling, would reduce relative humidity under these conditions.",
        "Incorrect. Constant water-vapor content does not imply constant relative humidity when temperature changes."
      ]
    },
    {
      "id": "PD-B02-PPL-012",
      "area": "Dew point",
      "prompt": "At the same pressure, air temperature and dew point converge as the air cools. What condition is approached?",
      "options": [
        "Maximum atmospheric pressure.",
        "Saturation of the air.",
        "Minimum water-vapor content."
      ],
      "correct": 1,
      "explanation": "At the dew point, the existing water vapor is sufficient for saturation.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 12: Dew point and saturation",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The temperature–dew-point spread does not identify a pressure maximum.",
        "Correct. At the dew point, the existing water vapor is sufficient for saturation.",
        "Incorrect. Cooling to the dew point does not require removal of the existing water vapor."
      ]
    },
    {
      "id": "PD-B02-PPL-013",
      "area": "Frontal weather",
      "prompt": "Warm, moist air gradually overrides a shallow wedge of colder air. Which cloud pattern is most consistent with stable air in this lifting process?",
      "options": [
        "A broad area of layered clouds.",
        "A narrow line of towering cumulus.",
        "Isolated fair-weather cumulus."
      ],
      "correct": 0,
      "explanation": "Gradual lifting of stable air favors widespread stratiform cloudiness.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 12: Warm fronts; stable air",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Gradual lifting of stable air favors widespread stratiform cloudiness.",
        "Incorrect. Towering convective development requires instability not stated here.",
        "Incorrect. Fair-weather cumulus reflects localized convective lifting rather than this broad overrunning process."
      ]
    },
    {
      "id": "PD-B02-PPL-014",
      "area": "Frost contamination",
      "prompt": "Before departure, a thin, rough frost layer remains on the wing. The airplane is below maximum gross weight. Why does the weight margin fail to resolve the hazard?",
      "options": [
        "The weight margin offsets the loss of maximum lift.",
        "Additional runway restores clean-wing performance.",
        "Frost can alter maximum lift and drag."
      ],
      "correct": 2,
      "explanation": "Rough contamination can change the wing’s lift and drag characteristics even when total weight is below the limit.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 12: Frost; aircraft icing",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Reduced weight can improve some performance, but it does not cancel an unknown aerodynamic degradation or authorize a contaminated-wing departure.",
        "Incorrect. More runway does not restore the clean wing’s stall and climb characteristics.",
        "Correct. Rough contamination can change the wing’s lift and drag characteristics even when total weight is below the limit."
      ]
    },
    {
      "id": "PD-B02-PPL-015",
      "area": "Icing and stall indications",
      "prompt": "Ice changes a wing’s shape while the airplane remains at the same weight. Why may the clean-wing stall-speed marking no longer provide the expected margin?",
      "options": [
        "The contaminated wing must reach a higher critical angle of attack.",
        "The airplane’s certified weight limit automatically increases.",
        "The contaminated wing may stall at a higher speed."
      ],
      "correct": 2,
      "explanation": "Ice can reduce maximum lift coefficient, raising stall speed and altering stall characteristics.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 12: Aircraft icing; effects on lift",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The stall may occur at a lower angle of attack; a higher critical angle is not assured.",
        "Incorrect. Icing does not increase an approved weight limit.",
        "Correct. Ice can reduce maximum lift coefficient, raising stall speed and altering stall characteristics."
      ]
    },
    {
      "id": "PD-B02-PPL-016",
      "area": "Atmospheric lapse rates",
      "prompt": "A rising parcel of unsaturated air expands as surrounding pressure decreases. Its temperature decreases primarily because",
      "options": [
        "the parcel gains water vapor.",
        "energy is used in expansion.",
        "the parcel absorbs heat from the surface."
      ],
      "correct": 1,
      "explanation": "Expansion produces adiabatic cooling without requiring heat transfer to the surroundings.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 12: Adiabatic cooling",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Gaining moisture is not required for this cooling mechanism.",
        "Correct. Expansion produces adiabatic cooling without requiring heat transfer to the surroundings.",
        "Incorrect. Absorbing heat would oppose, rather than explain, the cooling described."
      ]
    },
    {
      "id": "PD-B02-PPL-017",
      "area": "Pressure patterns",
      "prompt": "In the Northern Hemisphere, surface friction causes wind around a low-pressure center to have which general pattern?",
      "options": [
        "Counterclockwise and inward.",
        "Counterclockwise and outward.",
        "Clockwise and outward."
      ],
      "correct": 0,
      "explanation": "Friction reduces the Coriolis balance, allowing flow toward lower pressure while circulation remains counterclockwise.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 12: Wind patterns; friction",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Friction reduces the Coriolis balance, allowing flow toward lower pressure while circulation remains counterclockwise.",
        "Incorrect. Counterclockwise circulation is appropriate, but surface flow converges rather than diverges.",
        "Incorrect. Clockwise outward circulation is associated with a surface high."
      ]
    },
    {
      "id": "PD-B02-PPL-018",
      "area": "Mechanical turbulence",
      "prompt": "A light airplane approaches an airport downwind of a tree line in a strong surface wind. Where is turbulence from the trees most likely?",
      "options": [
        "On their leeward side.",
        "Only above the cloud base.",
        "Only on their windward side."
      ],
      "correct": 0,
      "explanation": "Obstructions disturb the airflow and create turbulent eddies downwind.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 12: Mechanical turbulence",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/14_phak_ch12.pdf",
      "standardCode": "PA.I.C",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Obstructions disturb the airflow and create turbulent eddies downwind.",
        "Incorrect. Mechanical turbulence does not require a cloud base.",
        "Incorrect. Windward effects can occur, but the principal disturbed wake extends leeward."
      ]
    },
    {
      "id": "PD-B02-PPL-019",
      "area": "Groundspeed planning",
      "prompt": "A 120 NM outbound leg has a 90-knot groundspeed. The return leg over the same route has a 120-knot groundspeed. What is the average groundspeed for the complete trip?",
      "options": [
        "103 knots.",
        "105 knots.",
        "110 knots."
      ],
      "correct": 0,
      "explanation": "Total time is 120/90 + 120/120 = 2.333 hours; 240/2.333 ≈ 102.9 knots.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 16: Time, speed, and distance",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf",
      "standardCode": "PA.I.D",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Total time is 120/90 + 120/120 = 2.333 hours; 240/2.333 ≈ 102.9 knots.",
        "Incorrect. The arithmetic mean of the two speeds does not account for the longer time at the slower speed.",
        "Incorrect. 110 knots exceeds the distance-weighted result for these equal-length legs."
      ]
    },
    {
      "id": "PD-B02-PPL-020",
      "area": "Fuel measurement",
      "prompt": "An airplane’s loading calculation requires 180 lb of aviation gasoline. Using 6 lb per US gallon, how many gallons does that represent?",
      "options": [
        "24 gallons.",
        "30 gallons.",
        "36 gallons."
      ],
      "correct": 1,
      "explanation": "At the specified planning density, divide fuel weight by pounds per gallon: 180 lb ÷ 6 lb/US gal = 30 US gallons.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 10: Fuel weight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf",
      "standardCode": "PA.I.F",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 24 gallons would weigh 144 lb at the specified density.",
        "Correct. At the specified planning density, divide fuel weight by pounds per gallon: 180 lb ÷ 6 lb/US gal = 30 US gallons.",
        "Incorrect. 36 gallons would weigh 216 lb."
      ]
    },
    {
      "id": "PD-B02-PPL-021",
      "area": "Course interception",
      "prompt": "An airplane is on the 240° radial of a VOR. In still air, which course leads directly toward the station?",
      "options": [
        "240°.",
        "060°.",
        "330°."
      ],
      "correct": 1,
      "explanation": "A VOR radial identifies the direction from the station; its reciprocal, 060°, leads inbound.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 16: VOR navigation",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf",
      "standardCode": "PA.VI",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 240° leads directly away from the station.",
        "Correct. A VOR radial identifies the direction from the station; its reciprocal, 060°, leads inbound.",
        "Incorrect. 330° is perpendicular to the required inbound course."
      ]
    },
    {
      "id": "PD-B02-PPL-022",
      "area": "Elapsed time",
      "prompt": "An airplane departs a checkpoint at 2350Z and reaches the next checkpoint at 0014Z the following day. The checkpoints are 36 NM apart. What groundspeed was made?",
      "options": [
        "60 knots.",
        "90 knots.",
        "150 knots."
      ],
      "correct": 1,
      "explanation": "The leg crosses midnight: 10 minutes to 0000Z plus 14 minutes afterward is 24 minutes. Groundspeed is 36 NM ÷ (24/60 hour) = 90 knots.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 16: Time and distance",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf",
      "standardCode": "PA.I.D",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 60 knots would require 36 minutes.",
        "Correct. The leg crosses midnight: 10 minutes to 0000Z plus 14 minutes afterward is 24 minutes. Groundspeed is 36 NM ÷ (24/60 hour) = 90 knots.",
        "Incorrect. 150 knots would cover 36 NM in 14.4 minutes."
      ]
    },
    {
      "id": "PD-B02-PPL-023",
      "area": "Position and endurance",
      "prompt": "Two airports are equally distant from an airplane. The groundspeed to airport A would be 80 knots and to airport B would be 120 knots. With the same fuel flow for either course, which airport requires less cruise fuel?",
      "options": [
        "Both require the same amount.",
        "Airport B.",
        "Airport A."
      ],
      "correct": 1,
      "explanation": "At constant fuel flow, the shorter flight time to B uses less cruise fuel.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 16: Diversion planning; time and fuel",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf",
      "standardCode": "PA.I.D",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Equal distance does not imply equal time when groundspeeds differ.",
        "Correct. At constant fuel flow, the shorter flight time to B uses less cruise fuel.",
        "Incorrect. The slower groundspeed increases flight time for the same distance."
      ]
    },
    {
      "id": "PD-B02-PPL-024",
      "area": "Electrical indications",
      "prompt": "An airplane uses a center-zero ammeter showing current into or out of the battery. After a normal start, it initially shows a substantial charge that later approaches zero. What does the change normally indicate?",
      "options": [
        "The alternator output has necessarily fallen to zero.",
        "The battery is being disconnected from every electrical load.",
        "The battery’s starting charge is being replenished."
      ],
      "correct": 2,
      "explanation": "The initial charging current replaces energy used in starting; charging demand decreases as the battery recovers.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Electrical systems; ammeters",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. This ammeter measures battery current, not necessarily total alternator output.",
        "Incorrect. A near-zero battery-current indication does not establish that the electrical system has been disconnected.",
        "Correct. The initial charging current replaces energy used in starting; charging demand decreases as the battery recovers."
      ]
    },
    {
      "id": "PD-B02-PPL-025",
      "area": "Engine detonation",
      "prompt": "A piston engine experiences detonation. Which description identifies that combustion abnormality?",
      "options": [
        "Ignition from a hot spot before the timed spark.",
        "Progressive flame travel after the timed spark.",
        "Explosive combustion after normal ignition begins."
      ],
      "correct": 2,
      "explanation": "Detonation is explosive combustion of part of the charge rather than normal progressive burning.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Detonation and preignition",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. This is preignition, a distinct abnormal condition that can coexist with detonation.",
        "Incorrect. This describes the normal combustion process rather than detonation.",
        "Correct. Detonation is explosive combustion of part of the charge rather than normal progressive burning."
      ]
    },
    {
      "id": "PD-B02-PPL-026",
      "area": "Preignition",
      "prompt": "A glowing deposit ignites the fuel-air mixture before the normal spark. Which condition is present?",
      "options": [
        "Progressive burning from the timed spark.",
        "Ignition before the timed spark.",
        "Explosive burning after normal ignition begins."
      ],
      "correct": 1,
      "explanation": "A glowing deposit can start combustion before the scheduled spark.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Detonation and preignition",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Normal ignition begins with the timed spark, which the stem says has not yet occurred.",
        "Correct. A glowing deposit can start combustion before the scheduled spark.",
        "Incorrect. This describes detonation rather than the defining early ignition in the stem."
      ]
    },
    {
      "id": "PD-B02-PPL-027",
      "area": "Ignition checks",
      "prompt": "During a normal magneto check, RPM drops slightly when either magneto is selected individually. Why can this be expected?",
      "options": [
        "Each selection reduces the number of active spark plugs per cylinder.",
        "Each selection closes one-half of the induction system.",
        "Each selection disconnects the engine from the battery."
      ],
      "correct": 0,
      "explanation": "Dual ignition improves combustion; operating on one magneto commonly produces a modest RPM loss within the aircraft’s limits.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Ignition systems",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Dual ignition improves combustion; operating on one magneto commonly produces a modest RPM loss within the aircraft’s limits.",
        "Incorrect. Magneto selection does not close the induction system.",
        "Incorrect. Magnetos generate their own ignition energy; battery disconnection is not the reason for the normal drop."
      ]
    },
    {
      "id": "PD-B02-PPL-028",
      "area": "Oil-system indications",
      "prompt": "During cruise, oil pressure drops while oil temperature rises. Why is this combination more concerning than a single questionable indication?",
      "options": [
        "The indications may corroborate a lubrication problem.",
        "The pressure decrease establishes increased cooling flow.",
        "The temperature rise distinguishes a faulty pressure gauge."
      ],
      "correct": 0,
      "explanation": "Related abnormal pressure and temperature trends strengthen concern for an actual oil-system problem; follow the approved procedure.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Oil systems",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Related abnormal pressure and temperature trends strengthen concern for an actual oil-system problem; follow the approved procedure.",
        "Incorrect. A lower pressure reading does not establish adequate oil flow or improved cooling.",
        "Incorrect. A temperature rise can support a real lubrication failure; it does not establish gauge error."
      ]
    },
    {
      "id": "PD-B02-PPL-029",
      "area": "Vacuum instruments",
      "prompt": "A conventional airplane’s vacuum-driven attitude and heading indicators begin behaving abnormally, while its electrically powered turn coordinator remains available. Which common failure should be considered?",
      "options": [
        "Loss of static-source pressure changes.",
        "Loss of pitot total pressure.",
        "Loss of gyro-system suction."
      ],
      "correct": 2,
      "explanation": "The affected vacuum gyros share a suction source; the electrically powered turn coordinator provides independent information.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 8: Vacuum systems; gyroscopic instruments",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Static blockage would affect pressure instruments rather than this pair of vacuum gyros.",
        "Incorrect. Pitot pressure supplies airspeed information, not these gyro rotors.",
        "Correct. The affected vacuum gyros share a suction source; the electrically powered turn coordinator provides independent information."
      ]
    },
    {
      "id": "PD-B02-PPL-030",
      "area": "Turn indications",
      "prompt": "In a coordinated level turn, the turn coordinator indicates a standard-rate turn. How long would a complete 360° turn take at that rate?",
      "options": [
        "One minute.",
        "Two minutes.",
        "Three minutes."
      ],
      "correct": 1,
      "explanation": "Standard rate is 3 degrees per second. A full 360-degree turn therefore takes 360 ÷ 3 = 120 seconds, or two minutes.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 8: Turn coordinator",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. One minute requires 6° per second, twice standard rate.",
        "Correct. Standard rate is 3 degrees per second. A full 360-degree turn therefore takes 360 ÷ 3 = 120 seconds, or two minutes.",
        "Incorrect. Three minutes corresponds to 2° per second."
      ]
    },
    {
      "id": "PD-B02-PPL-031",
      "area": "Load and lift",
      "prompt": "An airplane is in steady, unaccelerated level flight. A passenger moves aft without changing total weight, and the airplane is retrimmed within approved limits. Which quantity remains unchanged by the relocation itself?",
      "options": [
        "The moment of the passenger about the datum.",
        "The location of the airplane’s CG.",
        "The airplane’s total weight."
      ],
      "correct": 2,
      "explanation": "Relocation changes distribution and moments, not the total amount of weight aboard.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 10: Weight shifting",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf",
      "standardCode": "PA.I.F",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Moving aft increases the passenger’s arm and moment about the datum.",
        "Incorrect. Moving a passenger changes the CG unless the movement has no longitudinal component.",
        "Correct. Relocation changes distribution and moments, not the total amount of weight aboard."
      ]
    },
    {
      "id": "PD-B02-PPL-032",
      "area": "Aerodynamic drag",
      "prompt": "A pilot lowers the landing gear at a steady airspeed. Maintaining that airspeed and altitude normally requires additional power primarily because",
      "options": [
        "airplane weight increases.",
        "the wing’s span decreases.",
        "parasite drag increases."
      ],
      "correct": 2,
      "explanation": "Exposed gear increases form and interference drag without adding airplane mass.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 5: Parasite drag",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Extending existing gear does not add its weight to the airplane a second time.",
        "Incorrect. Gear extension does not reduce physical wingspan.",
        "Correct. Exposed gear increases form and interference drag without adding airplane mass."
      ]
    },
    {
      "id": "PD-B02-PPL-033",
      "area": "Density and true airspeed",
      "prompt": "At altitude, an airplane maintains the same calibrated airspeed as at a lower altitude. Ignoring compressibility effects, lower air density means its true airspeed is",
      "options": [
        "higher.",
        "unchanged.",
        "lower."
      ],
      "correct": 0,
      "explanation": "For the same dynamic pressure and calibrated speed, lower density requires greater true airspeed.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 8: Types of airspeed",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf",
      "standardCode": "PA.I.F",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. For the same dynamic pressure and calibrated speed, lower density requires greater true airspeed.",
        "Incorrect. Calibrated airspeed and TAS are not equal at every density.",
        "Incorrect. Lower TAS would reduce dynamic pressure further."
      ]
    },
    {
      "id": "PD-B02-PPL-034",
      "area": "Longitudinal control",
      "prompt": "A conventional elevator is deflected upward. What initial aerodynamic effect produces the intended nose-up pitching moment?",
      "options": [
        "A tail-force change producing a nose-up moment.",
        "A rudder-force change producing a yaw moment.",
        "An aileron-force change producing a roll moment."
      ],
      "correct": 0,
      "explanation": "Elevator deflection changes horizontal-tail force and the pitching moment about the CG.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 6: Elevator",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/08_phak_ch6.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Elevator deflection changes horizontal-tail force and the pitching moment about the CG.",
        "Incorrect. Rudder primarily controls yaw; this does not identify the elevator’s pitch mechanism.",
        "Incorrect. Ailerons primarily control roll; this does not identify the elevator’s pitch mechanism."
      ]
    },
    {
      "id": "PD-B02-PPL-035",
      "area": "Wing design",
      "prompt": "Two wings have the same area and support the same lift at the same dynamic pressure. The wing with greater aspect ratio generally has",
      "options": [
        "A lower required lift coefficient.",
        "Less required lift.",
        "Less induced drag."
      ],
      "correct": 2,
      "explanation": "Greater aspect ratio generally reduces induced drag for the same lift and dynamic pressure, other factors comparable.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 5: Aspect ratio; induced drag",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Equal lift, area, and dynamic pressure require equal lift coefficient; aspect ratio changes induced-drag efficiency.",
        "Incorrect. The stem requires the same lift from both wings.",
        "Correct. Greater aspect ratio generally reduces induced drag for the same lift and dynamic pressure, other factors comparable."
      ]
    },
    {
      "id": "PD-B02-PPL-036",
      "area": "Wake drift",
      "prompt": "A large airplane’s wake descends toward a runway in a light crosswind. Why can the upwind vortex remain near the runway longer than expected?",
      "options": [
        "The upwind vortex is forced to rise above the generating airplane.",
        "Crosswind eliminates the circulation of both vortices.",
        "Crosswind can oppose its normal outward motion."
      ],
      "correct": 2,
      "explanation": "A light crosswind can retard the upwind vortex’s lateral movement while carrying the downwind vortex away.",
      "reference": "AIM Chapter 7, Section 4: Vortex behavior; crosswind effects",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap7_section_4.html",
      "standardCode": "PA.III",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The stated drift mechanism does not require the vortex to rise above its source.",
        "Incorrect. A light crosswind does not eliminate wake circulation.",
        "Correct. A light crosswind can retard the upwind vortex’s lateral movement while carrying the downwind vortex away."
      ]
    },
    {
      "id": "PD-B02-PPL-037",
      "area": "Navigation error",
      "prompt": "After flying 30 NM from a known departure point, an airplane is 3 NM right of its intended track. Using the 1-in-60 approximation, what heading change would approximately regain the destination track in the next 30 NM, with the same wind?",
      "options": [
        "6° left.",
        "12° left.",
        "18° left."
      ],
      "correct": 1,
      "explanation": "Track error is about 6°. An additional 6° intercept angle over an equal distance gives about 12° left from the old heading.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 16: Pilotage and dead reckoning; course correction",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf",
      "standardCode": "PA.I.D",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. About 6° left corrects the accumulated drift but would approximately parallel the intended track.",
        "Correct. Track error is about 6°. An additional 6° intercept angle over an equal distance gives about 12° left from the old heading.",
        "Incorrect. 18° overcorrects the stated equal-distance recovery estimate."
      ]
    },
    {
      "id": "PD-B02-PPL-038",
      "area": "Power and airspeed",
      "prompt": "In steady level flight, thrust equals drag. The pilot increases power and allows airspeed to stabilize at a higher value while maintaining altitude. At the new steady condition,",
      "options": [
        "Drag remains greater than thrust.",
        "Thrust remains greater than drag.",
        "Thrust again equals drag."
      ],
      "correct": 2,
      "explanation": "At the new steady speed there is no continuing longitudinal acceleration, so the forces balance.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 5: Four forces; equilibrium",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "PA.I.G",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. This describes deceleration, not the stated stabilized condition.",
        "Incorrect. This describes continued acceleration, not the stated stabilized condition.",
        "Correct. At the new steady speed there is no continuing longitudinal acceleration, so the forces balance."
      ]
    },
    {
      "id": "PD-B02-PPL-039",
      "area": "Risk reassessment",
      "prompt": "A pilot makes a conservative departure decision using an early forecast. Before departure, a new report shows lower visibility along the route. Which action best applies a continuing decision process?",
      "options": [
        "Reassess the plan using the new information.",
        "Compare the report only after reaching the affected area.",
        "Retain the plan because the original decision was conservative."
      ],
      "correct": 0,
      "explanation": "A sound initial decision must be revisited when relevant conditions change.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 2: Continuous risk assessment; 3P process",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/04_phak_ch2.pdf",
      "standardCode": "PA.I.H",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. A sound initial decision must be revisited when relevant conditions change.",
        "Incorrect. Waiting until exposure reduces options without improving the information.",
        "Incorrect. A conservative decision based on old conditions does not establish acceptability under new conditions."
      ]
    },
    {
      "id": "PD-B02-PPL-040",
      "area": "Visual limitations",
      "prompt": "At night, a pilot looks directly at a faint, stationary light and loses sight of it, but sees it again when looking slightly to one side. What explains this?",
      "options": [
        "Off-center viewing increases the light’s actual intensity.",
        "Off-center viewing brings the image onto rod-rich retina.",
        "Direct viewing places the image on the optic nerve."
      ],
      "correct": 1,
      "explanation": "Rods outside the central fovea are more effective for detecting dim light.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 17: Night vision; off-center viewing",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/19_phak_ch17.pdf",
      "standardCode": "PA.I.H",
      "standardDoc": "FAA-S-ACS-6C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ppl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The technique changes retinal reception, not the light emitted by the source.",
        "Correct. Rods outside the central fovea are more effective for detecting dim light.",
        "Incorrect. The central point of gaze is not the optic-disc blind spot."
      ]
    }
  ],
  "ira": [
    {
      "id": "PD-DRAFT-IRA-001",
      "area": "Alternate planning",
      "prompt": "For a Part 91 airplane flight, the destination has a published instrument approach. From one hour before to one hour after the ETA, the forecast ceiling is exactly 2,000 feet above airport elevation and visibility is exactly 3 statute miles. Under 14 CFR 91.169(b), is an alternate required by this forecast?",
      "options": [
        "Yes; an approach must permit a 600-foot ceiling.",
        "Yes; both values must exceed the stated thresholds.",
        "No; both values meet the stated thresholds."
      ],
      "correct": 2,
      "explanation": "Both conditions are met throughout the specified period. This addresses the regulatory alternate requirement, not the prudence of extra options.",
      "reference": "14 CFR 91.169: Paragraph (b)(2)(i)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.169",
      "standardCode": "IR.I.C",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 600–2 concerns certain alternate minima, not this destination exemption.",
        "Incorrect. The regulation uses at least 2,000 feet and at least 3 statute miles, not values strictly greater than those thresholds.",
        "Correct. Both conditions are met throughout the specified period. This addresses the regulatory alternate requirement, not the prudence of extra options."
      ]
    },
    {
      "id": "PD-DRAFT-IRA-002",
      "area": "Holding timing",
      "prompt": "An airplane is established in a conventional timed hold at 10,000 feet MSL. The desired inbound leg is one minute. The last inbound leg took 75 seconds after a 60-second outbound leg. With unchanged wind and technique, approximately how long should the next outbound leg be?",
      "options": [
        "45 seconds.",
        "60 seconds.",
        "75 seconds."
      ],
      "correct": 0,
      "explanation": "Shorten the outbound leg by the 15-second inbound excess as an initial correction, then assess the result.",
      "reference": "AIM 5-3-8: Holding: timing",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "IR.III",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Shorten the outbound leg by the 15-second inbound excess as an initial correction, then assess the result.",
        "Incorrect. Repeating the same timing under unchanged conditions does not correct the long inbound leg.",
        "Incorrect. Lengthening the outbound leg would increase the inbound timing error."
      ]
    },
    {
      "id": "PD-DRAFT-IRA-003",
      "area": "STAR restrictions",
      "prompt": "ATC clears an airplane along a STAR and instructs it to maintain 11,000 feet. A fix is marked EXPECT 7,000. No descent clearance is issued. What altitude should be maintained at that fix?",
      "options": [
        "Any altitude between 7,000 and 11,000 feet.",
        "7,000 feet because the STAR was assigned.",
        "11,000 feet until a descent clearance is received."
      ],
      "correct": 2,
      "explanation": "Maintain the assigned altitude; the EXPECT annotation does not authorize descent.",
      "reference": "AIM 5-4-1: Standard Terminal Arrival procedures",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_4.html",
      "standardCode": "IR.V",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The STAR does not provide a discretionary altitude band in this clearance.",
        "Incorrect. An EXPECT altitude is planning information unless issued as a clearance.",
        "Correct. Maintain the assigned altitude; the EXPECT annotation does not authorize descent."
      ]
    },
    {
      "id": "PD-DRAFT-IRA-004",
      "area": "VOR checks",
      "prompt": "Two independent VOR systems sharing a common antenna are checked against each other while tuned to the same VOR. With the CDI centered, one indicates 084° FROM and the other 089° FROM. Considering only this comparison, does the check satisfy 14 CFR 91.171(c)?",
      "options": [
        "No; the indications differ by more than 4°.",
        "No; independent receivers must have separate antennas.",
        "Yes; each indication is within 6° of the other."
      ],
      "correct": 0,
      "explanation": "The difference is 5°, which exceeds the 4° limit for this method.",
      "reference": "14 CFR 91.171: Paragraph (c)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.171",
      "standardCode": "IR.II",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The difference is 5°, which exceeds the 4° limit for this method.",
        "Incorrect. The regulation permits a dual system independent except for the antenna.",
        "Incorrect. The applicable dual-system comparison tolerance is 4°, not the 6° airborne-check tolerance."
      ]
    },
    {
      "id": "PD-DRAFT-IRA-005",
      "area": "Cruise clearances",
      "prompt": "ATC issues \"CRUISE SIX THOUSAND.\" The pilot descends below 6,000 feet and reports leaving that altitude. Before climbing back to 6,000 feet, the pilot must",
      "options": [
        "return to the original altitude without advising ATC.",
        "obtain a further ATC clearance.",
        "cancel IFR before beginning the climb."
      ],
      "correct": 1,
      "explanation": "Once a descent from an altitude in the cruise block is reported, return to that altitude requires clearance.",
      "reference": "AIM 4-4-3: Clearance items: cruise",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_4.html",
      "standardCode": "IR.III",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The reported descent relinquishes the altitude above; the original cruise clearance no longer authorizes that return.",
        "Correct. Once a descent from an altitude in the cruise block is reported, return to that altitude requires clearance.",
        "Incorrect. Cancellation is not required; a further IFR clearance is the appropriate authorization."
      ]
    },
    {
      "id": "PD-DRAFT-IRA-006",
      "area": "Minimum crossing altitudes",
      "prompt": "On a hypothetical airway, the MEA rises from 5,000 to 8,000 feet at a fix with a published MCA of 7,000 feet eastbound. With no contrary ATC clearance, an eastbound airplane approaching at 5,000 feet should",
      "options": [
        "cross at or above 7,000 feet and continue to the new MEA.",
        "cross at 8,000 feet because the MCA replaces the new MEA.",
        "cross at 5,000 feet, then begin the climb."
      ],
      "correct": 0,
      "explanation": "The MCA governs crossing height; the new MEA remains applicable beyond the fix, with the climb continued as required.",
      "reference": "AIM 5-3-4: Airway and route system: minimum crossing altitude",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "IR.V",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The MCA governs crossing height; the new MEA remains applicable beyond the fix, with the climb continued as required.",
        "Incorrect. Crossing at 8,000 feet may satisfy both, but the statement incorrectly treats the MCA as a replacement for the MEA.",
        "Incorrect. The published MCA requires the airplane to reach at least 7,000 feet before crossing eastbound."
      ]
    },
    {
      "id": "PD-DRAFT-IRA-007",
      "area": "Lost communications",
      "prompt": "An IFR airplane remains in IMC after two-way radio failure. Its last assigned altitude is 5,000 feet; ATC advised it to expect 7,000 feet on this segment. The minimum IFR altitude for the segment is 6,000 feet. Under 14 CFR 91.185(c)(2), which altitude applies?",
      "options": [
        "6,000 feet.",
        "5,000 feet.",
        "7,000 feet."
      ],
      "correct": 2,
      "explanation": "Use the highest of the assigned, minimum IFR, and expected altitudes for the segment.",
      "reference": "14 CFR 91.185: Paragraph (c)(2)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.185",
      "standardCode": "IR.VII",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The minimum IFR altitude is a floor, but the expected altitude is higher.",
        "Incorrect. The assigned altitude is one comparison, but it is lower than the expected and minimum IFR altitudes.",
        "Correct. Use the highest of the assigned, minimum IFR, and expected altitudes for the segment."
      ]
    },
    {
      "id": "PD-DRAFT-IRA-008",
      "area": "Approach clearances",
      "prompt": "An airplane is radar vectored to the final approach course and cleared for the approach. No procedure turn is specifically authorized. Under 14 CFR 91.175(j), the pilot should",
      "options": [
        "proceed without a procedure turn.",
        "fly the procedure turn if one is depicted.",
        "hold at the IAF before proceeding inbound."
      ],
      "correct": 0,
      "explanation": "A procedure turn is not authorized in this circumstance unless ATC clears it.",
      "reference": "14 CFR 91.175: Paragraph (j)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.175",
      "standardCode": "IR.VI",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. A procedure turn is not authorized in this circumstance unless ATC clears it.",
        "Incorrect. A depicted turn does not override the restriction when radar vectors to final are provided.",
        "Incorrect. No holding instruction is given; the approach clearance and vectors do not imply a hold."
      ]
    },
    {
      "id": "PD-DRAFT-IRA-009",
      "area": "Radar weather limitations",
      "prompt": "An airborne weather-radar display shows a strong precipitation return followed by an area with little return directly behind it. Why should that dark area not be treated as a clear passage?",
      "options": [
        "A dark area establishes that precipitation intensity has fallen to zero.",
        "The radar beam may have been attenuated by the nearer precipitation.",
        "The display shows turbulence intensity independently of precipitation."
      ],
      "correct": 1,
      "explanation": "Strong precipitation can attenuate the beam and conceal additional weather behind it.",
      "reference": "AIM 7-1: Thunderstorms; weather radar",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap7_section_1.html",
      "standardCode": "IR.V",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Weak or absent return does not prove an absence of hazardous weather when attenuation is possible.",
        "Correct. Strong precipitation can attenuate the beam and conceal additional weather behind it.",
        "Incorrect. Weather radar primarily detects precipitation; return intensity is not a direct independent measure of all turbulence."
      ]
    },
    {
      "id": "PD-DRAFT-IRA-010",
      "area": "Approach visibility",
      "prompt": "At DA on a straight-in ILS, the runway threshold is distinctly visible and the airplane is in a position for a normal descent to landing. Flight visibility is below the published minimum. What action is required?",
      "options": [
        "Continue if the threshold remains visible.",
        "Descend until the visibility can be reassessed.",
        "Execute the appropriate missed approach."
      ],
      "correct": 2,
      "explanation": "All applicable conditions of 91.175(c) must be satisfied. The visibility condition is not met.",
      "reference": "14 CFR 91.175: Paragraphs (c)(2) and (e)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.175",
      "standardCode": "IR.VI",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A qualifying visual reference does not eliminate the flight-visibility requirement.",
        "Incorrect. The required conditions must exist before descent below DA; further descent to reassess is not authorized.",
        "Correct. All applicable conditions of 91.175(c) must be satisfied. The visibility condition is not met."
      ]
    },
    {
      "id": "PD-B02-IRA-011",
      "area": "VOR accuracy",
      "prompt": "At a certified airborne VOR checkpoint, a receiver shows an error of 5°. Considering only the permitted error for this check method, is the indication acceptable for IFR use?",
      "options": [
        "No; airborne checks require zero error.",
        "Yes; it is within the 6° airborne tolerance.",
        "No; it exceeds the 4° airborne tolerance."
      ],
      "correct": 1,
      "explanation": "An approved airborne checkpoint permits an error of no more than 6°.",
      "reference": "14 CFR 91.171: Paragraph (b)(3)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.171",
      "standardCode": "IR.II",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The regulation provides a tolerance; it does not require an exact zero reading.",
        "Correct. An approved airborne checkpoint permits an error of no more than 6°.",
        "Incorrect. 4° is associated with specified ground-check methods, not this airborne checkpoint."
      ]
    },
    {
      "id": "PD-B02-IRA-012",
      "area": "VOR records",
      "prompt": "A pilot completes an otherwise satisfactory VOR operational check. Which record entry meets the information requirement of 14 CFR 91.171(d)?",
      "options": [
        "Date, place, bearing error, and signature.",
        "Date, receiver serial number, and route.",
        "Place, tachometer time, and fuel quantity."
      ],
      "correct": 0,
      "explanation": "The rule specifically requires date, place, bearing error, and the checking person’s signature in an appropriate record.",
      "reference": "14 CFR 91.171: Paragraph (d)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.171",
      "standardCode": "IR.II",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The rule specifically requires date, place, bearing error, and the checking person’s signature in an appropriate record.",
        "Incorrect. These details omit required place, bearing error, and signature information.",
        "Incorrect. These details do not document the required check result and person."
      ]
    },
    {
      "id": "PD-B02-IRA-013",
      "area": "Alternate minima",
      "prompt": "An airplane’s proposed alternate has an available ILS and no nonstandard alternate minima apply. Under the standard Part 91 precision-approach alternate minima, which forecast meets the ceiling and visibility requirement at the alternate ETA?",
      "options": [
        "800 feet and 1 SM.",
        "600 feet and 2 SM.",
        "500 feet and 3 SM."
      ],
      "correct": 1,
      "explanation": "The standard precision alternate minima are 600 feet and 2 statute miles, subject to the rule’s applicability and procedure availability.",
      "reference": "14 CFR 91.169: Paragraph (c)(1)(i)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.169",
      "standardCode": "IR.I.C",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The ceiling is sufficient but visibility is below 2 statute miles.",
        "Correct. The standard precision alternate minima are 600 feet and 2 statute miles, subject to the rule’s applicability and procedure availability.",
        "Incorrect. The visibility is sufficient but the ceiling is below 600 feet."
      ]
    },
    {
      "id": "PD-B02-IRA-014",
      "area": "Alternate without an approach",
      "prompt": "An airplane alternate has no published instrument approach. Under Part 91, what forecast condition is required at its ETA?",
      "options": [
        "Weather permitting descent from the MEA, approach, and landing under basic VFR.",
        "A ceiling of 800 feet and visibility of 2 SM.",
        "Weather permitting a contact approach from the MEA."
      ],
      "correct": 0,
      "explanation": "The forecast must permit descent from the MEA, approach, and landing under basic VFR conditions.",
      "reference": "14 CFR 91.169: Paragraph (c)(2)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.169",
      "standardCode": "IR.I.C",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The forecast must permit descent from the MEA, approach, and landing under basic VFR conditions.",
        "Incorrect. 800–2 is the standard for a qualifying nonprecision approach, not a no-approach airport.",
        "Incorrect. A contact approach is not the no-published-approach exception in this rule."
      ]
    },
    {
      "id": "PD-B02-IRA-015",
      "area": "IFR fuel",
      "prompt": "For a Part 91 airplane flight, an alternate is required. Planned fuel must cover flight to the destination, then to the alternate, and then how much additional flight at normal cruising speed?",
      "options": [
        "45 minutes.",
        "60 minutes.",
        "30 minutes."
      ],
      "correct": 0,
      "explanation": "The airplane IFR rule requires an additional 45 minutes after the destination and alternate legs, considering weather and forecasts.",
      "reference": "14 CFR 91.167: Paragraph (a)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.167",
      "standardCode": "IR.I.C",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The airplane IFR rule requires an additional 45 minutes after the destination and alternate legs, considering weather and forecasts.",
        "Incorrect. 60 minutes may be a chosen margin but is not this rule’s stated minimum.",
        "Incorrect. 30 minutes is not the airplane IFR reserve specified here."
      ]
    },
    {
      "id": "PD-B02-IRA-016",
      "area": "Lost communications in VMC",
      "prompt": "An airplane on an IFR flight plan experiences radio failure in VMC, and VMC can be maintained. Under 14 CFR 91.185(b), the pilot should",
      "options": [
        "continue under VFR and land as soon as practicable.",
        "continue to the destination under the lost-communications IFR route hierarchy.",
        "immediately descend to the lowest airway altitude."
      ],
      "correct": 0,
      "explanation": "The VFR continuation and practicable landing provision applies when the failure occurs in VFR conditions or those conditions are encountered.",
      "reference": "14 CFR 91.185: Paragraph (b)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.185",
      "standardCode": "IR.VII",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The VFR continuation and practicable landing provision applies when the failure occurs in VFR conditions or those conditions are encountered.",
        "Incorrect. The IMC route hierarchy is not the first instruction for this stated VMC case.",
        "Incorrect. The rule does not direct an arbitrary descent to an airway altitude."
      ]
    },
    {
      "id": "PD-B02-IRA-017",
      "area": "Lost communications route",
      "prompt": "An IFR airplane in IMC loses radio communications. Its last clearance assigns a route; the filed route differs, and ATC has not issued an expected alternative. Under the route priority in 14 CFR 91.185(c)(1), which route applies?",
      "options": [
        "The last assigned route.",
        "The originally filed route.",
        "The shortest route to the destination."
      ],
      "correct": 0,
      "explanation": "The assigned route takes priority over the filed route under the stated conditions.",
      "reference": "14 CFR 91.185: Paragraph (c)(1)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.185",
      "standardCode": "IR.VII",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The assigned route takes priority over the filed route under the stated conditions.",
        "Incorrect. The filed route is a lower-priority fallback when the relevant assigned or expected route provisions do not apply.",
        "Incorrect. The rule does not substitute a general shortest-route choice for the clearance hierarchy."
      ]
    },
    {
      "id": "PD-B02-IRA-018",
      "area": "Lost communications while vectored",
      "prompt": "An airplane in IMC loses radio communications while being radar vectored. What route is specified by 14 CFR 91.185(c)(1)(ii)?",
      "options": [
        "Return directly to the departure airport.",
        "Continue the last vector indefinitely.",
        "Proceed directly to the fix, route, or airway specified in the vector clearance."
      ],
      "correct": 2,
      "explanation": "The rule directs a direct route from the failure point to the fix, route, or airway specified in the vector clearance.",
      "reference": "14 CFR 91.185: Paragraph (c)(1)(ii)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.185",
      "standardCode": "IR.VII",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Returning to departure is not the prescribed general vector-failure route.",
        "Incorrect. A heading vector is not an indefinite lost-communications route.",
        "Correct. The rule directs a direct route from the failure point to the fix, route, or airway specified in the vector clearance."
      ]
    },
    {
      "id": "PD-B02-IRA-019",
      "area": "EFC with communications",
      "prompt": "An airplane is holding with functioning two-way communications. Its expect-further-clearance time arrives, but no onward clearance has been received. The EFC time by itself",
      "options": [
        "cancels the IFR clearance.",
        "authorizes departure along the filed route.",
        "does not authorize leaving the hold."
      ],
      "correct": 2,
      "explanation": "Maintain the applicable clearance and request further clearance; the time is planning information in this circumstance.",
      "reference": "AIM Chapter 5, Section 3: Holding; EFC instructions",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "IR.III",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The EFC time does not cancel the IFR clearance.",
        "Incorrect. An EFC is not an onward clearance when communications remain available.",
        "Correct. Maintain the applicable clearance and request further clearance; the time is planning information in this circumstance."
      ]
    },
    {
      "id": "PD-B02-IRA-020",
      "area": "Holding speed",
      "prompt": "An airplane will hold at 9,000 feet MSL. No special holding-speed restriction is published or assigned. What is the standard maximum holding airspeed?",
      "options": [
        "265 KIAS.",
        "200 KIAS.",
        "230 KIAS."
      ],
      "correct": 2,
      "explanation": "The standard band from 6,001 through 14,000 feet MSL is 230 KIAS.",
      "reference": "AIM Chapter 5, Section 3: 5-3-8: holding airspeeds",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "IR.III",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 265 KIAS applies at 14,001 feet MSL and above.",
        "Incorrect. 200 KIAS applies from the minimum holding altitude through 6,000 feet MSL.",
        "Correct. The standard band from 6,001 through 14,000 feet MSL is 230 KIAS."
      ]
    },
    {
      "id": "PD-B02-IRA-021",
      "area": "Holding fix passage",
      "prompt": "An airplane holds over a VOR rather than a DME fix. In a conventional holding pattern, which indication normally establishes when to begin the outbound turn over the facility?",
      "options": [
        "The first movement of the CDI off center.",
        "The DME reaching an exact zero.",
        "The first complete TO/FROM reversal."
      ],
      "correct": 2,
      "explanation": "The FAA holding guidance uses the first complete TO/FROM reversal for VOR station passage.",
      "reference": "AIM Chapter 5, Section 3: 5-3-8: VOR holding",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "IR.III",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. CDI movement alone can result from course error and does not reliably establish station passage.",
        "Incorrect. DME is slant range and need not reach zero during an overhead passage.",
        "Correct. The FAA holding guidance uses the first complete TO/FROM reversal for VOR station passage."
      ]
    },
    {
      "id": "PD-B02-IRA-022",
      "area": "Outbound timing",
      "prompt": "In a conventional timed hold, outbound timing should begin over or abeam the holding fix, whichever occurs later. If the abeam position cannot be determined, timing begins",
      "options": [
        "when the CDI first centers inbound.",
        "when the outbound turn is completed.",
        "when the inbound turn is started."
      ],
      "correct": 1,
      "explanation": "When abeam cannot be determined, the FAA procedure starts outbound timing on completion of the outbound turn.",
      "reference": "AIM Chapter 5, Section 3: 5-3-8: outbound timing",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "IR.III",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Inbound CDI centering is unrelated to the start of the outbound timing.",
        "Correct. When abeam cannot be determined, the FAA procedure starts outbound timing on completion of the outbound turn.",
        "Incorrect. The inbound turn begins after the outbound leg rather than defining its starting time."
      ]
    },
    {
      "id": "PD-B02-IRA-023",
      "area": "Changeover points",
      "prompt": "A straight airway segment has a charted changeover point that is not midway between its VORs. In normal use, the pilot changes navigation guidance",
      "options": [
        "only after the station behind becomes unusable.",
        "at the charted changeover point.",
        "at the midpoint regardless of the chart."
      ],
      "correct": 1,
      "explanation": "The charted COP accounts for the intended change in navigation guidance.",
      "reference": "AIM Chapter 5, Section 3: 5-3-6: Changeover Points",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "IR.V",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Waiting for signal loss defeats the purpose of the prescribed changeover.",
        "Correct. The charted COP accounts for the intended change in navigation guidance.",
        "Incorrect. The midpoint is a default for some routes, not a replacement for a published COP."
      ]
    },
    {
      "id": "PD-B02-IRA-024",
      "area": "Minimum reception altitude",
      "prompt": "A charted intersection has an MRA above the airway MEA. What additional limitation does the MRA identify?",
      "options": [
        "Altitude required to begin a procedure turn.",
        "Altitude needed to receive the signals defining the fix.",
        "Altitude guaranteeing visual contact with the airport."
      ],
      "correct": 1,
      "explanation": "An MRA addresses reception of navigation signals needed to identify the fix.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: National Airspace System: minimum reception altitude",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "IR.V",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Procedure-turn altitudes are depicted separately.",
        "Correct. An MRA addresses reception of navigation signals needed to identify the fix.",
        "Incorrect. No radio-navigation altitude guarantees visual conditions."
      ]
    },
    {
      "id": "PD-B02-IRA-025",
      "area": "Minimum turning altitude",
      "prompt": "A published minimum turning altitude applies to the intended airway-to-airway turn. When must the airplane be at or above it?",
      "options": [
        "No later than the turn point, through establishment on the next route centerline.",
        "Only after completing the turn.",
        "Only if the turn exceeds 90°."
      ],
      "correct": 0,
      "explanation": "The charted MTA protects the turning maneuver and remains applicable until the following route centerline is joined.",
      "reference": "AIM Chapter 5, Section 3: 5-3-7: Minimum Turning Altitude",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "IR.V",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The charted MTA protects the turning maneuver and remains applicable until the following route centerline is joined.",
        "Incorrect. Reaching it after the turn would not protect the maneuver for which it is specified.",
        "Incorrect. The published restriction applies to the described route combination, not only to turns exceeding a generic angle."
      ]
    },
    {
      "id": "PD-B02-IRA-026",
      "area": "Visual descent point",
      "prompt": "An airplane reaches a published VDP on a nonprecision approach at MDA. No required visual reference is available. What does reaching the VDP authorize?",
      "options": [
        "An immediate turn onto the missed-approach course.",
        "Descent along the charted VDA despite the cloud.",
        "No descent below MDA on that basis alone."
      ],
      "correct": 2,
      "explanation": "The VDP identifies a point for a normal visual descent when the required conditions exist; it is not independent descent authority.",
      "reference": "AIM Chapter 5, Section 4: 5-4-5: visual descent points",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_4.html",
      "standardCode": "IR.VI",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The VDP is not necessarily the MAP and does not authorize an early missed turn.",
        "Incorrect. A VDP does not remove the requirements for descent below MDA.",
        "Correct. The VDP identifies a point for a normal visual descent when the required conditions exist; it is not independent descent authority."
      ]
    },
    {
      "id": "PD-B02-IRA-027",
      "area": "Approach categories",
      "prompt": "An airplane’s normal approach category is based on its prescribed reference speed or the specified multiple of stall speed at maximum certificated landing weight. If an approach is flown faster than the category’s upper limit, the pilot should",
      "options": [
        "retain the lower minima because actual weight is reduced.",
        "reduce the charted visibility to account for the faster approach.",
        "use the higher category’s applicable minima."
      ],
      "correct": 2,
      "explanation": "Higher-speed maneuvering requires the protection associated with the applicable higher category.",
      "reference": "AIM Chapter 5, Section 4: 5-4-7: instrument approach categories",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_4.html",
      "standardCode": "IR.VI",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Reduced weight does not permit ignoring the protection needed for the actual maneuvering speed.",
        "Incorrect. Higher speed is not a basis for lowering visibility minima.",
        "Correct. Higher-speed maneuvering requires the protection associated with the applicable higher category."
      ]
    },
    {
      "id": "PD-B02-IRA-028",
      "area": "Approach timing",
      "prompt": "A nonprecision approach uses timing from the FAF to identify the MAP. The applicable table must be selected using",
      "options": [
        "indicated airspeed on the final segment.",
        "groundspeed on the final segment.",
        "true airspeed before the FAF."
      ],
      "correct": 1,
      "explanation": "Time to cover a charted ground distance depends on groundspeed.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: IFR flight procedures: timed approaches",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "IR.VI",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. IAS does not account for true-air speed and wind effects on progress over the ground.",
        "Correct. Time to cover a charted ground distance depends on groundspeed.",
        "Incorrect. Pre-FAF TAS alone does not establish final-segment groundspeed."
      ]
    },
    {
      "id": "PD-B02-IRA-029",
      "area": "Localizer geometry",
      "prompt": "Two airplanes have the same angular localizer deviation. One is half as far from the localizer antenna as the other. Approximately how does its lateral displacement compare?",
      "options": [
        "Twice as large.",
        "The same.",
        "One-half as large."
      ],
      "correct": 2,
      "explanation": "For the same small angle, lateral displacement is approximately proportional to distance from the antenna.",
      "reference": "AIM Chapter 1, Section 1: 1-1-9: localizer",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html",
      "standardCode": "IR.V",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The closer airplane has the smaller, not larger, displacement.",
        "Incorrect. A fixed angular indication does not imply a fixed lateral distance.",
        "Correct. For the same small angle, lateral displacement is approximately proportional to distance from the antenna."
      ]
    },
    {
      "id": "PD-B02-IRA-030",
      "area": "ILS identification",
      "prompt": "An airplane receives both localizer and glideslope indications, but the localizer identification cannot be verified and a current NOTAM reports the facility out of service. The apparent indications",
      "options": [
        "may be used if the airplane’s VOR check is current.",
        "supersede the NOTAM if both needles center.",
        "are insufficient to establish that the ILS is usable."
      ],
      "correct": 2,
      "explanation": "An out-of-service facility can produce misleading indications; positive identification and status checks remain necessary.",
      "reference": "AIM Chapter 1, Section 1: 1-1-1; 1-1-9: facility status and identification",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html",
      "standardCode": "IR.VI",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A VOR receiver check does not verify the ILS ground facility.",
        "Incorrect. Centered needles do not cancel an out-of-service notice.",
        "Correct. An out-of-service facility can produce misleading indications; positive identification and status checks remain necessary."
      ]
    },
    {
      "id": "PD-B02-IRA-031",
      "area": "GPS integrity",
      "prompt": "A conventional GPS receiver reports that required integrity monitoring is unavailable for the intended operation. Why is an apparently plausible position insufficient?",
      "options": [
        "A displayed position proves that the integrity warning is false.",
        "Position presentation does not establish the required integrity assurance.",
        "Integrity concerns apply only to the magnetic compass."
      ],
      "correct": 1,
      "explanation": "Integrity monitoring assesses whether the navigation solution can be relied upon within the applicable limits.",
      "reference": "AIM Chapter 1, Section 1: GPS; receiver integrity monitoring",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html",
      "standardCode": "IR.II",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A receiver can display a position while the required ability to detect or alert for errors is unavailable.",
        "Correct. Integrity monitoring assesses whether the navigation solution can be relied upon within the applicable limits.",
        "Incorrect. Integrity is directly relevant to satellite navigation."
      ]
    },
    {
      "id": "PD-B02-IRA-032",
      "area": "Approach annunciation",
      "prompt": "Before the FAF, a navigation receiver annunciates LNAV rather than the LPV service level expected in the briefing. Published LNAV minima are available. What must be resolved before continuing using those minima?",
      "options": [
        "The glideslope pointer automatically authorizes LPV minima.",
        "The applicable minima, altitude limits, and procedure must be rechecked.",
        "The expected LPV DA remains controlling."
      ],
      "correct": 1,
      "explanation": "A changed service level requires a reassessment of the actual authorized guidance and minima, equipment limitations, and ability to continue safely.",
      "reference": "AIM Chapter 5, Section 4: RNAV approach minima; pilot briefing",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_4.html",
      "standardCode": "IR.VI",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A displayed vertical cue alone does not establish LPV authorization.",
        "Correct. A changed service level requires a reassessment of the actual authorized guidance and minima, equipment limitations, and ability to continue safely.",
        "Incorrect. An expected service level does not authorize minima the receiver has not provided."
      ]
    },
    {
      "id": "PD-B02-IRA-033",
      "area": "Somatogravic illusion",
      "prompt": "In IMC, rapid acceleration gives a pilot a strong sensation of pitching up although the attitude instruments show the intended attitude. Which response avoids the associated control error?",
      "options": [
        "Maintain instrument-referenced attitude control.",
        "Lower the nose until the sensation disappears.",
        "Use body sensation to reset the attitude indicator."
      ],
      "correct": 0,
      "explanation": "Linear acceleration can create a false pitch sensation; a reliable instrument cross-check is the appropriate reference.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Human factors: somatogravic illusion",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "IR.IV",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Linear acceleration can create a false pitch sensation; a reliable instrument cross-check is the appropriate reference.",
        "Incorrect. Pushing forward solely to cancel the illusion can produce an unintended descent.",
        "Incorrect. Body sensations cannot calibrate an attitude reference in this condition."
      ]
    },
    {
      "id": "PD-B02-IRA-034",
      "area": "Spatial orientation",
      "prompt": "After a slowly developing bank goes unnoticed, a pilot abruptly returns the airplane to level and feels banked in the opposite direction. Which illusion is illustrated?",
      "options": [
        "The leans.",
        "Autokinesis.",
        "Runway-width illusion."
      ],
      "correct": 0,
      "explanation": "An unnoticed gradual bank followed by a sensed correction can leave a false sensation of opposite bank.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Human factors: the leans",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "IR.IV",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. An unnoticed gradual bank followed by a sensed correction can leave a false sensation of opposite bank.",
        "Incorrect. Autokinesis is apparent motion of a stationary light when stared at.",
        "Incorrect. Runway-width illusion concerns visual approach geometry."
      ]
    },
    {
      "id": "PD-B02-IRA-035",
      "area": "Spatial orientation",
      "prompt": "While established in a prolonged turn in IMC, a pilot abruptly moves the head downward and experiences a strong tumbling sensation. What most directly caused it?",
      "options": [
        "A sudden change in runway lighting.",
        "A change in the airplane’s magnetic variation.",
        "Stimulation of multiple semicircular canals during head movement."
      ],
      "correct": 2,
      "explanation": "Head motion during a sustained turn can stimulate canals on different axes and produce a powerful false tumbling sensation.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Human factors: Coriolis illusion",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "IR.IV",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The event is vestibular and need not involve runway lights.",
        "Incorrect. Variation does not produce vestibular stimulation.",
        "Correct. Head motion during a sustained turn can stimulate canals on different axes and produce a powerful false tumbling sensation."
      ]
    },
    {
      "id": "PD-B02-IRA-036",
      "area": "Heading indicators",
      "prompt": "A conventional unslaved heading gyro gradually differs from the magnetic compass during steady flight. With no other fault indicated, what routine action is appropriate?",
      "options": [
        "Periodically realign it using a reliable compass indication.",
        "Apply the difference as a permanent wind correction.",
        "Assume the compass variation has changed by the same amount."
      ],
      "correct": 0,
      "explanation": "Conventional heading gyros precess and require periodic alignment under suitable, stable conditions.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 8: Heading indicator; precession",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf",
      "standardCode": "IR.II",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Conventional heading gyros precess and require periodic alignment under suitable, stable conditions.",
        "Incorrect. A heading-reference error is not a wind-triangle correction.",
        "Incorrect. Gyro drift does not establish a change in local magnetic variation."
      ]
    },
    {
      "id": "PD-B02-IRA-037",
      "area": "Unusual attitudes",
      "prompt": "In a nose-low unusual attitude, airspeed is increasing rapidly. Which general control objective addresses the developing overspeed and descent?",
      "options": [
        "Reduce power and return to controlled flight using the appropriate recovery sequence.",
        "Increase power and hold the bank while raising the nose abruptly.",
        "Maintain power until the altimeter stops unwinding."
      ],
      "correct": 0,
      "explanation": "A nose-low recovery generally includes power reduction, correction of excessive bank, and a smooth pitch recovery within limits; follow aircraft-specific guidance.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Airplane basic flight maneuvers: unusual attitudes",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "IR.IV",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. A nose-low recovery generally includes power reduction, correction of excessive bank, and a smooth pitch recovery within limits; follow aircraft-specific guidance.",
        "Incorrect. Extra power and an abrupt pull in bank can worsen overspeed and load factor.",
        "Incorrect. Waiting for the altitude trend to stop does not control the developing condition."
      ]
    },
    {
      "id": "PD-B02-IRA-038",
      "area": "Vertical-speed indications",
      "prompt": "After a conventional airplane levels off, the VSI briefly continues to indicate a climb before returning toward zero. Why can this occur?",
      "options": [
        "The pitot tube must be blocked.",
        "The instrument uses a calibrated leak that causes a response lag.",
        "The VSI directly measures the airplane’s pitch angle."
      ],
      "correct": 1,
      "explanation": "A conventional VSI senses a pressure-rate difference through a calibrated restriction and can lag a flight-path change.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 8: Vertical speed indicator",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf",
      "standardCode": "IR.II",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A pitot blockage does not explain this normal static-instrument lag.",
        "Correct. A conventional VSI senses a pressure-rate difference through a calibrated restriction and can lag a flight-path change.",
        "Incorrect. Pitch attitude is not the quantity directly measured by the VSI."
      ]
    },
    {
      "id": "PD-B02-IRA-039",
      "area": "Descent planning",
      "prompt": "An airplane must lose 6,000 feet in 24 NM at a groundspeed of 120 knots. Ignoring level-off allowances, what average descent rate is required?",
      "options": [
        "250 ft/min.",
        "500 ft/min.",
        "750 ft/min."
      ],
      "correct": 1,
      "explanation": "At 120 knots, groundspeed is 2 NM/min. The required rate is (6,000/24) × 2 = 500 ft/min.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Descent planning; time and distance",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "IR.I.C",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 250 is the gradient in feet per NM, not the rate per minute.",
        "Correct. At 120 knots, groundspeed is 2 NM/min. The required rate is (6,000/24) × 2 = 500 ft/min.",
        "Incorrect. 750 ft/min exceeds the rate implied by these distance and speed values."
      ]
    },
    {
      "id": "PD-B02-IRA-040",
      "area": "Briefing changes",
      "prompt": "After an approach briefing, ATC assigns a different runway with a different approach. What is the principal reason to review the new procedure before accepting final interception?",
      "options": [
        "The approach clearance removes the need to verify the chart.",
        "The original briefing automatically applies to every approach at the airport.",
        "Its courses, altitudes, minima, and missed approach may differ."
      ],
      "correct": 2,
      "explanation": "A runway change can alter essential guidance and escape planning; create time to verify and brief the actual procedure.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: IFR flight procedures: approach briefing",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "IR.VI",
      "standardDoc": "FAA-S-ACS-8C",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "ira",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. An ATC clearance does not verify the pilot’s chart selection and understanding.",
        "Incorrect. Common airport location does not make distinct procedures interchangeable.",
        "Correct. A runway change can alter essential guidance and escape planning; create time to verify and brief the actual procedure."
      ]
    }
  ],
  "cpl": [
    {
      "id": "PD-DRAFT-CPL-001",
      "area": "Drag and power",
      "prompt": "A propeller airplane is in steady level flight. Available power is unchanged. After slowing below the minimum-power-required speed, why does a further speed reduction require more power to maintain altitude?",
      "options": [
        "Parasite-drag growth increases power required.",
        "The airplane’s weight decreases as speed decreases.",
        "Induced-drag growth increases power required."
      ],
      "correct": 2,
      "explanation": "On the low-speed side of the power curve, increased induced drag causes power required to rise as speed is reduced.",
      "reference": "PHAK Chapter 5: Region of reversed command",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Parasite drag decreases with reduced speed under these conditions.",
        "Incorrect. Weight is not reduced simply by slowing down.",
        "Correct. On the low-speed side of the power curve, increased induced drag causes power required to rise as speed is reduced."
      ]
    },
    {
      "id": "PD-DRAFT-CPL-002",
      "area": "Drag relationships",
      "prompt": "For the same airplane in steady level flight at the same weight, density, and configuration, true airspeed is reduced from 120 to 90 knots. Using the usual induced-drag approximation, induced drag becomes approximately",
      "options": [
        "0.56 times its former value.",
        "1.33 times its former value.",
        "1.78 times its former value."
      ],
      "correct": 2,
      "explanation": "For fixed lift, induced drag varies approximately with 1/V²: (120/90)² ≈ 1.78.",
      "reference": "PHAK Chapter 5: Induced drag",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "CA.VII",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 0.56 is the square of the speed ratio, which describes the opposite trend.",
        "Incorrect. 1.33 uses the inverse speed ratio without squaring it.",
        "Correct. For fixed lift, induced drag varies approximately with 1/V²: (120/90)² ≈ 1.78."
      ]
    },
    {
      "id": "PD-DRAFT-CPL-003",
      "area": "Chandelles",
      "prompt": "During a properly executed chandelle in a single-engine airplane, the second 90° of turn is characterized by",
      "options": [
        "reducing bank while holding pitch attitude approximately constant.",
        "increasing bank while holding pitch attitude constant.",
        "holding bank while reducing pitch attitude to level flight."
      ],
      "correct": 0,
      "explanation": "After maximum pitch attitude is established near the 90° point, bank decreases while pitch is held approximately constant as airspeed decreases.",
      "reference": "AFH Chapter 10: Chandelles",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/11_afh_ch10.pdf",
      "standardCode": "CA.V",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. After maximum pitch attitude is established near the 90° point, bank decreases while pitch is held approximately constant as airspeed decreases.",
        "Incorrect. Bank is reduced toward wings-level during the second half.",
        "Incorrect. Holding bank through the completion does not produce the required wings-level rollout."
      ]
    },
    {
      "id": "PD-DRAFT-CPL-004",
      "area": "Lazy eights",
      "prompt": "In a properly coordinated lazy eight, where does the maximum pitch-up attitude occur relative to the 90° point of the first turn?",
      "options": [
        "At the 90° point.",
        "Before the 90° point.",
        "After the 90° point."
      ],
      "correct": 1,
      "explanation": "Maximum nose-up pitch occurs near the 45° point; pitch then decreases toward level as bank reaches its maximum near 90°.",
      "reference": "AFH Chapter 10: Lazy eights",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/11_afh_ch10.pdf",
      "standardCode": "CA.V",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Near 90°, pitch attitude is passing through level, not reaching maximum nose-up.",
        "Correct. Maximum nose-up pitch occurs near the 45° point; pitch then decreases toward level as bank reaches its maximum near 90°.",
        "Incorrect. After 90°, the nose continues below the horizon before recovering during the latter part of the turn."
      ]
    },
    {
      "id": "PD-DRAFT-CPL-005",
      "area": "Turbocharger limits",
      "prompt": "A turbocharged piston engine maintains its selected manifold pressure during a climb until the wastegate is fully closed. Above that point, at unchanged RPM and full available throttle, manifold pressure begins to fall. Which limit has been reached?",
      "options": [
        "The airplane’s absolute ceiling at that weight.",
        "The propeller’s maximum governing altitude.",
        "The engine’s critical altitude for that power setting."
      ],
      "correct": 2,
      "explanation": "Critical altitude is the altitude above which the turbocharger can no longer maintain the selected rated pressure or power under the applicable conditions.",
      "reference": "PHAK Chapter 7: Turbocharging systems: critical altitude",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "CA.I.G",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The airplane may still climb; falling manifold pressure does not establish zero climb capability.",
        "Incorrect. The stated pressure change is a turbocharging limitation, not a propeller governing-altitude limit.",
        "Correct. Critical altitude is the altitude above which the turbocharger can no longer maintain the selected rated pressure or power under the applicable conditions."
      ]
    },
    {
      "id": "PD-DRAFT-CPL-006",
      "area": "Single-engine speeds",
      "prompt": "In a normally aspirated conventional twin, increasing density altitude can reduce both VMC and single-engine climb capability. Why can these trends occur together?",
      "options": [
        "Reduced air density increases rudder force and available power.",
        "Reduced operating-engine power lowers both asymmetric yaw and excess power.",
        "Reduced VMC guarantees increased single-engine climb performance."
      ],
      "correct": 1,
      "explanation": "Less engine power can reduce the asymmetric yaw requiring rudder while also reducing the power available for climbing. Lower VMC does not imply improved climb.",
      "reference": "AFH Chapter 13: VMC; effect of density altitude",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/14_afh_ch13.pdf",
      "standardCode": "CA.X",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Lower density does not increase normally aspirated engine power.",
        "Correct. Less engine power can reduce the asymmetric yaw requiring rudder while also reducing the power available for climbing. Lower VMC does not imply improved climb.",
        "Incorrect. Directional-control speed and climb capability describe different limitations."
      ]
    },
    {
      "id": "PD-DRAFT-CPL-007",
      "area": "Best angle and best rate",
      "prompt": "For a propeller airplane, the speed for maximum climb angle is associated with maximum excess thrust, while the speed for maximum climb rate is associated with",
      "options": [
        "maximum lift coefficient.",
        "maximum excess power.",
        "minimum parasite drag."
      ],
      "correct": 1,
      "explanation": "Climb rate is proportional to excess power; climb angle is related to excess thrust.",
      "reference": "PHAK Chapter 11: Climb performance: excess thrust and power",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Maximum lift coefficient corresponds to a stall boundary, not the general maximum-rate condition.",
        "Correct. Climb rate is proportional to excess power; climb angle is related to excess thrust.",
        "Incorrect. Minimum parasite drag alone excludes induced drag and available power."
      ]
    },
    {
      "id": "PD-DRAFT-CPL-008",
      "area": "Figure-based loading",
      "prompt": "Refer to PHAK Chapter 10, Figure 10-10. Starting with the total loading shown, approximately how much baggage at station 105 must be removed to move the CG to 73.5 inches? Treat 73.5 inches as a calculation target, not an asserted approved limit.",
      "options": [
        "8.5 lb.",
        "28.3 lb.",
        "54.5 lb."
      ],
      "correct": 1,
      "explanation": "Solve (122,086 − 105x) ÷ (1,648.9 − x) = 73.5. This gives x = 28.31 lb.",
      "reference": "PHAK Chapter 10: Figure 10-10; removal of weight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Using the baggage arm alone ignores the change in total weight when baggage is removed.",
        "Correct. Solve (122,086 − 105x) ÷ (1,648.9 − x) = 73.5. This gives x = 28.31 lb.",
        "Incorrect. This removal exceeds that needed to reach the stated target. Verify the resulting weight and CG against actual limits before flight."
      ],
      "figureRef": {
        "supplement": "Pilot’s Handbook of Aeronautical Knowledge, Chapter 10",
        "figure": "10-10",
        "url": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10"
      }
    },
    {
      "id": "PD-DRAFT-CPL-009",
      "area": "Accelerated stalls",
      "prompt": "During a smooth pullout from a dive, an airplane stalls at an indicated airspeed above its wings-level, unaccelerated stall speed. Which condition caused the stall?",
      "options": [
        "The airplane descended through a lower density altitude.",
        "The airplane exceeded its maximum operating speed.",
        "The airplane exceeded its critical angle of attack."
      ],
      "correct": 2,
      "explanation": "Increased load factor raises the speed at which the critical angle of attack can be reached.",
      "reference": "PHAK Chapter 5: Accelerated stalls",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "CA.VII",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A change in density altitude does not establish the critical angle of attack.",
        "Incorrect. An overspeed and a stall are different limits; the stem does not establish an overspeed.",
        "Correct. Increased load factor raises the speed at which the critical angle of attack can be reached."
      ]
    },
    {
      "id": "PD-DRAFT-CPL-010",
      "area": "Performance interpolation",
      "prompt": "For a hypothetical performance table at the applicable weight and altitude, takeoff distance is 1,800 feet at 20°C and 2,200 feet at 40°C. The table authorizes linear interpolation. What distance applies at 35°C, before other corrections?",
      "options": [
        "1,900 feet.",
        "2,000 feet.",
        "2,100 feet."
      ],
      "correct": 2,
      "explanation": "35°C is three-fourths of the interval: 1,800 + 0.75(400) = 2,100 feet.",
      "reference": "PHAK Chapter 11: Interpolation of performance data",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 1,900 feet corresponds to 25°C under the stated interpolation.",
        "Incorrect. 2,000 feet corresponds to 30°C.",
        "Correct. 35°C is three-fourths of the interval: 1,800 + 0.75(400) = 2,100 feet."
      ]
    },
    {
      "id": "PD-B02-CPL-011",
      "area": "Excess power",
      "prompt": "At a stated flight condition, power available is 180 hp and power required for level flight is 140 hp. If weight and required power remain unchanged, raising available power to 200 hp increases excess power by",
      "options": [
        "14 percent.",
        "50 percent.",
        "100 percent."
      ],
      "correct": 1,
      "explanation": "Excess power rises from 40 to 60 hp, a 50 percent increase.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 11: Climb performance; excess power",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 14 percent compares the change with required power rather than original excess power.",
        "Correct. Excess power rises from 40 to 60 hp, a 50 percent increase.",
        "Incorrect. Doubling excess power would require 80 hp excess, not 60."
      ]
    },
    {
      "id": "PD-B02-CPL-012",
      "area": "Angle versus rate",
      "prompt": "A headwind increases while an airplane maintains the same airspeed, rate of climb, and performance through the air. What happens to its climb gradient relative to the ground?",
      "options": [
        "It increases.",
        "It decreases.",
        "It remains constant."
      ],
      "correct": 0,
      "explanation": "The same height is gained while covering less ground distance.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 11: Climb angle; wind effect",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The same height is gained while covering less ground distance.",
        "Incorrect. A lower groundspeed increases rather than decreases feet gained per ground mile.",
        "Incorrect. Ground-relative gradient depends on groundspeed as well as climb rate."
      ]
    },
    {
      "id": "PD-B02-CPL-013",
      "area": "Glide optimization",
      "prompt": "In still air, a clean propeller airplane is flown at the airspeed for maximum lift-to-drag ratio. With no thrust, this condition principally provides",
      "options": [
        "maximum glide distance per unit height.",
        "maximum vertical descent rate.",
        "minimum time to descend through a given height."
      ],
      "correct": 0,
      "explanation": "Maximum L/D gives the shallowest still-air glide angle and greatest distance per height lost.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 5: Lift/drag ratio; gliding flight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Maximum L/D gives the shallowest still-air glide angle and greatest distance per height lost.",
        "Incorrect. A maximum descent-rate condition is not the maximum-L/D objective.",
        "Incorrect. Minimum sink and maximum-distance glide are distinct conditions."
      ]
    },
    {
      "id": "PD-B02-CPL-014",
      "area": "Endurance versus range",
      "prompt": "For a propeller airplane with approximately constant propeller efficiency and fuel consumed in proportion to shaft power, the still-air maximum-endurance condition is associated most directly with",
      "options": [
        "minimum power required.",
        "minimum thrust required.",
        "maximum power available."
      ],
      "correct": 0,
      "explanation": "Minimum power demand produces the least fuel flow under the stated model and maximizes time aloft.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 11: Range and endurance; power required",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Minimum power demand produces the least fuel flow under the stated model and maximizes time aloft.",
        "Incorrect. Minimum thrust or drag is more directly associated with maximum L/D, not the minimum-power endurance condition.",
        "Incorrect. Maximum available power does not minimize fuel consumption."
      ]
    },
    {
      "id": "PD-B02-CPL-015",
      "area": "Energy conversion",
      "prompt": "In an idealized zoom with no net work from thrust or drag, true airspeed decreases from 100 to 80 knots. Using 1 knot = 1.688 ft/s and g = 32.2 ft/s², approximately how much height can the lost kinetic energy provide?",
      "options": [
        "94 feet.",
        "159 feet.",
        "310 feet."
      ],
      "correct": 1,
      "explanation": "Height gain is [(100 × 1.688)² − (80 × 1.688)²]/(2 × 32.2) ≈ 159 feet.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 4: Mechanical energy; exchange of altitude and airspeed",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. This is below the height obtained when the squared speeds are converted consistently to ft/s.",
        "Correct. Height gain is [(100 × 1.688)² − (80 × 1.688)²]/(2 × 32.2) ≈ 159 feet.",
        "Incorrect. This is approximately twice the energy-equivalent height; the factor 2g is required."
      ]
    },
    {
      "id": "PD-B02-CPL-016",
      "area": "Turn-rate comparison",
      "prompt": "In still air, two airplanes fly coordinated level turns at the same true airspeed. One increases bank from 30° to 45°. What happens to its turn radius?",
      "options": [
        "It decreases.",
        "It increases.",
        "It remains constant."
      ],
      "correct": 0,
      "explanation": "At fixed TAS, turn radius is inversely related to the tangent of bank angle.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 5: Forces in turns",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "CA.V",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. At fixed TAS, turn radius is inversely related to the tangent of bank angle.",
        "Incorrect. A steeper bank produces greater turning acceleration and a smaller radius.",
        "Incorrect. Holding speed constant does not hold radius constant when bank changes."
      ]
    },
    {
      "id": "PD-B02-CPL-017",
      "area": "Load factor in a descent",
      "prompt": "An airplane is banked 60° during a descending maneuver. Why is it incorrect to infer a 2g load factor from bank angle alone?",
      "options": [
        "Bank angle affects load factor only during climbs.",
        "The level-turn relationship requires steady altitude.",
        "All descending turns produce less than 1g."
      ],
      "correct": 1,
      "explanation": "The familiar n = 1/cos(bank) relationship assumes a coordinated, steady, level turn. A descending or accelerating maneuver requires additional flight-path information.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 5: Load factors; level-flight assumptions",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "CA.VII",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Climbing and descending turns can involve significant load factors.",
        "Correct. The familiar n = 1/cos(bank) relationship assumes a coordinated, steady, level turn. A descending or accelerating maneuver requires additional flight-path information.",
        "Incorrect. Descending maneuvers can produce a wide range of load factors; less than 1g is not assured."
      ]
    },
    {
      "id": "PD-B02-CPL-018",
      "area": "Spiral versus spin",
      "prompt": "An airplane is in a steep, tightening descending turn with rapidly increasing airspeed and high aerodynamic loads. The wing is not stalled. Which condition best fits?",
      "options": [
        "A stabilized power-off stall.",
        "A developed spin.",
        "A spiral dive."
      ],
      "correct": 2,
      "explanation": "A spiral dive can involve a steep bank, increasing speed, and a tightening descent without a stall.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 5: Spiral dives; spins",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/06_afh_ch5.pdf",
      "standardCode": "CA.IX",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A stalled condition is inconsistent with the stated unstalled wing.",
        "Incorrect. A spin requires a stalled wing and autorotation; the stem excludes the stall.",
        "Correct. A spiral dive can involve a steep bank, increasing speed, and a tightening descent without a stall."
      ]
    },
    {
      "id": "PD-B02-CPL-019",
      "area": "Spin recovery principle",
      "prompt": "A developed spin involves both stall and autorotation. Why is merely reducing power insufficient as a complete general recovery action?",
      "options": [
        "The stall and yaw must also be addressed using the approved procedure.",
        "An increased bank angle must first be established.",
        "Power reduction automatically removes the wing’s critical angle of attack."
      ],
      "correct": 0,
      "explanation": "Power is one consideration; stopping autorotation and reducing angle of attack are also required in the aircraft-specific sequence.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 5: Spins; recovery considerations",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/06_afh_ch5.pdf",
      "standardCode": "CA.IX",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Power is one consideration; stopping autorotation and reducing angle of attack are also required in the aircraft-specific sequence.",
        "Incorrect. Adding bank is not a general prerequisite for spin recovery.",
        "Incorrect. Throttle position alone does not determine angle of attack."
      ]
    },
    {
      "id": "PD-B02-CPL-020",
      "area": "Accelerated-stall margins",
      "prompt": "At the same weight and configuration, a pilot unloads the wing from a 2g pull to approximately 1g. What happens to the stall-speed threshold associated with that load factor?",
      "options": [
        "It remains unchanged.",
        "It decreases.",
        "It increases."
      ],
      "correct": 1,
      "explanation": "Stall speed varies with the square root of load factor; unloading lowers the speed at which the critical angle is reached.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 5: Load factors and stalling speed",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "CA.VII",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The configuration has not changed, but load factor has.",
        "Correct. Stall speed varies with the square root of load factor; unloading lowers the speed at which the critical angle is reached.",
        "Incorrect. Increasing rather than reducing load factor raises the accelerated stall-speed threshold."
      ]
    },
    {
      "id": "PD-B02-CPL-021",
      "area": "Steep-spiral purpose",
      "prompt": "A commercial pilot practices a steep spiral over a selected point. Which objective distinguishes it from a maximum-performance climbing maneuver?",
      "options": [
        "Holding constant altitude while maximizing turn rate.",
        "Gaining the most altitude through a 180° heading change.",
        "Dissipating altitude while remaining near a selected area."
      ],
      "correct": 2,
      "explanation": "A steep spiral is a descending ground-reference maneuver useful for remaining near a potential landing area.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 10: Steep spiral",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/11_afh_ch10.pdf",
      "standardCode": "CA.V",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A steep spiral is not an altitude-holding turn.",
        "Incorrect. This describes the broad objective of a chandelle.",
        "Correct. A steep spiral is a descending ground-reference maneuver useful for remaining near a potential landing area."
      ]
    },
    {
      "id": "PD-B02-CPL-022",
      "area": "Steep-spiral wind",
      "prompt": "During a steep spiral over a fixed point in steady wind, why must bank vary around the turn?",
      "options": [
        "The selected point’s elevation changes with heading.",
        "Airplane weight changes with heading.",
        "Groundspeed changes around the ground-reference circle."
      ],
      "correct": 2,
      "explanation": "A constant ground radius requires bank adjustments as groundspeed varies between upwind and downwind portions.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 10: Steep spiral; wind correction",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/11_afh_ch10.pdf",
      "standardCode": "CA.V",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The ground point’s elevation is fixed.",
        "Incorrect. Heading does not itself change airplane weight.",
        "Correct. A constant ground radius requires bank adjustments as groundspeed varies between upwind and downwind portions."
      ]
    },
    {
      "id": "PD-B02-CPL-023",
      "area": "Chandelle energy",
      "prompt": "During a correctly flown chandelle, airspeed decreases while altitude increases. Which description best explains the maneuver’s energy management?",
      "options": [
        "The climb requires constant kinetic energy throughout.",
        "The bank converts airplane weight into engine power.",
        "Available power and some kinetic energy support the climb."
      ],
      "correct": 2,
      "explanation": "The maneuver combines applied power with a controlled exchange of airspeed for height.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 10: Chandelles; airspeed and altitude",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/11_afh_ch10.pdf",
      "standardCode": "CA.V",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Airspeed decreases, so kinetic energy does not remain constant.",
        "Incorrect. Weight is not converted into additional engine power by banking.",
        "Correct. The maneuver combines applied power with a controlled exchange of airspeed for height."
      ]
    },
    {
      "id": "PD-B02-CPL-024",
      "area": "Lazy-eight coordination",
      "prompt": "During the low-speed, high-pitch part of a lazy eight in a clockwise-propeller airplane, why can rudder demand differ between left and right turns?",
      "options": [
        "The airplane’s CG moves laterally with each heading.",
        "The rudder reverses its aerodynamic direction in a left turn.",
        "Adverse yaw combines differently with left-turning tendencies."
      ],
      "correct": 2,
      "explanation": "The yaw from rolling and the propeller-related tendencies may reinforce or partly oppose each other depending on turn direction.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 10: Lazy eights; coordination",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/11_afh_ch10.pdf",
      "standardCode": "CA.V",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The yaw difference does not require a lateral movement of mass.",
        "Incorrect. The rudder does not reverse its basic aerodynamic effect simply because turn direction changes.",
        "Correct. The yaw from rolling and the propeller-related tendencies may reinforce or partly oppose each other depending on turn direction."
      ]
    },
    {
      "id": "PD-B02-CPL-025",
      "area": "Landing-gear operating limits",
      "prompt": "A retractable-gear airplane has VLO = 125 KIAS and VLE = 145 KIAS. With the gear fully extended and locked, which statement follows from these values alone?",
      "options": [
        "135 KIAS is within both gear limits.",
        "135 KIAS is above both gear limits.",
        "135 KIAS is within VLE but above VLO."
      ],
      "correct": 2,
      "explanation": "135 is below the 145 KIAS extended limit but above the 125 KIAS operating limit. Other limitations remain applicable.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 12: Landing gear; VLO and VLE",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/13_afh_ch12.pdf",
      "standardCode": "CA.I.G",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The mechanism-operating limit is only 125 KIAS.",
        "Incorrect. The extended limit is 145 KIAS and is not exceeded at 135 KIAS.",
        "Correct. 135 is below the 145 KIAS extended limit but above the 125 KIAS operating limit. Other limitations remain applicable."
      ]
    },
    {
      "id": "PD-B02-CPL-026",
      "area": "Gear-position evidence",
      "prompt": "After gear selection, the normal down-and-locked indication is absent. Why is normal-looking hydraulic pressure not sufficient proof that the gear is secure?",
      "options": [
        "System pressure does not directly verify each mechanical lock.",
        "Hydraulic pressure can exist only with every gear locked.",
        "A pressure indication replaces the landing-gear checklist."
      ],
      "correct": 0,
      "explanation": "Pressure and gear-lock status are different system facts. Use the aircraft’s approved indication and abnormal procedure.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 12: Retractable landing gear; abnormal indications",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/13_afh_ch12.pdf",
      "standardCode": "CA.I.G",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Pressure and gear-lock status are different system facts. Use the aircraft’s approved indication and abnormal procedure.",
        "Incorrect. Pressure can be present with an incomplete extension or indication problem.",
        "Incorrect. A single pressure reading does not replace the required checks."
      ]
    },
    {
      "id": "PD-B02-CPL-027",
      "area": "Propeller pitch limits",
      "prompt": "A constant-speed propeller has reached its low-pitch stop. Airspeed then changes. Why may RPM no longer remain at the selected value?",
      "options": [
        "The propeller has stopped absorbing engine power.",
        "The governor has no further blade-angle travel in that direction.",
        "The selected RPM automatically becomes a fixed manifold pressure."
      ],
      "correct": 1,
      "explanation": "Governing is limited by blade-angle range; at a stop, available governing authority can be exhausted.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Constant-speed propeller; governing range",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "CA.I.G",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The propeller can still absorb power even when the governor reaches a travel limit.",
        "Correct. Governing is limited by blade-angle range; at a stop, available governing authority can be exhausted.",
        "Incorrect. RPM selection does not become a manifold-pressure setting."
      ]
    },
    {
      "id": "PD-B02-CPL-028",
      "area": "Cowl flaps",
      "prompt": "On an airplane equipped with cowl flaps, opening them during a low-speed, high-power climb generally trades",
      "options": [
        "More cooling airflow, with reduced airplane weight.",
        "More cooling airflow, with additional drag.",
        "Less cooling airflow, with additional drag."
      ],
      "correct": 1,
      "explanation": "Opening cowl flaps can increase cooling flow while increasing drag.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 12: Engine cooling; cowl flaps",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/13_afh_ch12.pdf",
      "standardCode": "CA.I.G",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The airflow can increase, but selecting cowl flaps does not reduce airplane mass.",
        "Correct. Opening cowl flaps can increase cooling flow while increasing drag.",
        "Incorrect. Reduced cooling flow is the opposite of the intended opening effect."
      ]
    },
    {
      "id": "PD-B02-CPL-029",
      "area": "Density altitude and runway",
      "prompt": "At the same weight and takeoff indicated speed, a higher density altitude generally requires a higher true airspeed. In still air, what consequence should be included in takeoff planning?",
      "options": [
        "An unchanged liftoff groundspeed because IAS is unchanged.",
        "A lower liftoff groundspeed and shorter acceleration distance.",
        "A higher liftoff groundspeed and longer acceleration distance."
      ],
      "correct": 2,
      "explanation": "Higher TAS in still air means higher groundspeed; reduced engine and propeller performance may further increase distance.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 11: Density altitude; takeoff performance",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. IAS is not groundspeed, particularly when density changes.",
        "Incorrect. This reverses the speed effect of lower density at the same IAS.",
        "Correct. Higher TAS in still air means higher groundspeed; reduced engine and propeller performance may further increase distance."
      ]
    },
    {
      "id": "PD-B02-CPL-030",
      "area": "Runway slope",
      "prompt": "For otherwise comparable takeoff conditions, an upslope runway normally increases takeoff distance principally because",
      "options": [
        "Acceleration is unchanged because lift balances weight.",
        "Acceleration must overcome an uphill weight component.",
        "Acceleration benefits from a downhill weight component."
      ],
      "correct": 1,
      "explanation": "On an upslope, a component of gravity opposes motion along the runway.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 11: Takeoff performance; runway gradient",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Before liftoff, vertical support does not eliminate the gravitational component along the slope.",
        "Correct. On an upslope, a component of gravity opposes motion along the runway.",
        "Incorrect. This applies to a downslope, not the upslope specified."
      ]
    },
    {
      "id": "PD-B02-CPL-031",
      "area": "Landing-distance definitions",
      "prompt": "A landing chart lists 700 feet of ground roll and 1,600 feet over a 50-foot obstacle. Which value includes the airborne approach portion from the stated height?",
      "options": [
        "900 feet.",
        "1,600 feet.",
        "700 feet."
      ],
      "correct": 1,
      "explanation": "The 1,600-foot total includes both the airborne portion from 50 feet and the landing ground roll.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 11: Landing distance; chart definitions",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 900 feet is the difference between the entries, not the complete over-obstacle distance.",
        "Correct. The 1,600-foot total includes both the airborne portion from 50 feet and the landing ground roll.",
        "Incorrect. Ground roll begins after touchdown, not at the 50-foot point."
      ]
    },
    {
      "id": "PD-B02-CPL-032",
      "area": "Performance assumptions",
      "prompt": "An AFM chart assumes a dry, level, paved runway. The intended runway is wet grass. What is the principal limitation of using the uncorrected chart value?",
      "options": [
        "The chart’s surface assumptions do not match the operation.",
        "The chart becomes conservative whenever the runway is unpaved.",
        "Runway surface affects landing but not takeoff."
      ],
      "correct": 0,
      "explanation": "Surface changes can materially affect acceleration and braking; use applicable approved guidance rather than assuming the original number applies.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 11: Performance-chart assumptions",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Surface changes can materially affect acceleration and braking; use applicable approved guidance rather than assuming the original number applies.",
        "Incorrect. An unpaved or contaminated runway is not automatically a conservative improvement.",
        "Incorrect. Runway surface can affect both takeoff and landing performance."
      ]
    },
    {
      "id": "PD-B02-CPL-033",
      "area": "Windmilling propeller",
      "prompt": "Following a power loss in a single-engine airplane, why can a windmilling propeller increase the descent required to maintain a given glide speed?",
      "options": [
        "It eliminates induced drag from the wing.",
        "It adds weight to the airplane after failure.",
        "It can impose substantial additional drag."
      ],
      "correct": 2,
      "explanation": "A windmilling propeller can extract energy from the airflow and increase drag. Follow the aircraft’s approved engine-out procedure.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 18: Engine failure; propeller drag",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/19_afh_ch18.pdf",
      "standardCode": "CA.IX",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The wing must still produce lift and associated induced drag.",
        "Incorrect. The propeller’s mass was already part of the airplane’s weight.",
        "Correct. A windmilling propeller can extract energy from the airflow and increase drag. Follow the aircraft’s approved engine-out procedure."
      ]
    },
    {
      "id": "PD-B02-CPL-034",
      "area": "Engine-out bank",
      "prompt": "A conventional twin is held wings level after one engine fails, with rudder maintaining heading. Why may the minimum-drag engine-out attitude require a small bank toward the operating engine instead?",
      "options": [
        "It increases the failed engine’s thrust.",
        "It can reduce sideslip while balancing asymmetric thrust.",
        "It eliminates the need for rudder at every power setting."
      ],
      "correct": 1,
      "explanation": "The appropriate slight bank and rudder combination can establish a lower-drag, near-zero-sideslip condition. Use aircraft-specific guidance.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 13: Zero sideslip; one-engine-inoperative flight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/14_afh_ch13.pdf",
      "standardCode": "CA.X",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Banking does not restore thrust from the failed engine.",
        "Correct. The appropriate slight bank and rudder combination can establish a lower-drag, near-zero-sideslip condition. Use aircraft-specific guidance.",
        "Incorrect. Rudder requirements remain dependent on power, speed, and airplane configuration."
      ]
    },
    {
      "id": "PD-B02-CPL-035",
      "area": "Engine identification",
      "prompt": "After a suspected engine failure in a twin, why must the affected engine be verified before its fuel or propeller controls are moved?",
      "options": [
        "The verification restores the failed engine’s rated power.",
        "The remaining engine requires both propellers to be feathered.",
        "Control forces and initial symptoms can be misinterpreted."
      ],
      "correct": 2,
      "explanation": "A mistaken shutdown can remove the remaining thrust; identification and verification are essential parts of the approved procedure.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 13: Engine failure: identify and verify",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/14_afh_ch13.pdf",
      "standardCode": "CA.X",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Verification establishes identity, not necessarily engine recovery.",
        "Incorrect. Feathering the operating propeller would remove useful thrust.",
        "Correct. A mistaken shutdown can remove the remaining thrust; identification and verification are essential parts of the approved procedure."
      ]
    },
    {
      "id": "PD-B02-CPL-036",
      "area": "Service ceiling",
      "prompt": "A light airplane reaches the altitude at which its maximum available climb rate has fallen to the value defining its service ceiling. This does not necessarily mean it has reached",
      "options": [
        "an altitude of reduced excess power.",
        "the applicable service-ceiling condition.",
        "its absolute ceiling."
      ],
      "correct": 2,
      "explanation": "Absolute ceiling is the condition of zero maximum climb rate, distinct from the service-ceiling criterion.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 11: Service ceiling and absolute ceiling",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A reduced climb capability is consistent with reduced excess power.",
        "Incorrect. The stem expressly describes the service-ceiling condition.",
        "Correct. Absolute ceiling is the condition of zero maximum climb rate, distinct from the service-ceiling criterion."
      ]
    },
    {
      "id": "PD-B02-CPL-037",
      "area": "Load redistribution",
      "prompt": "An airplane weighs 3,000 lb at a CG of 80 inches. A 100 lb item at station 140 is removed. What is the new CG, approximately?",
      "options": [
        "77.9 inches.",
        "80.0 inches.",
        "82.1 inches."
      ],
      "correct": 0,
      "explanation": "New moment is 240,000 − 14,000 = 226,000 lb-in; divided by 2,900 lb gives 77.93 inches.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 10: Removal of weight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. New moment is 240,000 − 14,000 = 226,000 lb-in; divided by 2,900 lb gives 77.93 inches.",
        "Incorrect. Removing weight aft of the CG shifts the CG forward.",
        "Incorrect. 82.1 inches reverses the direction of the shift."
      ]
    },
    {
      "id": "PD-B02-CPL-038",
      "area": "Figure-based signed moments",
      "prompt": "Refer to PHAK Figure 10-10. If the 11 lb of oil at station −31 were removed for a calculation exercise, what would happen to total moment?",
      "options": [
        "It would increase by 341 lb-in.",
        "It would decrease by 341 lb-in.",
        "It would remain unchanged."
      ],
      "correct": 0,
      "explanation": "Removing a negative moment increases the remaining total: 122,086 − (−341) = 122,427 lb-in. This is a calculation exercise, not authorization to operate without oil.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 10: Figure 10-10; negative arms",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Removing a negative moment increases the remaining total: 122,086 − (−341) = 122,427 lb-in. This is a calculation exercise, not authorization to operate without oil.",
        "Incorrect. This subtracts the magnitude without retaining the negative sign.",
        "Incorrect. Oil has a nonzero arm and moment in the figure."
      ],
      "figureRef": {
        "supplement": "Pilot’s Handbook of Aeronautical Knowledge, Chapter 10",
        "figure": "10-10",
        "url": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10"
      }
    },
    {
      "id": "PD-B02-CPL-039",
      "area": "Figure-based total loading",
      "prompt": "Refer to PHAK Figure 10-10. In the loading exercise, the 70 lb baggage item is replaced by a 40 lb item at the same station. What is the resulting total weight and moment?",
      "options": [
        "1,618.9 lb and 118,936 lb-in.",
        "1,618.9 lb and 125,236 lb-in.",
        "1,648.9 lb and 118,936 lb-in."
      ],
      "correct": 0,
      "explanation": "Net removal is 30 lb at 105 inches: weight becomes 1,618.9 lb and moment decreases by 3,150 to 118,936 lb-in.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 10: Figure 10-10; replacement of weight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10",
      "standardCode": "CA.I.F",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Net removal is 30 lb at 105 inches: weight becomes 1,618.9 lb and moment decreases by 3,150 to 118,936 lb-in.",
        "Incorrect. The weight is correct, but the moment change has the wrong sign.",
        "Incorrect. The moment is correct, but replacing 70 lb with 40 lb reduces total weight by 30 lb."
      ],
      "figureRef": {
        "supplement": "Pilot’s Handbook of Aeronautical Knowledge, Chapter 10",
        "figure": "10-10",
        "url": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10"
      }
    },
    {
      "id": "PD-B02-CPL-040",
      "area": "Decision margins",
      "prompt": "A performance calculation shows the airplane can meet an obstacle requirement only if every planned assumption is achieved exactly. Which concern should most influence the departure decision?",
      "options": [
        "A favorable weight calculation makes all other assumptions immaterial.",
        "Small errors or adverse changes could eliminate the available margin.",
        "Exact equality provides the same practical margin as a substantial surplus."
      ],
      "correct": 1,
      "explanation": "A limit met with no surplus is sensitive to wind, technique, condition, and data uncertainty; evaluate a plan with suitable margin.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 2: Risk assessment; operational margins",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/04_phak_ch2.pdf",
      "standardCode": "CA.I.H",
      "standardDoc": "FAA-S-ACS-7B",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cpl",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Weight is one contributor and does not remove the other performance assumptions.",
        "Correct. A limit met with no surplus is sensitive to wind, technique, condition, and data uncertainty; evaluate a plan with suitable margin.",
        "Incorrect. Equality is not the same as resilience to ordinary variation."
      ]
    }
  ],
  "cfi": [
    {
      "id": "PD-DRAFT-CFI-001",
      "area": "Differential ailerons",
      "prompt": "During an aileron-system demonstration, the upward-deflecting aileron moves farther than the downward-deflecting aileron. What is the principal purpose of this differential travel?",
      "options": [
        "Eliminate the need for rudder.",
        "Reduce adverse yaw.",
        "Increase the critical angle of attack."
      ],
      "correct": 1,
      "explanation": "Greater upward travel adds drag on the descending wing relative to the other wing and helps reduce adverse yaw.",
      "reference": "PHAK Chapter 6: Differential ailerons",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/08_phak_ch6.pdf",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Differential ailerons reduce an adverse-yaw tendency; they do not eliminate the need for coordinated rudder.",
        "Correct. Greater upward travel adds drag on the descending wing relative to the other wing and helps reduce adverse yaw.",
        "Incorrect. Aileron differential does not redefine the airfoil’s critical angle of attack."
      ]
    },
    {
      "id": "PD-DRAFT-CFI-002",
      "area": "Static and dynamic stability",
      "prompt": "After a small pitch disturbance, an airplane initially tends toward its trimmed condition, but successive oscillations grow in amplitude. How should the instructor classify the demonstrated stability?",
      "options": [
        "Neutral static; neutral dynamic.",
        "Negative static; positive dynamic.",
        "Positive static; negative dynamic."
      ],
      "correct": 2,
      "explanation": "The initial restoring tendency is positive static stability. Growing oscillations indicate negative dynamic stability.",
      "reference": "PHAK Chapter 5: Static and dynamic stability",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Neither the initial restoring tendency nor the growing amplitude is neutral.",
        "Incorrect. The initial tendency is restoring, not divergent; subsequent motion is divergent, not damped.",
        "Correct. The initial restoring tendency is positive static stability. Growing oscillations indicate negative dynamic stability."
      ]
    },
    {
      "id": "PD-DRAFT-CFI-003",
      "area": "Ground-reference maneuvers",
      "prompt": "A learner flies turns around a point at constant altitude and true airspeed in a steady wind. To maintain a constant ground radius, where should the greatest bank angle normally occur?",
      "options": [
        "On the crosswind side, at the greatest crab angle.",
        "On the upwind side, at the lowest groundspeed.",
        "On the downwind side, at the greatest groundspeed."
      ],
      "correct": 2,
      "explanation": "A greater groundspeed requires a faster change in ground-track direction to maintain the same radius, requiring greater bank.",
      "reference": "PHAK Chapter 5: Forces in turns; effect of wind",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "FI.VIII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Crab angle alone does not identify the maximum bank required.",
        "Incorrect. Lower groundspeed requires less bank for a given ground radius.",
        "Correct. A greater groundspeed requires a faster change in ground-track direction to maintain the same radius, requiring greater bank."
      ]
    },
    {
      "id": "PD-DRAFT-CFI-004",
      "area": "Trim instruction",
      "prompt": "A learner repeatedly changes pitch with the trim control and then uses the elevator to correct the resulting airspeed. Which demonstration best addresses the reversed control sequence?",
      "options": [
        "Set trim first, then select the desired attitude.",
        "Establish the attitude, then trim away control pressure.",
        "Center the trim, then hold the desired speed with rudder."
      ],
      "correct": 1,
      "explanation": "Use the flight controls to establish the desired condition, allow the airplane to stabilize as appropriate, and trim to relieve sustained force.",
      "reference": "PHAK Chapter 6: Trim systems",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/08_phak_ch6.pdf",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Trim is not the primary control for establishing a new attitude.",
        "Correct. Use the flight controls to establish the desired condition, allow the airplane to stabilize as appropriate, and trim to relieve sustained force.",
        "Incorrect. Rudder does not substitute for elevator control of the desired pitch condition."
      ]
    },
    {
      "id": "PD-DRAFT-CFI-005",
      "area": "Visual illusions",
      "prompt": "A learner accustomed to a wide runway approaches a much narrower runway of similar length and slope. Without compensating for the visual illusion, the learner is most likely to fly",
      "options": [
        "a lower-than-normal approach.",
        "a normal approach with a later flare.",
        "a higher-than-normal approach."
      ],
      "correct": 0,
      "explanation": "A narrow runway can create the impression of being higher than actual, leading to a low approach.",
      "reference": "PHAK Chapter 17: Runway width illusion",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/19_phak_ch17.pdf",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. A narrow runway can create the impression of being higher than actual, leading to a low approach.",
        "Incorrect. A normal glidepath is not assured when the pilot follows this uncorrected illusion.",
        "Incorrect. A wider-than-usual runway can produce the opposite illusion."
      ]
    },
    {
      "id": "PD-DRAFT-CFI-006",
      "area": "Instructional use of simulation",
      "prompt": "An instructor uses a simulator to practice an avionics failure whose safe replication in the airplane would be impractical. Before transferring the skill to the airplane, what should the instructor emphasize?",
      "options": [
        "That simulator proficiency removes the need for aircraft familiarization.",
        "Which indications and procedures differ between the device and airplane.",
        "That device limitations should be omitted to preserve realism."
      ],
      "correct": 1,
      "explanation": "Explicit differences help prevent negative transfer while retaining the value of safe, repeatable practice.",
      "reference": "AIH Chapter 9: Use of flight simulation training devices",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/11_aih_chapter_9.pdf",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Device proficiency does not establish familiarity with every aircraft-specific difference.",
        "Correct. Explicit differences help prevent negative transfer while retaining the value of safe, repeatable practice.",
        "Incorrect. Undisclosed limitations can create false expectations when the learner operates the actual airplane."
      ]
    },
    {
      "id": "PD-DRAFT-CFI-007",
      "area": "Secondary stalls",
      "prompt": "A learner recovers from an initial stall but applies abrupt aft elevator before sufficient airspeed has returned. A second stall occurs. What is the most direct explanation?",
      "options": [
        "The wings stalled because the recovery used insufficient bank.",
        "The first stall permanently increased the airplane’s stall speed.",
        "The critical angle of attack was exceeded again."
      ],
      "correct": 2,
      "explanation": "A rapid pitch increase can produce a secondary stall by returning the wing beyond its critical angle of attack.",
      "reference": "AFH Chapter 5: Secondary stalls",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Insufficient bank is not the cause; added bank can increase the load factor during recovery.",
        "Incorrect. The initial stall does not permanently change the unaccelerated stall speed.",
        "Correct. A rapid pitch increase can produce a secondary stall by returning the wing beyond its critical angle of attack."
      ]
    },
    {
      "id": "PD-DRAFT-CFI-008",
      "area": "Figure-based moment checks",
      "prompt": "Refer to PHAK Chapter 10, Figure 10-10. A learner changes the oil moment from −341 to +341 lb-in but leaves every other entry unchanged. What effect does this sign error have on the computed CG?",
      "options": [
        "It moves the computed CG about 0.41 inch aft.",
        "It moves the computed CG about 0.21 inch forward.",
        "It leaves the computed CG unchanged."
      ],
      "correct": 0,
      "explanation": "The moment is overstated by 682 lb-in. At 1,648.9 lb, the computed CG is shifted aft by 682/1,648.9 ≈ 0.414 inch.",
      "reference": "PHAK Chapter 10: Figure 10-10; signed moments",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The moment is overstated by 682 lb-in. At 1,648.9 lb, the computed CG is shifted aft by 682/1,648.9 ≈ 0.414 inch.",
        "Incorrect. This uses one 341 lb-in term rather than the 682 lb-in change and reverses the direction.",
        "Incorrect. Weight is unchanged, but total moment is not; the computed CG therefore changes."
      ],
      "figureRef": {
        "supplement": "Pilot’s Handbook of Aeronautical Knowledge, Chapter 10",
        "figure": "10-10",
        "url": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10"
      }
    },
    {
      "id": "PD-DRAFT-CFI-009",
      "area": "Flap aerodynamics",
      "prompt": "A learner states that extending flaps reduces stall speed because it reduces airplane weight. Which explanation correctly identifies the aerodynamic change?",
      "options": [
        "Flaps reduce the wing’s required lift to zero.",
        "Flaps increase the wing’s maximum lift coefficient.",
        "Flaps increase the available engine power."
      ],
      "correct": 1,
      "explanation": "An increased maximum lift coefficient allows the same weight to be supported at a lower speed in the applicable configuration.",
      "reference": "PHAK Chapter 6: Secondary flight controls: flaps",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/08_phak_ch6.pdf",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Lift is still required to support the airplane.",
        "Correct. An increased maximum lift coefficient allows the same weight to be supported at a lower speed in the applicable configuration.",
        "Incorrect. Flaps change aerodynamic forces, not available engine power."
      ]
    },
    {
      "id": "PD-DRAFT-CFI-010",
      "area": "Load-factor instruction",
      "prompt": "A learner asks why steepening a level turn requires increased lift even though airplane weight has not changed. Which explanation is most accurate?",
      "options": [
        "The vertical lift component must continue to equal airplane weight.",
        "The total lift remains equal to airplane weight at every bank angle.",
        "The horizontal lift component must equal airplane weight."
      ],
      "correct": 0,
      "explanation": "Bank tilts the lift vector. Total lift must increase so that its vertical component still balances weight.",
      "reference": "PHAK Chapter 5: Forces in turns",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Bank tilts the lift vector. Total lift must increase so that its vertical component still balances weight.",
        "Incorrect. Total lift exceeds weight in a steady level banked turn.",
        "Incorrect. The horizontal component turns the airplane; it does not support weight."
      ]
    },
    {
      "id": "PD-B02-CFI-011",
      "area": "Integrated instruction",
      "prompt": "A new learner can hold altitude using the altimeter but rarely looks outside during VFR training. Which lesson design best applies integrated flight instruction?",
      "options": [
        "Teach the outside picture and instrument indications together.",
        "Remove every reference to instruments until the checkride.",
        "Continue instrument-only practice until VFR habits develop."
      ],
      "correct": 0,
      "explanation": "Integrated instruction connects outside visual references with instrument confirmation from the beginning while preserving an appropriate visual lookout.",
      "reference": "Aviation Instructor’s Handbook, Chapter 9: Integrated flight instruction",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/11_aih_chapter_9.pdf",
      "standardCode": "FI.IV",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Integrated instruction connects outside visual references with instrument confirmation from the beginning while preserving an appropriate visual lookout.",
        "Incorrect. Completely excluding instruments does not teach the intended relationship.",
        "Incorrect. Instrument-only practice does not by itself establish outside-reference habits for VFR flight."
      ]
    },
    {
      "id": "PD-B02-CFI-012",
      "area": "Demonstration planning",
      "prompt": "During an initial maneuver demonstration, the instructor begins a long explanation only after the learner’s workload becomes high. What change best improves the next demonstration?",
      "options": [
        "Brief key actions first, then coordinate a concise explanation with the demonstration.",
        "Add more simultaneous detail during the highest-workload phase.",
        "Omit the explanation and assess recall of the maneuver name."
      ],
      "correct": 0,
      "explanation": "Preparation creates a framework, and a coordinated demonstration links essential cues to actions without unnecessary overload.",
      "reference": "Aviation Instructor’s Handbook, Chapter 5: Demonstration-performance method",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/07_aih_chapter_5.pdf",
      "standardCode": "FI.IV",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Preparation creates a framework, and a coordinated demonstration links essential cues to actions without unnecessary overload.",
        "Incorrect. More detail during peak workload can further reduce useful observation.",
        "Incorrect. Naming the maneuver does not replace understanding its execution."
      ]
    },
    {
      "id": "PD-B02-CFI-013",
      "area": "Safe practice boundaries",
      "prompt": "An instructor plans a distraction exercise during a simulated emergency. Which condition should be established before introducing the distraction?",
      "options": [
        "A detailed critique after the exercise.",
        "Safety limits and intervention criteria.",
        "Additional repetitions of the distraction."
      ],
      "correct": 1,
      "explanation": "Safe boundaries and effective instructor supervision must precede the distraction exercise.",
      "reference": "Aviation Instructor’s Handbook, Chapter 9: Distractions; instructor supervision",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/11_aih_chapter_9.pdf",
      "standardCode": "FI.XII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A debrief is valuable afterward but does not establish safe conduct beforehand.",
        "Correct. Safe boundaries and effective instructor supervision must precede the distraction exercise.",
        "Incorrect. Repetition may develop a skill later; it does not establish the safety prerequisites."
      ]
    },
    {
      "id": "PD-B02-CFI-014",
      "area": "Simulated failures",
      "prompt": "A proposed in-flight simulation would disable a safety-critical system in a way not approved by the aircraft or training guidance. What is the better training choice?",
      "options": [
        "Use an approved method or suitable training device.",
        "Treat the learning objective as authorization to alter the system.",
        "Perform the disablement if the learner is not told in advance."
      ],
      "correct": 0,
      "explanation": "The objective can be trained through approved simulation without creating an unsupported real failure.",
      "reference": "Aviation Instructor’s Handbook, Chapter 9: Use of simulation; realistic training",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/11_aih_chapter_9.pdf",
      "standardCode": "FI.XII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The objective can be trained through approved simulation without creating an unsupported real failure.",
        "Incorrect. A learning goal does not override aircraft limitations and safe training practices.",
        "Incorrect. Surprise does not make an unsafe or unapproved method appropriate."
      ]
    },
    {
      "id": "PD-B02-CFI-015",
      "area": "Instructor intervention",
      "prompt": "During an emergency exercise, a learner’s fixation leads to a continuing unsafe airspeed trend despite coaching. What should determine the instructor’s intervention?",
      "options": [
        "The desired realism of the scenario.",
        "The remaining lesson objectives.",
        "The developing safety risk."
      ],
      "correct": 2,
      "explanation": "Intervene before the developing condition compromises safety, even if the exercise is incomplete.",
      "reference": "Aviation Instructor’s Handbook, Chapter 9: Instructor supervision; flight safety",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/11_aih_chapter_9.pdf",
      "standardCode": "FI.XII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Realism is useful only within safe limits.",
        "Incorrect. Other objectives can be rescheduled and do not justify allowing an unsafe trend to continue.",
        "Correct. Intervene before the developing condition compromises safety, even if the exercise is incomplete."
      ]
    },
    {
      "id": "PD-B02-CFI-016",
      "area": "Lesson prerequisites",
      "prompt": "A learner attempts a landing flare but cannot consistently recognize or hold the required pitch attitudes in simpler flight. What training adjustment best addresses the cause?",
      "options": [
        "Practice attitude recognition and control first.",
        "Repeat complete landings with more instructor prompts.",
        "Introduce more landing variables on the next circuit."
      ],
      "correct": 0,
      "explanation": "The stated weakness is a prerequisite pitch-control skill; isolate and strengthen it before integration.",
      "reference": "Aviation Instructor’s Handbook, Chapter 7: Building blocks of learning",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/09_aih_chapter_7.pdf",
      "standardCode": "FI.IV",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The stated weakness is a prerequisite pitch-control skill; isolate and strengthen it before integration.",
        "Incorrect. Prompts may help complete a landing but can conceal rather than resolve the missing prerequisite.",
        "Incorrect. Additional variables increase demands on a skill that is not yet reliable."
      ]
    },
    {
      "id": "PD-B02-CFI-017",
      "area": "Ballooning",
      "prompt": "A learner raises the nose excessively during the landing roundout and the airplane climbs away from the runway. Which error most directly initiated the balloon?",
      "options": [
        "Excessive rudder alignment correction.",
        "Excessive pitch change at the existing airspeed.",
        "Insufficient pitch change at the existing airspeed."
      ],
      "correct": 1,
      "explanation": "A rapid or excessive pitch increase can produce a lift increase and balloon while sufficient speed remains.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Roundout errors; ballooning",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Rudder alignment is important, but it is not the direct cause of the pitch-related lift increase described.",
        "Correct. A rapid or excessive pitch increase can produce a lift increase and balloon while sufficient speed remains.",
        "Incorrect. Too little roundout tends to leave excessive descent rather than create the described climb."
      ]
    },
    {
      "id": "PD-B02-CFI-018",
      "area": "High roundout",
      "prompt": "A learner begins the landing roundout much too high and then holds the airplane off while airspeed decays. Why should the instructor be prepared to go around?",
      "options": [
        "The earlier flare establishes a larger stall margin.",
        "The remaining float will consume the excess height gradually.",
        "A stall may occur well above touchdown height."
      ],
      "correct": 2,
      "explanation": "A high roundout can use the remaining kinetic energy before the airplane is close to the runway, creating a hard-landing risk.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Roundout too high",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Flare height alone does not increase the angle-of-attack or airspeed margin.",
        "Incorrect. A gentle, gradual settling is not assured as airspeed decays.",
        "Correct. A high roundout can use the remaining kinetic energy before the airplane is close to the runway, creating a hard-landing risk."
      ]
    },
    {
      "id": "PD-B02-CFI-019",
      "area": "Porpoising",
      "prompt": "After a nosewheel-first touchdown, a learner alternately pulls and pushes, producing repeated increasingly severe bounces. Which response best addresses the developing condition?",
      "options": [
        "Lower the nosewheel promptly to suppress the next bounce.",
        "Continue the landing using larger opposing pitch inputs.",
        "Go around using the approved procedure when feasible."
      ],
      "correct": 2,
      "explanation": "A timely go-around can stop the escalating cycle; use aircraft-specific guidance and available control.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Porpoising",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Forcing the nosewheel down can worsen impact loads and the pitching cycle.",
        "Incorrect. Larger, poorly timed opposing inputs can amplify the oscillations.",
        "Correct. A timely go-around can stop the escalating cycle; use aircraft-specific guidance and available control."
      ]
    },
    {
      "id": "PD-B02-CFI-020",
      "area": "Crosswind control functions",
      "prompt": "In a wing-low crosswind landing, a learner uses rudder to hold the airplane over the centerline but allows the nose to remain angled across the runway. Which control-role distinction needs correction?",
      "options": [
        "Elevator controls drift; aileron aligns the longitudinal axis.",
        "Aileron controls drift; rudder aligns the longitudinal axis.",
        "Rudder controls drift; elevator aligns the longitudinal axis."
      ],
      "correct": 1,
      "explanation": "The wing-low technique uses aileron to counter lateral drift and rudder to align the airplane with the runway.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Crosswind approach and landing",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Elevator is not the primary lateral-drift control, and aileron is not the primary yaw-alignment control.",
        "Correct. The wing-low technique uses aileron to counter lateral drift and rudder to align the airplane with the runway.",
        "Incorrect. Elevator does not align the airplane’s longitudinal axis in yaw."
      ]
    },
    {
      "id": "PD-B02-CFI-021",
      "area": "Crosswind rollout",
      "prompt": "After a successful crosswind touchdown, the learner centers the ailerons immediately as the airplane slows. Why is continued wind correction normally needed?",
      "options": [
        "Rudder input alone provides the required roll correction.",
        "Wind effects cease once the main wheels are loaded.",
        "Control effectiveness decreases as airspeed falls."
      ],
      "correct": 2,
      "explanation": "Appropriate wind correction generally needs to be maintained and adjusted as aerodynamic effectiveness changes during deceleration.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Crosswind landing roll",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Rudder primarily addresses yaw; it is not a substitute for aileron roll correction.",
        "Incorrect. Wind can still lift a wing or affect directional control after touchdown.",
        "Correct. Appropriate wind correction generally needs to be maintained and adjusted as aerodynamic effectiveness changes during deceleration."
      ]
    },
    {
      "id": "PD-B02-CFI-022",
      "area": "Short-field approach",
      "prompt": "A learner crosses the short-field landing threshold well above the planned height and faster than the target speed. Why is an acceptable calculated ground roll not enough to justify continuing?",
      "options": [
        "A lower loaded weight guarantees the charted total distance.",
        "Actual approach conditions exceed the chart assumptions.",
        "The charted ground roll includes any approach-height error."
      ],
      "correct": 1,
      "explanation": "Excess speed and height can increase airborne distance, float, and required stopping distance.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Short-field landings; stabilized approach",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Lower weight can help but does not guarantee the result after an excessive-speed, excessive-height approach.",
        "Correct. Excess speed and height can increase airborne distance, float, and required stopping distance.",
        "Incorrect. Ground roll begins after touchdown and does not include arbitrary additional airborne distance."
      ]
    },
    {
      "id": "PD-B02-CFI-023",
      "area": "Soft-field touchdown",
      "prompt": "During a soft-field landing exercise, the learner abruptly lowers the nosewheel immediately after main-wheel contact. What objective has been missed?",
      "options": [
        "Apply maximum braking as the main wheels touch.",
        "Keep nosewheel loading light as practical.",
        "Lower the nosewheel promptly for steering."
      ],
      "correct": 1,
      "explanation": "The soft-field technique seeks to protect the nosewheel and reduce its tendency to dig in, as appropriate for the airplane.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Soft-field landings",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Maximum braking is not the central soft-field objective and may be inappropriate to the surface.",
        "Correct. The soft-field technique seeks to protect the nosewheel and reduce its tendency to dig in, as appropriate for the airplane.",
        "Incorrect. Promptly loading the nosewheel conflicts with the stated soft-field objective; directional control still matters."
      ]
    },
    {
      "id": "PD-B02-CFI-024",
      "area": "Go-around coordination",
      "prompt": "In a clockwise-propeller training airplane, a learner applies full power for a go-around at low speed and allows a strong left yaw. What should the instructor connect to the power change?",
      "options": [
        "The need to raise the nose until yaw disappears.",
        "The need for appropriate coordinated rudder as left-turning tendencies increase.",
        "The need to hold the rudder fixed because power cannot affect yaw."
      ],
      "correct": 1,
      "explanation": "High power, low speed, and pitch attitude can increase left-turning tendencies and rudder demand.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Go-arounds; control coordination",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Pitching up does not substitute for coordinated directional control and can reduce airspeed further.",
        "Correct. High power, low speed, and pitch attitude can increase left-turning tendencies and rudder demand.",
        "Incorrect. Power changes can materially change yawing moments."
      ]
    },
    {
      "id": "PD-B02-CFI-025",
      "area": "Go-around configuration",
      "prompt": "A learner retracts all flaps abruptly at low speed during a go-around. Why can a staged, aircraft-specific reconfiguration be important?",
      "options": [
        "Flap retraction always adds engine power.",
        "The gear must remain extended at every climb speed.",
        "An abrupt reduction in lift can cause settling."
      ],
      "correct": 2,
      "explanation": "Removing lift-producing flap deflection before adequate speed and climb are established can produce a loss of lift and settling.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Go-arounds; configuration management",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Flaps change aerodynamic configuration rather than engine power.",
        "Incorrect. Gear timing depends on the aircraft and procedure, not a universal all-speed prohibition.",
        "Correct. Removing lift-producing flap deflection before adequate speed and climb are established can produce a loss of lift and settling."
      ]
    },
    {
      "id": "PD-B02-CFI-026",
      "area": "Slips versus skids",
      "prompt": "A learner proposes a forward slip to increase descent rate without increasing airspeed, using a bank and opposite rudder. Which distinction should the instructor emphasize?",
      "options": [
        "Opposite rudder necessarily makes every maneuver a spin.",
        "A controlled slip is not the same as an excessive-rudder skid.",
        "A slip removes the need to observe airspeed and aircraft limitations."
      ],
      "correct": 1,
      "explanation": "A forward slip deliberately creates sideslip with coordinated monitoring; a skid from excessive inside rudder has different control and stall implications.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 9: Forward slips; slips and skids",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf",
      "standardCode": "FI.VII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Opposing controls do not automatically establish a spin; stall and autorotation are required.",
        "Correct. A forward slip deliberately creates sideslip with coordinated monitoring; a skid from excessive inside rudder has different control and stall implications.",
        "Incorrect. Approved slip limitations, airspeed, fuel indications, and aircraft-specific cautions still matter."
      ]
    },
    {
      "id": "PD-B02-CFI-027",
      "area": "Stall cues",
      "prompt": "A learner waits for a specific indicated speed before recognizing a stall, despite buffet and deteriorating control effectiveness. What should the next demonstration establish?",
      "options": [
        "The marked airspeed as an invariant stall threshold.",
        "Angle of attack and aerodynamic warning cues.",
        "Pitch attitude alone as the stall criterion."
      ],
      "correct": 1,
      "explanation": "Demonstrate the available aerodynamic and aircraft-specific cues in relation to angle of attack.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 5: Stall recognition",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/06_afh_ch5.pdf",
      "standardCode": "FI.IX",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The threshold speed changes with load factor, weight, configuration, and contamination.",
        "Correct. Demonstrate the available aerodynamic and aircraft-specific cues in relation to angle of attack.",
        "Incorrect. An airplane can stall at different pitch attitudes; attitude alone does not define the critical angle."
      ]
    },
    {
      "id": "PD-B02-CFI-028",
      "area": "Banked stall demonstrations",
      "prompt": "An instructor compares a gentle, coordinated climbing turn with a heavily loaded pullout at the same indicated airspeed. Which point should the demonstration isolate?",
      "options": [
        "Angle of attack and load factor, rather than airspeed alone, determine the stall margin.",
        "The climbing airplane cannot stall.",
        "The pullout airplane must stall because it is descending."
      ],
      "correct": 0,
      "explanation": "Different load demands can produce different angles of attack at the same airspeed; the wing stalls at its critical angle.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 5: Accelerated stalls; angle of attack",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/06_afh_ch5.pdf",
      "standardCode": "FI.IX",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Different load demands can produce different angles of attack at the same airspeed; the wing stalls at its critical angle.",
        "Incorrect. A climb does not prevent a stall.",
        "Incorrect. Descent alone does not establish a stall."
      ]
    },
    {
      "id": "PD-B02-CFI-029",
      "area": "Rudder misuse",
      "prompt": "A learner attempts to correct every low wing in slow flight with rudder alone. What should the instructor assess before prescribing more practice?",
      "options": [
        "Whether the rudder can replace the elevator throughout the maneuver.",
        "Whether the turn coordinator can be ignored at low speed.",
        "Whether the learner understands yaw, roll coupling, and coordinated use of controls."
      ],
      "correct": 2,
      "explanation": "The error suggests a control-concept problem, not merely insufficient repetition. Teach the aircraft-appropriate coordinated response.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 3: Coordination; primary flight controls",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/04_afh_ch3.pdf",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Rudder is not a substitute for pitch control.",
        "Incorrect. Coordination remains important at low speed.",
        "Correct. The error suggests a control-concept problem, not merely insufficient repetition. Teach the aircraft-appropriate coordinated response."
      ]
    },
    {
      "id": "PD-B02-CFI-030",
      "area": "Steep-turn altitude loss",
      "prompt": "In a steep turn, a learner notices a large nose-low condition and attempts to recover using only abrupt aft elevator. Which instruction most directly avoids excessive loading?",
      "options": [
        "Hold the bank and recover with a rapid pitch increase.",
        "Reduce excessive bank and recover smoothly.",
        "Increase bank before increasing back pressure."
      ],
      "correct": 1,
      "explanation": "Reducing excessive bank restores a more useful vertical lift component and supports a smoother recovery within limits.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 10: Steep turns; recovery from altitude loss",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/11_afh_ch10.pdf",
      "standardCode": "FI.VIII",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A rapid pull while steeply banked can create excessive load factor and stall risk.",
        "Correct. Reducing excessive bank restores a more useful vertical lift component and supports a smoother recovery within limits.",
        "Incorrect. More bank can aggravate the descending spiral and required loading."
      ]
    },
    {
      "id": "PD-B02-CFI-031",
      "area": "Clearing procedures",
      "prompt": "A learner performs an accurate VFR maneuver but starts it without checking the surrounding airspace. How should the instructor evaluate the flight?",
      "options": [
        "The maneuver’s accuracy does not satisfy the missing collision-avoidance task.",
        "Clearing is needed only when another aircraft has been reported.",
        "Accurate aircraft control compensates for the missing visual check."
      ],
      "correct": 0,
      "explanation": "Aircraft control and traffic avoidance are concurrent responsibilities; a good maneuver does not excuse missing the safety preparation.",
      "reference": "Aviation Instructor’s Handbook, Chapter 9: Collision avoidance; instructor supervision",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/11_aih_chapter_9.pdf",
      "standardCode": "FI.V",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Aircraft control and traffic avoidance are concurrent responsibilities; a good maneuver does not excuse missing the safety preparation.",
        "Incorrect. Unreported traffic can still be present.",
        "Incorrect. The two competencies are not interchangeable."
      ]
    },
    {
      "id": "PD-B02-CFI-032",
      "area": "Student attention",
      "prompt": "An instructor repeatedly points out traffic and makes all position calls while the learner completes a cross-country. What assessment best reveals the learner’s independent situational awareness?",
      "options": [
        "Add more instructor position calls during the same route.",
        "Require the learner to identify and manage those tasks within safe supervision.",
        "Grade only the accuracy of the learner’s heading changes."
      ],
      "correct": 1,
      "explanation": "Appropriately transferring responsibility reveals what the learner can perceive and manage without continuous prompts.",
      "reference": "Aviation Instructor’s Handbook, Chapter 9: Developing learner responsibility",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/11_aih_chapter_9.pdf",
      "standardCode": "FI.IV",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. More prompts can mask the same dependency.",
        "Correct. Appropriately transferring responsibility reveals what the learner can perceive and manage without continuous prompts.",
        "Incorrect. Heading accuracy alone does not assess traffic and position awareness."
      ]
    },
    {
      "id": "PD-B02-CFI-033",
      "area": "Figure-based omitted weight",
      "prompt": "Refer to PHAK Figure 10-10. A learner omits the 170 lb passenger and the passenger’s 13,770 lb-in moment from the calculation. Which resulting total weight and moment are consistent with that omission?",
      "options": [
        "1,478.9 lb and 108,316 lb-in.",
        "1,478.9 lb and 135,856 lb-in.",
        "1,648.9 lb and 108,316 lb-in."
      ],
      "correct": 0,
      "explanation": "Subtracting the passenger from both totals gives 1,478.9 lb and 108,316 lb-in.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 10: Figure 10-10; total moments",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Subtracting the passenger from both totals gives 1,478.9 lb and 108,316 lb-in.",
        "Incorrect. The moment has been increased instead of decreased.",
        "Incorrect. Omitting the passenger must reduce total weight as well as moment."
      ],
      "figureRef": {
        "supplement": "Pilot’s Handbook of Aeronautical Knowledge, Chapter 10",
        "figure": "10-10",
        "url": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10"
      }
    },
    {
      "id": "PD-B02-CFI-034",
      "area": "Fuel-burn direction",
      "prompt": "A learner says burning fuel always moves the CG forward. Which comparison correctly determines the direction for a particular airplane?",
      "options": [
        "Fuel-tank arm relative to the current CG.",
        "Fuel octane relative to engine compression.",
        "Fuel quantity relative to maximum gross weight."
      ],
      "correct": 0,
      "explanation": "Removing weight ahead of the CG moves it aft; removing weight aft moves it forward. The tank location relative to current CG controls the direction.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 10: Removal of weight; fuel use",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf",
      "standardCode": "FI.II",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Removing weight ahead of the CG moves it aft; removing weight aft moves it forward. The tank location relative to current CG controls the direction.",
        "Incorrect. Fuel grade is not a longitudinal loading arm.",
        "Incorrect. Fuel quantity affects the size of the change but does not by itself identify direction."
      ]
    },
    {
      "id": "PD-B02-CFI-035",
      "area": "Training records",
      "prompt": "A learner’s progress notes say only \"good flight\" despite recurring errors. Which record would be more useful for the next instructor?",
      "options": [
        "A list of unrelated flights completed by other learners.",
        "A general statement that the learner is pleasant.",
        "Observed performance, remaining difficulties, and the next training objective."
      ],
      "correct": 2,
      "explanation": "Specific progress evidence supports continuity and planning without requiring the next instructor to rediscover the same gaps.",
      "reference": "Aviation Instructor’s Handbook, Chapter 7: Training syllabus; records of progress",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/09_aih_chapter_7.pdf",
      "standardCode": "FI.I",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Other learners’ activity does not establish this learner’s training needs.",
        "Incorrect. Personal impressions do not document the skills needing work.",
        "Correct. Specific progress evidence supports continuity and planning without requiring the next instructor to rediscover the same gaps."
      ]
    },
    {
      "id": "PD-B02-CFI-036",
      "area": "Relearning after a gap",
      "prompt": "After a long training interruption, a learner recalls the procedure but performs it inconsistently. What is the best basis for deciding where to resume?",
      "options": [
        "The number of months originally spent in training alone.",
        "The assumption that recall establishes unchanged proficiency.",
        "An assessment of retained knowledge and actual performance."
      ],
      "correct": 2,
      "explanation": "Resume from demonstrated retention and skill, using review to restore missing building blocks.",
      "reference": "Aviation Instructor’s Handbook, Chapter 7: Use of the syllabus; individual progress",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/09_aih_chapter_7.pdf",
      "standardCode": "FI.I",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Elapsed training history does not establish current competence.",
        "Incorrect. Procedural recall and reliable performance are distinct evidence.",
        "Correct. Resume from demonstrated retention and skill, using review to restore missing building blocks."
      ]
    },
    {
      "id": "PD-B02-CFI-037",
      "area": "Teaching transfer",
      "prompt": "A learner can fly turns around a point in one familiar practice area but cannot adapt when the wind and landmarks differ. Which exercise best targets the limitation?",
      "options": [
        "Replace the task with memorization of the original bank angles.",
        "Use the identical landmark and heading on every flight.",
        "Repeat the objective with varied wind and reference-point geometry."
      ],
      "correct": 2,
      "explanation": "Variation requires applying the underlying wind-correction principle rather than reproducing one visual script.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Transfer of learning; varied practice",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "FI.IV",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Fixed bank-angle recall does not adapt the maneuver to changed wind.",
        "Incorrect. The identical setting can reinforce dependence on familiar cues.",
        "Correct. Variation requires applying the underlying wind-correction principle rather than reproducing one visual script."
      ]
    },
    {
      "id": "PD-B02-CFI-038",
      "area": "Demonstration perspective",
      "prompt": "A learner cannot tell which control change caused a pitch response because the instructor changes several controls at once during an explanation. What revision best clarifies cause and effect?",
      "options": [
        "Make the simultaneous control changes faster.",
        "Ask the learner to memorize the final attitude without explanation.",
        "Isolate the relevant input when safe, then recombine the controls."
      ],
      "correct": 2,
      "explanation": "Separating an input during an appropriate demonstration makes its effect observable before the complete maneuver is practiced.",
      "reference": "Aviation Instructor’s Handbook, Chapter 5: Demonstration-performance; instructional clarity",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/07_aih_chapter_5.pdf",
      "standardCode": "FI.IV",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Faster combined changes can make attribution harder.",
        "Incorrect. A final attitude alone does not explain the control relationship.",
        "Correct. Separating an input during an appropriate demonstration makes its effect observable before the complete maneuver is practiced."
      ]
    },
    {
      "id": "PD-B02-CFI-039",
      "area": "Objective completion",
      "prompt": "A learner completes one accurate landing only after continuous instructor commands. The lesson standard requires consistent performance without assistance. What conclusion follows?",
      "options": [
        "The stated completion standard has not yet been demonstrated.",
        "The standard is met because touchdown was within the target zone.",
        "The standard should be changed after the flight to match the outcome."
      ],
      "correct": 0,
      "explanation": "The assistance condition is part of the standard, not an optional detail.",
      "reference": "Aviation Instructor’s Handbook, Chapter 7: Completion standards",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/09_aih_chapter_7.pdf",
      "standardCode": "FI.IV",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The assistance condition is part of the standard, not an optional detail.",
        "Incorrect. Touchdown location is only one component; the independent-performance requirement remains.",
        "Incorrect. Changing the standard retroactively obscures rather than evaluates the learning need."
      ]
    },
    {
      "id": "PD-B02-CFI-040",
      "area": "Instructor modeling",
      "prompt": "During a routine flight, an instructor dismisses a checklist item as unnecessary although the learner was taught to complete it. What instructional risk is most direct?",
      "options": [
        "The learner may adopt the observed shortcut as an acceptable norm.",
        "The shortcut strengthens the learner’s understanding of the approved procedure.",
        "The demonstration has no learning effect unless it is formally briefed."
      ],
      "correct": 0,
      "explanation": "An instructor’s behavior is a powerful example; observed disregard can undercut the standard taught in the classroom.",
      "reference": "Aviation Instructor’s Handbook, Chapter 8: Professionalism; instructor role modeling",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/10_aih_chapter_8.pdf",
      "standardCode": "FI.I",
      "standardDoc": "FAA-S-ACS-25",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "cfi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. An instructor’s behavior is a powerful example; observed disregard can undercut the standard taught in the classroom.",
        "Incorrect. An unexplained departure from the procedure can normalize the shortcut rather than clarify the standard.",
        "Incorrect. Learners also learn from informal instructor conduct."
      ]
    }
  ],
  "cfii": [
    {
      "id": "PD-DRAFT-CFII-001",
      "area": "VOR reverse sensing",
      "prompt": "A learner is inbound on the 090° radial toward a VOR but selects 090° on a conventional CDI. The instrument shows FROM. What selection gives normal inbound course sensing?",
      "options": [
        "180° with TO.",
        "270° with TO.",
        "090° with FROM."
      ],
      "correct": 1,
      "explanation": "The reciprocal inbound course on the 090° radial is 270°, with a TO indication.",
      "reference": "AIM 1-1-3: VOR course selection",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html",
      "standardCode": "PTS Area VII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 180° is not the inbound course from a position east of the station.",
        "Correct. The reciprocal inbound course on the 090° radial is 270°, with a TO indication.",
        "Incorrect. 090° FROM describes the outbound course on the 090° radial; using it inbound produces reverse sensing."
      ]
    },
    {
      "id": "PD-DRAFT-CFII-002",
      "area": "VOT indications",
      "prompt": "During a ground VOT check with the CDI centered, a learner obtains 180° with a TO indication. What does this combination indicate?",
      "options": [
        "The receiver has a 180° sensing error.",
        "The receiver shows the expected VOT indication.",
        "The receiver is set for an airborne checkpoint."
      ],
      "correct": 1,
      "explanation": "A normal VOT shows 000° FROM or 180° TO with the CDI centered, subject to the applicable tolerance.",
      "reference": "AIM 1-1-4: VOR Receiver Check",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html",
      "standardCode": "PTS Area II",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 180° TO is one of the normal VOT combinations, not evidence of a 180° error.",
        "Correct. A normal VOT shows 000° FROM or 180° TO with the CDI centered, subject to the applicable tolerance.",
        "Incorrect. This combination does not designate an airborne checkpoint."
      ]
    },
    {
      "id": "PD-DRAFT-CFII-003",
      "area": "DME limitations",
      "prompt": "A learner plans to calculate groundspeed from the rate of DME change while crossing abeam a station at constant groundspeed. Why is this method unsuitable at that point?",
      "options": [
        "The range-change rate is not the along-track groundspeed.",
        "The station transmits only distance above its antenna.",
        "DME stops measuring range outside the selected radial."
      ],
      "correct": 0,
      "explanation": "Near abeam, much of the motion is across rather than along the line to the station. Range rate therefore understates along-track speed.",
      "reference": "AIM 1-1-7: Distance Measuring Equipment",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html",
      "standardCode": "PTS Area VII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Near abeam, much of the motion is across rather than along the line to the station. Range rate therefore understates along-track speed.",
        "Incorrect. DME measures slant range, which includes both horizontal and vertical separation.",
        "Incorrect. DME range is not restricted to the selected VOR radial."
      ]
    },
    {
      "id": "PD-DRAFT-CFII-004",
      "area": "Glideslope interception",
      "prompt": "A learner intercepts an ILS glideslope from well above the published interception altitude and follows an unusually steep indication. Which possibility should the instructor address?",
      "options": [
        "Elimination of localizer sensitivity.",
        "Automatic conversion to a back-course approach.",
        "Reception of a false glideslope."
      ],
      "correct": 2,
      "explanation": "False glideslopes can occur above the normal path. Use the published procedure and intercept the correct path as prescribed.",
      "reference": "AIM 1-1-9: ILS glideslope",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html",
      "standardCode": "PTS Area II",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Glideslope interception does not eliminate localizer course sensitivity.",
        "Incorrect. A glideslope indication does not convert the procedure into a localizer back-course approach.",
        "Correct. False glideslopes can occur above the normal path. Use the published procedure and intercept the correct path as prescribed."
      ]
    },
    {
      "id": "PD-DRAFT-CFII-005",
      "area": "Holding wind correction",
      "prompt": "In a timed hold, the learner needs 8° of wind correction on the inbound leg. As an initial outbound correction under the usual FAA guidance, approximately what correction should be tried?",
      "options": [
        "8°.",
        "16°.",
        "24°."
      ],
      "correct": 2,
      "explanation": "Start with approximately three times the inbound correction on the outbound heading, then refine for the actual pattern.",
      "reference": "AIM 5-3-8: Holding: wind correction",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "PTS Area V",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "advanced",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The same angle does not provide the recommended initial compensation for both outbound drift and turn effects.",
        "Incorrect. Twice the inbound correction is less than the usual initial triple-drift correction.",
        "Correct. Start with approximately three times the inbound correction on the outbound heading, then refine for the actual pattern."
      ]
    },
    {
      "id": "PD-DRAFT-CFII-006",
      "area": "Procedure turn limits",
      "prompt": "A learner reaches the IAF for a conventional procedure turn marked \"remain within 10 NM.\" No different restriction is issued. What does the 10 NM limit principally constrain?",
      "options": [
        "The distance from the specified fix during the maneuver.",
        "The distance flown after beginning the inbound descent.",
        "The length of each straight leg of the maneuver."
      ],
      "correct": 0,
      "explanation": "The depicted distance bounds the maneuver relative to the specified fix, including the turn; it is not a separate allowance for each leg.",
      "reference": "AIM 5-4-9: Procedure Turn and Hold-in-lieu of Procedure Turn",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_4.html",
      "standardCode": "PTS Area VIII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The depicted distance bounds the maneuver relative to the specified fix, including the turn; it is not a separate allowance for each leg.",
        "Incorrect. The restriction is not limited to distance after an inbound descent.",
        "Incorrect. A 10 NM outbound leg plus the turn could exceed the protected maneuvering limit."
      ]
    },
    {
      "id": "PD-DRAFT-CFII-007",
      "area": "MSA interpretation",
      "prompt": "A learner outside a published approach segment proposes descending to a charted minimum safe altitude solely because the airplane is inside the MSA circle. What should the instructor explain?",
      "options": [
        "MSA guarantees navigation-signal reception throughout the circle.",
        "MSA replaces assigned altitudes whenever it is lower.",
        "MSA provides emergency obstacle clearance, not descent authorization."
      ],
      "correct": 2,
      "explanation": "An MSA provides specified obstacle clearance for emergency use; it does not by itself authorize descent or establish an approach segment.",
      "reference": "AIM 5-4-5: Instrument Approach Procedure Charts: minimum safe altitude",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_4.html",
      "standardCode": "PTS Area VIII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Navigation-signal coverage is not guaranteed by the MSA.",
        "Incorrect. An assigned altitude remains controlling unless amended or an emergency justifies deviation.",
        "Correct. An MSA provides specified obstacle clearance for emergency use; it does not by itself authorize descent or establish an approach segment."
      ]
    },
    {
      "id": "PD-DRAFT-CFII-008",
      "area": "VOR identification",
      "prompt": "A learner tunes a VOR listed by NOTAM as unusable. The CDI centers and no warning flag appears. What is the correct instructional conclusion?",
      "options": [
        "The receiver may be used if its most recent check was within tolerance.",
        "The centered CDI establishes that the NOTAM is no longer applicable.",
        "The navigation indication must be disregarded despite its appearance."
      ],
      "correct": 2,
      "explanation": "A facility known to be unusable can produce misleading indications; lack of a flag is not assurance of validity.",
      "reference": "AIM 1-1-1: General: unusable navigation facilities",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html",
      "standardCode": "PTS Area VII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A receiver accuracy check does not establish that the ground facility is usable.",
        "Incorrect. An apparently valid indication does not supersede the published unusable status.",
        "Correct. A facility known to be unusable can produce misleading indications; lack of a flag is not assurance of validity."
      ]
    },
    {
      "id": "PD-DRAFT-CFII-009",
      "area": "Holding altitude change",
      "prompt": "A conventional timed hold uses one-minute inbound legs at 14,000 feet MSL and below. The airplane climbs from 14,000 to 15,000 feet MSL in the hold. No different timing is published or assigned. What inbound timing applies at 15,000 feet?",
      "options": [
        "One and one-half minutes.",
        "One minute.",
        "Two minutes."
      ],
      "correct": 0,
      "explanation": "Above 14,000 feet MSL, the conventional inbound leg is one and one-half minutes.",
      "reference": "AIM 5-3-8: Holding: timing",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "PTS Area VI",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "advanced",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Above 14,000 feet MSL, the conventional inbound leg is one and one-half minutes.",
        "Incorrect. One minute applies at 14,000 feet MSL and below.",
        "Incorrect. Two minutes is not the standard timing for this altitude."
      ]
    },
    {
      "id": "PD-DRAFT-CFII-010",
      "area": "Instrument task management",
      "prompt": "During an instrument lesson, an ATC reroute exceeds the learner’s ability to enter and verify it while maintaining control. Which action best demonstrates appropriate workload management?",
      "options": [
        "Complete the entry before correcting the flight-path deviation.",
        "Accept the clearance and verify the route after interception.",
        "Maintain control and request time or delaying vectors."
      ],
      "correct": 2,
      "explanation": "Use ATC and available resources to create time while maintaining aircraft control, then enter and verify the clearance.",
      "reference": "AIH Chapter 1: Single-pilot resource management; task management",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/03_aih_chapter_1.pdf",
      "standardCode": "PTS Area II",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Navigation entry must not take priority over controlling the airplane.",
        "Incorrect. Flying an unverified route can create a new clearance or terrain risk.",
        "Correct. Use ATC and available resources to create time while maintaining aircraft control, then enter and verify the clearance."
      ]
    },
    {
      "id": "PD-B02-CFII-011",
      "area": "Wind correction diagnosis",
      "prompt": "A learner holds the correct inbound course but the heading differs from the selected course by 12°. The CDI remains centered. What should the instructor explain?",
      "options": [
        "The heading difference may be the required wind correction.",
        "The OBS must be changed to the heading to remove the difference.",
        "The centered CDI proves that no crosswind exists."
      ],
      "correct": 0,
      "explanation": "Course is the intended ground path; a different heading can be needed to hold it in wind.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Navigation systems; tracking a course",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Course is the intended ground path; a different heading can be needed to hold it in wind.",
        "Incorrect. Changing the selected course to match heading would change the navigation reference rather than correct the drift.",
        "Incorrect. A centered CDI can result from successful wind correction."
      ]
    },
    {
      "id": "PD-B02-CFII-012",
      "area": "Intercept versus tracking",
      "prompt": "A learner uses a large intercept angle to regain a VOR course, then retains that heading after the CDI centers and crosses through the course. Which skill is missing?",
      "options": [
        "Increasing the intercept angle after course capture.",
        "Treating the CDI as a heading selector.",
        "Transition from interception to a wind-corrected tracking heading."
      ],
      "correct": 2,
      "explanation": "An intercept heading brings the airplane to the course; it must then change to a heading that maintains the course.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: VOR course interception and tracking",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A larger continuing intercept would increase overshoot.",
        "Incorrect. The CDI indicates course displacement rather than selecting airplane heading.",
        "Correct. An intercept heading brings the airplane to the course; it must then change to a heading that maintains the course."
      ]
    },
    {
      "id": "PD-B02-CFII-013",
      "area": "TO/FROM ambiguity",
      "prompt": "Near VOR station passage, a learner makes large corrections in response to rapid CDI movement and a TO/FROM transition. What should the instructor emphasize?",
      "options": [
        "Treat every CDI movement as an equal lateral displacement.",
        "Maintain control and recognize the expected station-passage sensitivity.",
        "Assume the OBS setting has physically turned the airplane."
      ],
      "correct": 1,
      "explanation": "Near the station, small position changes can cause large angular changes; do not chase transient indications at the expense of control.",
      "reference": "AIM Chapter 1, Section 1: VOR characteristics; station passage",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html",
      "standardCode": "PTS Area VII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Angular deviation does not represent a fixed distance, especially near the facility.",
        "Correct. Near the station, small position changes can cause large angular changes; do not chase transient indications at the expense of control.",
        "Incorrect. The OBS changes the selected course reference, not aircraft heading."
      ]
    },
    {
      "id": "PD-B02-CFII-014",
      "area": "DME arc control",
      "prompt": "A learner flying a DME arc notices the distance increasing steadily above the assigned arc radius. Which correction principle applies?",
      "options": [
        "Turn farther away from the station to increase the radius.",
        "Adjust the flight path toward the station to reduce the excess radius.",
        "Change the DME channel to make the reading match the clearance."
      ],
      "correct": 1,
      "explanation": "The airplane is outside the desired arc; a controlled correction toward the station reduces range. Use a suitable arc technique and monitor trend.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: DME arcs",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Turning farther outward worsens the increasing radius.",
        "Correct. The airplane is outside the desired arc; a controlled correction toward the station reduces range. Use a suitable arc technique and monitor trend.",
        "Incorrect. Changing the tuned station does not correct the actual path relative to the assigned facility."
      ]
    },
    {
      "id": "PD-B02-CFII-015",
      "area": "DME station selection",
      "prompt": "A learner reads distance from a VOR/DME while using a separately tuned localizer and assumes it is distance from the runway threshold. What must be verified?",
      "options": [
        "Only whether the number decreases on final.",
        "The facility providing distance and the chart’s specified distance reference.",
        "Only whether the localizer is centered."
      ],
      "correct": 1,
      "explanation": "DME is distance to the selected facility, which may not be at the threshold or the approach’s intended reference.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Navigation systems; DME pairing and approach use",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A decreasing number does not identify the correct station or reference point.",
        "Correct. DME is distance to the selected facility, which may not be at the threshold or the approach’s intended reference.",
        "Incorrect. Localizer alignment does not establish which DME source is selected."
      ]
    },
    {
      "id": "PD-B02-CFII-016",
      "area": "Flight director",
      "prompt": "A learner follows flight-director bars but assumes the airplane will move the controls automatically. Which distinction should be taught?",
      "options": [
        "It controls the airplane whenever the command bars appear.",
        "It displays actual attitude; the pilot must derive every command.",
        "It displays commands; the autopilot must be engaged to fly them automatically."
      ],
      "correct": 2,
      "explanation": "Flight-director guidance and autopilot engagement are distinct; verify equipment modes and engagement.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Flight directors and autopilots",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area II",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Visible guidance does not establish automatic control engagement.",
        "Incorrect. The bars represent commands rather than merely a second actual-attitude display.",
        "Correct. Flight-director guidance and autopilot engagement are distinct; verify equipment modes and engagement."
      ]
    },
    {
      "id": "PD-B02-CFII-017",
      "area": "Armed versus active modes",
      "prompt": "A learner sees an approach mode armed and stops monitoring the active vertical mode. Why is that unsafe?",
      "options": [
        "Armed identifies the current controlling mode.",
        "Armed does not necessarily mean controlling.",
        "Armed cancels the previous altitude constraint."
      ],
      "correct": 1,
      "explanation": "An armed mode is prepared for a later capture; the active mode may still be controlling the airplane.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Electronic flight displays; autopilot mode awareness",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area II",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The active mode, not an armed label by itself, identifies current control.",
        "Correct. An armed mode is prepared for a later capture; the active mode may still be controlling the airplane.",
        "Incorrect. Automation mode selection does not amend a clearance or procedure restriction."
      ]
    },
    {
      "id": "PD-B02-CFII-018",
      "area": "Altitude selector",
      "prompt": "A learner changes the altitude preselector but leaves the autopilot in altitude hold. The airplane does not climb. What is the most direct explanation?",
      "options": [
        "A target selection may require a separate climb-mode selection.",
        "An altitude selection also changes the pressure setting.",
        "Altitude hold always climbs to the newest selected value."
      ],
      "correct": 0,
      "explanation": "A preselected target is not necessarily an active vertical-path command; use the installation-specific procedure.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Autopilot functions; selected and active modes",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area II",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. A preselected target is not necessarily an active vertical-path command; use the installation-specific procedure.",
        "Incorrect. Altitude preselection and altimeter pressure setting are different controls and functions.",
        "Incorrect. This is not how every system operates, and the stem describes continued altitude hold."
      ]
    },
    {
      "id": "PD-B02-CFII-019",
      "area": "Navigation-source selection",
      "prompt": "On an ILS lesson, the learner’s CDI remains centered on an FMS course while the raw localizer indication disagrees. Which check addresses the primary issue?",
      "options": [
        "Verify the active navigation source and the intended approach guidance.",
        "Change the altimeter setting until the indications agree.",
        "Ignore the localizer if the magenta line is centered."
      ],
      "correct": 0,
      "explanation": "A centered display can refer to a different source than the one intended for the procedure; verify source and modes.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Electronic flight displays; navigation-source management",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. A centered display can refer to a different source than the one intended for the procedure; verify source and modes.",
        "Incorrect. Barometric setting does not reconcile lateral navigation sources.",
        "Incorrect. Course color or centering alone does not establish that the required ILS source is controlling."
      ]
    },
    {
      "id": "PD-B02-CFII-020",
      "area": "AHRS and air data",
      "prompt": "A glass-cockpit trainer loses reliable airspeed and altitude indications while attitude remains valid from an independent source. Which distinction is useful for diagnosis?",
      "options": [
        "All glass-cockpit indications must fail together.",
        "Valid attitude proves the pitot-static system is normal.",
        "Air-data information and attitude information can have different sensor sources."
      ],
      "correct": 2,
      "explanation": "Attitude may be supplied by AHRS while pressure-derived quantities come through air-data sensors; identify the actual installation and independent evidence.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 8: Air data computers; attitude and heading reference systems",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf",
      "standardCode": "PTS Area II",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Integrated displays can present information from separate systems with different failure modes.",
        "Incorrect. An attitude sensor does not verify pitot and static pressures.",
        "Correct. Attitude may be supplied by AHRS while pressure-derived quantities come through air-data sensors; identify the actual installation and independent evidence."
      ]
    },
    {
      "id": "PD-B02-CFII-021",
      "area": "Rate-one turn planning",
      "prompt": "A learner must make a 75° heading change using a reliable standard-rate indication. Disregarding roll-in and rollout corrections, approximately how long is the turn?",
      "options": [
        "15 seconds.",
        "25 seconds.",
        "45 seconds."
      ],
      "correct": 1,
      "explanation": "75 ÷ 3 = 25 seconds; actual execution must account for establishing and removing bank.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Timed turns",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VI",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "advanced",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 15 seconds at 3° per second changes heading by 45°.",
        "Correct. 75 ÷ 3 = 25 seconds; actual execution must account for establishing and removing bank.",
        "Incorrect. 45 seconds at standard rate changes heading by 135°."
      ]
    },
    {
      "id": "PD-B02-CFII-022",
      "area": "Turn rate at altitude",
      "prompt": "A learner uses the same bank angle at a higher true airspeed and expects the same rate of turn. What should the instructor demonstrate?",
      "options": [
        "At the same bank, increased TAS reduces turn rate.",
        "At the same bank, increased TAS increases turn rate.",
        "Turn rate depends on bank alone."
      ],
      "correct": 0,
      "explanation": "For a coordinated level turn, rate is proportional to tan(bank)/TAS.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Airplane basic flight maneuvers; turns",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VI",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. For a coordinated level turn, rate is proportional to tan(bank)/TAS.",
        "Incorrect. This reverses the speed relationship.",
        "Incorrect. Speed and bank both influence turn rate."
      ]
    },
    {
      "id": "PD-B02-CFII-023",
      "area": "Compass interpretation",
      "prompt": "In the Northern Hemisphere, a learner begins a turn from a northerly heading using a conventional magnetic compass. The compass initially lags or may indicate a turn opposite the actual direction. Which error is being demonstrated?",
      "options": [
        "Localizer reverse sensing.",
        "Acceleration error on an east heading.",
        "Northerly turning error."
      ],
      "correct": 2,
      "explanation": "Compass dip produces characteristic turning errors that are strongest around north and south headings.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 8: Magnetic compass; turning errors",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf",
      "standardCode": "PTS Area II",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "advanced",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Localizer sensing is unrelated to magnetic-compass dip.",
        "Incorrect. The stem describes turning from north, not straight-line acceleration on east or west.",
        "Correct. Compass dip produces characteristic turning errors that are strongest around north and south headings."
      ]
    },
    {
      "id": "PD-B02-CFII-024",
      "area": "Timed-turn verification",
      "prompt": "A learner completes a timed turn while partial panel, then checks the magnetic compass during a continuing acceleration. Why might the immediate heading check mislead?",
      "options": [
        "The compass requires a functioning attitude indicator to operate.",
        "A timed turn permanently changes local variation.",
        "Compass acceleration error can contaminate the comparison."
      ],
      "correct": 2,
      "explanation": "Verify under conditions suitable for a stable compass reading rather than mixing a maneuver-induced error with the heading assessment.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 8: Magnetic compass errors; reliable comparison conditions",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/10_phak_ch8.pdf",
      "standardCode": "PTS Area VI",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The magnetic compass is independent of the attitude indicator.",
        "Incorrect. The maneuver does not change local magnetic variation.",
        "Correct. Verify under conditions suitable for a stable compass reading rather than mixing a maneuver-induced error with the heading assessment."
      ]
    },
    {
      "id": "PD-B02-CFII-025",
      "area": "Instrument failure isolation",
      "prompt": "During a lesson, an attitude display and a second display fed by the same AHRS agree, but an independent standby attitude source disagrees. Why is agreement between the first two insufficient?",
      "options": [
        "They may share a common erroneous input.",
        "The standby source must be wrong because it is outnumbered.",
        "Agreement proves both are independent."
      ],
      "correct": 0,
      "explanation": "Multiple displays of one sensor do not provide independent corroboration; compare genuinely independent sources and other flight evidence.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: IFR emergencies; instrument failure diagnosis",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area IX",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Multiple displays of one sensor do not provide independent corroboration; compare genuinely independent sources and other flight evidence.",
        "Incorrect. Failure diagnosis depends on source independence and consistency, not a vote among screen counts.",
        "Incorrect. Visual separation of screens does not establish sensor independence."
      ]
    },
    {
      "id": "PD-B02-CFII-026",
      "area": "Pitch versus vertical speed",
      "prompt": "A learner makes large alternating pitch changes to keep a conventional VSI exactly on zero. Which coaching point best addresses the resulting oscillation?",
      "options": [
        "Ignore airspeed and altitude while chasing the VSI.",
        "Increase correction size whenever the VSI lags.",
        "Use attitude to establish the condition and allow for instrument lag."
      ],
      "correct": 2,
      "explanation": "A stable attitude and a disciplined cross-check avoid overcontrolling a lagging rate indication.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Attitude instrument flying; cross-check and interpretation",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VI",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Other instruments are needed to assess the actual flight condition.",
        "Incorrect. Larger corrections based on lag tend to worsen the oscillation.",
        "Correct. A stable attitude and a disciplined cross-check avoid overcontrolling a lagging rate indication."
      ]
    },
    {
      "id": "PD-B02-CFII-027",
      "area": "Power changes",
      "prompt": "During instrument flight, a learner changes power substantially but holds every control fixed and expects airspeed alone to change. What should be demonstrated?",
      "options": [
        "Power changes can require pitch, trim, and coordination adjustments.",
        "Trim substitutes for monitoring the resulting flight path.",
        "Power changes have no effect on pitch or yaw tendencies."
      ],
      "correct": 0,
      "explanation": "Thrust and propeller effects can change pitching and yawing moments; establish the desired condition and retrim as appropriate.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Attitude instrument flying; power control",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VI",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Thrust and propeller effects can change pitching and yawing moments; establish the desired condition and retrim as appropriate.",
        "Incorrect. Trim relieves force; it does not replace checking attitude, airspeed, altitude, and coordination.",
        "Incorrect. The claim excludes real coupling that varies by airplane."
      ]
    },
    {
      "id": "PD-B02-CFII-028",
      "area": "Holding entry assessment",
      "prompt": "A learner chooses a recommended entry correctly but cannot identify the holding side on the chart. Why is more assessment needed?",
      "options": [
        "Correct entry selection establishes complete holding competence.",
        "The entry label determines the permitted holding speed.",
        "Pattern orientation and restrictions still need assessment."
      ],
      "correct": 2,
      "explanation": "A correct label does not demonstrate that the learner can track the pattern on its protected side within restrictions.",
      "reference": "AIM Chapter 5, Section 3: 5-3-8: holding entries and protected airspace",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "PTS Area IV",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Subsequent tracking, orientation, speed, and timing remain separate evidence.",
        "Incorrect. Holding speeds are published or assigned independently of which entry is used.",
        "Correct. A correct label does not demonstrate that the learner can track the pattern on its protected side within restrictions."
      ]
    },
    {
      "id": "PD-B02-CFII-029",
      "area": "Holding-speed exceedance",
      "prompt": "A learner cannot slow to a charted holding-speed limit before crossing the fix. What action should the CFII teach?",
      "options": [
        "Assume that a wider bank will guarantee obstacle protection.",
        "Advise ATC promptly and obtain an appropriate alternative.",
        "Enter at the higher speed because the fix is correct."
      ],
      "correct": 1,
      "explanation": "Notify ATC when unable to comply; speed affects the protected pattern and may require different handling.",
      "reference": "AIM Chapter 5, Section 3: 5-3-8: maximum holding airspeeds",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html",
      "standardCode": "PTS Area V",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A chosen bank does not guarantee protection outside the procedure’s assumptions.",
        "Correct. Notify ATC when unable to comply; speed affects the protected pattern and may require different handling.",
        "Incorrect. Fix identification does not compensate for exceeding a protection assumption."
      ]
    },
    {
      "id": "PD-B02-CFII-030",
      "area": "Procedure-turn direction",
      "prompt": "A learner plans a procedure turn on the side opposite the charted barb because it appears shorter. What should the instructor explain?",
      "options": [
        "Either side provides identical protection whenever the airplane is below 200 knots.",
        "The depicted maneuvering side is part of the protected procedure.",
        "The barb selects only the runway lighting system."
      ],
      "correct": 1,
      "explanation": "The procedure-turn side and limits define intended obstacle-protected maneuvering; do not substitute the opposite side.",
      "reference": "AIM Chapter 5, Section 4: 5-4-9: procedure turns",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_4.html",
      "standardCode": "PTS Area V",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A generic speed condition does not authorize maneuvering on an unprotected side.",
        "Correct. The procedure-turn side and limits define intended obstacle-protected maneuvering; do not substitute the opposite side.",
        "Incorrect. The barb is procedure-turn guidance, not lighting information."
      ]
    },
    {
      "id": "PD-B02-CFII-031",
      "area": "Stepdown fixes",
      "prompt": "A learner follows a constant descent angle that would cross an intermediate stepdown fix below its published altitude. Why must the descent be revised?",
      "options": [
        "Only the altitude at the MAP matters on a nonprecision approach.",
        "A constant-angle descent automatically supersedes every stepdown altitude.",
        "Advisory path geometry does not remove a published altitude restriction."
      ],
      "correct": 2,
      "explanation": "Comply with each applicable altitude restriction; a convenient continuous descent must be planned within them.",
      "reference": "AIM Chapter 5, Section 4: 5-4-5: descent angles and stepdown fixes",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_4.html",
      "standardCode": "PTS Area VIII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Obstacle protection and procedure compliance apply before the MAP as well.",
        "Incorrect. A path angle is not authority to disregard restrictions.",
        "Correct. Comply with each applicable altitude restriction; a convenient continuous descent must be planned within them."
      ]
    },
    {
      "id": "PD-B02-CFII-032",
      "area": "DA versus MDA teaching",
      "prompt": "A learner treats an LNAV MDA as a fly-through decision altitude because that technique is familiar from an ILS. What underlying distinction needs emphasis?",
      "options": [
        "MDA provides the same automatic descent allowance as an ILS DA.",
        "MDA is a minimum altitude that may not be penetrated without the required conditions.",
        "A visible vertical cue changes every MDA to DA."
      ],
      "correct": 1,
      "explanation": "A nonprecision MDA must be respected; a familiar precision-approach habit does not change its legal or procedural meaning.",
      "reference": "14 CFR 91.175: Paragraphs (c) and (e)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.175",
      "standardCode": "PTS Area VIII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. An MDA is not simply interchangeable with DA.",
        "Correct. A nonprecision MDA must be respected; a familiar precision-approach habit does not change its legal or procedural meaning.",
        "Incorrect. Advisory vertical guidance does not change the published minima type."
      ]
    },
    {
      "id": "PD-B02-CFII-033",
      "area": "Threshold elevation",
      "prompt": "An approach chart gives DA 1,260 feet MSL and threshold elevation 860 feet MSL. What height above that threshold does the DA represent?",
      "options": [
        "260 feet.",
        "400 feet.",
        "860 feet."
      ],
      "correct": 1,
      "explanation": "1,260 − 860 = 400 feet above the threshold for this calculation.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Approach charts; altitude and height",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area VIII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "advanced",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 260 is not the difference between the stated MSL elevations.",
        "Correct. 1,260 − 860 = 400 feet above the threshold for this calculation.",
        "Incorrect. 860 feet is the threshold’s MSL elevation, not the height difference."
      ]
    },
    {
      "id": "PD-B02-CFII-034",
      "area": "Cold-temperature teaching",
      "prompt": "A learner applies a required cold-temperature altitude correction by changing the altimeter’s pressure setting rather than following the published correction procedure. What misconception should be corrected?",
      "options": [
        "Every temperature correction is made by increasing the local altimeter setting.",
        "Temperature correction and pressure-setting adjustment are different operations.",
        "A correct pressure setting removes the need for required temperature corrections."
      ],
      "correct": 1,
      "explanation": "Use the prescribed cold-temperature procedure for affected altitudes while maintaining the required altimeter setting; do not invent a pressure change.",
      "reference": "AIM Chapter 7, Section 3: 7-3-5: Cold Temperature Airport Procedures",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap7_section_3.html",
      "standardCode": "PTS Area II",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A temperature correction is not a general license to falsify the pressure setting.",
        "Correct. Use the prescribed cold-temperature procedure for affected altitudes while maintaining the required altimeter setting; do not invent a pressure change.",
        "Incorrect. A proper pressure setting does not eliminate nonstandard-temperature error."
      ]
    },
    {
      "id": "PD-B02-CFII-035",
      "area": "Missed-approach performance",
      "prompt": "A learner briefs the missed-approach course but has not checked a published climb gradient higher than standard. What additional planning is essential?",
      "options": [
        "Compare required climb with airplane capability in the expected conditions.",
        "Use the final-approach descent rate as the available climb rate.",
        "Assume any approach-approved airplane can meet every missed gradient."
      ],
      "correct": 0,
      "explanation": "A path briefing must include performance; weight, altitude, temperature, configuration, and groundspeed affect capability.",
      "reference": "AIM Chapter 5, Section 4: 5-4-21: missed approach climb requirements",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_4.html",
      "standardCode": "PTS Area VIII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. A path briefing must include performance; weight, altitude, temperature, configuration, and groundspeed affect capability.",
        "Incorrect. Descent rate does not demonstrate available climb performance.",
        "Incorrect. Navigation approval does not establish performance for every gradient."
      ]
    },
    {
      "id": "PD-B02-CFII-036",
      "area": "Runway environment identification",
      "prompt": "In low visibility, a learner sees a row of lights but cannot determine whether they are approach lights or runway edge lights. What should govern descent below the applicable minimum?",
      "options": [
        "Any lights generally aligned with the final course.",
        "The learner’s expectation that the runway is ahead.",
        "A distinctly visible and identifiable qualifying reference, with all other conditions met."
      ],
      "correct": 2,
      "explanation": "The visual reference must be identifiable under the applicable rule, not merely a plausible light pattern.",
      "reference": "14 CFR 91.175: Paragraph (c)(3)",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-91.175",
      "standardCode": "PTS Area VIII",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. An unverified row of lights does not establish the required reference.",
        "Incorrect. Expectation is not visual identification.",
        "Correct. The visual reference must be identifiable under the applicable rule, not merely a plausible light pattern."
      ]
    },
    {
      "id": "PD-B02-CFII-037",
      "area": "Automation surprise",
      "prompt": "During an approach exercise, the airplane begins an unexpected climb after a mode change. What should the CFII reinforce first?",
      "options": [
        "Maintain control, verify modes and guidance, and use an appropriate simpler control mode if needed.",
        "Continue the unexpected path until the mode change finishes.",
        "Reprogram every route waypoint before correcting the flight path."
      ],
      "correct": 0,
      "explanation": "Control and mode awareness take priority; disconnect or simplify automation as appropriate under the equipment procedure.",
      "reference": "Instrument Flying Handbook, FAA-H-8083-15B: Automation management; IFR emergencies",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf",
      "standardCode": "PTS Area IX",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Control and mode awareness take priority; disconnect or simplify automation as appropriate under the equipment procedure.",
        "Incorrect. An unexpected deviation should be assessed and corrected, not passively accepted.",
        "Incorrect. Route editing is secondary to controlling the immediate flight path."
      ]
    },
    {
      "id": "PD-B02-CFII-038",
      "area": "Teaching instrument currency",
      "prompt": "A learner can document the minimum recent-experience tasks but performs poorly in a demanding approach scenario. What conclusion is appropriate?",
      "options": [
        "Legal recent experience does not by itself demonstrate current proficiency for the scenario.",
        "Recorded recent experience guarantees satisfactory performance in every instrument task.",
        "The weak scenario performance invalidates every prior logbook entry."
      ],
      "correct": 0,
      "explanation": "Currency requirements and demonstrated proficiency answer different questions; address the observed skill gap.",
      "reference": "Aviation Instructor’s Handbook, Chapter 1: Single-pilot resource management; proficiency and risk",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/03_aih_chapter_1.pdf",
      "standardCode": "PTS Area I",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Currency requirements and demonstrated proficiency answer different questions; address the observed skill gap.",
        "Incorrect. Minimum logged tasks do not guarantee every operational skill.",
        "Incorrect. A weak performance does not itself establish that prior entries were false."
      ]
    },
    {
      "id": "PD-B02-CFII-039",
      "area": "Assessment after a prompt",
      "prompt": "During a check, a learner begins a missed approach only after the instructor announces that the airplane has reached DA. What remains unproven?",
      "options": [
        "Execution after an explicit decision-point cue.",
        "Recognition that the instructor has spoken.",
        "Independent recognition of the decision point."
      ],
      "correct": 2,
      "explanation": "The instructor supplied the recognition cue; assess independent recognition separately within safe supervision.",
      "reference": "Aviation Instructor’s Handbook, Chapter 6: Assessment of actual performance",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/08_aih_chapter_6.pdf",
      "standardCode": "PTS Area IV",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The learner may have demonstrated response to the cue, but that does not establish independent timing.",
        "Incorrect. Hearing an announcement is not the operational task that remains unproven.",
        "Correct. The instructor supplied the recognition cue; assess independent recognition separately within safe supervision."
      ]
    },
    {
      "id": "PD-B02-CFII-040",
      "area": "Training progression",
      "prompt": "A learner can track a course, maintain altitude, and copy a clearance separately but loses control when all are combined. Which progression best addresses integration?",
      "options": [
        "Combine tasks gradually with explicit priorities and feedback.",
        "Add every possible failure at once to force adaptation.",
        "Continue isolated tasks indefinitely without integration."
      ],
      "correct": 0,
      "explanation": "Progressively increasing combined workload develops task management while preserving control priorities and useful feedback.",
      "reference": "Aviation Instructor’s Handbook, Chapter 7: Building blocks; scenario progression",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/09_aih_chapter_7.pdf",
      "standardCode": "PTS Area IV",
      "standardDoc": "FAA-S-8081-9E",
      "standardType": "PTS",
      "difficulty": "applied",
      "experienceLevel": "cfii",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Progressively increasing combined workload develops task management while preserving control priorities and useful feedback.",
        "Incorrect. An indiscriminate overload can obscure the underlying deficit and create unsafe practice.",
        "Incorrect. Isolated success does not itself develop the required integration."
      ]
    }
  ],
  "atp": [
    {
      "id": "PD-DRAFT-ATP-001",
      "area": "Mass limitations",
      "prompt": "A hypothetical transport airplane has a maximum takeoff weight of 68,000 lb, maximum landing weight of 60,000 lb, and maximum zero-fuel weight of 54,000 lb. Planned takeoff weight is 67,000 lb, including 12,000 lb of usable fuel. Predicted trip fuel burn is 8,000 lb. Which limitation is exceeded?",
      "options": [
        "Maximum takeoff weight by 1,000 lb.",
        "Maximum landing weight by 1,000 lb.",
        "Maximum zero-fuel weight by 1,000 lb."
      ],
      "correct": 2,
      "explanation": "Zero-fuel weight is 67,000 − 12,000 = 55,000 lb, exceeding the stated 54,000 lb limit. All limits must be satisfied separately.",
      "reference": "PHAK Chapter 10: Maximum zero fuel weight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Takeoff weight is 1,000 lb below its limit.",
        "Incorrect. Landing weight is 59,000 lb, which is 1,000 lb below its limit.",
        "Correct. Zero-fuel weight is 67,000 − 12,000 = 55,000 lb, exceeding the stated 54,000 lb limit. All limits must be satisfied separately."
      ]
    },
    {
      "id": "PD-DRAFT-ATP-002",
      "area": "Mach calculation",
      "prompt": "An airplane’s true airspeed is 450 knots where the local speed of sound is 600 knots. What is its Mach number?",
      "options": [
        "0.60.",
        "0.75.",
        "1.33."
      ],
      "correct": 1,
      "explanation": "Mach number is TAS divided by local speed of sound: 450/600 = 0.75.",
      "reference": "PHAK Chapter 5: Mach number",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "AA.I.D",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 0.60 does not follow from the stated speed ratio.",
        "Correct. Mach number is TAS divided by local speed of sound: 450/600 = 0.75.",
        "Incorrect. 1.33 reverses the numerator and denominator."
      ]
    },
    {
      "id": "PD-DRAFT-ATP-003",
      "area": "Engine-out performance",
      "prompt": "A transport airplane’s flight-planning data show that its one-engine-inoperative service ceiling is below the route’s terrain-clearance requirement. Which conclusion is justified by these data alone?",
      "options": [
        "An engine-out escape or drift-down analysis is required.",
        "An immediate descent will clear all terrain along the filed route.",
        "Maintaining the all-engines cruise Mach number will preserve altitude."
      ],
      "correct": 0,
      "explanation": "The crew needs an evaluated engine-out path and performance analysis; all-engines cruise capability does not demonstrate terrain clearance after an engine failure.",
      "reference": "PHAK Chapter 11: Climb performance; service ceiling",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The crew needs an evaluated engine-out path and performance analysis; all-engines cruise capability does not demonstrate terrain clearance after an engine failure.",
        "Incorrect. A service ceiling below the terrain requirement does not establish a safe path during descent.",
        "Incorrect. Cruise Mach selection does not replace lost climb capability or prove level-flight performance."
      ]
    },
    {
      "id": "PD-DRAFT-ATP-004",
      "area": "Takeoff decision speed",
      "prompt": "During a transport-airplane takeoff, a malfunction is recognized close to V1. Which definition of V1 is relevant to the stopping assessment?",
      "options": [
        "The speed at which a rejected takeoff must be fully stopped.",
        "The speed at which an engine failure must first become perceptible.",
        "The maximum speed for initiating the first action to stop within the accelerate-stop distance."
      ],
      "correct": 2,
      "explanation": "V1 includes the maximum speed by which the first stopping action must be taken for the accelerate-stop calculation. Follow the AFM and operator procedures.",
      "reference": "14 CFR 1.2: V1 definition",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.ecfr.gov/current/title-14/section-1.2",
      "standardCode": "AA.III",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. V1 is not the speed at which the airplane is already stopped.",
        "Incorrect. The failure recognition and action sequence is accounted for in takeoff performance; V1 is not simply the first perceptible-failure speed.",
        "Correct. V1 includes the maximum speed by which the first stopping action must be taken for the accelerate-stop calculation. Follow the AFM and operator procedures."
      ]
    },
    {
      "id": "PD-DRAFT-ATP-005",
      "area": "Landing performance",
      "prompt": "For a hypothetical airplane, the approved landing data for the expected conditions require 5,100 feet. Available landing distance is 5,000 feet. Actual airplane weight is below maximum landing weight. Which conclusion follows?",
      "options": [
        "The weight margin compensates for the distance shortfall.",
        "The landing-distance requirement is not met.",
        "The landing may be planned using the available runway length."
      ],
      "correct": 1,
      "explanation": "The applicable landing distance exceeds the distance available. A weight limit and a runway-performance limit are separate constraints.",
      "reference": "PHAK Chapter 11: Landing performance limitations",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Being below maximum landing weight does not override the performance calculation for the actual conditions.",
        "Correct. The applicable landing distance exceeds the distance available. A weight limit and a runway-performance limit are separate constraints.",
        "Incorrect. The available runway cannot be substituted for the required distance. Replan using approved data and applicable operating requirements."
      ]
    },
    {
      "id": "PD-DRAFT-ATP-006",
      "area": "Energy management",
      "prompt": "A transport airplane is high and fast near the end of an arrival. The crew’s revised plan requires a large configuration change, an excessive descent rate, and acceptance of an unstable final approach. Which decision best preserves the planned landing safety margin?",
      "options": [
        "Continue because the runway is longer than the landing distance.",
        "Use the maximum descent rate until the landing flare.",
        "Obtain additional track miles or discontinue the approach."
      ],
      "correct": 2,
      "explanation": "Create time and distance to meet stabilized criteria; discontinue if those criteria cannot be achieved under the operator procedure.",
      "reference": "PHAK Chapter 2: Risk management; hazardous attitudes",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
      "standardCode": "AA.I.F",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Runway length does not remove an unstable-approach risk or excess energy before touchdown.",
        "Incorrect. An excessive descent rate continued to the flare compounds rather than resolves the unstable condition.",
        "Correct. Create time and distance to meet stabilized criteria; discontinue if those criteria cannot be achieved under the operator procedure."
      ]
    },
    {
      "id": "PD-DRAFT-ATP-007",
      "area": "Swept-wing stalls",
      "prompt": "On a swept-wing airplane, an outboard wing stall can shift the remaining lift distribution inboard and forward. Which pitch tendency can result?",
      "options": [
        "No pitching moment.",
        "Pitch-down.",
        "Pitch-up."
      ],
      "correct": 2,
      "explanation": "The outboard portions of a swept wing lie aft. Losing their lift can shift the resultant forward and promote pitch-up. Aircraft design features can modify this tendency.",
      "reference": "PHAK Chapter 5: Swept wings; high-speed flight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "AA.I.D",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A shift of the lift resultant relative to the CG can change pitching moment.",
        "Incorrect. This is opposite the stated forward movement of the lift resultant.",
        "Correct. The outboard portions of a swept wing lie aft. Losing their lift can shift the resultant forward and promote pitch-up. Aircraft design features can modify this tendency."
      ]
    },
    {
      "id": "PD-DRAFT-ATP-008",
      "area": "Crew coordination",
      "prompt": "During a complex abnormal procedure, both pilots begin working independently on the same checklist while flight-path deviations develop. Which correction most directly addresses the immediate coordination failure?",
      "options": [
        "Complete the checklist before restoring flight-path monitoring.",
        "Reestablish pilot-flying and pilot-monitoring responsibilities.",
        "Assign both pilots to verify every checklist item simultaneously."
      ],
      "correct": 1,
      "explanation": "Explicitly restore control and monitoring duties so that aircraft control is maintained while the abnormal procedure is managed.",
      "reference": "PHAK Chapter 2: Crew resource management; workload management",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
      "standardCode": "AA.I.F",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Checklist completion cannot take priority over controlling the airplane.",
        "Correct. Explicitly restore control and monitoring duties so that aircraft control is maintained while the abnormal procedure is managed.",
        "Incorrect. Both pilots concentrating on the checklist can leave flight-path monitoring unassigned."
      ]
    },
    {
      "id": "PD-DRAFT-ATP-009",
      "area": "Thrust and climb",
      "prompt": "At a given weight and flight condition, an airplane has adequate thrust to maintain level flight after an engine failure but no excess thrust. What steady climb capability is available at that condition?",
      "options": [
        "A climb at the all-engines best-rate speed.",
        "No positive steady climb rate.",
        "A climb at half the all-engines climb rate."
      ],
      "correct": 1,
      "explanation": "With thrust equal to drag and no excess power at the stated condition, there is no positive steady climb capability.",
      "reference": "PHAK Chapter 11: Climb performance: excess thrust and power",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A selected speed does not create excess thrust or power.",
        "Correct. With thrust equal to drag and no excess power at the stated condition, there is no positive steady climb capability.",
        "Incorrect. Engine count does not establish a proportional climb-rate reduction; climb depends on excess power."
      ]
    },
    {
      "id": "PD-DRAFT-ATP-010",
      "area": "Jet propulsion",
      "prompt": "In steady level flight, a jet airplane’s thrust equals drag. For a simplified constant-thrust model, the condition of maximum excess thrust corresponds most directly to",
      "options": [
        "minimum drag.",
        "maximum lift coefficient.",
        "maximum true airspeed."
      ],
      "correct": 0,
      "explanation": "With available thrust held constant, the difference between thrust and drag is greatest where drag is least.",
      "reference": "PHAK Chapter 11: Thrust required and available",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. With available thrust held constant, the difference between thrust and drag is greatest where drag is least.",
        "Incorrect. Maximum lift coefficient is a stall boundary, not the general minimum-drag condition.",
        "Incorrect. At high speed, parasite drag increases; maximum airspeed is not generally maximum excess thrust."
      ]
    },
    {
      "id": "PD-B02-ATP-011",
      "area": "Critical Mach",
      "prompt": "An airplane is below Mach 1, but local airflow over part of its wing reaches Mach 1. Which condition has been reached?",
      "options": [
        "Mach 1 in the free stream.",
        "Maximum operating Mach number.",
        "Critical Mach number."
      ],
      "correct": 2,
      "explanation": "Critical Mach is the aircraft Mach number at which some local airflow first reaches sonic speed.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: High-speed flight; critical Mach",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.D",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The stem expressly says the airplane’s free-stream Mach number is below 1.",
        "Incorrect. MMO is an operating limit, not the definition of first local sonic flow.",
        "Correct. Critical Mach is the aircraft Mach number at which some local airflow first reaches sonic speed."
      ]
    },
    {
      "id": "PD-B02-ATP-012",
      "area": "Operating speed limits",
      "prompt": "A transport airplane has VMO 260 KIAS and MMO 0.80. The instruments show 240 KIAS and Mach 0.82. Which conclusion follows?",
      "options": [
        "Neither limit is exceeded because IAS is below VMO.",
        "The Mach operating limit is exceeded.",
        "The IAS operating limit is exceeded."
      ],
      "correct": 1,
      "explanation": "Both limits must be respected; the Mach limit can be controlling even with IAS below VMO.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Airspeed and Mach limitations",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.D",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Meeting one limit does not excuse exceeding the other.",
        "Correct. Both limits must be respected; the Mach limit can be controlling even with IAS below VMO.",
        "Incorrect. 240 KIAS is below the stated VMO; the exceedance is Mach."
      ]
    },
    {
      "id": "PD-B02-ATP-013",
      "area": "Climb at constant IAS",
      "prompt": "A jet climbs at constant IAS into lower density and lower temperature. Ignoring compressibility corrections to IAS, why can Mach number increase?",
      "options": [
        "Mach is fixed whenever IAS is fixed.",
        "TAS falls while local speed of sound rises.",
        "TAS rises while local speed of sound falls."
      ],
      "correct": 2,
      "explanation": "At a given indicated dynamic pressure, lower density requires higher TAS; colder air reduces sonic speed, increasing the ratio.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 5: High-speed flight; Mach and temperature",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/07_phak_ch5_0.pdf",
      "standardCode": "AA.I.D",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. IAS and Mach are different measures and do not remain in a fixed ratio through a climb.",
        "Incorrect. This reverses both stated tendencies.",
        "Correct. At a given indicated dynamic pressure, lower density requires higher TAS; colder air reduces sonic speed, increasing the ratio."
      ]
    },
    {
      "id": "PD-B02-ATP-014",
      "area": "Shock-induced separation",
      "prompt": "Above critical Mach, a stronger shock forms on the wing and the boundary layer separates behind it. Which consequence is most directly associated with this process?",
      "options": [
        "A guaranteed increase in maximum lift coefficient.",
        "Elimination of all pressure drag.",
        "Increased drag and possible buffet."
      ],
      "correct": 2,
      "explanation": "Shock-related separation can create drag rise, buffet, and control changes.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Mach buffet; shock waves",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.D",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Shock-induced separation is not a guaranteed lift improvement.",
        "Incorrect. A shock and separated flow add rather than eliminate drag mechanisms.",
        "Correct. Shock-related separation can create drag rise, buffet, and control changes."
      ]
    },
    {
      "id": "PD-B02-ATP-015",
      "area": "Swept-wing flow",
      "prompt": "Why do swept wings commonly use design features that discourage an early tip stall?",
      "options": [
        "Tip lift loss can reduce aileron effectiveness and promote adverse pitch behavior.",
        "Tip lift contributes only to drag and not to airplane support.",
        "Tip stall guarantees a benign nose-down recovery in every design."
      ],
      "correct": 0,
      "explanation": "Outboard stall can affect roll control and shift the remaining lift distribution in a way that promotes pitch-up.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Swept-wing stall characteristics",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.D",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Outboard stall can affect roll control and shift the remaining lift distribution in a way that promotes pitch-up.",
        "Incorrect. Outboard wing lift supports weight and affects moments.",
        "Incorrect. Swept-wing tip stall can have unfavorable pitch characteristics; a benign response is not assured."
      ]
    },
    {
      "id": "PD-B02-ATP-016",
      "area": "Deep-stall risk",
      "prompt": "On a susceptible T-tail design at very high angle of attack, the horizontal tail may become immersed in the wing’s separated wake. What is the principal concern?",
      "options": [
        "Insufficient nose-down control to reduce angle of attack.",
        "A guaranteed reduction in stall speed.",
        "An automatic increase in forward visibility."
      ],
      "correct": 0,
      "explanation": "Blanketing can reduce tail effectiveness and make recovery difficult; prevention and aircraft-specific procedures are critical.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Swept-wing and T-tail stall characteristics",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.D",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Blanketing can reduce tail effectiveness and make recovery difficult; prevention and aircraft-specific procedures are critical.",
        "Incorrect. Tail blanketing does not guarantee a favorable stall-speed change.",
        "Incorrect. Visibility does not explain the aerodynamic recovery problem."
      ]
    },
    {
      "id": "PD-B02-ATP-017",
      "area": "Jet thrust response",
      "prompt": "A jet is allowed to become very slow with engines near idle on final approach. Why can a late thrust demand provide less immediate protection than expected?",
      "options": [
        "Jet engines produce maximum thrust at idle RPM.",
        "Engine acceleration and thrust buildup take time.",
        "Selecting a higher thrust setting instantly restores all lost energy."
      ],
      "correct": 1,
      "explanation": "Spool-up delay means the crew must manage energy before a large last-moment demand becomes necessary.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Jet engine response; stabilized approaches",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Idle is a low-thrust condition, not maximum thrust.",
        "Correct. Spool-up delay means the crew must manage energy before a large last-moment demand becomes necessary.",
        "Incorrect. A lever movement does not instantaneously restore speed or climb capability."
      ]
    },
    {
      "id": "PD-B02-ATP-018",
      "area": "Ground spoilers",
      "prompt": "After touchdown, ground spoilers deploy normally. Besides aerodynamic drag, how can they improve wheel-braking effectiveness?",
      "options": [
        "They substitute reverse thrust for wheel braking.",
        "They increase the runway’s friction coefficient.",
        "They transfer more airplane weight to the wheels."
      ],
      "correct": 2,
      "explanation": "Reducing lift increases the portion of weight carried by the wheels, improving potential tire braking force.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Spoilers",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Spoilers and reverse thrust are distinct systems; lift dumping does not replace the braking function.",
        "Incorrect. The surface friction coefficient is not changed by the spoiler deployment.",
        "Correct. Reducing lift increases the portion of weight carried by the wheels, improving potential tire braking force."
      ]
    },
    {
      "id": "PD-B02-ATP-019",
      "area": "Reverse thrust limits",
      "prompt": "Why must reverse-thrust use follow aircraft-specific limitations and runway-condition guidance?",
      "options": [
        "Reverse guarantees the same stopping performance on every surface.",
        "Reverse can affect directional control as well as stopping.",
        "Reverse eliminates the need to monitor asymmetric indications."
      ],
      "correct": 1,
      "explanation": "Reverse effects vary with installation and conditions; asymmetry or low-friction surfaces can affect directional control.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Thrust reversers",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A contaminated surface and aircraft-specific assumptions still matter.",
        "Correct. Reverse effects vary with installation and conditions; asymmetry or low-friction surfaces can affect directional control.",
        "Incorrect. Asymmetric deployment or thrust remains important to recognize and manage."
      ]
    },
    {
      "id": "PD-B02-ATP-020",
      "area": "Engine-out takeoff planning",
      "prompt": "A crew has adequate all-engines takeoff distance but has not evaluated the required engine-out takeoff path. Which conclusion is justified?",
      "options": [
        "Engine-out obstacle clearance remains unproven.",
        "All-engines runway distance establishes the engine-out climb path.",
        "Structural weight compliance establishes every takeoff performance limit."
      ],
      "correct": 0,
      "explanation": "The engine-out path and its obstacle/performance constraints must be evaluated separately.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Takeoff performance; engine failure considerations",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.III",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The engine-out path and its obstacle/performance constraints must be evaluated separately.",
        "Incorrect. Adequate acceleration with all engines does not prove the climb capability after a failure.",
        "Incorrect. Structural and performance-limited weights can differ."
      ]
    },
    {
      "id": "PD-B02-ATP-021",
      "area": "Net versus gross data",
      "prompt": "A hypothetical takeoff analysis supplies a gross climb gradient of 3.0 percent and a net gradient of 2.2 percent after the specified planning reduction. For an obstacle check requiring net performance, which value should be used?",
      "options": [
        "2.2 percent.",
        "3.0 percent.",
        "5.2 percent."
      ],
      "correct": 0,
      "explanation": "Use the defined net data for a check that explicitly requires net performance.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Performance planning; use of applicable data",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Use the defined net data for a check that explicitly requires net performance.",
        "Incorrect. Gross performance omits the specified reduction.",
        "Incorrect. Adding the two gradients has no meaning for this check."
      ]
    },
    {
      "id": "PD-B02-ATP-022",
      "area": "Climb-gradient geometry",
      "prompt": "A hypothetical net flight path climbs at a constant 2.0 percent over 10,000 horizontal feet. What height gain does that gradient represent?",
      "options": [
        "20 feet.",
        "200 feet.",
        "2,000 feet."
      ],
      "correct": 1,
      "explanation": "0.02 × 10,000 = 200 feet. This is geometry only; an actual obstacle analysis includes its stated reference height and requirements.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 11: Climb gradient",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/13_phak_ch11.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 2 percent is 0.02, not 0.002.",
        "Correct. 0.02 × 10,000 = 200 feet. This is geometry only; an actual obstacle analysis includes its stated reference height and requirements.",
        "Incorrect. 2,000 feet represents a 20 percent gradient."
      ]
    },
    {
      "id": "PD-B02-ATP-023",
      "area": "Runway contamination",
      "prompt": "A dry-runway stopping calculation meets the available distance. Standing water is subsequently reported. What is the appropriate planning implication?",
      "options": [
        "Reassess using applicable contaminated-runway data and limitations.",
        "Assume reverse thrust makes the surface condition immaterial.",
        "Retain the dry result if brake pressure can reach its normal maximum."
      ],
      "correct": 0,
      "explanation": "Water can alter braking, hydroplaning, and directional control; the dry assumptions no longer establish compliance.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Landing; runway conditions",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Water can alter braking, hydroplaning, and directional control; the dry assumptions no longer establish compliance.",
        "Incorrect. Reverse availability does not remove the need for applicable performance data.",
        "Incorrect. Brake pressure does not guarantee tire friction on a contaminated surface."
      ]
    },
    {
      "id": "PD-B02-ATP-024",
      "area": "Rejected-takeoff energy",
      "prompt": "A hypothetical rejection occurs at the same groundspeed but at a higher mass than planned. Considering translational kinetic energy alone, what changes?",
      "options": [
        "Energy to be dissipated increases in proportion to mass.",
        "Energy remains unchanged because speed is unchanged.",
        "Energy decreases because the tires carry more weight."
      ],
      "correct": 0,
      "explanation": "Translational kinetic energy is one-half mass times speed squared. With groundspeed unchanged, a higher mass raises the initial energy to be dissipated in direct proportion to that mass.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 4: Kinetic energy and mass",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Translational kinetic energy is one-half mass times speed squared. With groundspeed unchanged, a higher mass raises the initial energy to be dissipated in direct proportion to that mass.",
        "Incorrect. Both mass and speed determine kinetic energy.",
        "Incorrect. Increased wheel loading does not reduce the airplane’s initial kinetic energy."
      ]
    },
    {
      "id": "PD-B02-ATP-025",
      "area": "Combined energy change",
      "prompt": "Compared with a reference landing, mass is 10 percent higher and touchdown groundspeed is 5 percent higher. Considering translational kinetic energy alone, the increase is approximately",
      "options": [
        "15 percent.",
        "21 percent.",
        "32 percent."
      ],
      "correct": 1,
      "explanation": "Energy ratio is 1.10 × 1.05² = 1.21275, approximately a 21 percent increase.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 4: Kinetic energy",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Adding the percentage changes ignores the squared-speed and combined effects.",
        "Correct. Energy ratio is 1.10 × 1.05² = 1.21275, approximately a 21 percent increase.",
        "Incorrect. 32 percent overstates the result for the stated mass and speed ratios."
      ]
    },
    {
      "id": "PD-B02-ATP-026",
      "area": "Pressurization control",
      "prompt": "A pressurized airplane receives a steady conditioned-air inflow. The outflow valve opens farther. Other conditions unchanged, the direct tendency is for cabin pressure to",
      "options": [
        "remain fixed regardless of valve position.",
        "increase and cabin altitude to fall.",
        "decrease and cabin altitude to rise."
      ],
      "correct": 2,
      "explanation": "Greater outflow tends to reduce cabin absolute pressure, corresponding to a higher cabin altitude.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Cabin pressurization; outflow valve",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The valve regulates the relationship between inflow and outflow and therefore influences pressure.",
        "Incorrect. This describes reduced rather than increased outflow under the simplified conditions.",
        "Correct. Greater outflow tends to reduce cabin absolute pressure, corresponding to a higher cabin altitude."
      ]
    },
    {
      "id": "PD-B02-ATP-027",
      "area": "Differential-pressure calculation",
      "prompt": "Cabin absolute pressure is 10.2 psi and ambient absolute pressure is 4.4 psi. What cabin differential pressure does this represent?",
      "options": [
        "4.4 psi.",
        "5.8 psi.",
        "14.6 psi."
      ],
      "correct": 1,
      "explanation": "Differential pressure is cabin minus ambient: 10.2 − 4.4 = 5.8 psi.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Cabin differential pressure",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 4.4 psi is the ambient absolute pressure.",
        "Correct. Differential pressure is cabin minus ambient: 10.2 − 4.4 = 5.8 psi.",
        "Incorrect. Adding the pressures does not give differential pressure."
      ]
    },
    {
      "id": "PD-B02-ATP-028",
      "area": "Pressurization indications",
      "prompt": "An airplane remains level, but cabin altitude climbs steadily. Why is airplane altitude alone insufficient to assess the event?",
      "options": [
        "Cabin pressure can change independently of the airplane’s geometric altitude.",
        "A level airplane cannot lose cabin pressure.",
        "Cabin altitude is a duplicate of the airplane altimeter at all times."
      ],
      "correct": 0,
      "explanation": "Pressurization depends on the system’s inflow, outflow, sealing, and control; level flight does not ensure stable cabin pressure.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Cabin pressurization indicators",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Pressurization depends on the system’s inflow, outflow, sealing, and control; level flight does not ensure stable cabin pressure.",
        "Incorrect. A leak or system malfunction can occur during level flight.",
        "Incorrect. Cabin altitude is the pressure altitude corresponding to cabin pressure, not necessarily airplane altitude."
      ]
    },
    {
      "id": "PD-B02-ATP-029",
      "area": "Bleed-air performance",
      "prompt": "Selecting an engine bleed-air service increases the demand for compressor air. Why may takeoff or climb performance data depend on that selection?",
      "options": [
        "Every bleed selection increases net engine thrust.",
        "Bleed configuration changes only cabin sound level.",
        "Extracted air and associated loads can reduce available propulsive performance."
      ],
      "correct": 2,
      "explanation": "Performance data can account for the air and power diverted to services; use the applicable configuration and limitations.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 15: Bleed air; turbine performance",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/16_afh_ch15.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Bleed extraction is not a universal thrust increase.",
        "Incorrect. The effect can include engine performance and system limits, not merely sound.",
        "Correct. Performance data can account for the air and power diverted to services; use the applicable configuration and limitations."
      ]
    },
    {
      "id": "PD-B02-ATP-030",
      "area": "Turbine limits",
      "prompt": "On a cold day, a turboprop reaches its torque limit while turbine temperature remains below its limit. Which response respects both constraints?",
      "options": [
        "Respect the torque limit despite unused temperature margin.",
        "Average the torque and temperature margins before increasing power.",
        "Increase power until the temperature limit becomes controlling."
      ],
      "correct": 0,
      "explanation": "Every applicable limit must be observed; one remaining margin does not override a reached limit.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 15: Turbine operating limits",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/16_afh_ch15.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Every applicable limit must be observed; one remaining margin does not override a reached limit.",
        "Incorrect. Different physical limits cannot be combined by averaging their margins.",
        "Incorrect. Increasing power beyond the torque limit would exceed an applicable constraint."
      ]
    },
    {
      "id": "PD-B02-ATP-031",
      "area": "Free-turbine engines",
      "prompt": "In a free-turbine turboprop, the propeller-driving power turbine is not rigidly connected to the gas-generator shaft. What does that arrangement permit?",
      "options": [
        "Propeller speed can be governed separately from gas-generator speed.",
        "Propeller thrust becomes independent of shaft power.",
        "Propeller speed must always equal compressor speed."
      ],
      "correct": 0,
      "explanation": "The separate power turbine and reduction gearbox allow propeller speed selection within the governing system and limits.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 15: Split-shaft/free-turbine engines",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/16_afh_ch15.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The separate power turbine and reduction gearbox allow propeller speed selection within the governing system and limits.",
        "Incorrect. The propeller still receives power and produces thrust through aerodynamic work.",
        "Incorrect. Separate shafts do not require identical rotational speed."
      ]
    },
    {
      "id": "PD-B02-ATP-032",
      "area": "Compressor stall",
      "prompt": "A turbine engine experiences disturbed compressor airflow, abnormal indications, and a possible bang or vibration. Why is the approved response aircraft-specific?",
      "options": [
        "The symptom guarantees complete mechanical seizure.",
        "Every compressor disturbance requires identical lever movement in every engine.",
        "The appropriate actions depend on the engine and installation limits."
      ],
      "correct": 2,
      "explanation": "Use the AFM/QRH and identify the condition; compressor disturbances can have different severity and prescribed responses.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 7: Turbine engines; compressor stalls",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/09_phak_ch7.pdf",
      "standardCode": "AA.I.A",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A compressor stall or surge does not necessarily mean the rotor has seized.",
        "Incorrect. A universal unqualified action can conflict with installation-specific procedures.",
        "Correct. Use the AFM/QRH and identify the condition; compressor disturbances can have different severity and prescribed responses."
      ]
    },
    {
      "id": "PD-B02-ATP-033",
      "area": "Optimum cruise altitude",
      "prompt": "As fuel is burned during a long jet flight, why can a higher cruise altitude become suitable later even if it was unsuitable at the initial weight?",
      "options": [
        "The speed of sound increases automatically as fuel quantity falls.",
        "Fuel burn increases structural maximum weight.",
        "Reduced weight can improve the available aerodynamic and climb margins."
      ],
      "correct": 2,
      "explanation": "Lower weight changes required lift and performance; any step climb still requires current limitations, weather, clearance, and capability checks.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: High-altitude performance; weight effects",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Fuel quantity does not directly set atmospheric sonic speed.",
        "Incorrect. The approved structural limit does not increase because fuel is used.",
        "Correct. Lower weight changes required lift and performance; any step climb still requires current limitations, weather, clearance, and capability checks."
      ]
    },
    {
      "id": "PD-B02-ATP-034",
      "area": "Equal-time point",
      "prompt": "Two airports are 600 NM apart. At points along the route, groundspeed toward airport A is 400 knots and toward airport B is 300 knots. Approximately how far from A is the equal-time point?",
      "options": [
        "257 NM.",
        "300 NM.",
        "343 NM."
      ],
      "correct": 2,
      "explanation": "Let x be distance from airport A. Equal return and onward times require x/400 = (600 − x)/300. Solving gives x = 342.86 NM, approximately 343 NM from A.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 16: Time, speed, and distance",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 257 NM is the remaining distance to B at the correct point.",
        "Incorrect. The midpoint gives unequal times when the directional groundspeeds differ.",
        "Correct. Let x be distance from airport A. Equal return and onward times require x/400 = (600 − x)/300. Solving gives x = 342.86 NM, approximately 343 NM from A."
      ]
    },
    {
      "id": "PD-B02-ATP-035",
      "area": "Return fuel planning",
      "prompt": "A planning exercise allows 3.5 hours of flight before the required reserve. Outbound groundspeed is 180 knots and return groundspeed is 120 knots, with the same fuel flow throughout. What is the farthest outbound distance permitting a return within that time?",
      "options": [
        "210 NM.",
        "252 NM.",
        "315 NM."
      ],
      "correct": 1,
      "explanation": "Solve x/180 + x/120 = 3.5; x = 252 NM. Other operational allowances are excluded by the exercise.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 16: Fuel endurance; return planning",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 210 NM would require only 2.917 hours for the round trip.",
        "Correct. Solve x/180 + x/120 = 3.5; x = 252 NM. Other operational allowances are excluded by the exercise.",
        "Incorrect. 315 NM would require 4.375 hours, exceeding the available time."
      ]
    },
    {
      "id": "PD-B02-ATP-036",
      "area": "Figure-based landing limit",
      "prompt": "Refer to PHAK Figure 10-11. The sample takeoff weight is 5,038 lb and maximum landing weight is 4,940 lb. What minimum weight reduction is needed before landing, considering only that weight limit?",
      "options": [
        "74 lb.",
        "98 lb.",
        "122 lb."
      ],
      "correct": 1,
      "explanation": "5,038 − 4,940 = 98 lb. An actual flight must satisfy all other limits and planning requirements.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 10: Figure 10-11; landing weight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 74 lb omits part of the difference between takeoff and landing limits.",
        "Correct. 5,038 − 4,940 = 98 lb. An actual flight must satisfy all other limits and planning requirements.",
        "Incorrect. 122 lb includes an additional 24 lb already removed before the shown takeoff weight."
      ],
      "figureRef": {
        "supplement": "Pilot’s Handbook of Aeronautical Knowledge, Chapter 10",
        "figure": "10-11",
        "url": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10"
      }
    },
    {
      "id": "PD-B02-ATP-037",
      "area": "Figure-based ramp margin",
      "prompt": "Refer to PHAK Figure 10-11. How much below the stated maximum ramp weight is the sample ramp weight?",
      "options": [
        "138 lb.",
        "162 lb.",
        "186 lb."
      ],
      "correct": 1,
      "explanation": "The figure shows maximum ramp weight of 5,224 lb and actual ramp weight of 5,062 lb. Their difference is 162 lb. The takeoff weight is a later loading condition after the listed fuel allowance.",
      "reference": "PHAK, FAA-H-8083-25C, Chapter 10: Figure 10-11; ramp weight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10",
      "standardCode": "AA.I.B",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "advanced",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. 138 lb results from an incorrect subtraction.",
        "Correct. The figure shows maximum ramp weight of 5,224 lb and actual ramp weight of 5,062 lb. Their difference is 162 lb. The takeoff weight is a later loading condition after the listed fuel allowance.",
        "Incorrect. 186 lb uses the takeoff weight rather than the ramp weight."
      ],
      "figureRef": {
        "supplement": "Pilot’s Handbook of Aeronautical Knowledge, Chapter 10",
        "figure": "10-11",
        "url": "https://www.faa.gov/sites/faa.gov/files/12_phak_ch10.pdf#page=10"
      }
    },
    {
      "id": "PD-B02-ATP-038",
      "area": "Clearance verification",
      "prompt": "A revised altitude is entered in the automation, but the monitoring pilot’s independent readback record shows a different altitude. Which action best addresses the discrepancy?",
      "options": [
        "Use the more experienced pilot’s memory without further checking.",
        "Use the preselector as the authoritative clearance record.",
        "Verify the actual clearance before using the selected altitude."
      ],
      "correct": 2,
      "explanation": "Resolve the conflicting records against the actual clearance, asking ATC if necessary.",
      "reference": "Aviation Instructor’s Handbook, Chapter 1: Crew resource management; communication",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/03_aih_chapter_1.pdf",
      "standardCode": "AA.I.F",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Experience does not remove the need to resolve a substantive discrepancy.",
        "Incorrect. The selected altitude is a crew entry, not an independent source of ATC authority.",
        "Correct. Resolve the conflicting records against the actual clearance, asking ATC if necessary."
      ]
    },
    {
      "id": "PD-B02-ATP-039",
      "area": "Common-mode navigation error",
      "prompt": "Both pilots agree that the FMS route is correct, but both checked it against the same outdated company note rather than the current clearance. What weakness remains?",
      "options": [
        "Two agreeing checks necessarily eliminate route error.",
        "Their agreement lacks an independent correct reference.",
        "The FMS guarantees that every entered route is cleared."
      ],
      "correct": 1,
      "explanation": "A common erroneous source can make separate checks reproduce the same mistake; verify against the applicable current clearance and charts.",
      "reference": "Aviation Instructor’s Handbook, Chapter 1: Automation and information management",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/03_aih_chapter_1.pdf",
      "standardCode": "AA.I.F",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Agreement is not enough when both checks share the same wrong input.",
        "Correct. A common erroneous source can make separate checks reproduce the same mistake; verify against the applicable current clearance and charts.",
        "Incorrect. The FMS can accurately fly a route that was entered incorrectly or not cleared."
      ]
    },
    {
      "id": "PD-B02-ATP-040",
      "area": "Descent energy",
      "prompt": "A crew begins descent late while maintaining high speed. Why can speed brakes improve the situation without guaranteeing a stabilized landing?",
      "options": [
        "They increase drag but do not remove the need to meet approach energy and configuration criteria.",
        "They eliminate the need for distance to decelerate and configure.",
        "They convert every late descent into an approved approach."
      ],
      "correct": 0,
      "explanation": "Drag devices assist energy reduction within limits; the crew must still assess the remaining path and discontinue or obtain more distance if necessary.",
      "reference": "Airplane Flying Handbook, FAA-H-8083-3C, Chapter 16: Drag devices; descent planning",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf",
      "standardCode": "AA.VI",
      "standardDoc": "FAA-S-ACS-11A",
      "standardType": "ACS",
      "difficulty": "applied",
      "experienceLevel": "atp",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Drag devices assist energy reduction within limits; the crew must still assess the remaining path and discontinue or obtain more distance if necessary.",
        "Incorrect. Deceleration, configuration, and descent still require time and distance.",
        "Incorrect. A device selection is not proof that stabilized criteria can be met."
      ]
    }
  ],
  "foi": [
    {
      "id": "PD-DRAFT-FOI-001",
      "area": "Interference and retention",
      "prompt": "After learning two similar radio procedures in close succession, a learner confuses their steps. Each procedure was recalled accurately before the second was introduced. Which explanation most directly fits the new confusion?",
      "options": [
        "Interference between similar learning.",
        "Retrieval failure from an unfamiliar setting.",
        "Fading through a long period of disuse."
      ],
      "correct": 0,
      "explanation": "Similar material can interfere with retrieval, especially when it is not well established. Compare distinguishing cues and reinforce correct retrieval.",
      "reference": "AIH Chapter 3: Forgetting: interference",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Similar material can interfere with retrieval, especially when it is not well established. Compare distinguishing cues and reinforce correct retrieval.",
        "Incorrect. No setting change is stated; the new similar material supplies the more direct explanation.",
        "Incorrect. The stem describes an immediate change after learning similar material, not a long period without use."
      ]
    },
    {
      "id": "PD-DRAFT-FOI-002",
      "area": "Assessment objectivity",
      "prompt": "An instructor awards a learner a higher maneuver grade because the learner is punctual and agreeable, although the recorded performance is below the stated standard. Which assessment quality is compromised most directly?",
      "options": [
        "Objectivity.",
        "Usability.",
        "Comprehensiveness."
      ],
      "correct": 0,
      "explanation": "The grade is influenced by unrelated personal impressions rather than observed performance against the standard.",
      "reference": "AIH Chapter 6: Characteristics of effective assessment: objectivity",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/08_aih_chapter_6.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The grade is influenced by unrelated personal impressions rather than observed performance against the standard.",
        "Incorrect. Ease of administration does not address the biased score.",
        "Incorrect. Coverage of the subject matter is not the immediate issue."
      ]
    },
    {
      "id": "PD-DRAFT-FOI-003",
      "area": "Learner-centered grading",
      "prompt": "During a training scenario, the instructor supplies repeated prompts for a task that the learner then completes correctly. Which evidence best distinguishes independent competence from assisted completion?",
      "options": [
        "Whether the learner agrees with the instructor’s explanation.",
        "Whether the task required more than one control input.",
        "Whether the task can be completed without those prompts."
      ],
      "correct": 2,
      "explanation": "Removing prompts during an appropriate assessment determines whether the learner can recognize and perform the task independently.",
      "reference": "AIH Chapter 6: Learner-centered assessment: grading",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/08_aih_chapter_6.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Agreement does not demonstrate independent performance.",
        "Incorrect. Task complexity alone does not establish how much assistance was required.",
        "Correct. Removing prompts during an appropriate assessment determines whether the learner can recognize and perform the task independently."
      ]
    },
    {
      "id": "PD-DRAFT-FOI-004",
      "area": "Guided discussion",
      "prompt": "An instructor wants learners to compare several defensible responses to a weather scenario using knowledge already taught. Which method most directly supports analysis by the learners?",
      "options": [
        "A demonstration with no opportunity for learner response.",
        "A guided discussion using focused, open-ended questions.",
        "A memorized lecture followed by silent note copying."
      ],
      "correct": 1,
      "explanation": "Guided discussion draws on prior knowledge and directs learners to analyze and explain their reasoning.",
      "reference": "AIH Chapter 5: Guided discussion method",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/07_aih_chapter_5.pdf",
      "standardCode": "AIH.5",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Demonstration is useful for showing performance, but this format does not elicit the stated learner analysis.",
        "Correct. Guided discussion draws on prior knowledge and directs learners to analyze and explain their reasoning.",
        "Incorrect. A lecture can present information but does not itself require the proposed comparison and discussion."
      ]
    },
    {
      "id": "PD-DRAFT-FOI-005",
      "area": "Training sequence",
      "prompt": "A course moves from basic attitude control to integrated maneuvers and then to operational scenarios. Which organizing principle is most directly illustrated?",
      "options": [
        "Progression from abstract to concrete.",
        "Progression from simple to complex.",
        "Progression from summative to formative."
      ],
      "correct": 1,
      "explanation": "Prerequisite skills are established before they are combined into more demanding performances.",
      "reference": "AIH Chapter 7: Building blocks of learning",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/09_aih_chapter_7.pdf",
      "standardCode": "AIH.7",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Abstract-to-concrete describes a different distinction; these tasks can all involve concrete flight activity.",
        "Correct. Prerequisite skills are established before they are combined into more demanding performances.",
        "Incorrect. Summative and formative describe assessment purposes, not the stated sequence of skill complexity."
      ]
    },
    {
      "id": "PD-DRAFT-FOI-006",
      "area": "Formative assessment",
      "prompt": "Halfway through a course, an instructor identifies recurring navigation errors and adjusts the next lessons before the final evaluation. The assessment is primarily",
      "options": [
        "summative.",
        "norm-referenced.",
        "formative."
      ],
      "correct": 2,
      "explanation": "The evidence is being used during learning to improve subsequent instruction.",
      "reference": "AIH Chapter 6: Traditional assessment; formative and summative assessment",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/08_aih_chapter_6.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A summative assessment evaluates achievement at the end of a defined training period.",
        "Incorrect. No comparison with other learners is described.",
        "Correct. The evidence is being used during learning to improve subsequent instruction."
      ]
    },
    {
      "id": "PD-DRAFT-FOI-007",
      "area": "Instructional aids",
      "prompt": "A training diagram accurately shows the components of a system but includes many unrelated labels that learners repeatedly mistake for required steps. Which revision best improves the aid for this lesson?",
      "options": [
        "Replace the diagram with the same labels in smaller type.",
        "Add every remaining system label for completeness.",
        "Remove labels unrelated to the lesson objective."
      ],
      "correct": 2,
      "explanation": "An aid should clarify the objective; unrelated details can divert attention and obscure the intended relationship.",
      "reference": "AIH Chapter 5: Instructional aids and training technologies",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/07_aih_chapter_5.pdf",
      "standardCode": "AIH.5",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Reducing type size does not resolve the unnecessary information or its misleading role.",
        "Incorrect. More irrelevant detail would compound the identified problem.",
        "Correct. An aid should clarify the objective; unrelated details can divert attention and obscure the intended relationship."
      ]
    },
    {
      "id": "PD-DRAFT-FOI-008",
      "area": "Overlearning",
      "prompt": "A learner recites a familiar checklist fluently but stops verifying the actual item states. Which risk of automated performance is illustrated?",
      "options": [
        "The verbal routine can become separated from its intended actions.",
        "Fluent recall demonstrates that each action has been completed.",
        "Continued practice necessarily prevents omission errors."
      ],
      "correct": 0,
      "explanation": "An overlearned routine can become automatic without the intended observation and action; the instructor should reconnect words to checks.",
      "reference": "AIH Chapter 3: Overlearning of knowledge",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. An overlearned routine can become automatic without the intended observation and action; the instructor should reconnect words to checks.",
        "Incorrect. Recitation alone does not establish that each item was checked.",
        "Incorrect. Practice can improve fluency but does not necessarily preserve meaningful verification."
      ]
    },
    {
      "id": "PD-DRAFT-FOI-009",
      "area": "Levels of skill acquisition",
      "prompt": "A learner performs a familiar motor sequence smoothly with little conscious attention to individual movements, while retaining the ability to monitor its result. Which stage of skill acquisition is best illustrated?",
      "options": [
        "Cognitive.",
        "Associative.",
        "Automatic response."
      ],
      "correct": 2,
      "explanation": "The task has become a coordinated, largely automatic sequence, allowing attention to its result and other demands.",
      "reference": "AIH Chapter 3: Stages of skill acquisition",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The cognitive stage involves understanding what to do and conscious attention to the steps.",
        "Incorrect. The associative stage refines and connects the steps but typically requires more conscious attention than described.",
        "Correct. The task has become a coordinated, largely automatic sequence, allowing attention to its result and other demands."
      ]
    },
    {
      "id": "PD-DRAFT-FOI-010",
      "area": "Preparation for learning",
      "prompt": "An instructor begins a new lesson by asking learners to recall a related procedure they already know, then connects that procedure to the new topic. What is the principal learning purpose?",
      "options": [
        "Demonstrate that assessment is unnecessary.",
        "Activate prior knowledge to support new learning.",
        "Replace the new objective with a review objective."
      ],
      "correct": 1,
      "explanation": "Bringing relevant existing knowledge into use helps learners organize and interpret new information.",
      "reference": "AIH Chapter 3: Memory; activating existing knowledge",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Activating prior knowledge does not establish that the new learning has been achieved.",
        "Correct. Bringing relevant existing knowledge into use helps learners organize and interpret new information.",
        "Incorrect. The review is a bridge to the new objective, not necessarily a replacement for it."
      ]
    },
    {
      "id": "PD-B02-FOI-011",
      "area": "Learning principles",
      "prompt": "Before a lesson, an instructor establishes how its objective supports the learner’s planned cross-country. Which principle is most directly supported by making that need apparent?",
      "options": [
        "Readiness.",
        "Intensity.",
        "Recency."
      ],
      "correct": 0,
      "explanation": "A recognized purpose and reason to learn help prepare the learner to engage with the objective.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Laws of learning: readiness",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. A recognized purpose and reason to learn help prepare the learner to engage with the objective.",
        "Incorrect. Intensity concerns vivid or realistic experiences rather than establishing the need for this lesson.",
        "Incorrect. Recency concerns how recently learning has been used or presented."
      ]
    },
    {
      "id": "PD-B02-FOI-012",
      "area": "Learning principles",
      "prompt": "A learner makes measurable progress, receives accurate encouragement, and becomes more willing to practice. Which principle most directly explains the reinforcing value of this satisfying experience?",
      "options": [
        "Disuse.",
        "Effect.",
        "Primacy."
      ],
      "correct": 1,
      "explanation": "Learning associated with a satisfying experience is strengthened under the law of effect.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Laws of learning: effect",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Disuse concerns loss of ready access or performance without use, not this reinforcement.",
        "Correct. Learning associated with a satisfying experience is strengthened under the law of effect.",
        "Incorrect. Primacy concerns the influence of initial learning, not the satisfying result described."
      ]
    },
    {
      "id": "PD-B02-FOI-013",
      "area": "Learning principles",
      "prompt": "A realistic but safely controlled simulation makes an emergency lesson more memorable than a vague verbal description. Which learning principle is most directly illustrated?",
      "options": [
        "Intensity.",
        "Recency.",
        "Primacy."
      ],
      "correct": 0,
      "explanation": "A vivid, meaningful experience can leave a stronger impression than a less engaging description.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Laws of learning: intensity",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. A vivid, meaningful experience can leave a stronger impression than a less engaging description.",
        "Incorrect. The comparison does not state which experience occurred more recently.",
        "Incorrect. The comparison does not depend on which lesson was first."
      ]
    },
    {
      "id": "PD-B02-FOI-014",
      "area": "Learning principles",
      "prompt": "An instructor reviews key actions immediately before a learner performs a new task. Which principle most directly supports the immediate availability of that information?",
      "options": [
        "Negative transfer.",
        "Recency.",
        "Repression."
      ],
      "correct": 1,
      "explanation": "Recently used or reviewed knowledge is generally more readily retrieved.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Laws of learning: recency",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Negative transfer involves prior learning interfering with a new task.",
        "Correct. Recently used or reviewed knowledge is generally more readily retrieved.",
        "Incorrect. Repression is not the explanation for information made recently available through review."
      ]
    },
    {
      "id": "PD-B02-FOI-015",
      "area": "Learning domains",
      "prompt": "A learner compares two fuel plans, calculates their margins, and explains the assumptions. Which learning domain is most directly assessed?",
      "options": [
        "Psychomotor.",
        "Cognitive.",
        "Affective."
      ],
      "correct": 1,
      "explanation": "Calculation, comparison, and explanation are primarily intellectual knowledge and reasoning tasks.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Domains of learning: cognitive",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. No physical coordination task is the central assessment here.",
        "Correct. Calculation, comparison, and explanation are primarily intellectual knowledge and reasoning tasks.",
        "Incorrect. Attitudes and values may influence decisions, but the stated evidence directly concerns reasoning."
      ]
    },
    {
      "id": "PD-B02-FOI-016",
      "area": "Learning domains",
      "prompt": "Over several lessons, a learner increasingly values conservative fuel margins and voluntarily incorporates them into planning. Which domain is most directly reflected?",
      "options": [
        "Psychomotor.",
        "Cognitive recall alone.",
        "Affective."
      ],
      "correct": 2,
      "explanation": "Adoption of a safety value and its integration into behavior are affective learning.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Domains of learning: affective",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The change is in values and consistent choices, not principally muscular coordination.",
        "Incorrect. The evidence extends beyond remembering a fuel definition.",
        "Correct. Adoption of a safety value and its integration into behavior are affective learning."
      ]
    },
    {
      "id": "PD-B02-FOI-017",
      "area": "Learning domains",
      "prompt": "An assessment requires smooth, coordinated manipulation of controls to maintain a specified attitude. Which domain is most directly involved?",
      "options": [
        "Affective.",
        "Psychomotor.",
        "Cognitive recall alone."
      ],
      "correct": 1,
      "explanation": "Physical coordination and practiced control movements are psychomotor performance.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Domains of learning: psychomotor",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Attitude toward safety can support the task, but the measured act is coordinated physical performance.",
        "Correct. Physical coordination and practiced control movements are psychomotor performance.",
        "Incorrect. Knowing the definition is not the same as executing the movement."
      ]
    },
    {
      "id": "PD-B02-FOI-018",
      "area": "Insight",
      "prompt": "After studying lift, load factor, and stall speed separately, a learner explains how they interact during a steep level turn. What does the new connection most directly demonstrate?",
      "options": [
        "Insight into relationships among perceptions and concepts.",
        "A loss of all prior knowledge.",
        "An isolated motor reflex."
      ],
      "correct": 0,
      "explanation": "Recognizing the relationship gives meaning to facts that were previously treated separately.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Perceptions; insight",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Recognizing the relationship gives meaning to facts that were previously treated separately.",
        "Incorrect. The learner is integrating earlier knowledge, not losing it.",
        "Incorrect. The explanation is conceptual rather than a reflex movement."
      ]
    },
    {
      "id": "PD-B02-FOI-019",
      "area": "Purposeful practice",
      "prompt": "Two learners complete the same number of repetitions. One identifies a specific error and receives corrective feedback each time; the other repeats the error without review. Why may the outcomes differ?",
      "options": [
        "Quality and purpose of practice matter as well as repetition count.",
        "Feedback prevents the learner from retaining any motor skill.",
        "Equal repetition counts guarantee equal learning."
      ],
      "correct": 0,
      "explanation": "Practice is more useful when directed toward correct performance with appropriate feedback.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Practice; skill acquisition",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Practice is more useful when directed toward correct performance with appropriate feedback.",
        "Incorrect. Effective feedback supports rather than prevents skill development.",
        "Incorrect. Repetition can reinforce an error when its cause is not addressed."
      ]
    },
    {
      "id": "PD-B02-FOI-020",
      "area": "Distributed practice",
      "prompt": "A long practice period produces fatigue and progressively poorer performance. Which adjustment most directly supports further useful learning?",
      "options": [
        "Remove all feedback to reduce the time spent discussing errors.",
        "Extend the session until the fatigue disappears during repetition.",
        "Use shorter sessions with suitable rest and focused objectives."
      ],
      "correct": 2,
      "explanation": "Distributed practice can preserve attention and allow consolidation instead of rehearsing degraded performance.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Practice; fatigue and learning",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Removing feedback does not address the underlying fatigue and can reinforce errors.",
        "Incorrect. Continuing through increasing fatigue can make practice less useful or unsafe.",
        "Correct. Distributed practice can preserve attention and allow consolidation instead of rehearsing degraded performance."
      ]
    },
    {
      "id": "PD-B02-FOI-021",
      "area": "Recall versus recognition",
      "prompt": "A learner selects the correct checklist item from three displayed choices but cannot state the item without seeing the choices. Which conclusion is justified?",
      "options": [
        "Independent execution is shown; understanding remains unproven.",
        "Recall is shown; recognition remains unproven.",
        "Recognition is shown; unaided recall remains unproven."
      ],
      "correct": 2,
      "explanation": "Choices can provide recognition cues; no unaided recall or physical execution is established.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Memory; retrieval",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. No execution task is described.",
        "Incorrect. Selecting a supplied choice demonstrates recognition rather than supplying the answer independently.",
        "Correct. Choices can provide recognition cues; no unaided recall or physical execution is established."
      ]
    },
    {
      "id": "PD-B02-FOI-022",
      "area": "Meaningful associations",
      "prompt": "A learner remembers an unfamiliar limitation more reliably after relating it to a known system mechanism. Why can this help retention?",
      "options": [
        "The new information is connected to an organized knowledge structure.",
        "Understanding removes every possibility of future forgetting.",
        "The limitation no longer needs to be checked against the source."
      ],
      "correct": 0,
      "explanation": "Meaningful connections provide organization and retrieval cues, rather than leaving an isolated fact.",
      "reference": "Aviation Instructor’s Handbook, Chapter 3: Memory; meaningful learning",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/05_aih_chapter_3.pdf",
      "standardCode": "AIH.3",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Meaningful connections provide organization and retrieval cues, rather than leaving an isolated fact.",
        "Incorrect. Understanding can improve retention but does not guarantee permanent error-free memory.",
        "Incorrect. Memory aids do not replace verifying the actual applicable limitation."
      ]
    },
    {
      "id": "PD-B02-FOI-023",
      "area": "Self-concept",
      "prompt": "An instructor criticizes a learner as an incapable person rather than describing a correctable performance error. Why can this impair learning?",
      "options": [
        "It distinguishes observable behavior from personal worth.",
        "It threatens self-concept without identifying a useful improvement.",
        "It makes the completion standard more objective."
      ],
      "correct": 1,
      "explanation": "A personal attack can provoke defensiveness and undermine confidence while supplying little usable guidance.",
      "reference": "Aviation Instructor’s Handbook, Chapter 2: Self-concept; motivation",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/04_aih_chapter_2.pdf",
      "standardCode": "AIH.2",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. It does the opposite: it labels the person rather than separating the action from identity.",
        "Correct. A personal attack can provoke defensiveness and undermine confidence while supplying little usable guidance.",
        "Incorrect. The statement substitutes a personal judgment for a performance standard."
      ]
    },
    {
      "id": "PD-B02-FOI-024",
      "area": "Anxiety response",
      "prompt": "A learner expresses apprehension before an unfamiliar maneuver but remains attentive and responsive. Which initial instructional response is most appropriate?",
      "options": [
        "Explain the exercise, establish expectations, and monitor the learner’s response.",
        "Assume the learner is medically unfit based on apprehension alone.",
        "Increase uncertainty to make the lesson more memorable."
      ],
      "correct": 0,
      "explanation": "Preparation and supportive, controlled exposure can address normal apprehension; continue assessing the individual response.",
      "reference": "Aviation Instructor’s Handbook, Chapter 2: Anxiety; normal reactions",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/04_aih_chapter_2.pdf",
      "standardCode": "AIH.2",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Preparation and supportive, controlled exposure can address normal apprehension; continue assessing the individual response.",
        "Incorrect. Apprehension alone does not establish a medical diagnosis.",
        "Incorrect. Additional uncertainty can aggravate anxiety rather than support learning."
      ]
    },
    {
      "id": "PD-B02-FOI-025",
      "area": "Overwhelming anxiety",
      "prompt": "During training, a learner becomes unable to process instructions and continues freezing despite simpler coaching. What should the instructor do first?",
      "options": [
        "Continue the same exercise with more frequent prompts.",
        "Maintain safety and reduce or stop the exercise.",
        "Finish the maneuver, then assess the distress in the debrief."
      ],
      "correct": 1,
      "explanation": "The learner is no longer processing instructions effectively; remove the immediate unsafe overload.",
      "reference": "Aviation Instructor’s Handbook, Chapter 2: Abnormal reactions to stress; instructor response",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/04_aih_chapter_2.pdf",
      "standardCode": "AIH.2",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The stem says simpler coaching has not restored effective processing; more prompts do not address the immediate overload.",
        "Correct. The learner is no longer processing instructions effectively; remove the immediate unsafe overload.",
        "Incorrect. Debriefing is important but must not delay control of the current safety problem."
      ]
    },
    {
      "id": "PD-B02-FOI-026",
      "area": "Human behavior",
      "prompt": "A learner responds to insecurity about weak landing performance by continually emphasizing unrelated academic achievements. Which defense mechanism best fits that substitution?",
      "options": [
        "Compensation.",
        "Physical fatigue.",
        "Repression."
      ],
      "correct": 0,
      "explanation": "Compensation substitutes strength or achievement in one area for a perceived weakness in another.",
      "reference": "Aviation Instructor’s Handbook, Chapter 2: Defense mechanisms: compensation",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/04_aih_chapter_2.pdf",
      "standardCode": "AIH.2",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Compensation substitutes strength or achievement in one area for a perceived weakness in another.",
        "Incorrect. Fatigue may impair performance but does not define this defensive substitution.",
        "Incorrect. Repression involves excluding distressing material from conscious awareness, not emphasizing another achievement."
      ]
    },
    {
      "id": "PD-B02-FOI-027",
      "area": "Human behavior",
      "prompt": "A learner is angry about a poor performance but insists, without supporting evidence, that the instructor is the angry and hostile one. Which defense mechanism most directly fits attributing the feeling to someone else?",
      "options": [
        "Readiness.",
        "Positive transfer.",
        "Projection."
      ],
      "correct": 2,
      "explanation": "Projection attributes one’s own unacceptable feelings or motives to another person.",
      "reference": "Aviation Instructor’s Handbook, Chapter 2: Defense mechanisms: projection",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/04_aih_chapter_2.pdf",
      "standardCode": "AIH.2",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Readiness concerns preparation and motivation to learn, not attributing feelings.",
        "Incorrect. Positive transfer concerns learning that helps another task.",
        "Correct. Projection attributes one’s own unacceptable feelings or motives to another person."
      ]
    },
    {
      "id": "PD-B02-FOI-028",
      "area": "Human behavior",
      "prompt": "Despite a clear recording of a missed checklist item, a learner refuses to acknowledge that the omission occurred. Which defense mechanism is most directly illustrated?",
      "options": [
        "Compensation.",
        "Correlation.",
        "Denial."
      ],
      "correct": 2,
      "explanation": "Denial rejects an uncomfortable fact despite the evidence.",
      "reference": "Aviation Instructor’s Handbook, Chapter 2: Defense mechanisms: denial",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/04_aih_chapter_2.pdf",
      "standardCode": "AIH.2",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Compensation would substitute another strength for the perceived weakness.",
        "Incorrect. Correlation is a level of learning, not the defensive rejection described.",
        "Correct. Denial rejects an uncomfortable fact despite the evidence."
      ]
    },
    {
      "id": "PD-B02-FOI-029",
      "area": "Guided-discovery responsibility",
      "prompt": "In problem-based instruction, an instructor lets learners propose solutions but verifies their reasoning against sound principles before the lesson ends. Why is that verification necessary?",
      "options": [
        "Verification prevents learners from applying prior knowledge.",
        "Discovery requires the instructor to accept all conclusions as equivalent.",
        "Learner participation does not make every proposed solution accurate."
      ],
      "correct": 2,
      "explanation": "Facilitation includes correcting misconceptions and ensuring that learning is accurate while preserving meaningful learner involvement.",
      "reference": "Aviation Instructor’s Handbook, Chapter 5: Problem-based learning; instructor facilitation",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/07_aih_chapter_5.pdf",
      "standardCode": "AIH.5",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Verification supports sound application rather than barring prior knowledge.",
        "Incorrect. Open exploration is not a declaration that incorrect conclusions meet the objective.",
        "Correct. Facilitation includes correcting misconceptions and ensuring that learning is accurate while preserving meaningful learner involvement."
      ]
    },
    {
      "id": "PD-B02-FOI-030",
      "area": "Question design",
      "prompt": "A question begins, \"You would use the approved checklist, wouldn’t you?\" Why is it weak evidence of the learner’s independent reasoning?",
      "options": [
        "It isolates the learner’s unprompted decision process.",
        "It cues the desired response.",
        "It requires a complete operational explanation."
      ],
      "correct": 1,
      "explanation": "The wording signals agreement with the instructor instead of requiring the learner to explain a decision.",
      "reference": "Aviation Instructor’s Handbook, Chapter 6: Oral assessment; leading questions",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/08_aih_chapter_6.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. The desired response is supplied by the phrasing.",
        "Correct. The wording signals agreement with the instructor instead of requiring the learner to explain a decision.",
        "Incorrect. A yes/no cue does not require a complete explanation."
      ]
    },
    {
      "id": "PD-B02-FOI-031",
      "area": "Item independence",
      "prompt": "A test question states the correct answer to a later question in its own stem. What is the principal design defect?",
      "options": [
        "The numerical alternatives are in ascending order.",
        "The items are not independent.",
        "The items have too many alternatives."
      ],
      "correct": 1,
      "explanation": "One item should not provide the solution to another because that changes what the later item measures.",
      "reference": "Aviation Instructor’s Handbook, Appendix B: Multiple-choice guidelines: independent items",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/14_aih_appendix_b.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Ordering numeric alternatives is not the defect described.",
        "Correct. One item should not provide the solution to another because that changes what the later item measures.",
        "Incorrect. No excessive option count is established."
      ]
    },
    {
      "id": "PD-B02-FOI-032",
      "area": "Grammatical cues",
      "prompt": "A multiple-choice stem ends in \"an,\" and only the correct alternative begins with a vowel sound. What should the author revise?",
      "options": [
        "Remove the grammatical clue while preserving the tested concept.",
        "Add another unrelated technical fact to the explanation.",
        "Retain the clue to reward grammatical skill in an aviation calculation."
      ],
      "correct": 0,
      "explanation": "Grammar should not reveal a keyed answer when the objective is the aviation concept.",
      "reference": "Aviation Instructor’s Handbook, Appendix B: Stems; grammatical fit",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/14_aih_appendix_b.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Grammar should not reveal a keyed answer when the objective is the aviation concept.",
        "Incorrect. Changing the explanation does not remove a clue in the item itself.",
        "Incorrect. An unrelated language cue weakens the intended measurement."
      ]
    },
    {
      "id": "PD-B02-FOI-033",
      "area": "Answer-length cues",
      "prompt": "Across a draft test, the correct choice is repeatedly a long qualified sentence while the wrong choices are brief assertions. What revision best reduces the unintended cue?",
      "options": [
        "Make alternatives comparably precise and similar in length.",
        "Lengthen only the correct choices further.",
        "Put the correct choice first throughout the test."
      ],
      "correct": 0,
      "explanation": "Comparable wording and scope help the learner choose on content rather than a recurring superficial pattern.",
      "reference": "Aviation Instructor’s Handbook, Appendix B: Alternatives; response-length cues",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/14_aih_appendix_b.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. Comparable wording and scope help the learner choose on content rather than a recurring superficial pattern.",
        "Incorrect. Making the contrast larger strengthens the cue.",
        "Incorrect. A fixed keyed position introduces another predictable pattern."
      ]
    },
    {
      "id": "PD-B02-FOI-034",
      "area": "Numeric distractors",
      "prompt": "An item tests a conversion. Which pair of distractors is most useful?",
      "options": [
        "Two random values unrelated to the calculation.",
        "The correct value repeated with different punctuation.",
        "Results from plausible unit or formula errors."
      ],
      "correct": 2,
      "explanation": "Common mistakes produce meaningful distractors that diagnose understanding of the actual task.",
      "reference": "Aviation Instructor’s Handbook, Appendix B: Alternatives; common learner errors",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/14_aih_appendix_b.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Random values are often easily dismissed without solving the problem.",
        "Incorrect. Repeated correct values undermine the requirement for a unique keyed response.",
        "Correct. Common mistakes produce meaningful distractors that diagnose understanding of the actual task."
      ]
    },
    {
      "id": "PD-B02-FOI-035",
      "area": "Negative wording",
      "prompt": "An essential question asks which action is NOT permitted. How should the author reduce avoidable reading error?",
      "options": [
        "Use a double negative to increase difficulty.",
        "Clearly emphasize the negative and avoid a second negative.",
        "Hide the negative among unnecessary details."
      ],
      "correct": 1,
      "explanation": "Necessary negative wording should be visible and structurally simple so difficulty comes from the content.",
      "reference": "Aviation Instructor’s Handbook, Appendix B: Negative questions; avoidance of double negatives",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/14_aih_appendix_b.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Double negatives can introduce confusion unrelated to the objective.",
        "Correct. Necessary negative wording should be visible and structurally simple so difficulty comes from the content.",
        "Incorrect. Concealing the negative creates a reading trap rather than useful challenge."
      ]
    },
    {
      "id": "PD-B02-FOI-036",
      "area": "Criterion-referenced assessment",
      "prompt": "A learner’s performance is compared with a published completion standard rather than with classmates’ scores. This is principally",
      "options": [
        "Norm-referenced assessment.",
        "Peer-referenced ranking.",
        "Criterion-referenced assessment."
      ],
      "correct": 2,
      "explanation": "Performance is compared with a defined standard or criterion.",
      "reference": "Aviation Instructor’s Handbook, Chapter 6: Performance assessment; standards",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/08_aih_chapter_6.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Norm-referenced assessment compares performance with a group.",
        "Incorrect. Ranking against peers is not the stated comparison with a completion standard.",
        "Correct. Performance is compared with a defined standard or criterion."
      ]
    },
    {
      "id": "PD-B02-FOI-037",
      "area": "Diagnostic assessment",
      "prompt": "Before choosing the first lesson in a transition course, an instructor checks the learner’s existing knowledge and skills. What is the principal purpose?",
      "options": [
        "Rank the learner against unrelated applicants.",
        "Identify the starting point and instructional needs.",
        "Certify final course completion in advance."
      ],
      "correct": 1,
      "explanation": "A pre-assessment identifies existing competence and gaps so instruction can be planned appropriately.",
      "reference": "Aviation Instructor’s Handbook, Chapter 7: Planning instruction; assessment of prior learning",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/09_aih_chapter_7.pdf",
      "standardCode": "AIH.7",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. A rank among others is not the stated instructional planning objective.",
        "Correct. A pre-assessment identifies existing competence and gaps so instruction can be planned appropriately.",
        "Incorrect. Entry evidence cannot establish learning that has not yet been taught or demonstrated."
      ]
    },
    {
      "id": "PD-B02-FOI-038",
      "area": "Syllabus and lesson plan",
      "prompt": "An instructor needs the sequence and overall progression of an entire course, then a detailed plan for tomorrow’s individual lesson. Which pairing best matches those needs?",
      "options": [
        "Training syllabus, then lesson plan.",
        "Completion record, then course critique.",
        "Lesson plan, then training syllabus."
      ],
      "correct": 0,
      "explanation": "The syllabus gives the course structure; the lesson plan organizes the individual learning session.",
      "reference": "Aviation Instructor’s Handbook, Chapter 7: Training syllabi and lesson plans",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/09_aih_chapter_7.pdf",
      "standardCode": "AIH.7",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Correct. The syllabus gives the course structure; the lesson plan organizes the individual learning session.",
        "Incorrect. A progress record and critique can inform planning but do not replace the course sequence and individual lesson plan.",
        "Incorrect. This reverses the levels of planning required by the stem."
      ]
    },
    {
      "id": "PD-B02-FOI-039",
      "area": "Professional correction",
      "prompt": "After giving an incorrect technical explanation, an instructor verifies the source and discovers the error. What response best supports sound learning?",
      "options": [
        "Wait for the learner to raise the conflict during a later lesson.",
        "Give a new example without explicitly correcting the earlier explanation.",
        "Acknowledge the error and explain the verified correction."
      ],
      "correct": 2,
      "explanation": "An explicit correction prevents the earlier misinformation from remaining an apparently valid rule.",
      "reference": "Aviation Instructor’s Handbook, Chapter 8: Professionalism; admitting errors",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/10_aih_chapter_8.pdf",
      "standardCode": "AIH.8",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Delay can allow the error to be practiced or applied before it is corrected.",
        "Incorrect. A new example may leave the learner retaining both conflicting ideas.",
        "Correct. An explicit correction prevents the earlier misinformation from remaining an apparently valid rule."
      ]
    },
    {
      "id": "PD-B02-FOI-040",
      "area": "Assessing judgment",
      "prompt": "A learner chooses a defensible alternate plan for a scenario that differs from the instructor’s preferred plan. What should determine the assessment?",
      "options": [
        "Whether the alternate plan was mentioned first.",
        "Agreement with the instructor’s preference alone.",
        "The learner’s reasoning and compliance with the stated criteria."
      ],
      "correct": 2,
      "explanation": "A different solution can be valid if it addresses the hazards, constraints, and objective. Evaluate evidence rather than personal preference.",
      "reference": "Aviation Instructor’s Handbook, Chapter 6: Objective assessment; evaluating problem solving",
      "source": "pilotdesk-curated",
      "sourceUrl": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/aviation_instructors_handbook/08_aih_chapter_6.pdf",
      "standardCode": "AIH.6",
      "standardDoc": "FAA-H-8083-9",
      "standardType": "Handbook",
      "difficulty": "applied",
      "experienceLevel": "foi",
      "reviewedAt": "2026-10-19",
      "authoring": "curated-manual",
      "instructorReview": "pending",
      "releaseBatch": "reviewed-280-2026-10",
      "choiceExplanations": [
        "Incorrect. Order of mention does not establish operational quality.",
        "Incorrect. Preference alone is not a criterion for rejecting a sound decision.",
        "Correct. A different solution can be valid if it addresses the hazards, constraints, and objective. Evaluate evidence rather than personal preference."
      ]
    }
  ]
};

export const banks={
 foi:[...expandedQuestions.foi,...curriculumQuestions.foi,...reviewedReleaseQuestions.foi],
 ppl:[...productionSamples('ppl'),...figureParallelQuestions.ppl.filter(q=>q.difficulty!=='foundation'),...scenarioQuestions.ppl,...expandedQuestions.ppl,...curriculumQuestions.ppl,...privatePathQuestions,...reviewedReleaseQuestions.ppl],
 ira:[...productionSamples('ira'),...figureParallelQuestions.ira.filter(q=>q.difficulty!=='foundation'),...scenarioQuestions.ira,...expandedQuestions.ira,...curriculumQuestions.ira,...reviewedReleaseQuestions.ira],
 cpl:[...productionSamples('cpl'),...figureParallelQuestions.cpl.filter(q=>q.difficulty!=='foundation'),...scenarioQuestions.cpl,...expandedQuestions.cpl,...curriculumQuestions.cpl,...reviewedReleaseQuestions.cpl],
 cfi:[...curatedCfi,...scenarioQuestions.cfi,...expandedQuestions.cfi,...curriculumQuestions.cfi,...reviewedReleaseQuestions.cfi],
 cfii:[...curatedCfii,...scenarioQuestions.cfii,...expandedQuestions.cfii,...curriculumQuestions.cfii,...reviewedReleaseQuestions.cfii],
 atp:[...exactAtpSamples,...scenarioQuestions.atp,...expandedQuestions.atp,...curriculumQuestions.atp,...reviewedReleaseQuestions.atp]
};
export const bankManifest={
 acsQuestionCount:['ppl','ira','cpl','cfi','atp'].reduce((s,t)=>s+banks[t].length,0),
 supplementalPtsQuestionCount:banks.cfii.length,
 handbookQuestionCount:banks.foi.length,
 totalQuestionCount:Object.values(banks).reduce((s,a)=>s+a.length,0),
 byTrack:Object.fromEntries(Object.entries(banks).map(([k,v])=>[k,v.length])),
 standards:STANDARDS,
 generatedAt:'2026-10-19',
 legacyGeneratedFamiliesExcluded:true
};
