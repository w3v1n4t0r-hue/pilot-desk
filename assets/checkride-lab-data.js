(()=>{
'use strict';
if(window.PilotDeskCheckrideData)return;
const src={
 private:{title:'Private Pilot',standard:'Private Pilot Airplane ACS',hub:'/training/private-pilot.html',items:[
  {id:'privileges',title:'Privileges and limitations',area:'Regulations',prompt:'You have a private pilot certificate. Walk me through a flight where compensation, business, or cost sharing could become a problem.',source:'Private Pilot ACS · 14 CFR Part 61',concepts:[
   ['private privileges',['private pilot','privilege','not for compensation','not for hire']],
   ['pro rata share',['pro rata','share expenses','fuel','oil','airport','rental']],
   ['incidental business',['incidental','business','employment','not carrying passengers for hire']],
   ['operation authority',['common carriage','holding out','part 119','operator certificate']]
  ],probes:['What expenses can a private pilot share with passengers?','When can a flight be incidental to your business or employment?','Why can a commercial certificate still be insufficient for some paid transportation?']},
  {id:'airworthiness',title:'Airworthiness today',area:'Airworthiness',prompt:'Show me how you decide this airplane is legal and safe to fly today.',source:'Private Pilot ACS · 14 CFR Part 91 · POH/AFM',concepts:[
   ['documents and status',['airworthiness certificate','registration','operating limitations','weight and balance']],
   ['inspections',['annual','100 hour','transponder','elt','pitot static','inspection']],
   ['required equipment',['91.205','required equipment','kinds of operation','equipment list']],
   ['inoperative equipment',['91.213','inoperative','deactivate','placard','mel']]
  ],probes:['An installed landing light is inoperative. How do you decide whether the flight can go?','Which inspections have expiration intervals you would verify before this flight?','What aircraft-specific documents or limitations do you need to check?']},
  {id:'weather',title:'Weather decision',area:'Weather',prompt:'Brief the weather for a two-hour VFR trip and tell me what would make you delay, divert, or stay home.',source:'Private Pilot ACS · Aviation Weather Handbook · current official weather',concepts:[
   ['current observations',['metar','observation','visibility','ceiling','wind']],
   ['forecast and trend',['taf','forecast','trend','prog','forecast discussion']],
   ['hazards',['thunderstorm','convective','icing','turbulence','sigmet','airmet']],
   ['personal margin',['personal minimum','alternate','divert','margin','escape']]
  ],probes:['What tells you whether the weather is improving or deteriorating?','What convective information would change your decision?','Give me one personal trigger that would make you turn around or divert.']},
  {id:'airspace',title:'Airspace and airport operations',area:'Airspace',prompt:'Your route crosses several classes of airspace. Explain what you need before entering each one and how you verify it.',source:'Private Pilot ACS · 14 CFR Part 91 · AIM · current charts',concepts:[
   ['entry requirements',['clearance','two way communication','mode c','ads-b','endorsement']],
   ['weather minimums',['visibility','cloud clearance','vfr minimum']],
   ['chart verification',['sectional','chart','airspace boundary','floor','ceiling']],
   ['airport operations',['runway sign','marking','traffic pattern','tower','light gun']]
  ],probes:['What does “two-way communication established” mean for Class C or D entry?','How do VFR cloud clearances change between common airspace classes?','Show me how you would verify the vertical limits of an airspace shelf.']},
  {id:'planning',title:'Cross-country planning',area:'Flight Planning',prompt:'Take me from a route on the chart to heading, groundspeed, time, and fuel.',source:'Private Pilot ACS · PHAK · current chart and aircraft data',concepts:[
   ['course and wind',['true course','wind correction','heading','wind']],
   ['groundspeed and time',['groundspeed','distance','time','ete']],
   ['fuel',['fuel burn','gph','reserve','fuel required']],
   ['route checks',['checkpoint','airspace','terrain','airport','notam']]
  ],probes:['If the headwind increases by 20 knots, what changes in your plan?','How do you turn true course into the heading you will actually fly?','Where does reserve fuel enter your calculation?']},
  {id:'performance',title:'Weight, balance, and performance',area:'Performance',prompt:'Prove this airplane can carry the load and safely use the runway you selected.',source:'Private Pilot ACS · POH/AFM',concepts:[
   ['weight and cg',['weight','cg','center of gravity','moment','arm']],
   ['takeoff performance',['takeoff distance','obstacle','runway','performance chart']],
   ['density altitude',['density altitude','temperature','pressure altitude','performance']],
   ['margin and conditions',['wind','surface','slope','weight','margin']]
  ],probes:['What changes when the CG moves aft?','How does density altitude affect takeoff and climb?','Which runway-condition assumptions in the POH may not match today?']},
  {id:'systems',title:'Aircraft systems',area:'Systems',prompt:'Pick the fuel or electrical system in the airplane and trace it from source to the cockpit indication.',source:'Private Pilot ACS · POH/AFM · PHAK',concepts:[
   ['components',['tank','pump','selector','alternator','battery','bus']],
   ['normal indication',['gauge','ammeter','voltmeter','pressure','flow']],
   ['failure clues',['failure','low voltage','pressure drop','warning']],
   ['pilot action',['checklist','alternate','pump','load shed','land']]
  ],probes:['What indication would make you suspect the alternator has failed?','What can the engine-driven and electric fuel pumps each do in your airplane?','Which checklist would you use after the first indication of a system failure?']},
  {id:'risk',title:'Abnormal and risk decisions',area:'Risk Management',prompt:'You are 25 minutes from destination when weather worsens and a passenger becomes ill. Talk me through your priorities.',source:'Private Pilot ACS · POH/AFM · FAA risk-management guidance',concepts:[
   ['aircraft control',['aviate','control','airspeed','stabilize']],
   ['options',['divert','land','alternate','turn around']],
   ['communication',['atc','mayday','pan pan','declare','flight service']],
   ['risk trigger',['personal minimum','time pressure','passenger','margin']]
  ],probes:['When would you declare an emergency instead of simply requesting priority?','What is your first practical escape option if the weather ahead is deteriorating?','What pressure is most likely to make a pilot continue too long?']}
 ]},
 instrument:{title:'Instrument Rating',standard:'Instrument Rating Airplane ACS',hub:'/training/instrument-rating.html',items:[
  {id:'currency',title:'IFR privileges and currency',area:'Regulations',prompt:'You want to file and fly IFR tonight. Prove that you are legal and current.',source:'Instrument Rating ACS · 14 CFR Parts 61 and 91',concepts:[
   ['rating',['instrument rating','rated','category and class']],
   ['recent experience',['six approaches','holding','intercept','tracking','6 hits']],
   ['ipc path',['ipc','instrument proficiency check','six months','currency']],
   ['logging',['actual','simulated','safety pilot','logbook']]
  ],probes:['What happens after the first six calendar months of lost instrument currency?','Which tasks make up the recent-experience requirement?','When can simulated instrument time be logged in an airplane?']},
  {id:'aircraft',title:'Aircraft IFR readiness',area:'Airworthiness',prompt:'What makes this exact airplane ready for the IFR flight you planned?',source:'Instrument Rating ACS · 14 CFR Part 91 · POH/AFM supplements',concepts:[
   ['required equipment',['91.205','ifr equipment','altimeter','clock','generator','navigation']],
   ['inspections',['pitot static','transponder','vor check','annual']],
   ['navigation approval',['database','gps','waas','supplement','approved']],
   ['defects',['inoperative','91.213','mel','placard']]
  ],probes:['Which inspection is specific to the IFR pitot-static system?','How do you determine whether the installed GPS is approved for this operation?','What would make an inoperative item a no-go even if it seems unrelated to IFR?']},
  {id:'weather',title:'IFR weather and alternates',area:'Weather',prompt:'Brief the IFR weather and explain the escape routes before launch.',source:'Instrument Rating ACS · Aviation Weather Handbook · current official weather',concepts:[
   ['ceiling and visibility',['ceiling','visibility','taf','metar']],
   ['icing and freezing',['icing','freezing level','airmet zulu','pirep']],
   ['convection',['convective','sigmet','thunderstorm','radar']],
   ['alternate and fuel',['alternate','fuel','approach','minimums']]
  ],probes:['What weather could make a technically legal alternate a poor choice?','How do freezing level and cloud tops affect your icing decision?','What forecast window matters for alternate planning?']},
  {id:'clearance',title:'Clearance and route',area:'IFR Operations',prompt:'Read back a clearance, then explain how you will verify and fly it from departure through enroute.',source:'Instrument Rating ACS · AIM · current charts',concepts:[
   ['clearance elements',['clearance limit','route','altitude','frequency','transponder']],
   ['departure',['sid','odp','takeoff minimum','climb gradient']],
   ['enroute altitude',['mea','moca','oroca','minimum altitude']],
   ['verification',['chart','route','fix','notam','amendment']]
  ],probes:['When would an ODP matter even if ATC did not assign it?','How do MEA and MOCA differ?','What part of a clearance readback deserves the most careful route verification?']},
  {id:'navigation',title:'Navigation and avionics',area:'Avionics',prompt:'Explain what your installed GPS can legally support and how you know it is providing trustworthy guidance.',source:'Instrument Rating ACS · AIM · AFM/avionics supplements',concepts:[
   ['approval',['afm supplement','approved','installation','tsoc']],
   ['database',['database','current','procedure','waypoint']],
   ['integrity',['raim','waas','integrity','annunciation']],
   ['backup',['vor','alternate navigation','failure','backup']]
  ],probes:['What changes if WAAS integrity is lost during an approach?','When does database currency become operationally important?','What navigation capability remains if the primary GPS fails?']},
  {id:'holding',title:'Holding',area:'IFR Procedures',prompt:'ATC clears you to hold. Explain entry, timing or distance, wind correction, and the protected side.',source:'Instrument Rating ACS · AIM',concepts:[
   ['clearance',['hold','fix','radial','course','direction']],
   ['entry',['direct','parallel','teardrop','entry']],
   ['wind correction',['wind correction','outbound','inbound']],
   ['limits',['speed','timing','distance','protected']]
  ],probes:['How would you correct outbound timing for a strong headwind inbound?','What information must be included in a complete holding clearance?','Why is the protected side more important than memorizing an entry label?']},
  {id:'approach',title:'Approach, missed, and circling',area:'Approaches',prompt:'Brief an approach and tell me exactly when the missed approach becomes the plan.',source:'Instrument Rating ACS · AIM · current procedure',concepts:[
   ['brief',['frequency','course','altitude','minimums','missed']],
   ['equipment',['gps','dme','vor','required equipment']],
   ['minimums',['da','mda','visibility','runway environment']],
   ['missed',['missed approach','map','climb','hold']]
  ],probes:['What must you see to continue below DA or MDA?','When do you begin the published missed approach?','What changes if a required navigation component is unavailable?']},
  {id:'failures',title:'Failures and lost communications',area:'Abnormal Operations',prompt:'You lose a primary display and then communications in IMC. Explain how your priorities change.',source:'Instrument Rating ACS · AIM · POH/AFM supplements',concepts:[
   ['control',['control','attitude','partial panel','backup instrument']],
   ['avionics failure',['identify','source','cross check','reversion']],
   ['lost comm route',['avef','assigned','vectored','expected','filed']],
   ['lost comm altitude',['highest','minimum altitude','expected','assigned']]
  ],probes:['What route priority applies after lost communications?','How do you decide which instrument is trustworthy after a display disagreement?','What altitude rule applies after losing communications?']}
 ]},
 commercial:{title:'Commercial Pilot',standard:'Commercial Pilot Airplane ACS',hub:'/training/commercial-pilot.html',items:[
  {id:'privileges',title:'Commercial privileges and operating authority',area:'Regulations',prompt:'A customer offers to pay you to fly them somewhere. Explain why a commercial certificate may or may not be enough.',source:'Commercial Pilot ACS · 14 CFR Parts 61, 91, 119',concepts:[
   ['certificate privileges',['commercial pilot','compensation','hire']],
   ['common carriage',['common carriage','holding out','willingness','public']],
   ['operator authority',['part 119','certificate','air carrier','commercial operator']],
   ['exceptions',['119.1','exception','aerial work','instruction']]
  ],probes:['What does “holding out” mean in common-carriage analysis?','Give an example where commercial pilot privileges are enough but an operating certificate is not required.','Why does owning the airplane not automatically solve the operating-authority question?']},
  {id:'airworthiness',title:'Professional airworthiness decision',area:'Airworthiness',prompt:'The airplane is technically legal but has a deferred discrepancy. Explain how you decide whether it is right for the mission.',source:'Commercial Pilot ACS · 14 CFR Part 91 · POH/AFM',concepts:[
   ['legal status',['inspection','required equipment','91.213','records']],
   ['mission effect',['weather','night','terrain','passenger','mission']],
   ['risk margin',['margin','redundancy','backup','conservative']],
   ['decision',['delay','cancel','maintenance','alternative']]
  ],probes:['What makes a legal discrepancy operationally unacceptable?','How should mission pressure change your margin?','Which source controls whether the discrepancy is actually permitted?']},
  {id:'performance',title:'Performance margins',area:'Performance',prompt:'Build the takeoff, climb, cruise, and landing performance picture for today.',source:'Commercial Pilot ACS · POH/AFM',concepts:[
   ['chart inputs',['weight','temperature','pressure altitude','wind']],
   ['takeoff and climb',['takeoff','obstacle','climb','rate']],
   ['landing',['landing distance','runway','surface']],
   ['margin',['interpolation','margin','conservative','condition']]
  ],probes:['How would you handle a chart input that falls between published values?','What performance number matters after clearing the obstacle?','Why can a legal runway still be an unacceptable runway for the mission?']},
  {id:'systems',title:'Systems at commercial depth',area:'Systems',prompt:'Trace a system far enough that a failure indication and the checklist response make sense.',source:'Commercial Pilot ACS · POH/AFM',concepts:[
   ['components',['component','pump','valve','bus','governor']],
   ['indication',['gauge','warning','pressure','temperature','voltage']],
   ['failure chain',['failure','effect','secondary','symptom']],
   ['checklist',['checklist','procedure','limitation','land']]
  ],probes:['What secondary indications would confirm the failure you suspect?','Which component actually creates the cockpit indication?','Which checklist action removes the greatest immediate risk?']},
  {id:'aerodynamics',title:'Aerodynamics and energy',area:'Aerodynamics',prompt:'Explain what the airplane is doing aerodynamically during a commercial maneuver instead of reciting control inputs.',source:'Commercial Pilot ACS · Airplane Flying Handbook',concepts:[
   ['energy',['energy','airspeed','altitude','kinetic','potential']],
   ['load factor',['load factor','bank','stall speed']],
   ['coordination',['coordination','yaw','rudder','slip']],
   ['control relationship',['pitch','power','angle of attack','lift']]
  ],probes:['Why does stall speed increase with load factor?','How do pitch and power trade energy during the maneuver?','What does uncoordinated flight change about the risk picture?']},
  {id:'pivotal',title:'Pivotal altitude and ground reference',area:'Maneuvers',prompt:'Explain why pivotal altitude changes and how wind affects eights-on-pylons.',source:'Commercial Pilot ACS · Airplane Flying Handbook',concepts:[
   ['groundspeed',['groundspeed','wind','speed']],
   ['pivotal altitude',['pivotal altitude','square','relationship']],
   ['wind effect',['wind correction','downwind','upwind']],
   ['visual reference',['pylon','line of sight','pivot']]
  ],probes:['What happens to pivotal altitude as groundspeed increases?','Why is one fixed altitude around the entire maneuver incorrect?','What are you actually judging visually against the pylon?']},
  {id:'weather',title:'Weather and mission pressure',area:'Risk Management',prompt:'The customer wants the flight completed but the weather is trending toward your limit. Explain your decision process.',source:'Commercial Pilot ACS · FAA risk-management guidance',concepts:[
   ['trend',['trend','forecast','metar','taf']],
   ['limits',['personal minimum','aircraft limitation','company','legal']],
   ['pressure',['customer','schedule','money','external pressure']],
   ['outs',['alternate','delay','divert','cancel']]
  ],probes:['How do you keep customer pressure from quietly moving your weather limit?','What trend information matters more than a single METAR?','Name the point where you would stop trying to make the trip work.']},
  {id:'abnormal',title:'Abnormal decisions',area:'Abnormal Operations',prompt:'Talk through a realistic system failure from recognition through landing or shutdown.',source:'Commercial Pilot ACS · POH/AFM',concepts:[
   ['recognition',['indication','recognize','confirm']],
   ['control',['control','airspeed','configuration']],
   ['checklist',['checklist','memory item','procedure']],
   ['landing decision',['land','divert','nearest suitable','shutdown']]
  ],probes:['What would make you land immediately rather than continue to a preferred airport?','Which indication would you use to verify the failure?','What is the risk of doing checklist items before stabilizing the airplane?']}
 ]},
 multi:{title:'Multi-Engine',standard:'Applicable Airplane ACS multi-engine tasks',hub:'/training/multiengine.html',items:[
  {id:'critical',title:'Critical engine',area:'Aerodynamics',prompt:'Explain why losing one engine can be worse than losing the other on some twins.',source:'Airplane ACS · Airplane Flying Handbook · POH/AFM',concepts:[
   ['p factor',['p-factor','descending blade','thrust line']],
   ['accelerated slipstream',['accelerated slipstream','lift','roll']],
   ['spiraling slipstream',['spiraling slipstream','rudder','vertical tail']],
   ['torque',['torque','roll','critical engine']]
  ],probes:['How does P-factor change the yawing moment after an engine failure?','Which critical-engine factor changes roll rather than yaw?','Why is “left engine” not a universal answer for every twin?']},
  {id:'vmc',title:'VMC',area:'Aerodynamics',prompt:'What is VMC, what does the published value represent, and what changes actual directional-control margin?',source:'Airplane ACS · AFH · POH/AFM',concepts:[
   ['definition',['minimum control speed','vmc','directional control']],
   ['certification',['certification','published','conditions','red line']],
   ['factors',['density altitude','weight','cg','power','bank']],
   ['not climb speed',['not climb','control','vyse','performance']]
  ],probes:['Why can actual VMC be lower or higher than the published red-line value?','What happens to VMC when the operating engine can make more power?','Why does being above VMC not guarantee climb performance?']},
  {id:'vyse',title:'VMC versus VYSE',area:'Performance',prompt:'Explain why VMC and VYSE are not interchangeable after an engine failure.',source:'Airplane ACS · POH/AFM',concepts:[
   ['vmc control',['vmc','control','directional']],
   ['vyse performance',['vyse','best rate','single engine','climb']],
   ['blue line',['blue line','target','performance']],
   ['separate questions',['control','climb','performance','separate']]
  ],probes:['Can the airplane be controllable above VMC and still descend?','What does the blue line actually represent?','Which speed answers the control question and which answers the climb-performance question?']},
  {id:'performance',title:'Single-engine performance',area:'Performance',prompt:'Can this airplane climb after an engine failure here? Show me how you decide.',source:'Airplane ACS · POH/AFM performance section',concepts:[
   ['chart',['single engine','climb chart','performance']],
   ['conditions',['weight','temperature','pressure altitude','configuration']],
   ['gradient or rate',['rate','gradient','fpm','percent']],
   ['realistic outcome',['service ceiling','drift down','descend','terrain']]
  ],probes:['What is the difference between single-engine service ceiling and absolute ceiling?','Which configuration errors hurt single-engine climb the most?','If the book shows a negative climb rate, what is your actual plan?']},
  {id:'zero',title:'Zero sideslip',area:'Aerodynamics',prompt:'Why is a small bank normally used toward the operating engine after an engine failure?',source:'Airplane Flying Handbook · POH/AFM',concepts:[
   ['rudder yaw',['rudder','yaw','dead engine']],
   ['bank',['bank','operating engine','lift vector']],
   ['sideslip drag',['sideslip','drag','zero sideslip']],
   ['ball limitation',['ball','not centered','indicator']]
  ],probes:['Why is centering the inclinometer ball not always the zero-sideslip condition?','What does the small bank contribute to directional control?','How does sideslip affect single-engine performance?']},
  {id:'prop',title:'Propeller and feathering',area:'Systems',prompt:'Explain windmilling drag, governor action, and what has to happen to feather or unfeather the propeller.',source:'Airplane ACS · POH/AFM',concepts:[
   ['windmilling drag',['windmill','drag','propeller']],
   ['governor',['governor','oil','blade angle','rpm']],
   ['feather',['feather','high pitch','low drag']],
   ['unfeather',['accumulator','starter','oil pressure','unfeather']]
  ],probes:['Why does a windmilling propeller create so much drag?','What moves the blades toward feather in your airplane?','How does your airplane unfeather the propeller?']},
  {id:'systems',title:'Twin systems',area:'Systems',prompt:'Trace fuel, electrical, and landing-gear systems that matter after an engine failure.',source:'POH/AFM systems section',concepts:[
   ['independence',['independent','left','right','shared']],
   ['fuel',['crossfeed','selector','pump','tank']],
   ['electrical',['alternator','bus','battery','load']],
   ['gear',['hydraulic','electric','emergency extension','pump']]
  ],probes:['Which systems are truly independent and which still share a common component?','What does crossfeed actually allow in your airplane?','Can one alternator carry the full electrical load after an engine failure?']},
  {id:'flow',title:'Engine-failure flow',area:'Abnormal Operations',prompt:'Talk through an engine failure from recognition through landing.',source:'Airplane ACS · POH/AFM emergency procedures',concepts:[
   ['maintain control',['control','pitch','airspeed','direction']],
   ['identify verify',['identify','dead foot','verify','throttle']],
   ['configure',['mixture','prop','throttle','gear','flaps']],
   ['secure and plan',['secure','feather','checklist','land']]
  ],probes:['Why must identification and verification be separate steps?','When might securing the engine be the wrong immediate action?','What airspeed are you targeting and why?']}
 ]},
 cfi:{title:'CFI',standard:'Flight Instructor Airplane ACS',hub:'/training/cfi.html',items:[
  {id:'learning',title:'Learning and human behavior',area:'FOI',prompt:'A learner keeps repeating the same landing error. Diagnose the learning problem and tell me what you change next.',source:'Flight Instructor ACS · Aviation Instructor’s Handbook',concepts:[
   ['diagnosis',['learning','error','cause','perception','habit']],
   ['communication',['question','feedback','explain','demonstrate']],
   ['practice',['practice','repetition','task','scenario']],
   ['assessment',['assess','standard','progress','objective']]
  ],probes:['How do you decide whether the problem is knowledge, skill, or judgment?','What kind of feedback is most useful immediately after the error?','How will you know your changed lesson actually worked?']},
  {id:'responsibility',title:'Instructor responsibilities',area:'Regulations',prompt:'What are you responsible for before you sign a learner off for a solo, knowledge test, or practical test?',source:'Flight Instructor ACS · 14 CFR Part 61 · FAA endorsement guidance',concepts:[
   ['training given',['training','required areas','proficiency']],
   ['records',['logbook','record','training record']],
   ['endorsement',['endorsement','61.87','61.39','knowledge test']],
   ['responsibility',['evaluate','proficient','limitations','expiration']]
  ],probes:['What are you certifying when you sign a practical-test recommendation?','Which solo endorsements expire and which are aircraft specific?','What training record must you keep as an instructor?']},
  {id:'lesson',title:'Lesson structure',area:'Teaching',prompt:'Teach a ten-minute lesson with a clear objective and a way to tell whether the learner got it.',source:'Flight Instructor ACS · Aviation Instructor’s Handbook',concepts:[
   ['objective',['objective','outcome','standard']],
   ['explanation',['explain','demonstrate','example']],
   ['practice',['practice','learner','perform']],
   ['assessment',['assess','question','standard','feedback']]
  ],probes:['State the lesson objective as something the learner can actually do.','What question would expose a misunderstanding instead of just testing recall?','What standard will you use to end the lesson?']},
  {id:'risk',title:'Teach risk management',area:'Risk Management',prompt:'Teach a learner to make a weather decision without turning risk management into slogans.',source:'Flight Instructor ACS · FAA risk-management material',concepts:[
   ['hazard',['hazard','identify','weather','aircraft','pilot']],
   ['risk',['likelihood','severity','risk']],
   ['control',['mitigate','control','margin','alternate']],
   ['trigger',['trigger','limit','decision point','divert']]
  ],probes:['Give the learner one measurable trigger to change the plan.','How do you teach the difference between a hazard and the risk it creates?','What question forces the learner to identify an escape option?']},
  {id:'aero',title:'Teach aerodynamics',area:'Aerodynamics',prompt:'Teach angle of attack or load factor without hiding behind vocabulary.',source:'Flight Instructor ACS · PHAK · Airplane Flying Handbook',concepts:[
   ['plain explanation',['angle of attack','load factor','lift','stall']],
   ['visual',['diagram','demonstrate','sight picture','model']],
   ['prediction',['predict','what happens','change']],
   ['application',['turn','stall','maneuver','real flight']]
  ],probes:['What misconception do students commonly have about stall speed?','How would you demonstrate this concept in the airplane?','What question would make the learner predict the outcome first?']},
  {id:'airworthiness',title:'Teach airworthiness',area:'Airworthiness',prompt:'A learner finds an inoperative item during preflight. Teach them how to decide whether the airplane can fly.',source:'Flight Instructor ACS · 14 CFR Part 91 · POH/AFM',concepts:[
   ['identify rule',['91.213','required equipment','mel']],
   ['aircraft source',['poh','equipment list','kinds of operation']],
   ['maintenance',['maintenance','deactivate','remove','placard']],
   ['judgment',['safe','mission','risk','no go']]
  ],probes:['What source would you have the learner open first?','When must maintenance personnel become involved?','How do you keep the learner from equating “legal” with “safe”?']},
  {id:'maneuver',title:'Teach a maneuver',area:'Flight Instruction',prompt:'Brief, demonstrate, coach, and critique one maneuver.',source:'Flight Instructor ACS · Airplane Flying Handbook',concepts:[
   ['objective',['objective','standard','acs']],
   ['brief',['setup','risk','common error']],
   ['demonstrate coach',['demonstrate','coach','practice']],
   ['critique',['critique','feedback','specific','next attempt']]
  ],probes:['What risk control belongs in the briefing before the maneuver?','What do you say while demonstrating versus while the learner is flying?','Give me one critique that is specific enough to improve the next attempt.']},
  {id:'debrief',title:'Evaluate and debrief',area:'Teaching',prompt:'The learner had a weak flight. Give me a useful debrief instead of a list of everything that went wrong.',source:'Flight Instructor ACS · Aviation Instructor’s Handbook',concepts:[
   ['specific evidence',['specific','example','what happened']],
   ['standard',['standard','acs','objective']],
   ['cause',['why','cause','pattern']],
   ['next action',['next','practice','plan','goal']]
  ],probes:['How do you separate one bad outcome from the underlying cause?','What makes criticism constructive instead of vague?','What should the learner leave the debrief knowing they will do next?']}
 ]},
 cfii:{title:'CFII',standard:'Instrument instructor preparation',hub:'/training/cfii.html',items:[
  {id:'privileges',title:'Instrument instructor privileges',area:'Regulations',prompt:'What instrument training can you give, and what endorsements or records are required?',source:'14 CFR Part 61 · FAA instructor guidance',concepts:[
   ['privileges',['instrument instructor','cfii','training','endorsement']],
   ['limitations',['category','class','instrument','limitation']],
   ['records',['record','logbook','endorsement']],
   ['specific purpose',['ipc','rating','currency','practical test']]
  ],probes:['What can a CFII sign for that a non-instrument CFI cannot?','What records do you keep for endorsements or practical-test recommendations?','How do instrument currency and an IPC differ from instrument-rating training?']},
  {id:'scan',title:'Instrument scan and control',area:'Teaching',prompt:'Teach a learner to recognize a bad instrument scan before it becomes an airplane-control problem.',source:'Instrument Flying Handbook · Aviation Instructor’s Handbook',concepts:[
   ['scan errors',['fixation','omission','emphasis','scan']],
   ['control performance',['control','performance','attitude','power']],
   ['trim',['trim','workload','stabilize']],
   ['diagnosis',['trend','cross check','error','correction']]
  ],probes:['How can you tell fixation from omission?','What cue tells you the learner is chasing instruments instead of controlling performance?','How do you use trim as part of workload management?']},
  {id:'legality',title:'IFR legality and currency',area:'Regulations',prompt:'Give the learner an IFR scenario and make them prove both pilot and aircraft readiness.',source:'Instrument Rating ACS · 14 CFR Parts 61 and 91',concepts:[
   ['pilot',['rating','currency','six approaches','ipc']],
   ['aircraft',['91.205','inspection','pitot static','vor']],
   ['avionics',['database','gps','supplement','approved']],
   ['operator',['limitation','mel','company','aircraft']]
  ],probes:['What fact proves pilot currency?','What fact proves the navigation equipment is approved for the approach?','Which aircraft inspection is easy for instrument students to forget?']},
  {id:'weather',title:'Teach IFR weather decisions',area:'Weather',prompt:'Teach an IFR weather decision rather than just teaching decoding.',source:'Aviation Weather Handbook · current official weather',concepts:[
   ['trend',['trend','metar','taf','forecast']],
   ['icing',['icing','freezing','pirep','cloud tops']],
   ['convection',['thunderstorm','convective','radar','sigmet']],
   ['escape',['alternate','out','divert','fuel']]
  ],probes:['What question moves the learner from decoding weather to deciding?','How would you teach the difference between tactical and strategic weather information?','What escape option must be identified before departure?']},
  {id:'automation',title:'Navigation and automation',area:'Avionics',prompt:'Teach what the avionics know, what they do not know, and how the learner verifies the setup.',source:'Instrument Flying Handbook · AIM · AFM/avionics supplements',concepts:[
   ['mode awareness',['mode','annunciation','armed','active']],
   ['source selection',['gps','vor','nav source','cdi']],
   ['integrity',['waas','raim','integrity','failure']],
   ['manual backup',['manual','raw data','backup','reversion']]
  ],probes:['How do you teach a learner to verify the active navigation source before intercepting final?','What is one automation trap caused by assuming an armed mode is active?','What manual backup should the learner have before accepting automation-dependent routing?']},
  {id:'holding',title:'Teach holding',area:'IFR Procedures',prompt:'Teach a hold so the learner can reason through a clearance they have never seen before.',source:'Instrument Rating ACS · AIM',concepts:[
   ['clearance',['fix','course','direction','legs']],
   ['protected side',['protected','holding side','airspace']],
   ['entry',['entry','direct','parallel','teardrop']],
   ['wind',['wind correction','timing','distance']]
  ],probes:['What should the learner draw first after copying a hold clearance?','How do you prevent entry-method memorization from replacing protected-side reasoning?','How do you teach wind correction after the first circuit?']},
  {id:'approach',title:'Teach approaches',area:'Approaches',prompt:'Have the learner brief, fly, and miss an approach while explaining the reason behind each setup choice.',source:'Instrument Rating ACS · AIM · current procedure',concepts:[
   ['briefing',['course','altitude','minimums','missed']],
   ['setup',['frequency','source','sequence','mode']],
   ['stabilized',['stabilized','descent','course','altitude']],
   ['missed',['missed','map','climb','navigation']]
  ],probes:['What should the learner verify before descending on the final approach segment?','What cue tells you the approach setup is no longer stabilized?','When do you teach the learner to configure for the missed approach?']},
  {id:'failure',title:'Teach failures and partial panel',area:'Abnormal Operations',prompt:'Teach a failure without creating more confusion than the failure itself.',source:'Instrument Rating ACS · Instrument Flying Handbook · POH/AFM',concepts:[
   ['identify bad data',['identify','failed','cross check','unreliable']],
   ['control',['control','attitude','airspeed','stabilize']],
   ['reduce workload',['automation','workload','simplify','vectors']],
   ['exit',['approach','divert','land','declare']]
  ],probes:['How do you make the learner prove which instrument is wrong?','What failure scenario is complex enough to teach but not so complex it becomes theater?','What practical exit would you want the learner to choose early?']}
 ]},
 atp:{title:'ATP / Type Rating',standard:'FAA-S-ACS-11A Airline Transport Pilot and Type Rating Airplane ACS',hub:'/training/atp.html',items:[
  {id:'systems',title:'Transport aircraft systems',area:'Systems',prompt:'Choose a major transport-aircraft system and explain its normal architecture, indications, redundancy, and what changes after a significant failure.',source:'FAA-S-ACS-11A · AFM/FCOM/QRH',concepts:[
   ['architecture',['system','source','bus','pump','valve','channel','redundancy']],
   ['indications',['indication','status','warning','caution','synoptic']],
   ['failure effect',['failure','degraded','lost','alternate']],
   ['crew action',['checklist','qrh','memory','landing','dispatch']]
  ],probes:['Which indications would confirm the failure instead of merely suggesting it?','What redundancy remains after the first failure?','Which action is memory, which belongs in the QRH, and why?']},
  {id:'performance',title:'Transport performance and limitations',area:'Performance',prompt:'Build the performance picture for a heavy departure and explain which numbers are legal limits versus operational margins.',source:'FAA-S-ACS-11A · AFM performance data · company procedures',concepts:[
   ['takeoff data',['v1','vr','v2','takeoff distance','field length']],
   ['weight limits',['structural','performance limited','maximum takeoff weight']],
   ['environment',['temperature','pressure altitude','wind','runway']],
   ['margin',['obstacle','climb','contaminated','margin']]
  ],probes:['What can make the allowable takeoff weight lower than the structural maximum?','How does a runway or wind change affect the performance-limited weight?','Which number protects accelerate-stop capability?']},
  {id:'highalt',title:'High-altitude aerodynamics',area:'High-Altitude Aerodynamics',prompt:'Explain the low-speed and high-speed buffet boundaries at altitude and what happens as the margin between them narrows.',source:'FAA-S-ACS-11A · FAA high-altitude aerodynamics guidance',concepts:[
   ['low speed',['stall','angle of attack','low speed buffet']],
   ['high speed',['mach','critical mach','shock','high speed buffet']],
   ['coffin corner',['margin','narrow','altitude','weight']],
   ['response',['speed','altitude','bank','load factor']]
  ],probes:['Why does increased bank reduce the usable buffet margin?','Which boundary moves when weight changes?','What is the operational response if buffet margin becomes inadequate?']},
  {id:'weather',title:'Air-carrier weather decision',area:'Weather',prompt:'Brief a transport-category flight where convection, icing, or destination weather is the controlling threat. Show the information that changes your plan.',source:'FAA-S-ACS-11A · Aviation Weather Handbook · current official weather',concepts:[
   ['observed forecast',['metar','taf','forecast','trend']],
   ['hazards',['convective','icing','turbulence','sigmet']],
   ['dispatch plan',['alternate','fuel','route','escape']],
   ['decision',['delay','reroute','divert','margin']]
  ],probes:['Which weather information is strategic and which is tactical?','What changes the alternate or fuel plan?','What condition would make you reject the planned route before departure?']},
  {id:'carrier',title:'Air-carrier operational rules',area:'Air Carrier Operations',prompt:'Explain how dispatch/release authority, alternates, fuel, and company specifications interact on a Part 121 flight.',source:'FAA-S-ACS-11A · 14 CFR Part 121 · operations specifications',concepts:[
   ['release',['dispatch release','dispatcher','pic','joint responsibility']],
   ['alternate',['alternate','operations specifications','weather minima']],
   ['fuel',['fuel','reserve','alternate','contingency']],
   ['company authority',['ops specs','manual','company procedure','regulation']]
  ],probes:['What makes company alternate minima different from simply using published approach minima?','Who shares operational-control responsibility for the release?','Which source would you use when company procedures are more restrictive than the regulation?']},
  {id:'crm',title:'CRM and threat management',area:'Human Factors / CRM',prompt:'The crew is rushed, the weather is deteriorating, and one crewmember notices a setup error. Describe how you want the cockpit to handle it.',source:'FAA-S-ACS-11A · FAA CRM / human-factors guidance',concepts:[
   ['speak up',['challenge','speak','assert','concern']],
   ['verify',['cross check','confirm','independent']],
   ['workload',['workload','task saturation','slow down']],
   ['decision',['threat','error','trap','go around','delay']]
  ],probes:['What wording would make the concern unmistakable?','When does workload justify stopping the operation rather than pressing on?','How do you keep hierarchy from suppressing a valid safety concern?']},
  {id:'instrument',title:'Transport instrument procedures',area:'Instrument Procedures',prompt:'Brief a complex arrival and approach, including automation mode awareness, altitude constraints, required navigation capability, and the missed approach.',source:'FAA-S-ACS-11A · AIM · current procedures · AFM/FCOM',concepts:[
   ['procedure',['arrival','approach','constraint','minimums']],
   ['automation',['mode','armed','active','fma']],
   ['navigation',['rnav','rnp','waas','required']],
   ['missed',['missed approach','go around','navigation','altitude']]
  ],probes:['Which automation annunciation must be verified before relying on vertical guidance?','What makes a navigation specification operationally unavailable?','At what point would you discontinue an unstable or incorrectly configured approach?']},
  {id:'emergency',title:'Transport emergency priorities',area:'Emergency Operations',prompt:'A significant system failure occurs in IMC at high workload. Explain the crew priorities from immediate control through diversion and landing.',source:'FAA-S-ACS-11A · AFM/QRH · company emergency procedures',concepts:[
   ['control',['aviate','control','flight path','stabilize']],
   ['identify',['identify','confirm','failure','indication']],
   ['procedure',['memory item','qrh','checklist','ecam','eicas']],
   ['plan',['divert','nearest suitable','fuel','weather','landing']]
  ],probes:['What makes an airport suitable rather than merely nearest?','How should task sharing change after the failure?','Which condition would make you stop troubleshooting and commit to landing?']}
 ]}
};
window.PilotDeskCheckrideData=src;
})();