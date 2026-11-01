---
sidebar_position: 8
title: Tools And MCP
description: Register MCP catalogs, sync tools, and decide what automation may use.
---

# Tools And MCP

Tools are executable capabilities. MCP catalogs are one way to bring external
tools into Flow Steward without hard-coding them into the core platform.

This page is about registering external MCP catalogs in the Flow Steward UI. The
built-in Flow Steward MCP server, used by IDEs and agents that call Flow Steward
itself, is covered in
[Connect An AI Client With MCP](../integrations/built-in-mcp-quick-start) and
[MCP Reference](../reference/mcp).

## Add an MCP connector

[![Create MCP connector form with endpoint, transport, authentication, headers, scopes, namespace, and enabled controls](/img/screenshots/2026-10-04/mcp-create-form.png)](/img/screenshots/2026-10-04/mcp-create-form.png)

*The blank connector form. No endpoint or credential was submitted for this screenshot.*

1. Open `Registry`.
2. Open `MCP`.
3. Select the required `Project scope`; credentials and projected tools are
   isolated to that project.
4. Choose `+ New MCP` and enter a name and endpoint URL.
5. Keep transport as `streamable_http`.
6. Choose `none`, `bearer`, `api_key`, or `oauth2` authentication.
7. Add each custom header as a key/value row. Store secrets through the
   credential controls; do not paste a JSON object into the header UI.
8. Add a namespace prefix when tool names need to stay distinct.
9. Leave `Enabled` on when the connector should be usable after save.
10. Save the MCP connector.

For OAuth, review scopes and authorization parameters, complete the provider
grant, and confirm whether a refresh token is required. Reconnect when the
endpoint, client binding, credential revision, or required scopes change.

## Sync and health-check MCP

After saving a connector:

1. Click `Sync` to discover remote tools.
2. Click `Health` to verify the endpoint can be reached.
3. Open the connector detail page.
4. Review discovered tools.
5. Allowlist only the tools that workflows or agents should be able to use.

The list page shows connector status, transport, endpoint, allowed tool count,
and last sync time.

[![Tools catalog with registered tool records and filtering controls](/img/screenshots/2026-10-04/tools-catalog.png)](/img/screenshots/2026-10-04/tools-catalog.png)

*Registered tools in the isolated synthetic fixture; the image does not prove a remote MCP sync or health check.*

## When to use MCP

Use MCP when a capability is external to Flow Steward but should be available to
agents or workflows through a structured tool contract.

Good examples:

- issue-tracker tools;
- incident-management tools;
- internal deployment tools;
- remote dataset or schema tools;
- provider tools exposed by another service.

## Tool safety checklist

Before exposing a tool to workflows:

- Confirm the endpoint belongs to the expected service.
- Use the narrowest token or header possible.
- Add a namespace prefix for shared catalogs.
- Sync and inspect the tool list.
- Allowlist only required tools.
- Run a test workflow before production use.
- Revoke or rotate credentials when the provider changes.

## Related reference

- [Connect An AI Client With MCP](../integrations/built-in-mcp-quick-start)
  gives a short setup path for Codex, Claude, Cursor, and other MCP clients.
- [MCP Reference](../reference/mcp) lists Flow Steward's built-in MCP tool
  groups.
- [CLI Reference](../reference/cli) documents the built-in public CLI. Client
  MCP configuration is performed in the client; there is no public
  `setup-codex-mcp` command in this candidate.

## Let an external agent author a workflow

Connect the client with the existing MCP quick start, then use the six
[authoring tools](../reference/mcp#workflow-authoring) to reuse local workflows,
inspect contracts and validate a disabled draft. Save requires an admin user
and `admin:all`; machine tokens remain operators. Project-name resolution also
needs `projects.read`. Saving does not enable or execute the draft. The manual
editor remains the place to inspect, adjust and deliberately enable the workflow
before Test Run.

The agent can also create and change agents and skills, assign skills to
agents, and enable or disable agents, skills and workflows through the
[agents and skills tools](../reference/mcp#agents-skills-and-models). These
need an administrator user and `admin:all`. An ID or display name that is
already taken is refused with the existing matches; nothing is renamed
automatically.

Install the **Flow Steward Operator** package to teach the agent these steps:
its `flow-steward-workflow-authoring` skill works through the existing
authenticated MCP connection and needs no application checkout. Basic MCP calls
also work without installing a skill. See
[Connect AI Agents](../integrations/connect-ai-agents) for the
**Settings → Account → AI agents** page, downloads and per-client setup, and
[Agent Skill Packages](../integrations/agent-plugin) for what each skill does.

## Inspect runs and request operational reports

Ask the workflow skill to show failed runs or pending approvals for an exact
project/workflow, inspect a known job’s errors, or report activity for a stated
period. Inspection does not authorize an approval decision, restart or cancellation.

`job_list(..., group_by="attention")` groups runs for triage and pages like the
plain list: `has_more=true` means the groups hold only the current page of
`total` runs. A status group key selects its whole group, so `stuck` also lists
`orphaned` runs and `failed` also lists `max_iterations` and `triage_needed`
runs.
For a complete inventory follow the pages through `total_pages`. There are no date arguments on `job_list`: exact time intervals
require filtering returned timestamps locally and stating which timestamp was used.

Operational `report_generate` supports project/workflow filters. `range="7d"`
means a rolling 168-hour UTC window; explicit start/end dates are inclusive UTC
calendar days. State the window and timezone. Local “today” needs complete job
pages filtered to the converted local-day interval, rather than a relabeled UTC
aggregate. Generation requires `reports.write` even with `persist=false`;
permission failures remain failures. See [MCP Reference](../reference/mcp#operational-report-periods).
