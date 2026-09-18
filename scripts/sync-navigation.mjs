import fs from 'node:fs';
import path from 'node:path';
import inventory from '../src/data/inventory.json' with { type: 'json' };
import { navSections, searchable } from '../src/data/site.mjs';

const assets=path.join(process.cwd(),'assets');
const write=(name,body)=>fs.writeFileSync(path.join(assets,name),body,'utf8');

// Keep the legacy aggregate for compatibility, but do not make every page download
// calculator/guide inventory just to render the header.
write('navigation-data.js',`window.PILOTDESK_NAV=${JSON.stringify({sections:navSections,searchable,inventory})};\n`);
write('navigation-core.js',`window.PILOTDESK_NAV_CORE=${JSON.stringify({sections:navSections})};\n`);
write('navigation-search.js',`window.PILOTDESK_NAV_SEARCH=${JSON.stringify(searchable)};\n`);
write('inventory-data.js',`window.PILOTDESK_INVENTORY=${JSON.stringify(inventory)};\n`);

console.log(`Synced split navigation payloads: ${navSections.length} sections, ${searchable.length} search entries, ${inventory.length} inventory entries.`);
