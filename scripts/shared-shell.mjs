import { navSections, footerLinks } from '../src/data/site.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sharedShell(html){
 const header=`<header class="topbar" data-pd-astro-shell><a class="brand" href="/" aria-label="PilotDesk home"><span class="brandmark" aria-hidden="true"><img src="/favicon.svg" alt="" width="40" height="40"></span><span><b>PilotDesk</b><small>FLIGHT TOOLS</small></span></a><button aria-label="Open navigation" aria-expanded="false" class="menu-btn" data-menu type="button">☰</button><nav class="pd-main-nav" aria-label="Main navigation">${navSections.map(s=>`<div class="pd-nav-item" data-pd-nav-item><button class="pd-nav-button" type="button" aria-expanded="false">${esc(s.label)}<i class="pd-nav-caret" aria-hidden="true"></i></button><div class="pd-nav-menu">${s.items.map(([u,t,c])=>`<a href="${u}"><b>${esc(t)}</b><span>${esc(c)}</span></a>`).join('')}</div></div>`).join('')}</nav><div class="pd-header-actions"><a class="pd-account-link" href="/account.html" data-pd-account-link><span class="pd-account-avatar" hidden>PD</span><span class="pd-account-text">Sign in</span></a></div></header>`;
 const footer=`<footer><b>PilotDesk</b><p>Aviation tools for planning and training.</p><div class="footer-links">${footerLinks.map(([u,t])=>`<a href="${u}">${esc(t)}</a>`).join('')}</div><p class="fine">Planning aid only. Verify operational information with current approved sources.</p></footer>`;
 // Normalize every legacy favicon/logo reference to the user-created PilotDesk mark.
 html=html.split('/assets/icon.svg').join('/favicon.svg');
 html=html.split('https://www.pilot-desk.com/assets/icon.svg').join('https://www.pilot-desk.com/favicon.svg');
 const canonicalIcon='<link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">';
 if(/<link\b[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/i.test(html)){
   html=html.replace(/<link\b[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi,canonicalIcon);
 }else if(/<\/head>/i.test(html)){
   html=html.replace(/<\/head>/i,canonicalIcon+'</head>');
 }
 if(!/<header\b[^>]*class="topbar"/.test(html))return html;
 html=html.replace(/<header\b[^>]*class="topbar"[^>]*>[\s\S]*?<\/header>/,header);
 html=/<footer\b/.test(html)?html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/,footer):html.replace('</body>',footer+'</body>');
 if(!html.includes('src="/assets/navigation-core.js"'))html=html.replace('</body>','<script defer src="/assets/navigation-core.js"></script></body>');
 if(!html.includes('src="/assets/global-nav.js"'))html=html.replace('</body>','<script defer src="/assets/global-nav.js"></script></body>');
 if(!html.includes('src="/assets/app-bootstrap.js"'))html=html.replace('</body>','<script defer src="/assets/app-bootstrap.js"></script></body>');
 if(!html.includes('/_vercel/insights/script.js'))html=html.replace('</body>','<script defer src="/_vercel/insights/script.js"></script></body>');
 return html;
}
