---
sidebar_position: 3
title: Platform Documentation Audit
description: Inventory of Flow Steward surfaces that need first-release documentation.
---

# Platform Documentation Audit

This audit captures the Flow Steward product surfaces that need real
documentation before the first public release. It is based on a read-only pass
over the application repository at `/Users/vasily/www/bmad-project`.

The current documentation site is only the shell. The next wave should use this
inventory to replace broad placeholder pages with product-specific guides,
references, and examples.

## Source Scope

Reviewed surfaces:

- Application README and existing internal docs
- CLI entrypoints under `core/entrypoints/cli/`
- Installer and release services
- FastAPI route decorators under `core/entrypoints/`
- MCP server tool declarations under `core/entrypoints/mcp/server.py`
- Registry seed data under `db/seeds/registry_seed.json`
- Workflow step-kind constants
- Extension manifests under `extensions/*/extension.yaml`
- Auth principal, roles, PAT, service-account, and machine-token code paths

The main application repository has many uncommitted changes, so this audit did
not modify it.

## Documentation Split

### User Guide

The User Guide should describe the product through the frontend and operator
workflows. It should not read like backend architecture.

Recommended pages:

- Product tour and navigation
- Installation wizard and first login
- Workspaces
- Projects
- Jobs, approvals, acknowledgements, retries, cancellations, and restarts
- Agents: creating, editing, cloning, assigning skills, viewing history
- Skills: creating, editing, inputs/outputs, validation, history, restore
- Tools and MCP tools
- Workflows: list, create, import/export, builder, phases, step kinds, triggers
- Workflow Builder with AI
- Datasets and Data Connections
- Extensions: install, scan, preview, enable, health, invoke, callbacks
- Events and redrive
- Chat and contextual assistant
- Search
- Users, roles, accounts, MFA, password reset, timezone, email change
- Personal access tokens
- Service accounts and machine tokens
- Settings: model providers, model catalog, assistant settings, retention
- Monitoring, process view, queues, and system health
- Trash, restore, lifecycle plans, hard delete
- Troubleshooting

### Developer Docs

Developer Docs should explain how to work on Flow Steward and extend it.

Recommended pages:

- Architecture overview
- Repository layout and standards
- Local development
- Frontend development
- Backend/API development
- Database schema and migrations
- Workflow runtime and step kinds
- Registry contracts
- Extension SDK and manifest authoring
- Remote extension runtime
- Testing and quality gates
- Security model
- Release and upgrade implementation

### Reference

Reference pages should be exhaustive and stable.

Recommended pages:

- CLI Reference
- MCP Reference
- Public API Reference
- Internal API Reference
- Webhooks and WebSockets
- OpenAPI
- Configuration and environment variables
- Installer Reference
- Upgrade Reference
- Registry seed reference
- Workflow step-kind reference
- Extension manifest reference

## Inventory Summary

### CLI

Top-level CLI domains:

| Domain | Purpose |
|---|---|
| `users` | Local-auth user management |
| `projects` | Project operations and indexing |
| `workflows` | Workflow catalog and contract operations |
| `reports` | Generate and fetch persisted reports |
| `tasks` | Task enqueue and workflow start |
| `jobs` | Job operations and lifecycle controls |
| `release` | Inspect and upgrade Flow Steward releases |
| `tooling` / `tool` | Tooling, ops, quality, DB, testing, extension, and i18n utilities |

`users` commands:

- `list`
- `create`
- `set-password`
- `force-password-reset`
- `unlock`
- `set-active`
- `set-roles`

`projects` commands:

- `list`
- `show`
- `index-status`
- `notification-routes`
- `notification-deliveries`
- `dispatch-notification`
- `reindex`
- `self-register`
- `self-unregister`

`workflows` commands:

- `list`
- `entrypoints`
- `validate`
- `contract`
- `suggestions`

`jobs` commands:

- `list`
- `show`
- `status`
- `logs`
- `messages`
- `errors`
- `approve`
- `reject`
- `ack`
- `unack`
- `cancel`
- `restart`
- `health-snapshot`

`release` commands:

- `info`
- `check`
- `upgrade`

`tooling` groups:

| Group | Commands |
|---|---|
| `quality` | `lint`, `check-ci-excludes`, `check-naming`, `release-gate`, `sonar-export-issues`, `sonar-generate-backlog` |
| `db` | `bootstrap-seed`, `demo-data`, `init-db`, `pg-query-diagnostics`, `postgres-tune-env`, `protected-export`, `restore-parity-check`, `self-project`, `upgrade` |
| `testing` | `smoke-test`, `e2e-live-test`, `nightfire-regression`, `fuzz-api`, `fuzz-mcp`, `fuzz-ui`, `cutover-preflight`, `cutover-smoke`, `preflight-check`, `workflow-ui-deep-validation` |
| `extensions` | `create`, `validate`, `test`, `pack` |
| `i18n` | `ui-i18n-catalog` |
| `ops` | `backfill-kb`, `backfill-memory`, `platform-preview`, `deployment-doctor`, `prune-workspace-artifacts`, `retention-cleanup`, `setup-codex-mcp`, `sync-public-contract-projection` |

