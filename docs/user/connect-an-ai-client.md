---
title: Connect an AI client
description: Connect your cloud assistant or local coding agent to Flow Steward over MCP.
---

# Connect an AI client

Use your preferred AI client to check runs, read reports, start workflows, or build
automation in your own Flow Steward instance. The client connects to Flow Steward
over the Model Context Protocol (MCP).

## Before you start

Sign in to Flow Steward and open **Settings → Account → AI agents**. Choose your
client and **Flow Steward Operator**, then follow the setup for your installation.
The page supplies your **MCP URL**, ending in `/mcp`. For example:

```text
https://flow-steward.example.com/mcp
```

Replace this example with the address shown by your installation. It is a server
endpoint, not a website to sign in to directly.

Choose what the client may do:

| Access | What it allows |
| --- | --- |
| **Monitor and run workflows** | Find projects, read statuses, errors, reports and approvals, and start or cancel runs. |
| **Full authoring** | Full access through `admin:all`, including creating and changing workflows, agents and skills. This is broad access and requires the corresponding authority in Flow Steward. |

For clients on your computer, create a personal token in the setup page, choose an
expiry and project restrictions, and copy it when shown. A token cannot grant more
access than your own role. For cloud clients, sign in to Flow Steward and choose
the access on its consent page; you do not copy a personal token.

:::note[Public HTTPS address]
Cloud clients need an MCP endpoint reachable from their servers over HTTPS with a
trusted certificate. `localhost`, an internal Docker hostname, or an address only
reachable through your computer's VPN will not work for this setup. Cowork's
remote connectors also connect from the cloud. If no usable address is shown,
ask your administrator to configure the installation's public address and enable
cloud AI app connections.
:::

## In the cloud

### Claude.ai and Cowork

1. In Claude, open **Customize → Connectors** and add a custom web connector.
   An organization owner may need to add it first for Team or Enterprise users.
2. Name it **Flow Steward** and paste your installation's MCP URL.
3. Follow the sign-in flow to Flow Steward, choose the access level and approve.
4. Enable the connector in the conversation or Cowork task where you want to use it.

For the Operator instructions as well as its tools, follow the package upload
steps shown on Flow Steward's **AI agents** page. The MCP connection works
separately from the package.

See [Claude's remote connector guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
for current account and organization requirements.

### ChatGPT

1. Open **Plugins** in ChatGPT, select the plus button and choose **Add custom MCP server**.
2. Name the connection **Flow Steward**, paste your MCP URL, and configure OAuth
   authentication.
3. Sign in to Flow Steward, choose the access level and approve the connection.
4. Complete creation and install the plugin. In a new chat, select it with `@`.

Your organization may need to allow custom MCP connections. Until the Flow Steward
Operator package is published in the directory, use the MCP tools through this
custom connection; the custom connection does not include the package's instructions.

See the official [ChatGPT MCP connection instructions](https://developers.openai.com/plugins/build/app-quickstart#connect-your-mcp-server-in-chatgpt).

### Microsoft 365 Copilot

An administrator prepares the connection for your Microsoft 365 organization:

1. In Flow Steward's **AI agents** page, choose **Microsoft 365 Copilot** and the
   Operator package. A Flow Steward administrator registers the Microsoft 365
   platform client using the page's setup step.
2. A Microsoft 365 administrator registers the OAuth connection in the Teams
   Developer Portal with the values Flow Steward supplies.
3. Paste the returned OAuth registration reference ID into Flow Steward's setup
   page and download the generated agent package.
4. Have the Microsoft 365 administrator upload the package and make the agent
   available to the intended users.
5. Open the agent in Copilot and sign in to Flow Steward when prompted. Each user
   approves their own access; installing the package does not grant access to
   Flow Steward.

Use the setup page's current values and tenant requirements. Microsoft 365
compatibility, report rendering and mobile availability must be checked in your
tenant. See Microsoft's [MCP authentication guide](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-authentication).

## On your computer

The following examples configure the MCP tools directly. The optional
[Agent Plugin](../integrations/agent-plugin) adds instructions and skills; follow
your installation's **AI agents** page for its current packages.

For the shell examples, set these variables in the terminal you use to launch
your client. Replace both example values:

```bash
export FLOW_STEWARD_MCP_URL='https://flow-steward.example.com/mcp'
export FLOW_STEWARD_TOKEN='replace-with-your-personal-token'
```

Keep tokens out of shared files and source control. The Claude Code and Gemini CLI
commands below save the supplied header in their personal client configuration.

### Claude Code

Run in your terminal:

```bash
claude mcp add --scope user --transport http flow-steward "$FLOW_STEWARD_MCP_URL" \
  --header "Authorization: Bearer $FLOW_STEWARD_TOKEN"
```

Open Claude Code and use `/mcp` to check the server. See the official
[Claude Code MCP guide](https://code.claude.com/docs/en/mcp#option-1-add-a-remote-http-server).

### Codex

Run in your terminal:

```bash
codex mcp add flow-steward --url "$FLOW_STEWARD_MCP_URL" \
  --bearer-token-env-var FLOW_STEWARD_TOKEN
```

Launch Codex from a terminal with `FLOW_STEWARD_TOKEN` set, or make that variable
available to the app process. Restart an existing session after changing its
configuration. Run `codex mcp list` to inspect the configured entry. See the
[Codex MCP command reference](https://learn.chatgpt.com/docs/developer-commands#codex-mcp).

### Cursor

Merge this server entry into your personal `~/.cursor/mcp.json`. Cursor reads the
URL and token from environment variables available to its process:

```json
{
  "mcpServers": {
    "flow-steward": {
      "url": "${env:FLOW_STEWARD_MCP_URL}",
      "headers": {
        "Authorization": "Bearer ${env:FLOW_STEWARD_TOKEN}"
      }
    }
  }
}
```

Restart Cursor with both variables available, then check the MCP server in its
settings. See [Cursor's MCP configuration guide](https://cursor.com/docs/mcp).

### Gemini CLI

Run in your terminal:

```bash
gemini mcp add --scope user --transport http \
  --header "Authorization: Bearer $FLOW_STEWARD_TOKEN" \
  flow-steward "$FLOW_STEWARD_MCP_URL"
```

Open Gemini CLI and run `/mcp` to check the server. See the official
[Gemini CLI MCP guide](https://geminicli.com/docs/tools/mcp-server/).

## Check the connection

In your client, confirm that **flow-steward** is connected and its permitted tools
are listed. Then ask:

```text
Use Flow Steward to list the projects I can access. Do not change anything.
```

The client should call `project_list` and return only projects your account and
credential may read. An empty list can be valid if no projects are available.

If the connection fails, check the MCP URL, network reachability and certificate,
then confirm the token or OAuth grant is active. If a tool is missing or a call
returns `403`, check the role, access preset and project restrictions before
requesting broader access. Reconnect after changing credentials.

Continue with [the MCP quick start](../integrations/built-in-mcp-quick-start) for
protocol details or the [MCP reference](../reference/mcp) for tool contracts.
