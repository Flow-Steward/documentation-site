---
title: Flow Steward Agent Plugin
description: Install one portable plugin with user workflow and operations skills and developer extension authoring skills.
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Flow Steward Agent Plugin

[Download the complete plugin ZIP](/skills/flow-steward-plugin.zip), or
<a href={useBaseUrl('/skills/flow-steward/README.md')}>read the packaged README</a>.
The archive extracts to one installable `flow-steward/` root with both manifests
and both canonical skills.

One portable plugin with two skills, using your already configured authenticated
Flow Steward MCP connection:

| Skill | Audience and use |
| --- | --- |
| `flow-steward-workflow-authoring` | End users: reuse/compose local workflows, inspect runs, errors and approvals, request operational reports. |
| `flow-steward-extension-authoring` | Developers: build extensions against current manifests, SDK and supported CLI lifecycle. |

The extracted `flow-steward/` directory is the actual plugin root. Root
`plugin.json` targets Agent Plugins 1.0.0 for Codex and Cursor;
`.claude-plugin/plugin.json` provides Claude Code metadata. Both discover the
same `skills/` sources. This skills-only package contains no endpoint, token,
server process, hooks or dependencies. Configure MCP separately using your
installation's connection instructions. The workflow skill works without a
platform checkout; extension implementation uses the target release's contracts
and supported Development runtime.

## Install and verify

Review the package before installing. Extract an archive to obtain
`flow-steward/plugin.json`, `flow-steward/.claude-plugin/plugin.json` and both
`flow-steward/skills/<name>/SKILL.md` files. Use the extracted `flow-steward`
directory as the plugin root. Do not load only `.claude-plugin/` or install the
whole application repository as a plugin. Inspect an existing installation before
replacing files; keep a rollback copy of the version you use.

### Codex

Put the extracted directory at `plugins/flow-steward` inside a local marketplace
root of your choosing. Create or extend `.agents/plugins/marketplace.json` there
with this entry; preserve other entries:

```json
{
  "name": "flow-steward-local",
  "plugins": [{
    "name": "flow-steward",
    "source": {"source": "local", "path": "./plugins/flow-steward"},
    "policy": {"installation": "AVAILABLE", "authentication": "ON_INSTALL"},
    "category": "Productivity"
  }]
}
```

From that marketplace root, inspect your installed CLI's help, then:

```bash
codex plugin marketplace add .
codex plugin list --marketplace flow-steward-local --available --json
codex plugin add flow-steward@flow-steward-local
```

