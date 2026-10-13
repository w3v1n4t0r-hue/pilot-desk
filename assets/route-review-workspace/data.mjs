export const SCENARIO = { date: '2026-10-09', hour: 18, label: '09 OCT 2026', region: 'Northern Plains & northern Rockies' };
// Deliberately synthetic weather, reports, restrictions and forecasts. Coordinates
// are approximate geographic reference positions; no operational airport data.
const rows = [
 ['KGFK','Grand Forks Intl','Grand Forks, ND',47.949,-97.176,true,4000,10,300,12],
 ['KMOT','Minot Intl','Minot, ND',48.260,-101.280,true,1800,5,310,18],
 ['KXWA','Williston Basin Intl','Williston, ND',48.258,-103.751,false,800,2,330,16],
 ['KFAR','Hector Intl','Fargo, ND',46.921,-96.816,true,5000,10,290,9],
 ['KBIS','Bismarck Municipal','Bismarck, ND',46.773,-100.746,true,2500,6,320,15],
 ['KDIK','Dickinson Regional','Dickinson, ND',46.797,-102.802,false,2200,5,310,14],
 ['KDVL','Devils Lake Regional','Devils Lake, ND',48.114,-98.909,false,2800,6,310,14],
 ['KJMS','Jamestown Regional','Jamestown, ND',46.930,-98.678,false,3500,10,300,12],
 ['KRUG','Rugby Municipal','Rugby, ND',48.390,-100.025,false,1400,4,320,16],
 ['KSDY','Sidney–Richland','Sidney, MT',47.706,-104.193,false,1500,4,320,11],
 ['KOLF','L. M. Clayton','Wolf Point, MT',48.094,-105.575,false,700,2,330,10],
 ['KGGW','Glasgow Intl','Glasgow, MT',48.212,-106.615,false,400,1,340,12],
 ['KMLS','Miles City','Miles City, MT',46.428,-105.886,false,3500,10,290,13],
 ['KBIL','Billings Logan Intl','Billings, MT',45.808,-108.543,true,6000,10,280,16],
 ['KLWT','Lewistown Municipal','Lewistown, MT',47.049,-109.467,false,1800,5,290,17],
 ['KHVR','Havre City–County','Havre, MT',48.543,-109.762,false,2200,5,300,14],
 ['KGTF','Great Falls Intl','Great Falls, MT',47.482,-111.371,true,4500,10,260,20],
 ['KHLN','Helena Regional','Helena, MT',46.607,-111.983,true,3000,6,250,12],
 ['KBZN','Bozeman Yellowstone Intl','Bozeman, MT',45.777,-111.153,true,5500,10,260,10],
 ['KMSO','Missoula Montana','Missoula, MT',46.917,-114.091,true,1200,4,230,8],
 ['KGPI','Glacier Park Intl','Kalispell, MT',48.311,-114.256,true,800,2,220,7],
 ['KCTB','Cut Bank Intl','Cut Bank, MT',48.608,-112.376,false,3500,10,270,18],
 ['KGEG','Spokane Intl','Spokane, WA',47.620,-117.534,true,4000,10,240,10],
 ['KCOE','Coeur d’Alene','Coeur d’Alene, ID',47.774,-116.820,false,1800,5,240,8],
 ['KRAP','Rapid City Regional','Rapid City, SD',44.045,-103.057,true,6000,10,320,15],
 ['KPIR','Pierre Regional','Pierre, SD',44.383,-100.286,true,5000,10,310,12],
 ['KABR','Aberdeen Regional','Aberdeen, SD',45.449,-98.422,true,4500,10,290,10],
 ['KATY','Watertown Regional','Watertown, SD',44.914,-97.154,true,4500,10,280,10],
 ['KBJI','Bemidji Regional','Bemidji, MN',47.510,-94.934,false,3500,10,280,8],
 ['KBRD','Brainerd Lakes Regional','Brainerd, MN',46.399,-94.138,false,4000,10,280,9],
 ['KDLH','Duluth Intl','Duluth, MN',46.842,-92.194,true,2500,5,270,9],
 ['KGPZ','Grand Rapids–Itasca','Grand Rapids, MN',47.211,-93.510,false,3000,6,280,8],
 ['KSTC','St. Cloud Regional','St. Cloud, MN',45.546,-94.060,true,5000,10,280,8],
 ['KSHR','Sheridan County','Sheridan, WY',44.769,-106.980,false,6000,10,280,12]
];
export const airports = rows.map(([id,name,city,lat,lon,towered,ceiling,visibility,wind,windSpeed],i)=>({id,name,city,lat,lon,towered,ceiling,visibility,wind,windSpeed,temp:7+i%6,dew:4+i%4,altimeter:29.83+i%8*.01}));
export const hazards = [
 {id:'ga-ice',layer:'gairmet',type:'G-AIRMET',title:'Zulu · moderate icing',severity:'caution',description:'Sample forecast of moderate icing. Freezing level near 5,000 ft MSL, with cloud tops near 12,000 ft.',floor:5000,ceiling:12000,start:18,end:22,coords:[[-103.6,48.9],[-100.1,48.8],[-99.8,47.0],[-103.8,47.1]]},
 {id:'ga-ifr',layer:'gairmet',type:'G-AIRMET',title:'Sierra · low ceilings',severity:'caution',description:'Sample area of ceilings below 1,000 ft AGL or visibility below 3 SM. Surface conditions can affect departure and arrival at any cruise altitude.',floor:0,ceiling:60000,surface:true,start:18,end:24,coords:[[-107.6,49.0],[-103.7,49.0],[-103.4,47.1],[-107.3,47.3]]},
 {id:'ga-turb',layer:'gairmet',type:'G-AIRMET',title:'Tango · moderate turbulence',severity:'caution',description:'Sample forecast of moderate turbulence along the northern Rockies.',floor:8000,ceiling:18000,start:18,end:23,coords:[[-115.6,48.6],[-111.1,48.4],[-110.7,45.2],[-114.7,45.3]]},
 {id:'sig-west',layer:'sigmet',type:'SIGMET',title:'Severe turbulence',severity:'warning',description:'Sample SIGMET for severe turbulence near the Continental Divide. This is a test area, not an issued advisory.',floor:10000,ceiling:24000,start:19,end:23,coords:[[-113.6,48.3],[-111.5,47.9],[-111.7,45.8],[-113.7,46.0]]},
 {id:'sig-east',layer:'sigmet',type:'SIGMET',title:'Embedded thunderstorms',severity:'warning',description:'Sample convective SIGMET. Embedded thunderstorms moving east. Tops FL350.',floor:0,ceiling:60000,start:20,end:23,coords:[[-99.6,47.0],[-97.8,47.5],[-96.9,45.0],[-98.8,44.7]]},
 {id:'tfr-minot',layer:'tfr',type:'TFR',title:'Temporary flight restriction',severity:'warning',description:'Simulated restriction northeast of Minot, included to test route conflicts. The circle and altitude limits are invented.',floor:0,ceiling:8000,start:18,end:21,center:[-101.13,48.30],radius:8},
 {id:'tfr-west',layer:'tfr',type:'TFR',title:'Fire response area',severity:'warning',description:'Simulated fire response restriction west of Helena. The circle and altitude limits are invented.',floor:0,ceiling:11500,start:18,end:24,center:[-112.63,46.70],radius:12}
];
export const pireps = [
 {id:'ua-1',layer:'pireps',type:'PIREP',title:'Moderate rime icing',severity:'caution',lon:-100.65,lat:48.1,altitude:7000,hour:17.75,aircraft:'BE20',kind:'icing',raw:'DEMO UA /OV MOT090025 /TM 1745 /FL070 /TP BE20 /IC MOD RIME',description:'Sample pilot report of moderate rime icing at 7,000 ft MSL.'},
 {id:'ua-2',layer:'pireps',type:'PIREP',title:'Light turbulence',severity:'caution',lon:-99.0,lat:47.95,altitude:6000,hour:17.5,aircraft:'C172',kind:'turbulence',raw:'DEMO UA /OV DVL /TM 1730 /FL060 /TP C172 /TB LGT',description:'Sample pilot report of light turbulence at 6,000 ft MSL.'},
 {id:'ua-3',layer:'pireps',type:'PIREP',title:'Cloud tops at 8,500 ft',severity:'info',lon:-103.4,lat:48.22,altitude:8500,hour:17.9,aircraft:'PA44',kind:'cloud',raw:'DEMO UA /OV XWA /TM 1754 /FL085 /TP PA44 /SK OVC-TOP085',description:'Sample pilot report of an overcast layer with tops at 8,500 ft MSL.'},
 {id:'ua-4',layer:'pireps',type:'PIREP',title:'Severe turbulence',severity:'warning',lon:-112.1,lat:46.8,altitude:12000,hour:18,aircraft:'BE20',kind:'turbulence',raw:'DEMO UUA /OV HLN /TM 1800 /FL120 /TP BE20 /TB SEV',description:'Sample urgent pilot report of severe turbulence at 12,000 ft MSL.'},
 {id:'ua-5',layer:'pireps',type:'PIREP',title:'Light clear icing',severity:'caution',lon:-114.4,lat:47.5,altitude:9000,hour:18.3,aircraft:'PC12',kind:'icing',raw:'DEMO UA /OV MSO /TM 1818 /FL090 /TP PC12 /IC LGT CLR',description:'Sample pilot report of light clear icing at 9,000 ft MSL.'},
 {id:'ua-6',layer:'pireps',type:'PIREP',title:'Smooth air',severity:'info',lon:-95.8,lat:46.6,altitude:5500,hour:17.8,aircraft:'C182',kind:'turbulence',raw:'DEMO UA /OV FAR /TM 1748 /FL055 /TP C182 /TB NEG',description:'Sample pilot report of smooth air at 5,500 ft MSL.'}
];
export const radar = [
 {coords:[[-102.7,48.7],[-101.9,48.8],[-100.9,48.4],[-100.6,47.7],[-101.1,47.4],[-102.0,47.6],[-102.5,48.1]],level:1},
 {coords:[[-102.2,48.4],[-101.6,48.5],[-101.1,48.1],[-101.3,47.8],[-101.9,47.9]],level:2},
 {coords:[[-114.9,48.7],[-114.0,48.5],[-113.6,47.8],[-113.8,46.7],[-114.5,46.3],[-115.0,47.3]],level:1},
 {coords:[[-99.5,46.8],[-98.5,47.0],[-97.5,46.2],[-97.2,45.0],[-98.0,44.5],[-99.0,45.3]],level:2},
 {coords:[[-98.9,46.3],[-98.3,46.3],[-97.8,45.7],[-98.1,45.2],[-98.6,45.5]],level:3}
];
export const examples = [
 {name:'Grand Forks → Williston',ids:['KGFK','KMOT','KXWA']},
 {name:'Across western Montana',ids:['KBIL','KHLN','KMSO']},
 {name:'Northern Plains',ids:['KFAR','KBIS','KDIK']}
];
export const geo = {
 bounds:[-120,41,-89,51],
 states:[
 {name:'NORTH DAKOTA',label:[-100.5,47.3],coords:[[-104.05,49],[-97.23,49],[-97.0,48.3],[-96.84,47.6],[-96.56,46.9],[-96.58,45.94],[-104.05,45.94]]},
 {name:'SOUTH DAKOTA',label:[-100.3,44.8],coords:[[-104.05,45.94],[-96.58,45.94],[-96.45,45.3],[-96.45,43.5],[-96.6,43.0],[-104.05,43.0]]},
 {name:'MONTANA',label:[-109.4,47.8],coords:[[-116.05,49],[-104.05,49],[-104.05,45],[-111.05,45],[-111.05,44.48],[-112.4,44.45],[-113.1,45.1],[-113.8,45.6],[-114.5,46.6],[-115.6,47.5],[-116.05,47.9]]},
 {name:'MINNESOTA',label:[-94.2,46.1],coords:[[-97.23,49],[-95.15,49],[-95.15,49.38],[-94.8,49.38],[-94.6,48.8],[-93.2,48.65],[-92.4,48.2],[-91.8,48.2],[-89.5,47.9],[-91.1,46.8],[-92.1,46.7],[-92.3,45.5],[-92.8,45],[-92.7,44.6],[-91.2,43.5],[-96.45,43.5],[-96.45,45.3],[-96.58,45.94],[-96.56,46.9],[-96.84,47.6],[-97,48.3]]},
 {name:'WYOMING',label:[-107.5,43.7],coords:[[-111.05,45],[-104.05,45],[-104.05,41],[-111.05,41]]},
 {name:'IDAHO',label:[-115.5,45.1],coords:[[-117.03,49],[-116.05,49],[-116.05,47.9],[-115.6,47.5],[-114.5,46.6],[-113.8,45.6],[-113.1,45.1],[-112.4,44.45],[-111.05,44.48],[-111.05,42],[-117.0,42],[-117.2,44.5],[-116.5,46],[-117.03,46]]},
 {name:'WASHINGTON',label:[-118.5,47.8],coords:[[-124,49],[-117.03,49],[-117.03,46],[-119,46],[-120,45.7],[-124,46.2]]}
 ],
 rivers:[
 [[-111.8,46.8],[-111.3,47.4],[-110.5,47.8],[-109.3,47.6],[-108,47.6],[-106.4,48],[-105.6,48],[-104.4,48.1],[-103.9,47.9],[-103,47.8],[-102.2,47.6],[-101.4,47.5],[-100.9,47],[-100.7,46.8],[-100.3,46.2],[-100.2,45.5],[-100.5,44.9],[-100.3,44.3],[-99.9,43.9]],
 [[-110.5,44.6],[-109.8,45.3],[-108.8,45.6],[-108.5,45.8],[-107.2,46.1],[-106,46.4],[-104.8,47.1],[-104.2,47.5],[-103.9,47.9]],
 [[-96.55,46],[-96.8,46.6],[-96.85,47],[-97.06,47.95],[-97.13,48.5],[-97.23,49]]
 ],
 lakes:[
 [[-102.9,47.9],[-102.1,47.8],[-101.5,47.65],[-101.35,47.45],[-102.1,47.6],[-102.9,47.65]],
 [[-114.25,47.96],[-114.07,47.95],[-114.04,47.55],[-114.18,47.48],[-114.28,47.7]],
 [[-91.1,46.8],[-89.6,47.9],[-87,47.5],[-88,46.5],[-90.3,46.6]]
 ],
 roads:[
 [[-117.5,47.6],[-116.8,47.7],[-115.4,47.1],[-114.1,46.9],[-112.5,45.9],[-111.2,45.7],[-108.5,45.8],[-106.8,44.8],[-103.2,44.1],[-100.3,43.8],[-96.7,43.5]],
 [[-108.5,45.8],[-107,46.2],[-105.8,46.4],[-104.4,47.0],[-102.8,46.9],[-100.7,46.8],[-98.6,46.9],[-96.8,46.9],[-94.2,46.4]],
 [[-111.2,45.7],[-112,46.6],[-111.4,47.5],[-111.9,48.5]]
 ]
};
