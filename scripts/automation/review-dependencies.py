"""Static data review only: parse files, never import or execute product code."""
import ast
import argparse
import hashlib
import json
import re
import subprocess
from urllib.parse import urlparse
from pathlib import Path

ROOT = Path.cwd()
parser = argparse.ArgumentParser(description='Statically review documentation dependency scopes; no inference or tests.')
parser.add_argument('product_root', type=Path)
parser.add_argument('--write', action='store_true', help='Update dependency map and audit JSON; default is summary only')
args = parser.parse_args()
PRODUCT = args.product_root.resolve()
SOURCE_SHA = subprocess.check_output(['git', '-C', str(PRODUCT), 'rev-parse', 'HEAD'], text=True).strip()
def sha(data): return hashlib.sha256(data).hexdigest()
def digest(data): return sha(json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode())
tracked = subprocess.check_output(['git', '-C', str(PRODUCT), 'ls-files', '-z'], text=True).split('\0')
files = set(filter(None, tracked))
def matched(scope, path):
    return path == scope or (scope.endswith('/') and path.startswith(scope)) or (scope.endswith('*') and path.startswith(scope[:-1]))
def expand(scopes): return {p for p in files if any(matched(s,p) for s in scopes)}

# Namespace scopes deliberately include new members, not just files cited by an
# old generation. Shared transport/config contracts are explicit below.
GROUPS = {
 'access': ['core/application/auth/','core/infrastructure/security/','core/entrypoints/api/auth*','core/entrypoints/api/oauth*','assets/frontend/src/lib/auth/','assets/frontend/src/pages/auth/','assets/frontend/src/pages/oauth/','core/entrypoints/api/dependencies.py','core/entrypoints/admin/deps.py'],
 'navigation': ['assets/frontend/src/app/','assets/frontend/src/components/layout/','assets/frontend/src/lib/routing/','core/application/search/','core/entrypoints/api/search.py'],
 'config': ['core/infrastructure/config/','core/application/settings/','core/application/management/command_specs/config.py','core/application/lifecycle/configuration*','core/infrastructure/runtime_env.py'],
 'install': ['install.sh','flow-steward','core/application/installer/','core/infrastructure/installer/','core/entrypoints/cli/installer*','core/application/management/command_specs/environment.py','core/application/management/command_specs/stack.py','core/application/lifecycle/','core/infrastructure/runtime/','infra/docker/','core/entrypoints/cli/scripts/docker_compose*'],
 'recovery': ['core/application/clone/','core/infrastructure/clone/','core/application/release/','core/infrastructure/release/','core/application/maintenance/','core/application/doctor/','core/application/readiness/','core/application/management/command_specs/backup.py','core/application/management/command_specs/clone.py','core/application/management/command_specs/release.py','core/application/management/command_specs/database.py','core/entrypoints/cli/scripts/db_*','db/released_migrations.json','db/migrations/'],
 'storage': ['core/application/orchestration/artifact*','core/application/jobs/attachment*','core/application/management/staged_attachment*','core/application/tooling/ops/prune_workspace_artifacts.py','core/entrypoints/api/extension_artifacts.py','core/entrypoints/api/report_download.py','core/infrastructure/ports/'],
 'observability': ['core/application/monitoring/','core/application/observability/','core/application/observability_vocabulary.py','core/infrastructure/observability/','core/infrastructure/monitoring/','core/entrypoints/api/system_monitoring.py','core/entrypoints/api/health.py','core/entrypoints/admin/monitoring.py','assets/frontend/src/pages/monitoring/'],
 'events': ['core/application/management/command_services_event*','core/application/management/query_services_event*','core/application/notifications/','core/infrastructure/db/event*','core/infrastructure/db/logger_events*','core/entrypoints/api/events*','assets/frontend/src/pages/monitoring/shared/events/','assets/frontend/src/components/shared/period-filter*','core/infrastructure/date_*','assets/frontend/src/lib/time/'],
 'jobs': ['core/application/jobs/','core/application/management/command_services_job*','core/application/management/query_services_job*','core/application/management/job_*','core/application/management/approval*','core/entrypoints/api/jobs*','core/entrypoints/api/job_*','core/entrypoints/api/messages.py','core/entrypoints/api/approval_decision*','assets/frontend/src/pages/jobs/','core/infrastructure/db/job_*','core/infrastructure/db/checkpoint*'],
 'workflow': ['core/application/workflows/','core/application/workflow_documents/','core/application/orchestration/','core/application/tabular_feed/','core/infrastructure/tabular_feed/','core/application/management/workflow_*','core/application/management/command_services_workflow*','core/application/management/query_services_workflow*','core/entrypoints/admin/workflows*','core/entrypoints/api/workflow*','assets/frontend/src/pages/workflows/'],
 'project': ['core/application/projects/','core/application/workspaces/','core/application/management/project_*','core/application/management/command_services_project*','core/application/management/query_services_project*','core/entrypoints/api/project*','core/entrypoints/admin/workspaces.py','core/entrypoints/admin/project_*','assets/frontend/src/pages/projects/','assets/frontend/src/pages/registry/workspaces/'],
 'agents': ['core/application/registry/','core/application/external_agents/','core/application/management/command_services_agent*','core/application/management/command_services_skill*','core/application/management/query_services_agent*','core/application/management/query_services_skill*','core/entrypoints/admin/agents*','core/entrypoints/admin/skills.py','assets/frontend/src/pages/registry/agents/','assets/frontend/src/pages/registry/skills/'],
 'mcp': ['core/entrypoints/mcp/','core/entrypoints/api/integrations_mcp*','core/entrypoints/api/mcp_server_catalog.py','core/application/management/mcp_*','core/application/management/command_services_tool*','core/application/management/query_services_tool*','core/entrypoints/admin/tools.py','assets/frontend/src/pages/registry/mcp/'],
 'api': ['core/entrypoints/api/public_openapi*','core/entrypoints/api/contracts_v2.py','core/entrypoints/api/workflow_entrypoints*','core/entrypoints/api/jobs*','core/entrypoints/api/job_detail*','core/entrypoints/api/events_stream.py','core/application/idempotency/','core/entrypoints/api/idempotency_headers.py','core/application/management/task_submission.py'],
 'extensions': ['core/application/extensions/','core/infrastructure/extension_runtime/','core/infrastructure/extension_sdk/','core/application/tooling/extensions/','core/entrypoints/api/extension*','core/entrypoints/api/integrations_extension*','core/entrypoints/api/llm_provider_extensions.py','core/application/management/extension*','assets/frontend/src/pages/extensions/','docs/standards/extension*'],
 'datasets': ['core/application/datasets/','core/application/management/project_connection*','core/entrypoints/admin/datasets*','core/entrypoints/api/project_integrations.py','assets/frontend/src/pages/registry/datasets/','assets/frontend/src/pages/registry/data-connections/','assets/frontend/src/pages/projects/connections/'],
 'security': ['core/application/security/','core/application/secrets/','core/entrypoints/api/security.py','core/entrypoints/admin/guardrails.py','core/application/management/query_services_security*','core/application/management/command_services_security*','assets/frontend/src/pages/settings/security/','assets/frontend/src/pages/registry/guardrails/'],
 'lifecycle': ['core/application/management/command_services_trash*','core/application/management/trash_*','core/entrypoints/api/trash.py','assets/frontend/src/pages/trash/','core/application/tooling/ops/retention*','core/entrypoints/admin/settings_retention.py','core/application/management/command_services_changelog*','core/entrypoints/admin/changelog.py','core/entrypoints/admin/project_history.py','assets/frontend/src/pages/registry/changelog/'],
 'skills': ['docs/agent-skills/','core/application/tooling/agent_skills/','infra/tooling/agent-skills/','assets/frontend/src/pages/settings/account/','core/application/auth/agent_connection*','core/entrypoints/api/agent_connection_routes.py'],
 'quality': ['AGENTS.md','docs/standards/','docs/architecture/','core/application/tooling/quality/','infra/tooling/quality/','.pre-commit-config.yaml','.github/workflows/remote-quality.yml','.github/workflows/release-images.yml','core/entrypoints/cli/scripts/lint.sh','pyproject.toml','assets/frontend/package.json','core/entrypoints/cli/scripts/run_test_runner.sh'],
 'cli': ['flow-steward','core/entrypoints/cli/','core/application/management/command_specs/','core/application/management/command_service*','core/infrastructure/cli_runtime/'],
 'memory': ['core/application/memory/','core/application/intelligence/','core/application/management/project_profile*','core/application/tooling/ops/sync_workflow_knowledge.py'],
 'reports': ['core/application/reports/','core/application/notifications/','core/entrypoints/api/report*','core/entrypoints/mcp/server_report*','core/entrypoints/mcp/server_workflow_report*'],
 'webhooks': ['core/application/webhooks/','core/entrypoints/api/provider_webhook*','core/entrypoints/api/job_webhook*','core/application/workflows/provider_event*'],
 'catalogs': ['core/infrastructure/static_catalog/','core/entrypoints/api/extension_catalog.py','core/entrypoints/api/mcp_server_catalog.py','core/application/management/mcp_server_catalog*','core/entrypoints/admin/workflows_routes_catalog.py','core/entrypoints/admin/catalog_categories.py','assets/frontend/src/pages/registry/mcp/'],
 'schema': ['db/schema/','db/migrations/','db/released_migrations.json','core/application/management/command_models*','core/application/management/query_models*'],
}
ASSIGNMENTS = {
 'admin/audit-trail': 'access events jobs security lifecycle reports extensions',
 'admin/events-and-redrive': 'access events workflow',
 'admin/queues-concurrency-retries-dlq': 'access jobs workflow observability config events',
 'admin/security-policy-and-redaction': 'access security config jobs project extensions',
 'deploy/architecture': 'install config observability storage',
 'deploy/backups-and-restore': 'recovery install config storage schema',
 'deploy/deployment-checklist': 'install recovery config storage observability quality',
 'deploy/diagnostics-and-migration': 'recovery install config storage schema',
 'deploy/elestio': 'install recovery config access',
 'deploy/installation': 'install config recovery access',
 'deploy/installer-walkthrough': 'install config recovery access',
 'deploy/observability': 'observability events jobs config install',
 'deploy/platforms': 'install config recovery access',
 'deploy/render': 'install config recovery access',
 'deploy/rollback': 'recovery install config storage',
 'deploy/storage-and-artifacts': 'storage install config jobs recovery',
 'developer/architecture': 'workflow api mcp extensions project agents schema install',
 'developer/cli-and-automation': 'cli access api',
 'developer/contributing-documentation': 'quality cli api mcp skills',
 'developer/contributing': 'quality install cli skills schema',
 'developer/documentation-site': '',
 'developer/extensions': 'extensions catalogs schema access',
 'developer/integrations': 'api mcp webhooks workflow extensions reports access',
 'developer/local-development': 'install config cli quality',
 'developer/mcp-server': 'mcp api access workflow',
 'developer/operations-internals': 'observability recovery storage lifecycle config jobs',
 'developer/project-knowledge-and-code-intelligence': 'memory project agents mcp navigation',
 'developer/publish-extension': 'extensions catalogs quality skills',
 'developer/publish-workflow': 'workflow catalogs skills security',
 'developer/quality-and-testing': 'quality cli install',
 'developer/workflow-runtime': 'workflow jobs agents extensions mcp datasets reports webhooks',
 'integrations/agent-plugin': 'skills access mcp',
 'integrations/build-an-extension': 'extensions catalogs workflow skills',
 'integrations/built-in-mcp-quick-start': 'mcp api access project',
 'integrations/connect-ai-agents': 'skills access mcp config',
 'integrations/extension-authoring-skill': 'skills extensions',
 'integrations/extension-operator-guide': 'extensions catalogs lifecycle access',
 'integrations/external-mcp-catalogs': 'mcp catalogs access config',
 'integrations/incoming-workflow-webhooks': 'webhooks workflow security api access',
 'integrations/public-api-quick-start': 'api jobs access workflow',
 'intro': 'navigation project workflow agents mcp api datasets access',
 'maintainer/documentation-debt-backlog': '',
 'reference/api': 'api access project reports config',
 'reference/cli': 'cli recovery install access',
 'reference/configuration': 'config memory mcp install',
 'reference/environment-variables': 'config install access security workflow storage observability memory quality',
 'reference/feature-coverage-matrix': 'navigation workflow project agents datasets mcp api jobs extensions security lifecycle config memory',
 'reference/host-settings': 'config install security extensions',
 'reference/installer': 'install config recovery access',
 'reference/limits-and-file-formats': 'config api workflow jobs extensions datasets reports storage security',
 'reference/mcp': 'mcp api access project jobs reports workflow agents',
 'reference/platform-audit': '',
 'reference/release-readiness': '',
 'reference/upgrade': 'recovery install config schema',
 'reference/workflow-step-kinds': 'workflow agents extensions datasets reports mcp',
 'troubleshooting': 'install recovery access config jobs workflow extensions mcp datasets events storage security lifecycle',
 'user/agents-and-skills': 'agents workflow project access navigation',
 'user/connect-an-ai-client': 'skills access mcp navigation',
 'user/core-concepts': 'navigation project workflow agents datasets mcp extensions jobs',
 'user/dashboard': 'navigation jobs project observability',
 'user/datasets-and-data-connections': 'datasets project extensions access navigation',
 'user/extensions': 'extensions catalogs lifecycle access navigation',
 'user/failed-run-diagnostics': 'jobs workflow mcp extensions security storage events',
 'user/feature-catalog': 'navigation workflow project agents datasets mcp api jobs extensions security lifecycle config memory',
 'user/feature-configuration': 'config project workflow memory storage security reports lifecycle',
 'user/file-an-issue': 'recovery cli skills security',
 'user/first-workflow': 'workflow project api mcp access jobs catalogs',
 'user/getting-started': 'install recovery access navigation project',
 'user/installation-and-updates': 'install recovery config access schema',
 'user/jobs-and-approvals': 'jobs workflow access navigation',
 'user/monitoring': 'observability events jobs lifecycle config access navigation',
 'user/product-tour': 'navigation project workflow agents datasets mcp extensions jobs lifecycle',
 'user/project-knowledge-and-code-intelligence': 'memory project agents mcp navigation',
 'user/registry-management': 'agents project workflow lifecycle security navigation',
 'user/settings-and-model-providers': 'config lifecycle reports extensions access navigation',
 'user/tools-and-mcp': 'mcp catalogs project workflow access navigation',
 'user/trash-and-lifecycle': 'lifecycle project datasets mcp workflow agents access navigation',
 'user/use-cases': 'navigation workflow project agents datasets mcp api jobs extensions security lifecycle memory reports webhooks',
 'user/users-roles-and-access': 'access project config navigation',
 'user/workflow-and-extension-catalogs': 'catalogs extensions workflow mcp access navigation',
 'user/workflow-builder': 'workflow agents extensions datasets reports mcp access navigation',
 'user/workflow-promotion': 'workflow project extensions datasets security access',
 'user/workflows': 'workflow jobs project agents datasets mcp api extensions reports webhooks access navigation',
 'user/workspaces-and-projects': 'project datasets workflow memory access navigation',
}

