import json,sys
from urllib.request import Request,urlopen
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
base=sys.argv[1].rstrip('/') if len(sys.argv)>1 else 'https://hd-herz-stiftung.vercel.app'
a=json.loads(Path('migration/redirect-audit.json').read_text())
paths=[p['old_path'] for p in a['pages']]
paths+=['/?p='+p['wordpress_page_id'] for p in a['pages'] if p['wordpress_page_id']]
paths+=['/kontakt.html','/en/contact.html','/impressum.html','/datenschutz.html','/en/legal-notice.html','/en/privacy-policy.html','/robots.txt','/sitemap.xml','/version-2/kontakt.html']
paths += [p.replace('https://www.herzhdstiftung.de','') for p in a['linked_legacy_media_to_preserve']]
def check(p):
 try:
  with urlopen(Request(base+p,method='HEAD'),timeout=25) as r:
   return {'path':p,'status':r.status,'final':r.url}
 except Exception as e:return {'path':p,'error':str(e)}
results=list(ThreadPoolExecutor(6).map(check,paths))
errors=[r for r in results if r.get('status')!=200]
print(json.dumps({'checked':len(results),'errors':errors},ensure_ascii=False,indent=2))
Path('Sicherungen/livegang-20261013/deployment-check.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
assert not errors
