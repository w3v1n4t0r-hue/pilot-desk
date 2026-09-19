import fs from 'node:fs';

const required = [
  ['PRODUCT-ROADMAP.md', /why does a pilot come back tomorrow/i],
  ['site.webmanifest', /"display":"standalone"/],
  ['sw.js', /addEventListener\('fetch'/],
  ['daily/index.html', /PilotDesk Daily/i],
  ['learn/oral-exam/index.html', /oral/i],
  ['aircraft.html', /Aircraft/i],
  ['account.html', /Your PilotDesk/i],
  ['assets/page-share.js', /navigator\.share/],
  ['supabase/migrations/001_pilotdesk_accounts.sql', /saved_calculations/],
  ['supabase/migrations/010_expand_pilot_stages.sql', /'cfii'/],
];

let failed = false;
for (const [file, pattern] of required) {
  const text = fs.readFileSync(file, 'utf8');
  if (!pattern.test(text)) {
    failed = true;
    console.error(`FAIL ${file}: missing ${pattern}`);
  } else {
    console.log(`PASS ${file}`);
  }
}
if (failed) process.exit(1);
