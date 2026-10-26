---
title: Flow Steward Agent Plugin
description: Install one portable plugin with skills for workflows and operations, bug reports, catalog publishing, extension authoring and code contributions.
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Flow Steward Agent Plugin

[Download the complete plugin ZIP](/skills/flow-steward-plugin.zip), or
<a href={useBaseUrl('/skills/flow-steward/README.md')}>read the packaged README</a>.
The archive extracts to one installable `flow-steward/` root with both manifests
and six canonical skills (plugin version 1.1.0).

The workflow skill uses your already configured authenticated Flow Steward MCP
connection. The other skills work from a terminal with `git`, the GitHub CLI
`gh` or a browser and, for development, a Flow Steward application checkout.

| Skill | Audience and use | Page |
| --- | --- | --- |
| `flow-steward-workflow-authoring` | End users: reuse/compose local workflows, inspect runs, errors and approvals, request operational reports, export or import a workflow. | [Tools And MCP](../user/tools-and-mcp) |
| `flow-steward-report-issue` | End users and their agents: report a bug or request a feature on GitHub, with the redacted System Diagnostics report attached. | [Report a Bug](../user/file-an-issue) |
| `flow-steward-publish-workflow` | Workflow authors: share a workflow template in the public workflow catalog. | [Publish a Workflow Template](../developer/publish-workflow) |
| `flow-steward-extension-authoring` | Developers: build extensions against current manifests, SDK and supported CLI lifecycle. | [Extension Authoring Skill](extension-authoring-skill) |
| `flow-steward-publish-extension` | Developers: publish an extension and its later versions to the public extension catalog. | [Publish an Extension](../developer/publish-extension) |
| `flow-steward-contribute-code` | Contributors: fix a bug or propose an improvement in the core repository, from the issue to a reviewed pull request. | [Contributing Code](../developer/contributing) |

The extracted `flow-steward/` directory is the actual plugin root. Root
`plugin.json` targets Agent Plugins 1.0.0 for Codex and Cursor;
`.claude-plugin/plugin.json` provides Claude Code metadata. Both discover the
same `skills/` sources. This skills-only package contains no endpoint, token,
server process, hooks or dependencies. Configure MCP separately using your
installation's connection instructions. The workflow, issue and workflow
publishing skills work without a platform checkout; extension work and code
contributions use the target release's contracts and the supported Development
environment.

## Install and verify

Review the package before installing. Extract an archive to obtain
`flow-steward/plugin.json`, `flow-steward/.claude-plugin/plugin.json` and the six
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

Restart the client and verify the six skills in its available skills listing.
The local marketplace is private; this package is not listed in a public
marketplace. [Codex packaging documentation](https://developers.openai.com/plugins/build/plugins)
explains local sources and cache behavior.

### Cursor

Copy the extracted root to `~/.cursor/plugins/local/flow-steward`, reload the
window and inspect Customize for the six skills. Local imports must be allowed by
your organization. A marketplace installation of the same name takes precedence;
symlinks outside the local plugins directory are skipped. See
[Cursor local plugins](https://cursor.com/docs/plugins).

### Claude Code

For a session-local load, inspect `claude --help` and run:

```bash
claude --plugin-dir /absolute/path/to/flow-steward
```

Verify the skills in the session's skill listing, for example
`/flow-steward:flow-steward-workflow-authoring`,
`/flow-steward:flow-steward-report-issue` and
`/flow-steward:flow-steward-contribute-code`.
`claude plugin validate /absolute/path/to/flow-steward` checks the manifest;
it does not prove tool connectivity or successful use. Persistent installation
uses a configured Claude marketplace and its normal plugin lifecycle. See
[Claude plugin reference](https://code.claude.com/docs/en/plugins-reference).

### Optional individual skill installation

Copy any complete leaf under `skills/` into one native skills directory:
Codex `.agents/skills/` or `~/.agents/skills/`; Cursor `.agents/skills/`,
`.cursor/skills/` or their user equivalents; Claude `.claude/skills/` or
`~/.claude/skills/`. Use the same canonical bytes and keep the leaf name.
Standalone names are `$flow-steward-workflow-authoring` /
`$flow-steward-extension-authoring` in Codex and the corresponding `/` names
in Claude; the other skills follow the same pattern with their leaf names. For plugin installs use the client's discovered names; Claude adds
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
for this project for the last seven days". Anyone can ask "Report this error
as a Flow Steward bug" or "Publish this workflow to the Flow Steward catalog".
Developers can ask to build, validate and publish an extension, or to fix a
core bug and open a pull request.

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

### Report a bug, publish, contribute

**Report a bug**

> The supplier import job failed with "connector timeout". Report it as a Flow
> Steward bug.

The agent searches existing issues, asks you to download the System
Diagnostics report (**System → Monitoring → Download diagnostics**, or
`./flow-steward reports diagnostics`) and to glance through it, collects the
version, steps, expected and actual result and the job id, and shows you the
draft. It files the issue only after you agree, and never pastes secrets or
customer data. See [Report a Bug or Request a Feature](../user/file-an-issue).

**Publish a workflow template**

> Publish my workflow "Import supplier stock" to the Flow Steward workflow catalog.

The agent checks the name, description and version, exports the workflow with
its child workflows, reviews the file with you for private data, and prepares
the catalog pull request. See [Publish a Workflow Template](../developer/publish-workflow).

**Publish an extension**

> Publish version 1.2.0 of my extension com.acme.crm-sync to the catalog.

The agent checks the manifest listing fields and `icon.png`, runs the gate's
extension checks, confirms wheels for Linux AMD64 and ARM64, and walks through
the release tag and, for a first listing, the catalog pull request. See
[Publish an Extension](../developer/publish-extension).

**Contribute a fix**

> Fix issue #123 in Flow Steward and open a pull request.

The agent works in the Development environment, writes the failing regression
test first, runs the `lint.sh` tiers, and opens a pull request with the
evidence after you approve. See [Contributing Code](../developer/contributing).

### Individual skill downloads

The optional individual ZIPs copy the same canonical leaves; they are not
separate instruction editions:
[workflow authoring](/skills/flow-steward-workflow-authoring.zip),
[report an issue](/skills/flow-steward-report-issue.zip),
[publish a workflow](/skills/flow-steward-publish-workflow.zip),
[extension authoring](/skills/flow-steward-extension-authoring.zip),
[publish an extension](/skills/flow-steward-publish-extension.zip) and
[contribute code](/skills/flow-steward-contribute-code.zip). Installing a skill
does not grant permissions. Draft save needs an admin user with `admin:all`;
machine tokens remain operators. Report generation needs `reports.write` even
with `persist=false`. Enablement, execution and approval remain deliberate
authorized actions.
