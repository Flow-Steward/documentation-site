---
title: Extension Authoring Skill
description: Install a portable coding-agent skill for creating and reviewing Flow Steward extensions in Claude Code, Codex, or Cursor.
---

# Extension Authoring Skill

Use the **Flow Steward Extension Authoring** skill when asking a coding agent to build or
review an extension. It guides the agent through the target application's
schemas, provider runtime, tests, and packaging. It is separate from the
[skills registered inside Flow Steward](../user/agents-and-skills).

The skill is included in the **Flow Steward Developer** package
(`flow-steward-developer`), together with the skills for publishing an
extension, contributing code and reporting an issue. Check the
[latest Flow Steward release](https://github.com/Flow-Steward/flow-steward-app/releases/latest)
for package downloads; see [Connect AI Agents](connect-ai-agents#download) for
the expected files and checksums. The package source is available on main at
`docs/agent-skills/flow-steward-developer` in the application repository.
Source availability and archive-building support do not establish that a
particular release has published those downloads. The package contains no
credentials, installs no dependencies and deploys nothing. The agent still
has to inspect the actual target release's contracts.

## Before you start

Have a compatible Flow Steward **application source checkout**, a working
Development authoring environment, and Docker available for its tooling. A
Compact production container or this documentation repository is not the
extension development toolchain. Follow [Local Development](../developer/local-development)
and the target checkout's instructions.

Decide which provider to integrate, what the extension should do, and which
Flow Steward version it must support. Start with mocked provider responses;
keep live credentials out of prompts and committed fixtures. The skill recommends the
[Example Showcase extension](build-an-extension#example-showcase-extension) as
its default reference for extension features. Inspect that external bundle's
current contracts and compatibility with your target checkout before reusing it.

The skill is also how you add custom logic to workflows: Flow Steward has no
inline code step, so ask the agent for an extension whose action you then call
with the **Extension tools** step (see
[Custom code](../reference/workflow-step-kinds#custom-code-code-step)).

## Install in your coding agent

Install the Developer package in your client as described in
[Connect AI Agents](connect-ai-agents#install-the-package-in-your-client) and
use the client's discovered skill names. Claude Code plugin installs expose
`/flow-steward-developer:flow-steward-extension-authoring`.

To install only this skill, extract the package and copy its
`skills/flow-steward-extension-authoring/` folder into the skills directory of
the project your agent will use:

| Agent | Project-local destination | Invoke |
|---|---|---|
| Claude Code | `.claude/skills/flow-steward-extension-authoring/SKILL.md` | `/flow-steward-extension-authoring` followed by the task |
| Codex | `.agents/skills/flow-steward-extension-authoring/SKILL.md` | `$flow-steward-extension-authoring` followed by the task |
| Cursor | `.cursor/skills/flow-steward-extension-authoring/SKILL.md` | Ask the agent to use `flow-steward-extension-authoring` for the task |

For example, after extracting the package to
`~/Downloads/flow-steward-developer`:

```bash
# Run in the project where Codex will work.
mkdir -p .agents/skills
cp -R ~/Downloads/flow-steward-developer/skills/flow-steward-extension-authoring .agents/skills/
```

For Claude Code or Cursor, substitute the destination directory from the table.
If an older copy exists, review and replace that copy rather than creating a
nested `flow-steward-extension-authoring/flow-steward-extension-authoring/` directory. Keep one
active version of the skill in the agent's search paths. Start a new agent
session if the installed skill is not discovered.

These are local coding-agent installation instructions. Cloud sessions must
have access to the skill and application checkout in their own environment;
a folder on your laptop is not automatically available there. Client discovery
and installation behavior can change; confirm support in your installed client.
See the official
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

Check the delivered `wheels/` folder yourself: every requirement needs compatible
`_x86_64` and `_aarch64` wheels, or a compatible universal `any` wheel.
`extensions validate` does not verify coverage of both architectures.
`lock-deps` and `bundle --with-wheels` target both by default; explicit
`--platforms` overrides can narrow that coverage. Follow
[Python Dependencies And Wheel Distribution](build-an-extension#python-dependencies-and-wheel-distribution)
for locks, platform defaults and missing-wheel handling, and
[Bundle And Install](build-an-extension#bundle-and-install) for
separate native runtime targets.

The skill does not grant the agent access to a provider account, approve an
installation, or guarantee that generated code is correct. Review the output
and run the target's validation before installing a package. For manual
authoring, continue with [Build An Extension](build-an-extension); for runtime
and schema details, see [Extensions](../developer/extensions).

## Updating the skill

Replace the installed package or folder with a reviewed new download when
adopting a new Flow Steward release. Keep local changes under version control. The agent must
still compare contracts with the target checkout: a skill update and an
application release are independent artifacts. For a package installation,
follow the [package update steps](agent-plugin#update), refresh the client,
and verify the discovered skills against the reviewed package.
