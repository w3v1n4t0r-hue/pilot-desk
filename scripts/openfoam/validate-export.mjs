import fs from 'node:fs';
import { validateDataset } from '../../assets/flight-lab-data.mjs';
validateDataset(JSON.parse(fs.readFileSync(0,'utf8')));
console.log('Flight Lab dataset contract passed.');
