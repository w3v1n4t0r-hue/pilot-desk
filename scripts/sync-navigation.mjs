import fs from 'node:fs';
import path from 'node:path';
import inventory from '../src/data/inventory.json' with { type: 'json' };
import { navSections, searchable } from '../src/data/site.mjs';

const out = path.join(process.cwd(), 'assets', 'navigation-data.js');
const payload = `window.PILOTDESK_NAV=${JSON.stringify({ sections: navSections, searchable, inventory })};\n`;
fs.writeFileSync(out, payload, 'utf8');
console.log(`Synced shared navigation data to ${path.relative(process.cwd(), out)}.`);
