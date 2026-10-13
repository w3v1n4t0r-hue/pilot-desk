// Geometry only: the established calculator remains the source of displayed answers.
export const DIAGRAM_KEYS=new Set(['tsd','holdDistance','tasApprox','crosswind','windTriangle','threeDegree','tod','glide','climbGradient','fpmGradient','gradientAngle','obstacleGradient','turnRadius','rateTurn','stdRate','arcDistance','fuelRequired','endurance','fuelWeight','reciprocal','trueMag','loadFactor','stallBank','densityAltitude','pressureAltitude','isaTemp','cloudBase']);
export const NM_FT = 6076.11549;
export const norm = angle => ((angle % 360) + 360) % 360;
export const shortestAngle = (from, to) => from + ((to - from + 540) % 360) - 180;
const rad = angle => angle * Math.PI / 180;
export const vector = (speed, bearing) => [speed * Math.sin(rad(bearing)), -speed * Math.cos(rad(bearing))];
const finite = values => values.every(Number.isFinite);
export function diagramModel(key, v) {
  if (!finite(Object.values(v))) return null;
  if (key === 'tsd' || key === 'holdDistance') {
    const distance=key==='tsd'?v.distance:v.gs*v.seconds/3600;
    const speed=key==='tsd'?v.speed:v.gs;
    if(!finite([distance,speed])||distance<0||speed<=0)return null;
    if(key==='tsd'&&(!finite([v.time])||v.time<=0))return null;
    if(key==='holdDistance'&&(!finite([v.seconds])||v.seconds<0))return null;
    const seconds=distance/speed*3600;
    const lanes=key==='tsd'?[
      {distance,label:`Time: ${distance} NM at ${speed} kt`,answer:seconds/3600,unit:'hr'},
      {distance:speed*v.time,label:`Distance: ${speed} kt for ${v.time} hr`,answer:speed*v.time,unit:'NM'},
      {distance,label:`Speed: ${distance} NM in ${v.time} hr`,answer:distance/v.time,unit:'kt'}
    ]:[{distance,label:'Straight leg',answer:distance,unit:'NM'}];
    if(!finite([seconds,...lanes.map(l=>l.answer)]))return null;
    return {kind:'journey',title:key==='tsd'?'Time, distance and speed':'Straight-leg distance',lanes,seconds,
      caption:key==='tsd'?'Each row is a separate calculation. Replay follows the first row.':'Straight leg only; this does not show a full holding circuit.'};
  }
  if(key==='tasApprox'){
    if(!finite([v.cas,v.alt])||v.cas<=0)return null;
    const tas=v.cas*(1+.02*v.alt/1000);if(tas<=0)return null;
    return {kind:'airspeed',title:'CAS and estimated TAS',cas:v.cas,tas,alt:v.alt,
      caption:'2% per 1,000 ft training estimate. Both bars use the same speed scale.'};
  }
  if (key === 'crosswind') {
    if (!finite([v.runway,v.windDir,v.windSpeed]) || v.windSpeed < 0 || v.windSpeed > 250) return null;
    const angle = ((v.windDir-v.runway+540)%360)-180;
    return {kind:'crosswind',title:'Runway wind',runway:norm(v.runway),wind:norm(v.windDir),speed:v.windSpeed,
      cross:v.windSpeed*Math.sin(rad(angle)),head:v.windSpeed*Math.cos(rad(angle)),gust:v.gustSpeed,
      caption:'Solid: wind. Dashed: components. Faint: gust, when entered.'};
  }
  if (key === 'windTriangle') {
    if (!finite([v.course,v.tas,v.windDir,v.windSpeed]) || v.tas <= 0 || v.windSpeed < 0) return null;
    const relative = rad(v.windDir-v.course), ratio = v.windSpeed*Math.sin(relative)/v.tas;
    if (Math.abs(ratio)>1) return null;
    const correction = Math.asin(ratio), heading = norm(v.course+correction*180/Math.PI);
    const gs = v.tas*Math.cos(correction)-v.windSpeed*Math.cos(relative);
    if (gs<=0) return null;
    const air = vector(v.tas,heading), wind = vector(v.windSpeed,v.windDir+180);
    return {kind:'triangle',title:'Wind triangle',air,wind,ground:[air[0]+wind[0],air[1]+wind[1]],heading,gs,
      caption:'Solid: airspeed. Dashed: wind. Bright: track over the ground.'};
  }
  if (['threeDegree','tod','glide','climbGradient','fpmGradient','gradientAngle','obstacleGradient'].includes(key)) {
    let distance=10,height,gs=v.gs,climb=false,angle,obstacle=null;
    if(key==='threeDegree'){if(!finite([gs])||gs<=0)return null;distance=gs/60;height=distance*NM_FT*Math.tan(rad(3));angle=3;}
    if(key==='tod'){if(!finite([v.altitude,v.gradient,gs])||v.altitude<0||v.gradient<=0||gs<=0)return null;height=v.altitude;distance=height/v.gradient;angle=Math.atan(v.gradient/NM_FT)*180/Math.PI;}
    if(key==='glide'){if(!finite([v.alt,v.ratio])||v.alt<0||v.ratio<=0)return null;height=v.alt;distance=height*v.ratio/NM_FT;angle=Math.atan(1/v.ratio)*180/Math.PI;}
    if(key==='climbGradient'){if(!finite([v.gradient,gs])||v.gradient<0||gs<=0)return null;distance=gs/60;height=distance*v.gradient;climb=true;angle=Math.atan(v.gradient/NM_FT)*180/Math.PI;}
    if(key==='fpmGradient'){if(!finite([v.fpm,gs])||gs<=0)return null;distance=gs/60;height=Math.abs(v.fpm);climb=v.fpm>=0;angle=Math.atan(Math.abs(v.fpm)*60/gs/NM_FT)*180/Math.PI;}
    if(key==='gradientAngle'){if(!finite([v.angle])||Math.abs(v.angle)>45)return null;angle=Math.abs(v.angle);distance=1;height=distance*NM_FT*Math.tan(rad(angle));climb=v.angle>=0;}
    if(key==='obstacleGradient'){if(!finite([v.obstacle,v.distance,v.margin])||v.obstacle<0||v.margin<0||v.distance<=0)return null;distance=v.distance;height=v.obstacle+v.margin;obstacle=v.obstacle;climb=true;angle=Math.atan(height/(distance*NM_FT))*180/Math.PI;}
    if(!finite([distance,height,angle]))return null;
    return {kind:'profile',title:climb?'Climb profile':key==='glide'?'Glide profile':'Descent profile',distance,height,gs,climb,angle,obstacle,
      minutes:gs>0?distance/gs*60:null,caption:(['threeDegree','climbGradient','fpmGradient'].includes(key)?'One minute at the entered groundspeed. ':key==='gradientAngle'?'One nautical mile at the entered angle. ':'')+'Height and distance use separate scales.'};
  }
  if(['turnRadius','rateTurn','stdRate','arcDistance'].includes(key)) {
    let radius,rate,bank=v.bank,degrees=360;
    if(key==='arcDistance'){if(!finite([v.radius,v.degrees])||v.radius<=0||v.degrees<0||v.degrees>360)return null;radius=v.radius;degrees=v.degrees;}
    else{if(!finite([v.tas])||v.tas<=0)return null;if(key==='stdRate')bank=Math.atan((3*Math.PI/180)*(v.tas*.514444)/9.80665)*180/Math.PI;if(!Number.isFinite(bank)||bank<=0||bank>=90)return null;radius=v.tas*v.tas/(11.26*Math.tan(rad(bank)))/NM_FT;rate=key==='stdRate'?3:1091*Math.tan(rad(bank))/v.tas;}
    return {kind:'turn',title:'Turn geometry',radius,rate,bank,degrees,seconds:rate>0?degrees/rate:null,
      caption:'The circle shows radius. Replay follows the selected arc once.'};
  }
  if(['fuelRequired','endurance','fuelWeight'].includes(key)) {
    let total,trip,reserve=0,remaining=0;
    if(key==='fuelWeight'){if(!finite([v.gallons,v.ppg])||v.gallons<0||v.ppg<=0)return null;total=v.gallons;trip=total;}
    else {if(!finite([v.fuel,v.burn,v.reserve])||v.fuel<0||v.burn<=0||v.reserve<0)return null;total=v.fuel;reserve=v.burn*v.reserve/60;if(key==='fuelRequired'){if(!finite([v.time])||v.time<0)return null;trip=v.burn*v.time;}else trip=Math.max(0,total-reserve);remaining=total-trip-reserve;}
    return {kind:'fuel',title:key==='fuelWeight'?'Fuel volume':'Fuel allocation',total,trip,reserve,remaining,
      caption:key==='fuelWeight'?'Volume shown in US gallons; weight uses your entered fuel density.':'Trip, reserve and remaining fuel use the values you entered.'};
  }
  if(['reciprocal','trueMag'].includes(key)) {
    if(key==='reciprocal'){if(!finite([v.heading]))return null;return {kind:'heading',title:'Reciprocal heading',first:norm(v.heading),second:norm(v.heading+180),labels:['Entered','Reciprocal'],caption:'The reciprocal is 180° from the entered direction.'};}
    if(!finite([v.direction,v.variation]))return null;
    return {kind:'heading',title:'True and magnetic',first:norm(v.direction),second:norm(v.direction-v.variation),labels:['Entered as true','Magnetic'],caption:'This diagram uses the entered direction as true. The calculator also gives the reverse conversion.'};
  }
  if(['loadFactor','stallBank'].includes(key)) {
    if(!finite([v.bank])||v.bank<0||v.bank>80)return null;
    const factor=1/Math.cos(rad(v.bank));
    return {kind:'bank',title:'Bank and load',bank:v.bank,factor,stallFactor:Math.sqrt(factor),caption:'Coordinated, level-turn relationship. The curve shows load factor against bank.'};
  }
  if(['densityAltitude','pressureAltitude','isaTemp','cloudBase'].includes(key)) {
    let first,second,labels;
    if(key==='densityAltitude'){if(!finite([v.pa,v.oat])||v.oat<=-273.15||v.pa>36089)return null;const theta=1-.0065*v.pa*.3048/288.15,p=101325*Math.pow(theta,9.80665/(287.05287*.0065)),rho=p/(287.05287*(v.oat+273.15));first=v.pa;second=(288.15/.0065)*(1-Math.pow(rho/1.225,1/(9.80665/(287.05287*.0065)-1)))/.3048;labels=['Pressure altitude','Density altitude'];}
    if(key==='pressureAltitude'){if(!finite([v.elev,v.altimeter]))return null;first=v.elev;second=v.elev+(29.92-v.altimeter)*1000;labels=['Field elevation','Pressure altitude'];}
    if(key==='isaTemp'){if(!finite([v.alt]))return null;first=0;second=v.alt;labels=['Sea level','Entered altitude'];}
    if(key==='cloudBase'){if(!finite([v.temp,v.dew])||v.dew>v.temp)return null;first=0;second=(v.temp-v.dew)/2.444444*1000;labels=['Surface','Estimated cloud base'];}
    if(!finite([first,second]))return null;
    return {kind:'altitude',title:key==='cloudBase'?'Cloud-base estimate':'Altitude comparison',first,second,labels,
      caption:key==='densityAltitude'?'Altitude comparison only. Aircraft performance comes from its approved data.':'Markers share the same altitude scale.'};
  }
  return null;
}
