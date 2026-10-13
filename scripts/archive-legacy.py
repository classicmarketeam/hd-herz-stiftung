"""Snapshot public legacy pages; generate inert archive content (requires beautifulsoup4)."""
import json, re, hashlib, html
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlsplit, urljoin
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parent.parent
BACKUP=ROOT/'Sicherungen/livegang-20261013/public'
OUT=ROOT/'legacy'
audit=json.loads((ROOT/'migration/redirect-audit.json').read_text())
BASE='https://www.herzhdstiftung.de'

def fetch(url):
    with urlopen(Request(url,headers={'User-Agent':'HerzHD-Migration/1.0'}), timeout=40) as r:
        return r.read()

def page_snapshot(p):
    dest=BACKUP/(p['old_path'].strip('/') or '_home')/'index.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    if not dest.exists(): dest.write_bytes(fetch(p['old_url']))
    return p,BeautifulSoup(dest.read_bytes(),'html.parser')

pages=list(ThreadPoolExecutor(5).map(page_snapshot,audit['pages']))
resources=set(audit['linked_legacy_media_to_preserve'])
for p,s in pages:
    for el in s.find_all(['img','source','video','link','a']):
        for attr in ['src','poster','href']:
            v=el.get(attr,'')
            url=urljoin(BASE,v)
            if urlsplit(url).netloc in ['www.herzhdstiftung.de','herzhdstiftung.de'] and urlsplit(url).path.startswith('/wp-content/'):
                resources.add(url)

def asset_snapshot(url):
    path=urlsplit(url).path.lstrip('/')
    dest=BACKUP/path
    dest.parent.mkdir(parents=True,exist_ok=True)
    if not dest.exists(): dest.write_bytes(fetch(url))
    return url,path

assets=[]; failures=[]
with ThreadPoolExecutor(5) as pool:
    futures={pool.submit(asset_snapshot,u):u for u in sorted(resources)}
    for f,u in futures.items():
        try: assets.append(f.result())
        except Exception as e: failures.append({'url':u,'error':str(e)})

# Do not silently publish an archive missing a linked original download.
for u in audit['linked_legacy_media_to_preserve']:
    assert any(x[0]==u for x in assets), u

allowed={'div','section','article','p','h1','h2','h3','h4','h5','h6','a','img','figure','figcaption','ul','ol','li','strong','em','b','i','u','br','span','blockquote','table','thead','tbody','tr','td','th','video','source','hr','sup','sub'}
records=[]
for p,s in pages:
    if p['status']!='needs_content_decision': continue
    main=s.find('main')
    assert main is not None,p['old_url']
    for el in main.find_all(['script','style','noscript','form','input','button','svg']): el.decompose()
    for el in main.find_all('iframe'):
        link=s.new_tag('a',href=el.get('src',''))
        link.string='Video auf der Website des Anbieters öffnen'
        el.replace_with(link)
    for el in list(main.find_all(True)):
        if el.name not in allowed: el.unwrap();continue
        attrs={k:v for k,v in el.attrs.items() if k in ['href','src','alt','title','poster','controls','colspan','rowspan']}
        for attr in ['href','src','poster']:
            if attr not in attrs: continue
            url=urljoin(p['old_url'],attrs[attr]); parts=urlsplit(url)
            if parts.scheme not in ['http','https','mailto','tel']: attrs.pop(attr);continue
            if parts.netloc in ['www.herzhdstiftung.de','herzhdstiftung.de']:
                attrs[attr]=parts.path+('?' + parts.query if parts.query else '')+('#'+parts.fragment if parts.fragment else '')
            else:
                attrs[attr]=url
                if attr in ['src','poster']: attrs.pop(attr) # No third-party embeds in archived pages.
        if el.name=='img': attrs.update(loading='lazy',alt=attrs.get('alt',''))
        if el.name=='video': attrs.update(controls='',preload='none')
        el.attrs=attrs
    title=p['title'] or s.title.get_text().split('–')[0].strip()
    dest=OUT/p['old_path'].strip('/')/'content.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(''.join(str(x) for x in main.contents))
    records.append({'path':p['old_path'],'title':title,'source':p['old_url']})
for url,path in assets:
    dest=OUT/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes((BACKUP/path).read_bytes())
(OUT/'manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
(BACKUP/'manifest.json').write_text(json.dumps({'pages':len(pages),'assets':assets,'failures':failures},ensure_ascii=False,indent=2))
print(json.dumps({'pages_backed_up':len(pages),'archive_pages':len(records),'assets':len(assets),'failures':failures},ensure_ascii=False))
