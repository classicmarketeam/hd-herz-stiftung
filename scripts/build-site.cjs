// Assemble an allowlisted public site; drafts, backups and raw source materials never enter dist.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const source = path.join(root, 'version-2');
const origin = 'https://www.herzhdstiftung.de';
fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(out);
const copy = (from,to) => fs.cpSync(path.join(root,from),path.join(out,to),{recursive:true,filter:p=>!p.endsWith('.DS_Store')});
copy('assets','shared-assets');
copy('assets/images/favicon.ico','favicon.ico');
const faviconLinks='<link rel="icon" type="image/x-icon" href="/favicon.ico?v=20261013"><link rel="icon" type="image/png" sizes="32x32" href="/shared-assets/images/favicon.png?v=20261013"><link rel="apple-touch-icon" sizes="180x180" href="/shared-assets/images/apple-touch-icon.png?v=20261013">';
copy('version-2/assets','assets');
for(const file of ['styles.css','scripts.js','contact-form.js']) copy('version-2/'+file,file);
const urls=[];
for(const dir of ['', 'en']) {
  fs.mkdirSync(path.join(out,dir),{recursive:true});
  for(const file of fs.readdirSync(path.join(source,dir)).filter(f=>f.endsWith('.html'))) {
    let html=fs.readFileSync(path.join(source,dir,file),'utf8');
    html=html.replace(/\s*<meta\s+name="robots"[^>]*>/g,'')
      .replace(/\s*<script>document.documentElement.classList.add\("preview-locked"\);<\/script>/g,'')
      .replace(/\s*<script[^>]*src="[^"]*preview-lock\.js[^>]*><\/script>/g,'');
    html=html.replaceAll(dir ? '../../assets/' : '../assets/', '/shared-assets/');
    // Fail the deployment if an upload exclusion removed a referenced video.
    for (const match of html.matchAll(/<source\b[^>]*\bsrc="([^"]+)"/g)) {
      if (/^https?:\/\//.test(match[1])) continue;
      const mediaPath=decodeURIComponent(match[1].split(/[?#]/)[0]);
      const target=mediaPath.startsWith('/') ? path.join(out,mediaPath) : path.resolve(out,dir,mediaPath);
      if (!fs.existsSync(target) || fs.statSync(target).size===0) {
        throw new Error(`Missing media in ${dir}/${file}: ${match[1]}`);
      }
    }
    const url='/' + (dir ? dir+'/' : '') + (file==='index.html' ? '' : file);
    html=html.replace('</head>',`    <link rel="canonical" href="${origin}${url}" />\n  </head>`);
    fs.writeFileSync(path.join(out,dir,file),html);
    urls.push(url);
  }
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'legacy/manifest.json'),'utf8'));
copy('legacy/wp-content','wp-content');
const ccm=fs.readFileSync(path.join(source,'index.html'),'utf8').match(/<script src="https:\/\/cloud.ccm19.de[^>]*><\/script>/)[0];
for(const entry of manifest){
 const content=fs.readFileSync(path.join(root,'legacy',entry.path,'content.html'),'utf8');
 const title=entry.title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const html=`<!doctype html><html lang="de"><head><meta charset="utf-8">${faviconLinks}${ccm}<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | Archiv – Herz HD Stiftung</title><meta name="description" content="Archivbeitrag der Herz HD Stiftung: ${title}"><link rel="canonical" href="${origin}${entry.path}"><link rel="stylesheet" href="/styles.css"><style>body{background:#f7f4ed;color:#263333}.archive-header,.archive-content,.archive-footer{max-width:960px;margin:auto;padding:32px 24px}.archive-header img{width:140px}.archive-header nav,.archive-footer{display:flex;gap:24px;flex-wrap:wrap}.archive-note{padding:20px;background:#e9e5da}.archive-content img{display:block;max-width:100%;max-height:800px;width:auto;height:auto;margin:24px auto}.archive-content h1,.archive-content h2,.archive-content h3,.archive-content h4{margin:32px 0 16px}.archive-content p{margin:16px 0}.archive-content table{display:block;overflow-x:auto}.archive-content video{max-width:100%}.archive-content a{text-decoration:underline}</style></head><body><header class="archive-header"><a href="/"><img src="/shared-assets/images/logo.png" alt="Herz HD Stiftung"></a><nav><a href="/">Startseite</a><a href="/projekte.html">Projekte</a><a href="/kunst.html">Kunst</a><a href="/kontakt.html">Kontakt</a></nav><p class="archive-note">Archiv der bisherigen Website · Stand 13. Oktober 2026. Dieser Beitrag bleibt für bestehende Links und QR-Codes erreichbar. Angaben zu Aktionen und Preisen können überholt sein.</p></header><main class="archive-content">${content}</main><footer class="archive-footer"><a href="/impressum.html">Impressum</a><a href="/datenschutz.html">Datenschutz</a><a href="#CCM.openWidget">Datenschutzeinstellungen</a><a href="/kontakt.html">Kontakt</a></footer></body></html>`;
 const dest=path.join(out,entry.path,'index.html');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);urls.push(entry.path);
}
fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`\n<url><loc>${origin}${u}</loc></url>`).join('')}\n</urlset>\n`);
fs.writeFileSync(path.join(out,'404.html'),`<!doctype html><html lang="de"><head><meta charset="utf-8">${faviconLinks}<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Seite nicht gefunden | Herz HD Stiftung</title><link rel="stylesheet" href="/styles.css"></head><body><main class="section section-inner"><h1>Diese Seite wurde nicht gefunden.</h1><p>Hier geht es zur <a href="/">Startseite</a> oder zum <a href="/kontakt.html">Kontakt</a>.</p><p lang="en">Page not found. Visit our <a href="/en/">English homepage</a>.</p></main></body></html>`);
console.log(`Built ${urls.length} pages in dist (16 new, ${manifest.length} archived).`);