### Installer

`./install.sh` runs `core.entrypoints.cli.ops.stack_installer`.

Installer commands:

- `configure`
- `up`
- `down`
- `restart`
- `rebuild`
- `status`
- `doctor`
- `config`

Installer options include:

- `--yes`
- `--environment production|local-development`
- `--graph-storage postgres-age`
- `--file-storage external-s3|bundled-seaweedfs`
- `--test-runner` / `--no-test-runner`
- `--audit-tools` / `--no-audit-tools`
- `--quality-tools` / `--no-quality-tools`
- `--start-now` / `--no-start-now`
- `--static-only`
- `--run-compose-config`

The installer writes saved stack state to `.flow-steward/stack.toml`,
`.flow-steward/compose.env`, and managed blocks in `.env` or `.env.prod`.

### Release And Upgrade

Release management is a host-side operator flow.

Important commands:

```bash
python -m core.entrypoints.cli release info
python -m core.entrypoints.cli release check
python -m core.entrypoints.cli release upgrade --dry-run
python -m core.entrypoints.cli release upgrade --target-version <version>
```

Release upgrade validates pinned release metadata, Docker-based install mode,
host bundle version, optional DB schema upgrade state, backup, runtime image
updates, restart, and health smoke checks.

### Roles And Access

Role levels:

| Role | Level | Notes |
|---|---:|---|
| `viewer` | 1 | Read-oriented role and default for many user creation paths |
| `operator` | 2 | Operational role for job/workflow actions |
| `admin` | 3 | Administrative role for users, accounts, tokens, and system settings |

Principal types map to roles:

| Principal type | Effective role |
|---|---|
| `viewer` | `viewer` |
| `user` | `viewer` |
| `operator` | `operator` |
| `service_account` | `operator` |
| `admin` | `admin` |
| `system_actor` | `admin` |

Auth surfaces include local sessions, proxy auth, PATs, service accounts, machine
tokens, account memberships, MFA, password reset, email change, timezone, and
scoped project/workflow access.

### API

Static route scan found approximately **550 route decorators**.

High-level groups:

| Surface | Count | Examples |
|---|---:|---|
| Frontend shell/public pages | 12 | `/`, `/login`, `/bootstrap`, `/app/*` |
| Admin/UI pages and registry admin routes | 290 | agents, skills, tools, workflows, guardrails, datasets, workspaces |
| Public/normalized API v2 | 6 | `/api/v2/dashboard/summary`, `/api/v2/jobs`, `/api/v2/projects` |
| Auth/admin API | 36 | users, accounts, PATs, service accounts, MFA, password reset |
| Projects API | 44 | CRUD, KB, indexing, schedules, connections, jobs |
| Jobs API | 31 | status, logs, messages, errors, approvals, cancel/restart, cost, trace |
| Workflow API and entrypoints | 16 | triggers, webhook entrypoints, reactions |
| Extensions API and callbacks | 16 | install, scan, enable, preview, invoke, callbacks |
| Settings/model API | 9 | model providers, model catalog, retention |
| Other internal API | 87 | app bootstrap, chat, commands, events, external agents, reports, search |
| Webhooks | 1 | `/webhook/providers/{provider_key}` |
| WebSockets | 2 | `/ws/jobs/{job_id}`, `/ws/projects/{project_id}/reindex` |

Next documentation step: generate route tables from the live OpenAPI schema, then
mark each endpoint as public, internal, admin-only, webhook, or compatibility.

### MCP

Static scan found **55 MCP tools**.

Groups:

- Knowledge Base: `kb_search`, `kb_write`, `kb_tag_files`
- Project profile and project list: `project_profile_get`,
  `project_profile_update`, `project_list`, `project_jobs`,
  `project_index_status`
- Code intelligence: `code_search`, `code_project_overview`,
  `code_module_map`, `code_dependency_graph`, `code_file_context`,
  `code_find_symbol`, `code_class_hierarchy`, `code_what_calls`,
  `code_execution_trace`, `code_blast_radius`, `code_impact_check`
- Database: `db_schema`
- Task preparation and submission: `task_prepare_brief`, `submit_task`
- Workflow operations: `workflow_list`, `workflow_entrypoint_list`,
  `workflow_validate`, `workflow_contract`, `workflow_suggestions`,
  `workflow_trigger`, `trigger_workflow_entrypoint`
