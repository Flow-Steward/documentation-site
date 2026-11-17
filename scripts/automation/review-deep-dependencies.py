"""Parse saved public source text only. No product imports/execution."""
import ast,hashlib,json,posixpath,re,subprocess,sys
from pathlib import Path
if len(sys.argv)!=3:raise SystemExit('usage: review-deep-dependencies.py <public-product-checkout> <new-candidate.json>')
P=Path(sys.argv[1]).resolve(); R=Path.cwd()
OUTPUT=Path(sys.argv[2])
if OUTPUT.exists():raise SystemExit('refusing to overwrite an existing report')
def digest(v):return hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
files=set(filter(None,subprocess.check_output(['git','-C',str(P),'ls-files','-z'],text=True).split('\0')))
def match(p,s):return p==s or s.endswith('/') and p.startswith(s) or s.endswith('*') and p.startswith(s[:-1])
mods={p[:-3].replace('/','.'):p for p in files if p.endswith('.py')}
mods.update({n[:-9]:p for n,p in list(mods.items()) if n.endswith('.__init__')})
G={}; dynamic={};missing={};errors=[]; evidence={}
def refs(names):
 out=set()
 for name in names:
  if name in mods:out.add(mods[name])
  parts=name.split('.')
  for i in range(1,len(parts)):
   init='/'.join(parts[:i])+'/__init__.py'
   if init in files:out.add(init)
 return out
for path in sorted(files):
 if not ((path.startswith('core/') and path.endswith('.py')) or (path.startswith(('assets/frontend/','assets/platform-kit/')) and path.endswith(('.ts','.tsx','.js','.jsx','.mjs')))):continue
 text=(P/path).read_text();out=set();dyn=[];bad=[]
 if re.search(r'(?:^|/)(?:tests?|__tests__)/|\.(?:test|spec)\.',path):G[path]=[];continue
 evidence[path]=hashlib.sha256(text.encode()).hexdigest()
 if path.endswith('.py'):
  try:t=ast.parse(text)
  except SyntaxError:errors.append(path);continue
  constants={}
  import_functions={'__import__'}
  for node in ast.walk(t):
   if isinstance(node,ast.ImportFrom) and node.module=='importlib':
    import_functions.update(alias.asname or alias.name for alias in node.names if alias.name=='import_module')
  for n in t.body:
   if isinstance(n,ast.Assign) and isinstance(n.value,ast.Constant) and isinstance(n.value.value,str):
    for target in n.targets:
     if isinstance(target,ast.Name):constants[target.id]=n.value.value
  for n in ast.walk(t):
   names=[]
   if isinstance(n,ast.Import):names=[a.name for a in n.names]
   elif isinstance(n,ast.ImportFrom):
    pkg=path[:-3].replace('/','.').split('.')[:-1]
    if path.endswith('/__init__.py'):pkg=path[:-12].replace('/','.').strip('.').split('.')
    base='.'.join(pkg[:len(pkg)-n.level+1]+([n.module] if n.module else [])) if n.level else n.module or ''
    names=[base]+[base+'.'+a.name for a in n.names if a.name!='*']
    if base.startswith('core.') and base not in mods and not any(m.startswith(base+'.') for m in mods):bad.append({'line':n.lineno,'module':base})
   elif isinstance(n,ast.Call) and ((isinstance(n.func,ast.Name) and n.func.id in import_functions) or (isinstance(n.func,ast.Attribute) and n.func.attr=='import_module')):
    arg=n.args[0] if n.args else None;name=arg.value if isinstance(arg,ast.Constant) and isinstance(arg.value,str) else constants.get(arg.id) if isinstance(arg,ast.Name) else None
    if name:names=[name]
    else:dyn.append({'line':n.lineno,'expression':ast.unparse(n)})
   out.update(refs(names))
  # Finite lazy export values, resolved as data, never evaluated.
  if path=='core/application/management/__init__.py':
   for value in list(constants.values())+re.findall(r'"(core\.[a-zA-Z0-9_.]+)"',text):out.update(refs([value]))
  if path=='core/entrypoints/cli/platform/service_registry.py':out.update(p for p in files if p.startswith('core/entrypoints/cli/platform/service_bindings/') and p.endswith('.py'))
  if path=='core/infrastructure/db/__init__.py':out.update(p for p in files if p.startswith('core/infrastructure/db/') and p.endswith('.py'))
 else:
  clean=re.sub(r'/\*[\s\S]*?\*/','',text)
  specs=re.findall(r'(?:\b(?:import|export)\s+(?:type\s+)?[^;]*?\bfrom\s*|\bimport\s*\(\s*|^\s*import\s*)[\'\"]([^\'\"]+)',clean,re.M)
  for spec in specs:
   if spec=='@flow-steward/frontend-extension-manifest':base='assets/frontend/src/app/extension-manifest-empty.tsx'
   elif spec.startswith('@/'):base='assets/frontend/src/'+spec[2:]
   elif spec.startswith('.'):base=posixpath.normpath(posixpath.join(posixpath.dirname(path),spec))
   else:continue
   candidates=[base]+[base+s for s in ('.ts','.tsx','.js','.jsx','.json','.css','/index.ts','/index.tsx','/index.js')]
   if base.endswith('.js'):candidates += [base[:-3]+s for s in ('.ts','.tsx')]
   hit=next((p for p in candidates if p in files),None)
   if hit:out.add(hit)
   else:bad.append({'specifier':spec})
  dyn=[{'line':clean.count('\n',0,m.start())+1,'expression':m.group(0)} for m in re.finditer(r'\bimport\s*\(\s*(?![\'\"\s])[^)]+\)',clean)]
  if path.startswith('assets/frontend/'):out.update(p for p in ['assets/frontend/package.json','assets/frontend/package-lock.json','assets/frontend/tsconfig.json','assets/frontend/vite.config.ts'] if p in files)
 if path=='assets/frontend/src/pages/workflows/catalog/catalog-model.ts' and evidence[path]=='7885c8137b531ecc0c51201eb085c7138fa19453f0c0f33022234dc900242010':
  # The text "import ({schema})" occurs in a localized catalog label.
  dyn=[]
 if path=='assets/frontend/src/app/platform-kit-loader.ts':out.update(p for p in files if p.startswith('assets/platform-kit/'))
 if path=='core/application/orchestration/graph/nodes_step_context.py':
  out.add('core/application/registry/agent_manifest.py')
 G[path]=sorted(out)
 if dyn:dynamic[path]=dyn
 if bad:missing[path]=bad

