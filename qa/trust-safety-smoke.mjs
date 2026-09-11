import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const safety=read('legal/safety.html');
const privacy=read('legal/privacy.html');
const feedback=read('feedback.html');
const weather=read('assets/weather-fixed.js');
const disclaimer=read('legal/disclaimer.html');
const calcSafety=read('assets/safety.js');

assert(safety.includes('TRUST &amp; SAFETY')&&safety.includes('Useful aviation tools, with clear limits.'),'Trust & Safety page identity missing');
assert(safety.includes('not an FAA-approved navigation source')&&safety.includes('not monitored as an emergency service'),'Core aviation limitations missing');
assert(safety.includes('more than 90 minutes old')&&safety.includes('official or approved sources'),'Weather freshness policy missing');
assert(safety.includes('Advertising is isolated')&&safety.includes('Advertising content does not change calculator formulas'),'Ad independence statement missing');
assert(safety.includes('secondary cross-check')&&safety.includes('/sources.html'),'Source hierarchy guidance missing');

assert(privacy.includes('Effective September 11, 2026'),'Privacy policy effective date not updated');
assert(privacy.includes('search text')&&privacy.includes('Weight &amp; Balance entries'),'Sensitive analytics exclusions missing');
assert(privacy.includes('does not sell aircraft-profile data or calculator-input data'),'Data sale statement missing');
assert(privacy.includes('Blocking advertising is not intended to disable'),'Ad/privacy independence statement missing');

assert(feedback.includes('Safety-critical issue'),'Safety-critical feedback option missing');
assert(feedback.includes('Incorrect aviation data or source'),'Aviation data reporting option missing');
assert(feedback.includes('GitHub issues may be public'),'Public feedback privacy warning missing');
assert(feedback.includes('not an emergency channel'),'Emergency-channel warning missing');

assert(weather.includes('function ageMinutes('),'Weather observation age calculation missing');
assert(weather.includes('obsAge>90'),'90-minute weather age threshold missing');
assert(weather.includes('Older observation.')&&weather.includes('Verify current conditions at the source'),'Visible stale-weather warning missing');
assert(weather.includes("warnState?'warn':'live'"),'Stale/partial weather status handling missing');

assert(disclaimer.includes('Do not use PilotDesk as your sole source'),'Primary aviation disclaimer missing');
assert(calcSafety.includes('outside the supported range')&&calcSafety.includes('clearOutputs()'),'Calculator fail-closed validation missing');

console.log('PilotDesk trust and safety checks passed: aviation limits, privacy minimization, safety reporting, stale-weather warnings, and calculator validation verified.');
