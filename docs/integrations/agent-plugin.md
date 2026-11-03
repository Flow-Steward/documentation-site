---
title: Agent Skill Packages
description: The Flow Steward Operator and Developer skill packages for AI agents, their skills, example requests, updates and individual skill installation.
---

# Agent Skill Packages

Flow Steward provides two agent skill packages. Install either one or both;
neither needs the other.

- **Flow Steward Operator** (`flow-steward-operator`) is for people who build
  and run automations by talking to an AI agent. The agent works through your
  installation's MCP server, so it needs access: a personal access token, or
  OAuth sign-in for cloud apps. Offline workflow conversion additionally needs
  a terminal, Python and file access.
- **Flow Steward Developer** (`flow-steward-developer`) is for developers who
  build extensions or change the core code. It works in a terminal with the
  Flow Steward CLI, the extension SDK, Git and Docker, and needs no MCP
  connection and no Flow Steward token.

On main, Operator is version **1.0.1** and Developer is version **1.0.0**.
These source versions do not establish that matching release downloads have
been published; check the selected release's assets before downloading. If you
still have the earlier single `flow-steward` plugin installed, remove it before
installing the new packages so the client does not see the same skills twice.

Downloads, checksums, supported clients and installation steps are on
[Connect AI Agents](connect-ai-agents#download). Your installation's
**Settings → Account → AI agents** page shows the same steps with your address
filled in. Client support and verification vary; check the package's
[compatibility matrix](https://github.com/Flow-Steward/flow-steward-app/blob/main/docs/agent-skills/COMPATIBILITY.md).
Historical checks of Operator 1.0.0 do not verify Operator 1.0.1 or its
four-skill inventory. Cloud-client operation against a live installation,
including access to the offline converter's required runtime, remains unverified.

## Skills

| Skill | Package | Use | Page |
| --- | --- | --- | --- |
| `flow-steward-workflow-authoring` | Operator | Find what exists, create skills and agents, compose, validate and save workflows as disabled drafts, enable and run them on request, change existing workflows, repair disabled objects, and answer questions about runs, errors, approvals and reports. | [Tools And MCP](../user/tools-and-mcp) |
| `flow-steward-migrate-workflow` | Operator | Convert supported n8n exports into disabled drafts, assess Make or Activepieces exports, and identify adaptations and setup blockers. | See migration example below. |
| `flow-steward-publish-workflow` | Operator | Share a workflow as a template in the public catalog `Flow-Steward/workflows`. | [Publish a Workflow Template](../developer/publish-workflow) |
| `flow-steward-extension-authoring` | Developer | Build or change an extension against the target release's manifest, SDK and CLI lifecycle, and validate and test it. | [Extension Authoring Skill](extension-authoring-skill) |
| `flow-steward-publish-extension` | Developer | Release an extension, and later versions, and list it in the public catalog `Flow-Steward/extensions`. | [Publish an Extension](../developer/publish-extension) |
| `flow-steward-contribute-code` | Developer | Fix a bug or propose an improvement in `Flow-Steward/flow-steward-app`, from the issue to a reviewed pull request. | [Contributing Code](../developer/contributing) |
| `flow-steward-report-issue` | Both | Report a bug or request a feature on GitHub with the System Diagnostics report, without changing anything. | [Report a Bug](../user/file-an-issue) |

The packages contain no installation address, token or hooks. Developer holds
instructions; Operator also bundles an offline n8n converter, references and
examples. The converter requires Python 3.12+ and `PyYAML==6.0.3`, pinned in
its `scripts/requirements.txt`; use a separate local environment rather than
changing platform dependencies. Only the Claude Code manifest of the Operator
package declares the Flow Steward MCP server, and it asks you for the address
and the token; in every other client you add the server yourself. Updating a
package never changes your connection.

The token decides what the agent may do, not the package. Reading runs and
reports needs the matching read scopes; creating, changing and enabling agents,
skills and workflows needs an administrator user and a token with `admin:all`
(**Full authoring** on the AI agents page). Reporting issues and publishing
templates use GitHub through your client's GitHub tools or the `gh` CLI;
without them the skills prepare the text and you submit it in the browser.

## Package layout

Each package archive extracts to one plugin root:

| File | Read by |
| --- | --- |
| `plugin.json` | Agent Plugins 1.0.0 clients and the OpenAI plugin directory |
| `.claude-plugin/plugin.json` | Claude Code and Claude.ai |
| `.cursor-plugin/plugin.json` | Cursor |
| `gemini-extension.json` | Gemini CLI; added when building the package archive |
| `skills/<name>/SKILL.md` | Every client |

Install that root directory, not only `.claude-plugin/` and not the whole
application repository. The marketplace archive
`flow-steward-agent-skills-<Core version>.zip` holds both packages as a Claude Code
marketplace named `flow-steward`.

## Check that it works

For the Operator package:

1. The client lists the four skills.
2. The Flow Steward MCP server is connected and its tool list contains the
   tools your token allows, for example `project_list` and `workflow_list`.
3. Ask: "List my Flow Steward projects and their enabled workflows." The agent
   should use the MCP tools and report a permission error as an error.

Skill discovery does not establish that the client can run the offline converter;
check its terminal, Python and file access separately.

For the Developer package, the client lists the four skills. Ask, in a Flow
Steward application checkout: "Which checks does the extension quality gate
run?" The agent should answer from the checkout's `docs/standards/` and
`lint.sh` rather than from memory.

## Install individual skills

You can instead copy a whole folder from a package's `skills/` directory into
the client's own skills directory: `~/.agents/skills/`, `~/.cursor/skills/` or
`~/.claude/skills/`, or the project equivalents. Copy
`flow-steward-workflow-authoring` together with its `references/` folder. For
`flow-steward-migrate-workflow`, keep its `references/`, `scripts/` and `assets/`
folders too. Do not install the same skill both as a plugin and as a standalone skill.

## Update

Replace the reviewed package files with the selected release, run the client's
update step (listed on
[Connect AI Agents](connect-ai-agents#update-and-remove)), restart or reload the
client, and check the skills listing again. Codex loads a cached installed copy:
compare the installed files with the new ones before relying on the update.
Never overwrite MCP credentials while updating skills.

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

**Migrate an external workflow**

> Inspect this exported n8n workflow and prepare a complete disabled Flow Steward
> draft with a source-to-target mapping and setup blockers. Leave connections
> unbound where setup is deferred; do not import or run it.

Expect a complete disabled draft when the behavior can be represented, or a
mapping and explicit blockers. An unbound draft is not ready to import or run.
The bundled offline converter handles a qualified subset of n8n JSON and writes
new local YAML and mapping-report files; it does not call providers or save to
Flow Steward. Unsupported constructs need explicit agent-assisted adaptation.
Make and Activepieces use that mapping/adaptation path, not the n8n parser.
Conversion leaves `target_validation=required` and `runtime_verified=false`:
target validation, import, execution and live external checks are separate.
Saving or importing requires the existing authoring authority and authorization;
conversion does not authorize execution, extension installation or publication.

**Create a skill and an agent**

> Create a skill "Summarise supplier email" that takes the email text and
> returns a short summary, and an agent "Supplier assistant" that uses it.
> Validate both and enable them only if validation passes.

Expect the new skill and agent IDs, their validation results and enabled state,
or a refusal you can act on. If the ID or display name is already taken, the
agent shows the existing matches and a suggested free name instead of creating
a duplicate. This needs an administrator token with `admin:all`. See
[agents and skills tools](../reference/mcp#agents-skills-and-models).

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

Installing a skill does not grant permissions. Draft save and agent or skill
changes need an administrator user with `admin:all`; machine tokens remain
operators. Report generation needs `reports.write` or a supported broader scope,
even with `persist=false`.
Enablement, execution and approval remain deliberate, authorized actions.
