---
title: Connect AI Agents
description: Connect Claude Code, Codex, Cursor, Gemini CLI, Claude.ai, Cowork or ChatGPT to Flow Steward with the Operator or Developer skill package.
---

# Connect AI Agents

Since Flow Steward 0.9.7 there is a guided way to connect an AI agent to your own
installation. The **AI agents** page under **Settings → Account** walks you
through it: you pick the client and the skill package, Flow Steward fills in
your installation's MCP address, creates an access token when the client needs
one, and gives you the first request to try.

This page explains the same steps, what each choice means, and where to
download the packages.

## What you need

- A Flow Steward user account. What the agent may do is never more than what
  your own role allows.
- An installation with a public address. The MCP address an agent connects to
  is `<your address>/mcp`, taken from `FS_PUBLIC_BASE_URL`. When that setting is
  missing, or the MCP address points to a service inside the installation's own
  network, the page says so and does not create a token: an administrator has
  to fix the address first.
- For cloud apps (Claude.ai, Cowork, ChatGPT) the address must be public
  **HTTPS**, and an administrator must allow cloud AI apps (see
  [Cloud AI apps](#cloud-ai-apps-claudeai-cowork-chatgpt)).

## Two packages

The skill packages teach an agent how to work with Flow Steward. They contain
instructions only: no address, no token and no server. You can install either
one or both; neither needs the other.

| Package | For | Connects to your installation | Skills |
| --- | --- | --- | --- |
| **Flow Steward Operator** (`flow-steward-operator`) | People who build and run automations by talking to an agent | Yes, through MCP, so it needs access | Workflow authoring (find, compose, validate and save workflows, create agents and skills, read runs, errors, approvals and reports), report an issue, publish a workflow template |
| **Flow Steward Developer** (`flow-steward-developer`) | Developers who build extensions or change the core code | No. It works in a terminal with Git, Docker and a Flow Steward checkout | Extension authoring, publish an extension, contribute code, report an issue |

Both packages are version 1.0.0, first released with Flow Steward 0.9.7. See
[Agent Skill Packages](agent-plugin) for what each skill does and example
requests.

## Supported clients

"Verified" means install, skill discovery, update and removal were run in that
client before the release. Other rows are prepared from the client's
documentation but have not been run in the client yet. Report problems with
[Report a Bug](../user/file-an-issue).

| Client | Where it runs | Operator: how it signs in | Operator verified | Developer |
| --- | --- | --- | --- | --- |
| Claude Code | Your computer (terminal, IDE, Code tab of the desktop app) | Personal access token | Yes | Yes, verified |
| Codex | Your computer (CLI and the ChatGPT desktop app's coding agent) | Personal access token | Not verified | Offered, not verified |
| Cursor | Your computer (desktop app) | Personal access token | Not verified | Offered, not verified |
| Gemini CLI | Your computer (terminal) | Personal access token | Not verified | Offered, not verified |
| Claude.ai and Cowork | Anthropic's servers | OAuth sign-in and consent | Not verified | Not offered: chat has no terminal |
| ChatGPT | OpenAI's servers | OAuth sign-in and consent | Not verified | Listing not published yet |

The Claude Code check covered both packages from the release archives with
the command-line client; the interactive configuration dialog and skill use
inside a signed-in session were not part of it. No cloud client has been
verified against a live installation yet. The full matrix, with limits per
client, is in the application repository's
[compatibility matrix](https://github.com/Flow-Steward/flow-steward-app/blob/main/docs/agent-skills/COMPATIBILITY.md).

## Download

All files are attached to every Flow Steward release, starting with 0.9.7.
The links below always point to the
[latest release](https://github.com/Flow-Steward/flow-steward-app/releases/latest).

| File | Contents |
| --- | --- |
| [flow-steward-operator-1.0.0.zip](https://github.com/Flow-Steward/flow-steward-app/releases/latest/download/flow-steward-operator-1.0.0.zip) | Operator package for Codex, Cursor, Claude.ai upload and Claude Code session loading |
| [flow-steward-operator-1.0.0.tar.gz](https://github.com/Flow-Steward/flow-steward-app/releases/latest/download/flow-steward-operator-1.0.0.tar.gz) | Operator package as a Gemini CLI extension |
| [flow-steward-developer-1.0.0.zip](https://github.com/Flow-Steward/flow-steward-app/releases/latest/download/flow-steward-developer-1.0.0.zip) | Developer package for Codex, Cursor and Claude Code session loading |
| [flow-steward-developer-1.0.0.tar.gz](https://github.com/Flow-Steward/flow-steward-app/releases/latest/download/flow-steward-developer-1.0.0.tar.gz) | Developer package as a Gemini CLI extension |
| `flow-steward-agent-skills-<version>.zip`, on the [latest release page](https://github.com/Flow-Steward/flow-steward-app/releases/latest) (its name carries the Flow Steward version) | Both packages as a ready Claude Code marketplace named `flow-steward` |
| [SHA256SUMS](https://github.com/Flow-Steward/flow-steward-app/releases/latest/download/SHA256SUMS) | SHA-256 checksums of the five archives above (not of `release-manifest.json`) |
| [release-manifest.json](https://github.com/Flow-Steward/flow-steward-app/releases/latest/download/release-manifest.json) | The Core repository, commit, tag and version the archives were built from |

Each package archive has the plugin root at the top level. Put `SHA256SUMS`
next to the files you downloaded and check them before installing:

```bash
shasum -a 256 -c SHA256SUMS --ignore-missing
```

On Linux use `sha256sum -c --ignore-missing SHA256SUMS`. Every downloaded
archive should report `OK`. Review the files before installing them, and keep
a copy of any version you replace.

## Connect with the AI agents page

Open **Settings → Account → AI agents**. The page has five steps.

1. **AI client.** Choose your client. Clients are marked **On your computer**
   or **Cloud**. A cloud client shows what still blocks it, for example a
   missing public HTTPS address.
2. **Package.** Choose **Operator** or **Developer**. A package that is not
   verified in the chosen client carries a **Not verified in this client**
   badge. The Developer package does not connect to Flow Steward, so steps 3
   and 5 do not apply to it.
3. **Access.** For a client that uses a token, choose:
   - **What the agent may do**:
     - **Monitor and run workflows**: find projects, read statuses, errors,
       reports and approvals, and start or cancel runs. Scopes
       `projects.read`, `jobs.read`, `jobs.write`, `reports.read`,
       `reports.write`, `workflows.read`, `workflows.write`.
     - **Full authoring**: `admin:all`. This is full access, everything you
       can do in Flow Steward, including creating and changing workflows,
       agents and skills. It is not a narrow permission. It is available only
       to administrators; for other users it is shown disabled.
   - **Projects**: empty means every project within your access. Choosing
     projects limits runs, jobs and workflows to them; agents and skills belong
     to the whole account and are not limited by project.
   - **Expiration**: 7, 30 or 90 days, 30 by default. There is no "never".

   Then select **Create token**. For a cloud client there is nothing to create
   here: you choose the access later, in Flow Steward's consent page.
4. **Set up the client.** The page lists each setup step for the chosen client
   with your MCP address already filled in: download links, commands, a
   configuration file to copy or download, and the values to paste.
5. **First request.** Ask the agent:

   ```text
   List my Flow Steward projects and their enabled workflows.
   ```

   It should answer from the MCP tools and report a permission error as an
   error.

### The token is shown once

The new token is filled into the setup steps and shown only on this page, once.
It disappears when you leave the page or select **Hide the token**. Flow
Steward stores only a hash of it, so copy it into the client right away.

The page creates at most one token per attempt. If you click twice or the
answer is lost, it does not create a second token:

- **We could not confirm whether the token was created**: select **Check
  again**. It asks about the same attempt and never creates another token.
- **This token already exists; its secret was shown once**: the attempt made
  the token earlier. If you did not save it, revoke it and start a new attempt.

Tokens created here are ordinary personal access tokens named
`AI agent · <client>`. They also appear under **Settings → Account → Personal
tokens**.

### Check use and revoke

Below the setup, the page shows the token's status (active, expired or
revoked), expiry, scopes, projects and **Last used**. Copying or downloading
the settings does not count as use; the time appears after the first request
with the token. **Revoke token** asks for confirmation and takes effect
immediately: clients using the token lose access, and this cannot be undone.

## Install the package in your client

The commands below follow the package READMEs shipped in the release. The AI
agents page shows the same steps with your address filled in. Replace
`/absolute/path/to/...` with the folder where you extracted the download.

### Claude Code

Download and extract `flow-steward-agent-skills-<version>.zip` from the
[latest release](https://github.com/Flow-Steward/flow-steward-app/releases/latest). Its
`flow-steward-agent-skills` folder is a local marketplace named
`flow-steward` that lists both packages:

```bash
claude plugin marketplace add /absolute/path/to/flow-steward-agent-skills
claude plugin install flow-steward-operator@flow-steward
claude plugin details flow-steward-operator@flow-steward
```

Use `flow-steward-developer@flow-steward` for the Developer package. `details`
lists the skills; in a session they appear as, for example,
`/flow-steward-operator:flow-steward-workflow-authoring`.

The Operator plugin declares the Flow Steward MCP server and asks for two
values: your MCP address and your personal token. Set them in a session:

```text
/plugin configure flow-steward-operator@flow-steward
```

The token is masked and kept in the system credential store, not in settings
files. Until both values are set, only the skills load. If you added the same
server earlier with `claude mcp add`, remove that entry so the agent does not
see every tool twice.

To try a package for one session without installing it, start
`claude --plugin-dir /absolute/path/to/flow-steward-operator`; the option also
accepts the release zip.

### Codex

Extract `flow-steward-operator-1.0.0.zip` into `plugins/flow-steward-operator`
inside a local marketplace folder of your choice. In that folder, create or
extend `.agents/plugins/marketplace.json`, keeping other entries. For the
Developer package, use `flow-steward-developer` in the folder name and the
entry:

```json
{
  "name": "flow-steward-local",
  "plugins": [{
    "name": "flow-steward-operator",
    "source": {"source": "local", "path": "./plugins/flow-steward-operator"},
    "policy": {"installation": "AVAILABLE", "authentication": "ON_INSTALL"},
    "category": "Productivity"
  }]
}
```

Register the marketplace from that folder:

```bash
codex plugin marketplace add .
```

The CLI has no install command. In an interactive session open `/plugins`,
choose the `flow-steward-local` marketplace and install the package, or install
it from the Plugins tab of the ChatGPT desktop app. Start a new session and
check the skills listing.

For the Operator package, add the MCP server to `~/.codex/config.toml` and keep
the rest of the file. The file names the variable that holds the token, not the
token:

```toml
[mcp_servers.flow-steward]
url = "https://flow-steward.example.com/mcp"
bearer_token_env_var = "FLOW_STEWARD_TOKEN"
```

Then set the variable where Codex starts, for example in your shell profile:

```bash
export FLOW_STEWARD_TOKEN="<your personal token>"
```

Anyone who can read that variable can use the token.

### Cursor

Copy the extracted package to `~/.cursor/plugins/local/flow-steward-operator`
(or `flow-steward-developer`), reload the window and find the skills under
Customize. Your organization must allow local plugin imports.

The Cursor plugin carries no MCP server. For the Operator package, merge this
entry into `mcpServers` in `~/.cursor/mcp.json` and set `FLOW_STEWARD_TOKEN`
as for Codex:

```json
{
  "mcpServers": {
    "flow-steward": {
      "url": "https://flow-steward.example.com/mcp",
      "headers": {"Authorization": "Bearer ${env:FLOW_STEWARD_TOKEN}"}
    }
  }
}
```

### Gemini CLI

Extract `flow-steward-operator-1.0.0.tar.gz` (or the Developer archive) into an
empty folder named `flow-steward-operator`; `gemini-extension.json` is at its
root. Then install it:

```bash
gemini extensions install /absolute/path/to/flow-steward-operator
```

The extension carries no MCP server. For the Operator package, add it yourself:

```bash
gemini mcp add --transport http \
  --header "Authorization: Bearer <your personal token>" \
  flow-steward https://flow-steward.example.com/mcp
```

Gemini CLI keeps the token in its own settings file, so run this only on your
own computer. Google replaced Gemini CLI with Antigravity CLI for unpaid and
Google One accounts.

### Update and remove

Each release raises the package `version`. To update, replace the extracted
files with the new release and use the client's update step, for example
`claude plugin marketplace update flow-steward` and
`claude plugin update flow-steward-operator@flow-steward`,
`codex plugin marketplace upgrade flow-steward-local`, or
`gemini extensions update flow-steward-operator`. Codex runs a cached copy, so
compare the installed files with the new ones and start a new session. Cursor
needs a window reload. Updating a package never changes your MCP connection or
token. The package READMEs list the removal commands.

## Cloud AI apps: Claude.ai, Cowork, ChatGPT

Cloud apps open the MCP connection from their own servers and cannot use a
personal token. They connect through **OAuth**: the app sends you to Flow
Steward, you sign in, choose the access and approve it. You copy no token.

This works only when:

- the installation has a public HTTPS address in `FS_PUBLIC_BASE_URL`
  (localhost, private and local network addresses cannot be used);
- an administrator has turned on **Settings → Security → Cloud AI apps
  (OAuth)**. The switch, **Allow cloud AI apps to connect**, is off by default;
- the installation can reach `chatgpt.com` and `claude.ai` over HTTPS to read
  the app's identity;
- the database has the OAuth tables. A fresh 0.9.7 installation has them. An
  installation upgraded from an earlier release gets them with 0.9.8 or later;
  after an upgrade to 0.9.7 alone, the page reports **The database is missing
  the OAuth tables**.

Only ChatGPT and Claude can connect this way. When something is missing, the
AI agents page and the Security setting name the blocker, for example
**A public HTTPS address is required**, **Cloud AI apps are turned off** or
**The database is missing the OAuth tables**. Personal tokens are never
affected by this setting.

### Claude.ai and Cowork

1. Download `flow-steward-operator-1.0.0.zip` and upload it in Claude under
   **Customize > Plugins > Upload plugin**. In Claude the plugin provides the
   skills; its own MCP server entry is not used there.
2. Add Flow Steward as a custom connector with your MCP address,
   `https://<your address>/mcp`.
3. Claude opens Flow Steward. Sign in, review the consent page and select
   **Allow access**.

The Developer package is not offered for Claude.ai and Cowork.

### ChatGPT

The Operator package is not in the OpenAI plugin directory yet. Until it is
listed, ChatGPT works with the MCP tools alone, without the package's
instructions.

1. Add Flow Steward as a custom MCP connector with your MCP address.
2. ChatGPT opens Flow Steward. Sign in, review the consent page and select
   **Allow access**.

### The consent page

The page **Allow \<app\> to access Flow Steward?** shows who is asking (the
app's name, the site that publishes its identity and where you return) and
lets you choose:

- **Access level**: **Monitor and run workflows** or **Full authoring**, the
  same presets as for tokens. An app gets only what it asked for: if it
  requested fewer scopes, only those are listed. Full authoring is offered only
  when the app asked for `admin:all`. A level above your own role is shown
  disabled; if nothing can be granted, only **Deny** is available.
- **Projects**: empty means every project you can access.
- **Access ends after**: 7, 30 or 90 days, 30 by default. Refreshing the
  connection never extends this date.

A connection request is valid for 10 minutes and can be answered once, in the
browser where it started.

### Connected AI apps

Approved apps are listed under **Settings → Account → Personal tokens →
Connected AI apps**, below your personal tokens. Each row shows the app, its
access and scopes, projects, created and expiry dates, when the access was
last used, and its status. **Revoke access** removes access immediately,
including the app's refresh token; the app has to be connected again to work.
Revoked and expired entries stay listed until they are cleaned up. Each user
sees only their own connected apps.

Turning the Security switch off immediately rejects every OAuth token of the
account. The connected apps stay listed and can still be revoked.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| **This installation has no public address** | An administrator sets `FS_PUBLIC_BASE_URL` to the address people open Flow Steward with. |
| **The MCP address is an internal one** | `FS_MCP_RESOURCE_URL` names an internal service. Remove the override or set it to a public address. |
| **This access is more than your own role allows** | Choose **Monitor and run workflows**, or ask an administrator. |
| **One of the selected projects is not available to you** | Remove that project from the selection. |
| **Cloud AI apps are turned off** | An administrator turns them on in **Settings → Security**. |
| **The database is missing the OAuth tables** | The database was created before 0.9.7. Upgrade to 0.9.8 or later with the regular [release upgrade](../user/installation-and-updates#upgrade-to-an-official-release); 0.9.7 does not add the tables to an existing database. |
| **The MCP server is not linked to the application** | The internal secret between the MCP server and the application is missing. Update or restart the installation so it is generated. |
| **The app could not be identified** | The installation cannot reach `chatgpt.com` or `claude.ai`. Allow outbound HTTPS to them. |
| The agent sees fewer tools than expected | Tools are filtered by the token's scopes. Agents and skills need **Full authoring**. See [MCP Reference](../reference/mcp). |

## Related pages

- [Agent Skill Packages](agent-plugin)
- [Connect An AI Client With MCP](built-in-mcp-quick-start)
- [MCP Reference](../reference/mcp)
- [Users, Roles, And Access](../user/users-roles-and-access)