- Job diagnostics: `job_result`, `job_status`, `job_runtime_journal`,
  `job_errors`, `job_worktrees`, `job_parallel_merges`, `job_trace`,
  `job_incident`, `job_cost_breakdown`, `job_events`, `job_messages`,
  `job_logs`, `job_approval`, `job_stories`, `job_approvals`
- Job controls: `job_cancel`, `job_acknowledge`, `job_unacknowledge`,
  `job_restart`, `job_approval_decide`
- Reports: `report_generate`, `report_get`
- Notifications: `project_notification_routes`,
  `project_notification_deliveries`, `dispatch_project_notification`

MCP docs should explain authentication, scopes, common agent workflows, and the
safe order of tool usage.

### Registry Seed

The canonical seed currently includes:

| Registry area | Count |
|---|---:|
| Data contracts | 16 |
| Fields | 51 |
| Tools | 9 |
| Skills | 18 |
| Agents | 24 |
| Workflows | 11 |
| Published block contracts | 18 |
| Guardrails | 8 |

Tools include Code Indexer, Context7 Documentation, File Operations, Git
Operations, Knowledge Base Query, Knowledge Base Write, Test Runner, Text Editor,
and E2E test tools.

Skills include Analyze Requirements, Create PRD, Create Stories, Design
Architecture, Implement Story, Run QA, Code Review, Apply Rework, Create PR,
Generate Docs, Security Scan, Handle Incident, Refactor Code, Fix Bug, Update
Knowledge Base, and verification skills.

Agent roles include analyst, architect, developer, code reviewer, scrum master,
QA, and validator.

### Workflows

Seeded workflows include:

- Contextual Bugfix
- Incident Response
- Maintenance
- Quick Fix
- Spike Investigation
- Standard Feature
- Story Cycle (Callable)
- Test/E2E placeholder workflows

Supported workflow step kinds:

| Step kind | Purpose |
|---|---|
| `agent` | Run an agent step |
| `connector` | Invoke a connector-backed step |
| `invoke_workflow` | Call another workflow |
| `http_request` | Make an HTTP request |
| `dataset_query` | Execute a dataset query |
| `if` | Conditional branch |
| `switch` | Multi-branch control flow |
| `stop_success` | End successfully |
| `stop_fail` | End with failure |
| `set_variable` | Write workflow state |
| `for_each` | Iterate over collection |
| `batch` | Batch control-flow work |

Workflow docs need both operator-facing builder guidance and developer-facing
runtime contract guidance.

### Extensions

Current extension bundles:

| Extension | Kind | Purpose |
|---|---|---|
| `clickup` | `task_provider` | Normalize ClickUp task webhook events into Flow Steward task ingress |
| `openclaw` | `task_provider` | Normalize OpenClaw task payloads |
| `telegram` | `notification_provider` | Send Flow Steward notifications and receive approval callbacks through Telegram |
| `toolbox_dataset_connector` | `tool_provider` | Wrap Google MCP Toolbox database prebuilts as dataset connectors |

Extension tooling:

- `tooling extensions create <extension_id>`
- `tooling extensions validate <extension_id>`
- `tooling extensions test <extension_id>`
- `tooling extensions pack <extension_id>`

Extension docs should cover filesystem layout, YAML-only manifest files, schemas,
actions, queries, callbacks, response envelope, validation, smoke tests, packing,
and marketplace-readiness validation.

## Immediate Documentation Backlog

1. Replace the current User Guide with task-oriented frontend guides:
   installation, first login, projects, workflows, jobs, agents, skills, tools,
   users/roles, PATs, service accounts, extensions, monitoring, troubleshooting.
2. Split Developer Docs from User Guide:
   architecture, local development, runtime model, workflow step contracts,
   extension SDK, testing, release internals.
3. Generate a full CLI reference from argparse definitions, including flags and
   examples.
4. Generate a full MCP reference from `@mcp.tool` declarations, including
   arguments and common workflows.
5. Generate API reference from OpenAPI and annotate endpoints as public,
   internal, admin-only, webhook, or websocket.
6. Add workflow builder docs with every supported step kind and examples.
7. Add installer and upgrade docs for `./install.sh` and `release upgrade`.
8. Promote stable internal docs from the application repository into this docs
   site, leaving architecture task packs and dated audit artifacts in the main
   repo unless they are product-facing.

## Verification Notes

- The audit used static code scanning because the local app CLI environment in
  this checkout is not fully importable from the available virtualenv.
- Docusaurus build should be rerun after updating this page.