seed_receipts = [json.loads(path.read_text()) for path in sorted((ROOT/'.automation/recovery/41981965666/receipts').glob('*.json'))]
previous = {'pages': {item['reviewed_document']: {'scopes': sorted(set(value.split(' — ',1)[0] for value in item['evidence']))} for item in seed_receipts}}
# Review imports as syntax only. Missing edges are reported, never silently
# interpreted as a complete dependency graph or added as broad global scopes.
modules={}
for path in files:
    if path.startswith('core/') and path.endswith('.py'):
        name=path[:-3].replace('/','.')
        modules[name]=path
        if name.endswith('.__init__'):modules[name[:-9]]=path
edges={};dynamic={};parse_errors=[]
for path in sorted(set(modules.values())):
    try:
        if (PRODUCT/path).is_symlink(): raise ValueError('symlink source')
        tree=ast.parse((PRODUCT/path).read_text())
    except (SyntaxError,UnicodeError,ValueError) as error:parse_errors.append(path);continue
    found=set();unknown=[]
    for node in ast.walk(tree):
        names=[]
        if isinstance(node,ast.Import):names=[a.name for a in node.names]
        elif isinstance(node,ast.ImportFrom):
            package=path[:-3].replace('/','.').split('.')[:-1]
            if path.endswith('/__init__.py'):package=path[:-12].replace('/','.').strip('.').split('.')
            base='.'.join(package[:len(package)-node.level+1]+([node.module] if node.module else [])) if node.level else node.module or ''
            names=[base]+[base+'.'+a.name for a in node.names if a.name!='*']
        elif isinstance(node,ast.Call):
            func=node.func
            if isinstance(func,ast.Name) and func.id=='__import__' or isinstance(func,ast.Attribute) and func.attr=='import_module':
                if node.args and isinstance(node.args[0],ast.Constant) and isinstance(node.args[0].value,str):names=[node.args[0].value]
                else:unknown.append(node.lineno)
        found.update(modules[n] for n in names if n in modules)
    edges[path]=found;dynamic[path]=unknown