Restart the client and verify both skills in its available skills listing.
The local marketplace is private; this package is not listed in a public
marketplace. [Codex packaging documentation](https://developers.openai.com/plugins/build/plugins)
explains local sources and cache behavior.

### Cursor

Copy the extracted root to `~/.cursor/plugins/local/flow-steward`, reload the
window and inspect Customize for both skills. Local imports must be allowed by
your organization. A marketplace installation of the same name takes precedence;
symlinks outside the local plugins directory are skipped. See
[Cursor local plugins](https://cursor.com/docs/plugins).

### Claude Code

For a session-local load, inspect `claude --help` and run:

```bash
claude --plugin-dir /absolute/path/to/flow-steward
```

Verify `/flow-steward:flow-steward-workflow-authoring` and
`/flow-steward:flow-steward-extension-authoring` in the session's skill listing.
`claude plugin validate /absolute/path/to/flow-steward` checks the manifest;
it does not prove tool connectivity or successful use. Persistent installation
uses a configured Claude marketplace and its normal plugin lifecycle. See
[Claude plugin reference](https://code.claude.com/docs/en/plugins-reference).

### Optional individual skill installation

Copy either complete leaf under `skills/` into one native skills directory:
Codex `.agents/skills/` or `~/.agents/skills/`; Cursor `.agents/skills/`,
`.cursor/skills/` or their user equivalents; Claude `.claude/skills/` or
`~/.claude/skills/`. Use the same canonical bytes and keep the leaf name.
Standalone names are `$flow-steward-workflow-authoring` /
`$flow-steward-extension-authoring` in Codex and the corresponding `/` names
in Claude. For plugin installs use the client's discovered names; Claude adds
its plugin namespace. Avoid duplicate standalone and plugin installs.
Native paths are documented for [Codex](https://developers.openai.com/codex/skills),
[Cursor](https://cursor.com/docs/skills) and
[Claude](https://code.claude.com/docs/en/skills).

## Use and update

After client discovery, confirm the configured MCP connects and `tools/list`
returns the expected token-scoped tools. Try a requested scoped read, such as
listing workflows or inspecting a known job; document permission errors as
errors. For example: "Find my project's existing workflow for weekly summaries",
"Show failed runs and pending approvals for this workflow", or "Report activity
for this project for the last seven days". Developers can ask to build and
validate an extension with the extension skill.

On update, compare package version and hashes, replace the reviewed plugin root
at the same source location, refresh/restart the client and verify skill discovery
again. Codex loads a cached installed copy; confirm the refreshed install's bytes
before claiming an update took effect. Session-local Claude loads use the new
root on the next session. Cursor local copies need a reload. Marketplace-managed
installs use that client's marketplace update lifecycle. Never overwrite MCP
credentials while updating skills.

## Choose a task

Users can ask the workflow skill to reuse a project’s existing workflow, inspect
failed runs or pending approvals, or request an operational activity report.
Specify the project/workflow and period; the agent reports scope, observed results
and limits. It needs no platform source checkout. See [Tools And MCP](../user/tools-and-mcp#inspect-runs-and-request-operational-reports)
and [MCP Reference](../reference/mcp#operational-report-periods) for pagination, UTC
periods and authorization. Basic MCP calls work without either skill.

### Example requests and results

**Reuse an existing workflow**

> In project Supplier Operations, find an existing workflow for weekly supplier
> updates. Show its required inputs and observed readiness before I choose a run.

Expect an accessible workflow’s identity, inputs and any readiness gaps, or a
clear no-match result. Finding a workflow does not execute it.

**Compose a supplier-attachment workflow**

> In project Supplier Operations, use my sample supplier attachment to design a
> workflow that extracts product updates for Shopify. Inspect the available
> workflow examples, schemas and component contracts, validate the draft, and
> save it disabled if my existing permissions allow.

Expect a draft based on the sample and accessible contracts, validation results,
and either the saved disabled workflow identity or a clear dependency/permission
limitation. This example depends on your installed integrations; it does not
establish that an attachment reader or Shopify operation is available. Validation
is separate from execution; enablement and scheduling require their own supported,
authorized path. See [workflow authoring](../reference/mcp#workflow-authoring).

**Inspect failed runs and pending approvals**

> For project Supplier Operations and workflow supplier-product-updates, show
> failed runs and pending approvals. Explain the observed errors and gate context;
> leave approval decisions and recovery actions for me.

Expect scoped job IDs, statuses, errors or approval context, with coverage limits
stated. See [run inspection](../user/tools-and-mcp#inspect-runs-and-request-operational-reports)
for complete-page and bounded-triage behavior.

**Request an operational activity report**

> Report activity for project Supplier Operations and workflow
> supplier-product-updates for October 1–7, 2026, inclusive UTC calendar days.
> Show the exact scope, period, coverage and observed outcomes; do not persist it.

Expect an operational activity report for that stated window, or a permission or
coverage limitation. These results describe activity rather than complete
financial reporting. See [report periods and authority](../reference/mcp#operational-report-periods)
for UTC ranges, local-day requests and generation permissions.

Developers use [Extension Authoring Skill](extension-authoring-skill) with the
target application checkout, current manifests/SDK and the supported Development
CLI to create, validate, test and package an extension.

The optional individual [workflow skill ZIP](/skills/flow-steward-workflow-authoring.zip)
and [extension skill ZIP](/skills/flow-steward-extension-authoring.zip) copy the same
canonical leaves; they are not separate instruction editions. Installing a skill
does not grant permissions. Draft save needs an admin user with `admin:all`;
machine tokens remain operators. Report generation needs `reports.write` even
with `persist=false`. Enablement, execution and approval remain deliberate
authorized actions.
