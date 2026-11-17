# Public-default dependency review: 84 documentation pages

Product snapshot: `a237cb9494b24b53de944b61b05c814e2e81e3d9`.
Coverage: `public-default-v1`, explicitly selected by the user. Luna remains
`gpt-6-luna`; generation and Chroma remain disabled.

All 84 entries have a reviewed **static dependency topology within this
profile**. This does not assert runtime equivalence, validate the code by tests,
verify current provider behavior, or authorize queue activation. Custom/private
implementation behavior is excluded; public loading/validation contracts remain
included. A broader profile must be explicitly reviewed and changes receipt inputs.

## Evidence and resolutions

- The saved graph contains 2,967 source nodes, Python package initializers,
  transitive imports, conservative type edges, frontend import/export paths,
  lazy route imports, the default extension manifest and package/config inputs.
- Named constants in `__import__` calls resolve to extension runtime modules.
  Management lazy exports resolve to their finite module table. DB lazy loading
  watches all public package modules. CLI `import_module` dispatch resolves to
  the closed `service_bindings` registry, including choice providers.
- Default platform-kit loading watches tracked platform-kit assets. Custom
  injected loaders, runtime tool implementations and private bootstrap modules
  are excluded by the selected profile; their public protocols remain watched.
- The nonexistent `core.application.registry.models` import occurs only under
  `TYPE_CHECKING`. It remains recorded as source typing debt; the actual
  `agent_manifest.py` owner is included. No product code was modified.
- `import ({schema})` in a localized catalog label is text, not an import.
  The candidate parser's exception is bound to this exact file hash.
- Four fragment-URL identities were corrected (`extensions#…`, `workflows#…`).
  Twenty-two previously saved public reference files from five pinned external
  repositories are now materialized under `.automation/external-evidence/`.
  Their hashes are validated and included in affected page receipt inputs.

The earlier 80 transitive warnings have explicit dispositions and additional
watch inventories. Up to 1,663 additional deep files per page invalidate cache
and participate in impact routing; they are not automatically added to Luna's
read context. Base reads remain 0–51 files (8–51 for product-topic pages), plus
changed watched files. Oversized final reads and more than ten misses block work.
Conservative topology can select too many candidates through shared composition;
this pass does not claim a measured reduction in cost or runtime.

The graph is bound to the reviewed product SHA. A new SHA requires refreshed
static dependency review; no silent reuse of a stale graph is allowed. Raw
previous diagnostics remain in the audit alongside current `deepReview` records.

## Per-page inventory