def closure(roots):
    seen=set(roots);todo=list(roots)
    while todo:
        for dependency in edges.get(todo.pop(),set()):
            if dependency not in seen:seen.add(dependency);todo.append(dependency)
    return seen
pages = sorted(p for p in (ROOT/'docs').rglob('*') if p.suffix in {'.md','.mdx'})
rules = {}; review = []
for page in pages:
    name = str(page.relative_to(ROOT)); key = str(page.relative_to(ROOT/'docs').with_suffix(''))
    topics = ASSIGNMENTS.get(key)
    if topics is None: raise ValueError('Unassigned page: '+name)
    topics = topics.split(); text = page.read_text()
    prior = previous['pages'].get(name, {'scopes': []})['scopes']
    scopes = sorted(set(s for group in topics for s in GROUPS[group] if expand([s])))
    if set(topics)&{'access','api','mcp','workflow','events','jobs','project','agents','datasets','extensions','reports','lifecycle'}:
        scopes+=['core/application/management/scope.py','core/application/management/guards.py','core/application/management/errors.py','core/application/management/command_services_common.py','core/application/management/query_services_common.py']
    if 'storage' in topics:
        scopes+=['core/infrastructure/runtime/artifact_storage_factory.py','core/infrastructure/extension_runtime/object_storage.py','core/infrastructure/lifecycle/storage_gateway.py','core/application/extensions/artifact*','core/application/jobs/artifact*','core/application/ports/']
    if 'jobs' in topics:scopes+=['core/infrastructure/runtime/worker/','core/entrypoints/cli/worker*']
    if 'navigation' in topics:scopes+=['assets/frontend/package.json','assets/frontend/package-lock.json']
    if 'quality' in topics:scopes+=['core/application/tooling/db/upgrade_preflight.py']
    obsolete = sorted(s for s in prior if not expand([s]))
    # Preserve still-existing direct citations, but directory families rather
    # than their old existence are the primary routing model.
    scopes = sorted(set(scopes) | {s for s in prior if expand([s])})
    local = {name}
    if not topics:
        local.update(['scripts/automation/','package.json','package-lock.json','docusaurus.config.ts','sidebars.ts','src/','static/llms.txt','.github/workflows/'])
    local_missing=[]
    for href in re.findall(r'\]\(([^)]+)\)', text):
        if re.match(r'^(?:https?://|mailto:|#|/)',href):continue
        clean=href.split('#')[0]
        if not clean:continue
        target=page.parent/clean
        candidates=[target,target.with_suffix('.md'),target.with_suffix('.mdx')]
        found=next((p for p in candidates if p.is_file()),None)
        if found:
            rel=str(found.resolve().relative_to(ROOT.resolve()));local.add(rel)
        else:local_missing.append(href)
    external=sorted(set(re.findall(r'https://github.com/Flow-Steward/[^\s)\]>`]+',text)))
    external=[u for u in external if not re.match(r'https://github.com/Flow-Steward/(?:flow-steward-app)(?:/|\.git|$)',u)]
    reference_urls=sorted(set(re.findall(r'https?://[^\s)\]>`]+',text)))
    external_references=[u for u in reference_urls if urlparse(u).hostname not in {'docs.flowsteward.org','127.0.0.1','localhost'} and not u.startswith('https://github.com/Flow-Steward/flow-steward-app')]
    # Source-backed scopes have been structurally inspected, but a citation or
    # namespace match is not a semantic-completeness approval.
    reason='Conservative topic namespaces and shared consumers from static review; runtime/dynamic and external coverage require resolution.'
    rules[name]={'scopes':scopes,'docsScopes':sorted(local),'reviewed':False,'reviewedBy':'','reason':reason,'topics':topics,'reviewSourceSha':SOURCE_SHA,'externalDependencies':external}
    direct=expand(scopes); reached=closure(direct); gaps=sorted(reached-direct)
    indirect_dynamic=[p for p in sorted(reached) if dynamic.get(p)]
    review.append({'page':name,'pageHash':sha(page.read_bytes()),'scopeHash':digest(rules[name]),'topics':topics,'sourceFiles':len(direct),'previousScopeCount':len(prior),'obsoleteCitations':obsolete,'localLinkGaps':local_missing,'externalDependencies':external,'externalReferences':external_references,'staticImportGapCount':len(gaps),'staticImportGapExamples':gaps[:12],'dynamicImportFiles':indirect_dynamic[:12],'dynamicImportFileCount':len(indirect_dynamic),'status':'requires_completeness_approval','scopeModel':'conservative-static','reason':reason})

out={'version':1,'sourceSha':SOURCE_SHA,'docsSourceSha':'ac717b6729fcdfe3bbc8d516fc2a1a5e50333078','pages':review,'status':'not_approved','pythonParseErrors':parse_errors,'limitations':['No project code, tests, model or embeddings were executed.','Static namespaces do not prove dynamic or semantic closure.','Frontend dynamic import/consumer closure was not established; UI scopes remain conservative.','External catalog/deployment repositories are not part of the product snapshot.','All 84 pages retain reviewed=false; queue activation must fail closed.']}
if args.write:
    (ROOT/'.automation/page-dependencies.json').write_text(json.dumps({'version':1,'pages':rules},indent=2)+'\n')
    (ROOT/'.automation/dependency-audit.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'pages':len(review),'emptyProductScopes':sum(not r['sourceFiles'] for r in review),'obsoleteCitations':sum(len(r['obsoleteCitations']) for r in review),'externalPages':sum(bool(r['externalDependencies']) for r in review),'localLinkGapPages':sum(bool(r['localLinkGaps']) for r in review),'approved':0},indent=2))
