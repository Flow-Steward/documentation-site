---
title: Connect AI Agents
description: Connect Claude Code, Codex, Cursor, Gemini CLI, Claude.ai, Cowork or ChatGPT to Flow Steward with the Operator or Developer skill package.
---

# Connect AI Agents

Flow Steward provides a guided way to connect an AI agent to your own
installation. The **AI agents** page under **Settings → Account** walks you
through it: you pick the client and the skill package, Flow Steward fills in
your installation's MCP address, creates an access token when the client needs
one, and gives you the first request to try.

This page explains the same steps, what each choice means, and where to
find the packages. It describes current source on main; release downloads may
contain earlier package versions.

## What you need

- A Flow Steward user account. What the agent may do is never more than what
  your own role allows.
- An installation with an address the client can reach. The MCP address an
  agent connects to is `<your address>/mcp`, taken from `FS_PUBLIC_BASE_URL`
  unless overridden by `FS_MCP_RESOURCE_URL`. When the base setting is
  missing, or the MCP address uses a bare internal service name, the page
  says so and does not create a token: an administrator has to fix the address
  first.
- For cloud apps (Claude.ai, Cowork, ChatGPT) the address must be public
  **HTTPS**, and an administrator must allow cloud AI apps (see
  [Cloud AI apps](#cloud-ai-apps-claudeai-cowork-chatgpt)).

## Two packages

The skill packages teach an agent how to work with Flow Steward. They contain
no installation address, token or server implementation. The Operator package
also includes an offline workflow converter. You can install either package
or both; neither needs the other.

| Package | For | Connects to your installation | Skills |
| --- | --- | --- | --- |
| **Flow Steward Operator** (`flow-steward-operator`) | People who build and run automations by talking to an agent | Yes, through MCP, so it needs access; offline conversion additionally needs a terminal, Python and file access | Workflow authoring (find, compose, validate and save workflows, create agents and skills, read runs, errors, approvals and reports), migrate external workflows, report an issue, publish a workflow template |
| **Flow Steward Developer** (`flow-steward-developer`) | Developers who build extensions or change the core code | No. It works in a terminal with Git, Docker and a Flow Steward checkout | Extension authoring, publish an extension, contribute code, report an issue |

On main, Operator is version **1.0.1** and Developer is **1.0.0**. Operator's
fourth skill, `flow-steward-migrate-workflow`, converts supported external
workflows into disabled drafts and reports setup blockers. Its offline
converter requires a terminal, Python and file access; it is unavailable in
chat and unverified in Cowork. Source availability does not establish that
these versions have been published as release downloads. See
[Agent Skill Packages](agent-plugin) for what each skill does and example
requests.

## Supported clients

"Verified" means install, skill discovery, update and removal were run in that
client for the stated package version. Other rows are prepared from the client's
documentation but have not been run in the client yet. Report problems with
[Report a Bug](../user/file-an-issue).

| Client | Where it runs | Operator: how it signs in | Operator verified | Developer |
| --- | --- | --- | --- | --- |
| Claude Code | Your computer (terminal, IDE, Code tab of the desktop app) | Personal access token | 1.0.0 verified; current 1.0.1 not verified | Yes, 1.0.0 verified |
| Codex | Your computer (CLI and the ChatGPT desktop app's coding agent) | Personal access token | Not verified | Offered, not verified |
| Cursor | Your computer (desktop app) | Personal access token | Not verified | Offered, not verified |
| Gemini CLI | Your computer (terminal) | Personal access token | Not verified | Offered, not verified |
| Claude.ai and Cowork | Anthropic's servers | OAuth sign-in and consent | Not verified | Not offered: chat has no terminal; Cowork support unverified |
| ChatGPT | OpenAI's servers | OAuth sign-in and consent | Not verified | Listing not published according to the repository's recorded status |

The historical Claude Code check covered Operator 1.0.0 with three skills and
Developer 1.0.0 from the release archives with the command-line client; the
interactive configuration dialog and skill use inside a signed-in session
were not part of it. It does not verify Operator 1.0.1 or its four-skill
inventory. No cloud client has been verified against a live installation yet.
The full matrix, with limits per client, is in the application repository's
[compatibility matrix](https://github.com/Flow-Steward/flow-steward-app/blob/main/docs/agent-skills/COMPATIBILITY.md),
whose client documentation was checked on 2026-10-31. External client features,
account eligibility and catalog availability may have changed since that check.

## Download

Check the assets on the
[latest release](https://github.com/Flow-Steward/flow-steward-app/releases/latest)
for the versions actually available. The source archive builder prepares the
files below, but does not upload them; their presence in source does not prove
that they are attached to a published release.

| File | Contents |
| --- | --- |
| `flow-steward-operator-<package-version>.zip` | Operator package for Codex, Cursor, Claude.ai upload and Claude Code session loading |
| `flow-steward-operator-<package-version>.tar.gz` | Operator package as a Gemini CLI extension |
| `flow-steward-developer-<package-version>.zip` | Developer package for Codex, Cursor and Claude Code session loading |
| `flow-steward-developer-<package-version>.tar.gz` | Developer package as a Gemini CLI extension |
| `flow-steward-agent-skills-<version>.zip` (its name carries the Flow Steward version) | Both packages as a ready Claude Code marketplace named `flow-steward` |
| `SHA256SUMS` | SHA-256 checksums of the five archives above (not of `release-manifest.json`) |
| `release-manifest.json` | The Core repository, commit, tag and version the archives were built from |

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

The commands below follow the package READMEs in source. The AI
agents page shows the same steps with your address filled in. Replace
`/absolute/path/to/...` with the folder where you extracted the download,
and `<package-version>` with the version of that package in your release.
The current source versions are Operator 1.0.1 and Developer 1.0.0.

### Claude Code

Download and extract `flow-steward-agent-skills-<version>.zip` from the
[latest release](https://github.com/Flow-Steward/flow-steward-app/releases/latest),
if that asset is available. Its `flow-steward-agent-skills` folder is a local
marketplace named `flow-steward` that lists both packages:

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

Extract `flow-steward-operator-<package-version>.zip` into `plugins/flow-steward-operator`
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

The documented CLI setup has no install command. In an interactive session
open `/plugins`, choose the `flow-steward-local` marketplace and install the
package, or install it from the Plugins tab of the ChatGPT desktop app. Start
a new session and check the skills listing. This setup is unverified; check
your installed client's help if its commands differ.

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

Extract `flow-steward-operator-<package-version>.tar.gz` (or the Developer archive)
into an empty folder named `flow-steward-operator`; `gemini-extension.json` is
at its root. Then install it:

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
own computer. The compatibility matrix records that Google replaced Gemini
CLI with Antigravity CLI for unpaid and Google One accounts on 2026-06-18;
check current provider availability for your account.

### Update and remove

To update to a newer package version, replace the extracted files with the
new release and use the client's update step, for example
`claude plugin marketplace update flow-steward` and
`claude plugin update flow-steward-operator@flow-steward`,
`codex plugin marketplace upgrade flow-steward-local`, or
`gemini extensions update flow-steward-operator`. Codex runs a cached copy, so
compare the installed files with the new ones and start a new session. Cursor
needs a window reload. Updating a package never changes your MCP connection or
token. The package READMEs list the removal commands.

## Cloud AI apps: Claude.ai, Cowork, ChatGPT

The documented cloud setup uses **OAuth**: the app sends you to Flow
Steward, you sign in, choose the access and approve it. You copy no token.
These client integrations have not been verified against a live installation;
current provider support and account eligibility must be checked with the client.

This works only when:

- the installation has a public HTTPS address in `FS_PUBLIC_BASE_URL`
  (localhost, private and local network addresses cannot be used);
- any `FS_MCP_ISSUER_URL` and `FS_MCP_RESOURCE_URL` overrides match that
  installation's origin and `/mcp` address;
- an administrator has turned on **Settings → Security → Cloud AI apps
  (OAuth)**. The switch, **Allow cloud AI apps to connect**, is off by default;
- the installation can reach `chatgpt.com` and `claude.ai` over HTTPS to read
  the app's identity;
- the database has the OAuth tables. The source records that 0.9.7 added them
  to fresh installations only. Current main includes the migration
  `20261101153533_inbound_oauth_tables.sql` for older databases. Use a release
  containing that migration and its regular upgrade process; source presence
  alone does not establish which published release contains it.

Only ChatGPT and Claude can connect this way. When something is missing, the
AI agents page and the Security setting name the blocker, for example
**A public HTTPS address is required**, **Cloud AI apps are turned off** or
**The database is missing the OAuth tables**. Personal tokens are never
affected by this setting.

### Claude.ai and Cowork

1. Download `flow-steward-operator-<package-version>.zip` and upload it in Claude under
   **Customize > Plugins > Upload plugin**. In Claude the plugin provides the
   skills; its own MCP server entry is not used there.
2. Add Flow Steward as a custom connector with your MCP address,
   `https://<your address>/mcp`.
3. Claude opens Flow Steward. Sign in, review the consent page and select
   **Allow access**.

The Developer package is not offered for Claude.ai and Cowork. The Operator
migration skill's offline converter is unavailable in chat and unverified in
Cowork because it needs a terminal, Python and file access.

### ChatGPT

The repository records that the Operator package is not in the OpenAI plugin
directory yet; current directory publication has not been independently
verified. Without the package, the documented connection uses MCP tools alone,
without the package's instructions. The offline converter is not claimed for
chat.

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
| **The MCP address is an internal one** | `FS_MCP_RESOURCE_URL` names an internal service. Remove the override or set it to an address the client can reach. |
| **The MCP address does not match this installation** | Remove `FS_MCP_ISSUER_URL` or `FS_MCP_RESOURCE_URL` overrides, or make them match `FS_PUBLIC_BASE_URL` and its `/mcp` endpoint, then restart. |
| **This access is more than your own role allows** | Choose **Monitor and run workflows**, or ask an administrator. |
| **One of the selected projects is not available to you** | Remove that project from the selection. |
| **Cloud AI apps are turned off** | An administrator turns them on in **Settings → Security**. |
| **The database is missing the OAuth tables** | An older database needs the OAuth migration. Use a release containing `20261101153533_inbound_oauth_tables.sql` with the regular [release upgrade](../user/installation-and-updates#upgrade-to-an-official-release); 0.9.7 alone does not add the tables to an existing database. |
| **The MCP server is not linked to the application** | The internal secret between the MCP server and the application is missing or too short. Update or restart the installation so it is generated. |
| **The app could not be identified** | Check that the installation can reach `chatgpt.com` and `claude.ai` over HTTPS, then start the connection again. |
| The agent sees fewer tools than expected | Tools are filtered by the token's scopes. Agents and skills need **Full authoring**. See [MCP Reference](../reference/mcp). |

## Related pages

- [Agent Skill Packages](agent-plugin)
- [Connect An AI Client With MCP](built-in-mcp-quick-start)
- [MCP Reference](../reference/mcp)
- [Users, Roles, And Access](../user/users-roles-and-access)
