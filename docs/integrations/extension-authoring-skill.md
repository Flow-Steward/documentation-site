---
title: Extension Authoring Skill
description: Install a portable coding-agent skill for creating and reviewing Flow Steward extensions in Claude Code, Codex, or Cursor.
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Extension Authoring Skill

Use the **Flow Steward Extension Authoring** skill when asking a coding agent to build or
review an extension. It guides the agent through the target application's
schemas, provider runtime, tests, and packaging. It is separate from the
[skills registered inside Flow Steward](../user/agents-and-skills).

Install the [Flow Steward Agent Plugin](agent-plugin) to get this developer skill
and the workflow/operations skill together. For an optional standalone installation,
[download the individual skill ZIP](/skills/flow-steward-extension-authoring.zip), or
<a href={useBaseUrl('/skills/flow-steward-extension-authoring/SKILL.md')}>read SKILL.md</a> before installing it.
The ZIP contains the canonical `flow-steward-extension-authoring/` instructions.
The individual download copies the same canonical leaf as the plugin and requires
inspection of the actual target release's contracts. It does not contain credentials,
install dependencies or deploy an extension automatically.

## Before you start

Have a compatible Flow Steward **application source checkout**, a working
Development authoring environment, and Docker available for its tooling. A
Compact production container or this documentation repository is not the
extension development toolchain. Follow [Local Development](../developer/local-development)
and the target checkout's instructions.

Decide which provider to integrate, what the extension should do, and which
Flow Steward version it must support. Start with mocked provider responses;
keep live credentials out of prompts and committed fixtures.

## Install in your coding agent

For the complete plugin, follow [Install and verify](agent-plugin#install-and-verify)
and use the client’s discovered skill names. Claude plugin installs expose
`/flow-steward:flow-steward-extension-authoring`. For the individual ZIP, unzip
the download. From the project directory your agent will use, create the
appropriate skills directory and copy `flow-steward-extension-authoring/` into it:

| Agent | Project-local destination | Invoke |
|---|---|---|
| Claude Code | `.claude/skills/flow-steward-extension-authoring/SKILL.md` | `/flow-steward-extension-authoring` followed by the task |
| Codex | `.agents/skills/flow-steward-extension-authoring/SKILL.md` | `$flow-steward-extension-authoring` followed by the task |
| Cursor | `.cursor/skills/flow-steward-extension-authoring/SKILL.md` | Ask the agent to use `flow-steward-extension-authoring` for the task |

For example, after extracting to your Downloads directory:

```bash
# Run in the project where Codex will work.
mkdir -p .agents/skills
cp -R ~/Downloads/flow-steward-extension-authoring .agents/skills/
```

For Claude Code or Cursor, substitute the destination directory from the table.
If an older copy exists, review and replace that copy rather than creating a
nested `flow-steward-extension-authoring/flow-steward-extension-authoring/` directory. Keep one
active version of the skill in the agent's search paths. Start a new agent
session if the installed skill is not discovered.

These are local coding-agent installation instructions. Cloud sessions must
have access to the skill and application checkout in their own environment;
a folder on your laptop is not automatically available there. See the official
[Claude Code skills documentation](https://code.claude.com/docs/en/skills),
[Codex skills documentation](https://developers.openai.com/codex/skills), and
[Cursor skills documentation](https://cursor.com/docs/skills) for discovery and
account-level installation behavior.

## Give the agent a concrete task

For Codex, start with a request such as:

```text
Use $flow-steward-extension-authoring to create com.acme.crm-sync for the Flow Steward
checkout in this workspace. Target the checked-out release. Implement lookup
of CRM records and an authenticated incoming webhook that starts a workflow.
Use mocked provider responses first. Explain each configuration field and
where an operator obtains its value. Validate and package for Linux AMD64
and ARM64, including compatible hash-locked third-party wheels when needed.
Report the Python/ABI target, archives and checks actually run on each
architecture, plus missing verification. Do not deploy or publish it.
```

Use Claude Code's slash invocation or the same natural-language request in
Cursor. Replace the example provider, operations, authentication requirements,
and target release with your own requirements. The skill also supports a
review request: identify your existing bundle and ask for contract validation,
missing tests, and operator-instruction gaps.

## What you should receive

- An extension bundle with its manifests, runtime, referenced files, and focused tests;
  portable third-party wheels cover both Linux AMD64 and ARM64 for the target
  tooling Python/ABI. Native executables need separately targeted archives.
- Configuration instructions, required provider permissions, a first successful
  operation, and troubleshooting guidance.
- The target Flow Steward revision, Python/ABI and architecture targets, archive
  paths/digests, commands actually run, and results.
- An actual verification report identifying which architectures were tested and
  what remains unverified. Packaging/wheel coverage alone does not prove successful
  installation on both architectures or a live provider integration.

Follow [Python Dependencies And Wheel Distribution](build-an-extension#python-dependencies-and-wheel-distribution)
for locks, platform defaults and missing-wheel handling, and
[Bundle And Install](build-an-extension#bundle-and-install) for
separate native runtime targets.

The skill does not grant the agent access to a provider account, approve an
installation, or guarantee that generated code is correct. Review the output
and run the target's validation before installing a package. For manual
authoring, continue with [Build An Extension](build-an-extension); for runtime
and schema details, see [Extensions](../developer/extensions).

## Updating the skill

Replace the installed folder with a reviewed new download when adopting a new
Flow Steward release. Keep local changes under version control. The agent must
still compare contracts with the target checkout: a skill update and an
application release are independent artifacts. For a full plugin installation,
follow the [plugin update steps](agent-plugin#use-and-update), refresh the client,
and verify both discovered skills against the reviewed package.
