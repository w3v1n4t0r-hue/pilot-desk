import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
// Reuse the bundler already installed by Astro, including under pnpm isolation.
const esbuildPath=require.resolve('esbuild',{paths:[dirname(require.resolve('astro'))]});
const { build }=await import(pathToFileURL(esbuildPath).href);
fs.mkdirSync('.astro-public/assets',{recursive:true});
await build({entryPoints:['src/scripts/calculator-motion.js'],outfile:'.astro-public/assets/calculator-motion-runtime.js',bundle:true,format:'iife',platform:'browser',target:'es2020',minify:true,loader:{'.svg':'text'}});
console.log('Built calculator-only Motion runtime.');
