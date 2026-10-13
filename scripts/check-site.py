from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
import posixpath,json
root=Path('dist');audit=json.loads(Path('migration/redirect-audit.json').read_text())
redirects={x['old_path'].rstrip('/'):x['target'] for x in audit['pages'] if x['target']}
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=set()
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  for k in (['href'] if tag in ['a','link'] else ['src','poster']):
   if a.get(k):self.links.append((tag,a[k]))
parsed={}
for p in root.rglob('*.html'):
 parser=Links();parser.feed(p.read_text());parsed[p.relative_to(root).as_posix()]=parser
errors=[];legacy_missing=[]
for name,doc in parsed.items():
 content=(root/name).read_text()
 if name!='404.html':
  assert 'preview-locked' not in content and 'preview-lock.js' not in content,name
  assert 'noindex' not in content,name
 for tag,url in doc.links:
  parts=urlsplit(url)
  if parts.netloc or parts.scheme or parts.fragment.startswith('CCM.'):continue
  target=unquote(parts.path)
  if target:target=posixpath.normpath(target.lstrip('/') if target.startswith('/') else posixpath.join(posixpath.dirname(name),target))
  else:target=name
  mapped=redirects.get('/'+target.rstrip('/'))
  if mapped:target=urlsplit(mapped).path.lstrip('/') or 'index.html'
  if target in ['.','']:target='index.html'
  if (root/target).is_dir():target=target.rstrip('/')+'/index.html'
  if not (root/target).exists():
   (legacy_missing if name not in ['index.html','404.html'] and name.endswith('/index.html') and not name.startswith('en/') else errors).append((name,url))
  elif parts.fragment and target in parsed and not mapped and parts.fragment not in parsed[target].ids:
   if '/index.html' not in name:errors.append((name,'missing fragment '+url))
print(json.dumps({'pages':len(parsed),'errors':errors,'legacy_missing':legacy_missing},ensure_ascii=False,indent=2))
assert not errors