def closure(roots):
 seen=set(roots);todo=list(roots)
 while todo:
  for p in G.get(todo.pop(),[]):
   if p not in seen:seen.add(p);todo.append(p)
 return sorted(seen)
deps=json.loads((R/'.automation/page-dependencies.json').read_text());pages=[];sets={}
for page,rule in deps['pages'].items():
 roots=sorted(p for p in files if any(match(p,s) for s in rule['scopes']));closed=closure(roots);extra=sorted(set(closed)-set(roots));key=digest(extra);sets[key]=extra
 pages.append({'page':page,'closureHash':digest(closed),'addedWatchFiles':len(extra),'reachedFiles':len(closed),'dynamicSites':{p:dynamic[p] for p in closed if p in dynamic},'unresolvedLocalImports':{p:missing[p] for p in closed if p in missing},'status':'review_required'})
out={'version':1,'sourceSha':subprocess.check_output(['git','-C',str(P),'rev-parse','HEAD'],text=True).strip(),'method':'Python AST including package initializers, constant dynamic imports and finite lazy exports; frontend literal import/export plus alias/default-manifest resolution. Type-only edges retained conservatively. Test sources are watched leaves.','parseErrors':errors,'edges':G,'dynamicSites':dynamic,'unresolvedLocalImports':missing,'sourceEvidence':evidence,'pages':pages,'limitations':['No runtime validation. Regex frontend extraction cannot prove complete JS semantics.','Dynamic private/custom modules and remote frontend modules require explicit bounded policy.','Python importlib aliases and arbitrary file/config accesses are not a complete static analysis.']}
with OUTPUT.open('x') as report:report.write(json.dumps(out,indent=2)+'\n')
print(json.dumps({'pages':len(pages),'parseErrors':errors,'dynamicFiles':len(dynamic),'unresolvedLocalImportFiles':len(missing),'output':str(OUTPUT)},indent=2))
