---
title: Feature Coverage
description: Current Flow Steward surfaces and removed-feature boundaries.
pagination_next: null
pagination_prev: null
---

# Feature Coverage

This map distinguishes available product surfaces, internal services, and
removed functionality. Availability still depends on role, configuration,
installed providers, and workflow contracts. It is not a claim that every
integration has been exercised in a live deployment.

| Area | Current surface and boundary | Guide |
|---|---|---|
| Dashboard and search | Operational summaries and scoped product-entity search. No project KB or repository-code search. | [Dashboard](../user/dashboard) |
| Workspaces and projects | Workspace scope, rules, model routes, connections, datasets, workflow bindings, history, and policy. No General/IT or repository setup form. | [Projects](../user/workspaces-and-projects) |
| Workflow authoring | Administrator canvas, phases, steps, contracts, validation, shared external authoring, clone, and import/export. | [Workflows](../user/workflows) |
| Workflow Catalog | Ready-made operational workflows and examples; browse, preflight, dependency mapping, and independent disabled drafts. | [Catalogs](../user/workflow-and-extension-catalogs) |
| Workflow execution | Administrator Test Run, explicit API/MCP launch, configured webhooks/provider triggers, schedules, and child workflows. | [Public API](../integrations/public-api-quick-start) |
| Step kinds | Fourteen kinds; inline loops accept only set-variable, batch, HTTP, and transform steps. | [Step kinds](workflow-step-kinds) |
| Approvals | Phase-completion gates and separate runtime approval policies; approve/reject through authorized job controls. | [Jobs](../user/jobs-and-approvals) |
| Schedules | Existing schedule management in the project UI; provisioning through the internal API. | [Workflows](../user/workflows#manage-scheduled-runs) |
| Agents and skills | Authored AI roles, instructions, contracts, tool access, and history. No implicit code-writing ability. | [Agents and skills](../user/agents-and-skills) |
| Tools and outbound MCP | Project-scoped remote catalog discovery, auth, allowlisting, health, and execution. | [Tools and MCP](../user/tools-and-mcp) |
| Built-in MCP | 40 project, workflow authoring/execution, job diagnostics/control, operational report, and notification tools; discovery is token filtered. | [MCP reference](mcp) |
| Public API | Ten curated method/path operations; starts runs at `/api/workflow-runs`. | [API reference](api) |
| Datasets and connections | Workspace sources, introspection, selected resources, project access, and scoped queries. | [Datasets](../user/datasets-and-data-connections) |
| Extensions | Separately distributed releases, configured catalog, install/configure/enable/health, callbacks, actions, and uninstall plans. | [Extensions](../user/extensions) |
| Models and provider settings | Account/provider configuration, fresh verification, catalog filtering, deliberate project/agent model selection. | [Settings](../user/settings-and-model-providers) |
| Notifications and reports | Project routes, deliveries, report generation/retrieval, and event evidence. | [Integrations](../developer/integrations) |
| Job evidence and recovery | Logs, messages, errors, traces, artifacts, costs, approvals, journal, restart/cancel, and watchdog. | [Diagnostics](../user/failed-run-diagnostics) |
| Monitoring, events, and queues | Services, storage, processes, queue state, event dispatch, and authorized redrive. | [Monitoring](../user/monitoring-and-troubleshooting) |
| Policy and sensitive data | Project/account policy, scanning, redaction, PII modes, and scoped access. | [Policy](../admin/security-policy-and-redaction) |
| Identity and access | Users, roles, PATs, service accounts, token scopes, and allowlists. | [Access](../user/users-roles-and-access) |
| Retention and lifecycle | Retention settings, cleanup, trash, restore, and dependency-aware deletion plans. | [Lifecycle](../user/trash-and-lifecycle) |
| Installation and operations | Profile-specific installation, health, configuration, release, backup, and Clone operations. | [Installation](../user/installation-and-updates) |
| CLI | 101 registered public commands, with profile-specific dispatch limits; no task-submit/run command. | [CLI](cli) |
| Internal memory | Scoped project-profile synchronization and workflow knowledge support the runtime; no public KB CRUD. | [Project context](../user/project-knowledge-and-code-intelligence) |
| Removed knowledge/code tooling | Public KB/profile MCP tools, project KB/Index Status pages, repository indexing, code graphs, code-writing/shell/Git tools, and worktree/parallel-merge diagnostics. | [Project context](../user/project-knowledge-and-code-intelligence) |

Use the installed version's OpenAPI, MCP `tools/list`, and CLI help for exact
request schemas. Historical audit findings are maintained outside the public
site.
