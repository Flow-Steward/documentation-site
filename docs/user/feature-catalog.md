---
sidebar_position: 4
title: Feature Catalog
description: User-facing map of the main Flow Steward capabilities and where to configure them.
---

# Feature Catalog

This catalog explains the capabilities users can enable, configure, or operate
in Flow Steward. Use it as the release overview before jumping into deeper
workflow, configuration, and reference pages.

Release-planning and audit matrices are maintained outside the public site.
Use this catalog for reader navigation and the owning reference page for exact
contracts.

## Documentation pattern

Each feature page should answer the same questions:

| Question | What to document |
|---|---|
| What it does | The user-facing outcome, not just the internal object name. |
| When to use it | The jobs, workflows, or operational situations where it helps. |
| How it works | The high-level flow and which records, agents, tools, or services participate. |
| How to configure it | Project settings, workflow settings, step settings, env variables, and permissions. |
| Security and retention | PII handling, artifact storage, logs, trash, and cleanup behavior. |
| Troubleshooting | Where to look when the feature does not behave as expected. |

## Core capabilities

| Capability | What users should know |
|---|---|
| Projects and workspaces | Workspaces group a client, team, or data boundary; projects inside them hold rules, datasets, jobs, settings, workflow bindings, and scoped runtime context. |
| Jobs | Jobs are workflow runs with status, logs, messages, approvals, artifacts, costs, and final reports. |
| Workflow Catalog | [Find ready-made workflows](workflow-and-extension-catalogs), review requirements, and create independent local drafts; contribute through the catalog repository. |
| Extension Catalog | Browse Extensions > Marketplace for published integrations, install or update a reviewed release, and contribute your own extension. |
| Workflow Builder | Administrators compose phases and steps, use configured templates and shared authoring services, and review disabled drafts before execution. |
| Workflow Test Run | Administrator-only durable test-job submission from the workflow builder; it may execute external effects. |
| Incoming Webhooks | External systems can start workflow runs through configured webhook entrypoints with auth, content-type limits, source restrictions, and input mapping. |
| Scheduled Jobs | Administrators create or edit schedules from a linked workflow's Settings > Smart setup > Schedules after saving an enabled interface with the Schedule trigger. The project's Scheduled jobs page supports run-now, pause/resume, and deletion, plus an administrator workflow selector leading to the editor. Overlap protection is automatic; API clients use the authenticated internal API with the required authority. |
| Human Approval Gates | Phases can pause for human review before continuing, auto-approving, or routing to failure/rework. |
| Notifications | Project routes can send workflow, job, approval, failure, or operational events to configured providers. |
| Agents and Skills | Agent steps run a selected agent/skill contract. Inputs and outputs become workflow variables that the UI can surface automatically. |
| Connector Steps | Connector steps call installed tools or extensions through operation schemas and project connections. |
| HTTP Request Steps | Workflows can call HTTP APIs with method, URL, headers, body templates, auth references, timeout, and expected status handling. |
| Dataset Query Steps | Steps can query project datasets and place scoped rows or summaries into workflow state. |
| Nested Workflows | A workflow can invoke another workflow, map child inputs/outputs, collect artifacts, and enforce child timeout/cancel behavior. |
| Artifacts | Runs can produce files and structured outputs backed by memory, local filesystem storage, bundled S3-compatible storage, or external S3-compatible storage. |
| Search | Global and project search help users find supported product entities within their permissions. Search covers the registered product categories; project KB and repository code are outside the public search contract. |
| Project context | Project rules and assigned connections support internal context assembly. Shared workflow knowledge supports runtime and discovery services; project KB pages and MCP memory tools are outside the public interface. |
| External workflow authoring | Connected agents discover local contracts and validate/save disabled drafts through shared application services. |
| PII and Security Policy | Security policy can scan, redact, pseudonymize, or allow sensitive data across inbound, outbound, tool, and indexing surfaces. |
| Upload Policy | Operators can configure allowed MIME types, file extensions, max file size, and max file count. |
| Logs and Runtime Journal | Runtime logs, job messages, security findings, notification deliveries, and watchdog journals explain what happened. |
| Trash and Retention | Deleted records can be listed, restored, planned for purge, or purged according to retention settings. |
| Watchdog | The watchdog detects stuck, orphaned, interrupted, or abandoned jobs and can mark or recover them according to runtime policy. |
| Queue and Retry/DLQ | Queue controls help operators inspect pending work, retry failed items, and understand delivery failures. |
| Extensions and Packs | External or self-hosted extensions add tools, notification providers, task providers, and reusable integration packs. |
| MCP Server | The API-backed transport exposes 40 project, workflow, authoring, job, report, and notification tools. |
| CLI | Plain by default; supports installation operations, doctor/repair, configuration, release checks/upgrades, encrypted Clone, product commands, and local quality tooling with profile-specific availability. |

## Supported entrypoints and runtime boundaries

- Start workflow runs through the explicit workflow-run API, MCP call, or a
  configured trigger, with the selected workflow's declared inputs and scope.
- Project context and shared workflow knowledge serve internal runtime and
  discovery paths. Public project KB, profile/KB, and MCP memory tools are
  outside the first-release interface.
- Repository indexing, code graphs, Git-worktree execution, code-edit/shell/test
  tools, and software-delivery diagnostics are not built-in core features.
- Provider bundles are distributed separately; a core checkout does not imply
  any provider is installed or supported.

See [Feature Coverage](../reference/feature-coverage-matrix) for the current
surface map.

## First-release documentation priorities

For the public release, prioritize complete pages for:

- workflows, phases, steps, test runs, and incoming webhooks;
- artifact storage and S3-compatible deployment options;
- project context, search, and explicit workflow launch;
- manual workflow editing and disabled draft review;
- PII, upload policy, logs, retention, trash, and watchdog behavior;
- agents, skills, variables, connectors, HTTP requests, datasets, and notifications.