| Page | Original watched files | Additional deep watch files | Base read files | Public-default dependency review |
|---|---:|---:|---:|---|
| `docs/admin/audit-trail.md` | 806 | 1164 | 26 | reviewed (static) |
| `docs/admin/events-and-redrive.md` | 1040 | 974 | 13 | reviewed (static) |
| `docs/admin/queues-concurrency-retries-dlq.md` | 1345 | 804 | 24 | reviewed (static) |
| `docs/admin/security-policy-and-redaction.md` | 834 | 1160 | 22 | reviewed (static) |
| `docs/deploy/architecture.md` | 370 | 1133 | 13 | reviewed (static) |
| `docs/deploy/backups-and-restore.md` | 395 | 1204 | 27 | reviewed (static) |
| `docs/deploy/deployment-checklist.md` | 559 | 1124 | 21 | reviewed (static) |
| `docs/deploy/diagnostics-and-migration.md` | 391 | 1126 | 27 | reviewed (static) |
| `docs/deploy/elestio.md` | 477 | 1201 | 15 | reviewed (static) |
| `docs/deploy/installation.md` | 477 | 1057 | 15 | reviewed (static) |
| `docs/deploy/installer-walkthrough.md` | 473 | 1049 | 15 | reviewed (static) |
| `docs/deploy/observability.md` | 561 | 1182 | 19 | reviewed (static) |
| `docs/deploy/platforms.md` | 480 | 1198 | 15 | reviewed (static) |
| `docs/deploy/render.md` | 477 | 1201 | 15 | reviewed (static) |
| `docs/deploy/rollback.md` | 362 | 1093 | 14 | reviewed (static) |
| `docs/deploy/storage-and-artifacts.md` | 523 | 1197 | 19 | reviewed (static) |
| `docs/developer/architecture.md` | 1747 | 909 | 39 | reviewed (static) |
| `docs/developer/cli-and-automation.md` | 359 | 1346 | 33 | reviewed (static) |
| `docs/developer/contributing-documentation.md` | 530 | 1419 | 40 | reviewed (static) |
| `docs/developer/contributing.md` | 668 | 1254 | 51 | reviewed (static) |
| `docs/developer/documentation-site.md` | 4 | 0 | 4 | reviewed (static) |
| `docs/developer/extensions.md` | 557 | 1197 | 25 | reviewed (static) |
| `docs/developer/integrations.md` | 1472 | 840 | 22 | reviewed (static) |
| `docs/developer/local-development.md` | 584 | 1176 | 37 | reviewed (static) |
| `docs/developer/mcp-server.md` | 1078 | 1159 | 14 | reviewed (static) |
| `docs/developer/operations-internals.md` | 452 | 1277 | 22 | reviewed (static) |
| `docs/developer/project-knowledge-and-code-intelligence.md` | 400 | 1580 | 16 | reviewed (static) |
| `docs/developer/publish-extension.md` | 620 | 1281 | 16 | reviewed (static) |
| `docs/developer/publish-workflow.md` | 1040 | 1050 | 16 | reviewed (static) |
| `docs/developer/quality-and-testing.md` | 539 | 1213 | 34 | reviewed (static) |
| `docs/developer/workflow-runtime.md` | 1675 | 705 | 28 | reviewed (static) |
| `docs/integrations/agent-plugin.md` | 309 | 1174 | 10 | reviewed (static) |
| `docs/integrations/build-an-extension.md` | 1344 | 987 | 17 | reviewed (static) |
| `docs/integrations/built-in-mcp-quick-start.md` | 324 | 1180 | 12 | reviewed (static) |
| `docs/integrations/connect-ai-agents.md` | 366 | 1129 | 13 | reviewed (static) |
| `docs/integrations/extension-authoring-skill.md` | 449 | 1293 | 8 | reviewed (static) |
| `docs/integrations/extension-operator-guide.md` | 559 | 1196 | 16 | reviewed (static) |
| `docs/integrations/external-mcp-catalogs.md` | 287 | 1152 | 13 | reviewed (static) |
| `docs/integrations/incoming-workflow-webhooks.md` | 1041 | 1002 | 17 | reviewed (static) |
| `docs/integrations/public-api-quick-start.md` | 1179 | 921 | 17 | reviewed (static) |
| `docs/intro.mdx` | 1398 | 1016 | 27 | reviewed (static) |
| `docs/maintainer/documentation-debt-backlog.md` | 0 | 0 | 0 | reviewed (static) |
| `docs/reference/api.md` | 339 | 1117 | 15 | reviewed (static) |
| `docs/reference/cli.md` | 599 | 1151 | 34 | reviewed (static) |
| `docs/reference/configuration.md` | 374 | 1130 | 13 | reviewed (static) |
| `docs/reference/environment-variables.md` | 1515 | 857 | 32 | reviewed (static) |
| `docs/reference/feature-coverage-matrix.md` | 1922 | 686 | 46 | reviewed (static) |
| `docs/reference/host-settings.md` | 655 | 1182 | 14 | reviewed (static) |
| `docs/reference/installer.md` | 473 | 1049 | 15 | reviewed (static) |
| `docs/reference/limits-and-file-formats.md` | 1594 | 742 | 31 | reviewed (static) |
| `docs/reference/mcp.md` | 1481 | 784 | 28 | reviewed (static) |
| `docs/reference/platform-audit.md` | 0 | 0 | 0 | reviewed (static) |
| `docs/reference/release-readiness.md` | 0 | 0 | 0 | reviewed (static) |
| `docs/reference/upgrade.md` | 366 | 1072 | 24 | reviewed (static) |
| `docs/reference/workflow-step-kinds.md` | 1483 | 833 | 21 | reviewed (static) |
| `docs/troubleshooting.md` | 2075 | 538 | 48 | reviewed (static) |
| `docs/user/agents-and-skills.md` | 1263 | 1069 | 19 | reviewed (static) |
| `docs/user/connect-an-ai-client.md` | 407 | 1663 | 13 | reviewed (static) |
| `docs/user/core-concepts.md` | 1788 | 801 | 30 | reviewed (static) |
| `docs/user/dashboard.md` | 453 | 1610 | 14 | reviewed (static) |
| `docs/user/datasets-and-data-connections.md` | 707 | 1597 | 17 | reviewed (static) |
| `docs/user/extensions.md` | 655 | 1628 | 19 | reviewed (static) |
| `docs/user/failed-run-diagnostics.md` | 1552 | 792 | 27 | reviewed (static) |
| `docs/user/feature-catalog.md` | 1922 | 686 | 46 | reviewed (static) |
| `docs/user/feature-configuration.md` | 1136 | 922 | 26 | reviewed (static) |
| `docs/user/file-an-issue.md` | 407 | 1369 | 33 | reviewed (static) |
| `docs/user/first-workflow.md` | 1351 | 867 | 26 | reviewed (static) |
| `docs/user/getting-started.md` | 610 | 1581 | 18 | reviewed (static) |
| `docs/user/installation-and-updates.md` | 499 | 1036 | 28 | reviewed (static) |
| `docs/user/jobs-and-approvals.md` | 1264 | 1111 | 17 | reviewed (static) |
| `docs/user/monitoring.md` | 616 | 1559 | 26 | reviewed (static) |
| `docs/user/product-tour.md` | 1811 | 786 | 34 | reviewed (static) |
| `docs/user/project-knowledge-and-code-intelligence.md` | 393 | 1584 | 16 | reviewed (static) |
| `docs/user/registry-management.md` | 1203 | 1081 | 22 | reviewed (static) |
| `docs/user/settings-and-model-providers.md` | 705 | 1587 | 20 | reviewed (static) |
| `docs/user/tools-and-mcp.md` | 1248 | 1108 | 21 | reviewed (static) |
| `docs/user/trash-and-lifecycle.md` | 1412 | 995 | 28 | reviewed (static) |
| `docs/user/use-cases.md` | 1911 | 692 | 47 | reviewed (static) |
| `docs/user/users-roles-and-access.md` | 376 | 1610 | 13 | reviewed (static) |
| `docs/user/workflow-and-extension-catalogs.md` | 1503 | 1033 | 22 | reviewed (static) |
| `docs/user/workflow-builder.md` | 1693 | 868 | 27 | reviewed (static) |
| `docs/user/workflow-promotion.md` | 1494 | 860 | 22 | reviewed (static) |
| `docs/user/workflows.md` | 1959 | 678 | 40 | reviewed (static) |
| `docs/user/workspaces-and-projects.md` | 1230 | 1114 | 21 | reviewed (static) |

## Remaining connection gates

- Eight externally referenced pages still require the execution adapter to
  expose the pinned evidence in its isolated view and validate citations. Saved
  files alone do not prove that adapter exists or live provider claims are true.
- The current release-impact policy has no approved decisions. Unknown changes
  remain unresolved; labels such as bugfix/security never silently authorize skips.
- Connect durable ledger restoration/persistence, constrained source views,
  docs-only routing and accepted/no-op coverage tracking before paid execution.
- No tests, builds, JS planner/queue execution, AI calls, embeddings, workflow
  dispatch or rerun were performed. Raw receipts/reservations were not rewritten.
  Runtime verification remains pending the user's authorization.

`review-deep-dependencies.py <public-product> <new-candidate.json>` is an optional
future static parser. It imports no product modules and emits candidate data
only; it does not overwrite approvals, activate the queue or call a model.
Its output still needs review of dynamic boundaries and the selected profile.
