import fs from 'node:fs';

const edit=(file,replacements)=>{
  let s=fs.readFileSync(file,'utf8');
  for(const [from,to] of replacements){
    if(!s.includes(from))throw new Error(`Missing expected copy in ${file}: ${from}`);
    s=s.replaceAll(from,to);
  }
  fs.writeFileSync(file,s);
  console.log('updated',file);
};

edit('changelog.html',[
  ['short FAQ sections built around standard aviation relationships and reminders','short FAQ sections covering standard aviation relationships and reminders']
]);

edit('guides/flight-planning.html',[
  ["PilotDesk's <a href=\"/airport.html\">Airport Search</a> is designed as a starting workspace, but","PilotDesk's <a href=\"/airport.html\">Airport Search</a> is a starting point, but"],
  ['<h2>A connected PilotDesk workflow</h2>','<h2>Planning with PilotDesk</h2>']
]);

edit('guides/metar-taf.html',[
  ['PilotDesk is designed to keep the official sources close, not hide them behind a simplified interpretation.','PilotDesk keeps links to the official sources beside the simplified explanation.']
]);

edit('guides/true-airspeed-rule.html',[
  ['The 2% rule is intentionally a shortcut, not exact TAS.','The 2% rule is a shortcut, not exact TAS.']
]);

edit('index.html',[
  ['Built around common pilot math.','Common pilot math.']
]);

edit('legal/privacy.html',[
  ['PilotDesk is designed to work with as little personal information as practical.','PilotDesk collects as little personal information as practical for the features it provides.'],
  ['PilotDesk does not intentionally upload aircraft-profile values or calculator inputs to a PilotDesk account or database.','PilotDesk does not send aircraft-profile values or calculator inputs to a PilotDesk account or database during normal use.'],
  ['These events are designed to identify the feature or page, not the numerical values you entered.','These events identify the feature or page, not the numerical values you entered.'],
  ['PilotDesk does not intentionally send aircraft names, tail numbers, passenger information, calculator inputs, Weight & Balance entries, or raw profile data as analytics-event properties.','PilotDesk is configured not to send aircraft names, tail numbers, passenger information, calculator inputs, Weight & Balance entries, or raw profile data as analytics-event properties.'],
  ['It is not designed to include aircraft profiles, calculator inputs or form contents.','It excludes aircraft profiles, calculator inputs and form contents from the report format.'],
  ['PilotDesk does not knowingly create child accounts or intentionally collect personal information from children through an account system.','PilotDesk does not knowingly create child accounts or knowingly collect personal information from children through an account system.']
]);

edit('legal/safety.html',[
  ['PilotDesk is designed to show an error or no result rather than silently invent a number.','PilotDesk should show an error or no result rather than silently invent a number.']
]);

edit('planner.html',[
  ["Current weather is requested live through PilotDesk's server endpoint and is not intentionally served from the offline cache.","Current weather is requested live through PilotDesk's server endpoint and bypasses the offline cache."]
]);

edit('sources.html',[
  ['Weather responses are not intentionally served from the PilotDesk offline cache.','Weather responses bypass the PilotDesk offline cache.']
]);

console.log('Remaining public copy cleanup complete.');
