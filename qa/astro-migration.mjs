import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const pkg=JSON.parse(read('package.json'));
const astro=read('astro.config.mjs');
const layout=read('src/layouts/BaseLayout.astro');
const header=read('src/components/Header.astro');
const footer=read('src/components/Footer.astro');
const data=read('src/data/site.mjs');
const home=read('src/pages/index.astro');
const tools=read('src/pages/tools.astro');
const bootstrap=read('assets/app-bootstrap.js');
const nav=read('assets/global-nav.js');
const vercel=JSON.parse(read('vercel.json'));

check(pkg.dependencies?.astro==='7.3.2','Astro dependency is not pinned to the reviewed release');
check(pkg.scripts?.build?.includes('astro build'),'package build script must run Astro');
check(astro.includes("format: 'file'"),'Astro must preserve root .html URL output');
check(astro.includes("publicDir: '.astro-public'"),'Astro must use the migration passthrough public directory');
check(layout.includes('data-pd-astro-native="1"'),'native Astro pages must identify themselves to legacy enhancement scripts');
check(layout.includes('<Header />')&&layout.includes('<Footer />'),'BaseLayout must own shared site chrome');
check(header.includes("import { navSections }"),'Astro header must use shared navigation data');
check(data.includes("label: 'Tools'")&&data.includes("label: 'Plan'")&&data.includes("label: 'Weather'")&&data.includes("label: 'Learn'"),'shared navigation taxonomy is incomplete');
check(['Plan a Flight','Use a Calculator','Study for a Written','Play Daily'].every(x=>data.includes(`'${x}'`)),'shared homepage data must preserve the four primary jobs');
check(home.includes('data-pd-home-account'),'Astro homepage must keep account discovery near the top');
check(tools.includes('pdToolDirectorySearch')&&tools.includes('/assets/tools-directory.js'),'Astro calculator directory wiring is incomplete');
check(bootstrap.includes('isAstroNative')&&bootstrap.includes("/assets/navigation-data.js"),'legacy bootstrap must respect native Astro structure and shared nav data');
check(nav.includes('window.PILOTDESK_NAV')&&nav.includes("data-pd-astro-shell"),'global navigation must use shared data and preserve Astro-rendered markup');
check(vercel.buildCommand==='npm run build'&&vercel.outputDirectory==='dist','Vercel must deploy the Astro dist build');
for(const file of ['dist/index.html','dist/tools.html','dist/calculators/crosswind/index.html','dist/written-prep.html','dist/assets/navigation-data.js','dist/sw.js'])check(fs.existsSync(file),`Astro build missing ${file}`);
if(fs.existsSync('dist/index.html'))check(read('dist/index.html').includes('data-pd-astro-native="1"'),'built homepage is not native Astro output');
if(fs.existsSync('dist/tools.html'))check(read('dist/tools.html').includes('data-pd-astro-native="1"'),'built tools page is not native Astro output');

if(failures.length){console.error('Astro migration checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Astro migration checks passed: shared shell, navigation data, Vercel build output, and legacy-route passthrough verified.');
