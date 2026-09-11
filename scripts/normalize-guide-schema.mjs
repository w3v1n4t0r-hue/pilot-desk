import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const guides = path.join(root, 'guides');
const logo = 'https://www.pilot-desk.com/assets/icon.svg';

for (const entry of fs.readdirSync(guides, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const file = path.join(guides, entry.name);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  html = html.replace(
    /"author":\{"@type":"Organization","name":"PilotDesk","url":"https:\/\/www\.pilot-desk\.com\/"\}/g,
    `"author":{"@type":"Organization","name":"PilotDesk","url":"https://www.pilot-desk.com/","logo":{"@type":"ImageObject","url":"${logo}"}}`
  );

  if (html !== before) fs.writeFileSync(file, html);
}
