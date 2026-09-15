import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.pilot-desk.com',
  output: 'static',
  publicDir: '.astro-public',
  outDir: 'dist',
  build: {
    format: 'file'
  },
  vite: {
    build: {
      sourcemap: false
    }
  }
});
