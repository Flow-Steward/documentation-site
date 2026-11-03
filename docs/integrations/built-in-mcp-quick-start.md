---
sidebar_position: 3
title: Connect An AI Client With MCP
description: Make an exact first read-only call to the built-in MCP server.
---

# Connect An AI Client With MCP

:::tip[Use the AI agents page]
**Settings → Account → AI agents** provides client-specific setup steps for
Claude Code, Codex, Cursor, Gemini CLI, Claude.ai, Cowork and ChatGPT, with your
MCP address filled in and personal-token creation for clients that use it. See
[Connect AI Agents](connect-ai-agents). This page is the manual, protocol-level
check.
:::

The production gateway routes `<public-base-url>/mcp` to the built-in stateless
streamable HTTP server. This page describes behavior available on main; it does
not establish which published release includes it. The exact protocol example
below uses `2026-07-28`. Live client execution and current third-party client
compatibility were not verified for this documentation pass.

## Before you start

This check uses a personal access token, as the local-client setup steps do.
The cloud-app setup paths (Claude.ai, Cowork, ChatGPT) use OAuth sign-in instead,
as described in
[Cloud AI apps](connect-ai-agents#cloud-ai-apps-claudeai-cowork-chatgpt).

Set `FLOW_STEWARD_URL` to your public base URL and `FLOW_STEWARD_TOKEN` to your
personal access token. The first tool requires project-read authority, for
example `projects.read`, `projects:*`, `read:*`, or `admin:all`; scope matching
also accepts `*:read` and `*:*`. Use `projects.read` for this check. The token's
account/project restrictions and the caller's application permissions still
apply after discovery.

Client UIs may express the same server as:

```json
{
  "mcpServers": {
    "flow-steward": {
      "transport": "streamable_http",
      "url": "https://flow-steward.example.com/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

Adapt field names only when your client documents a different configuration
schema. There is no public `setup-codex-mcp` CLI command.

## Connect and discover protocol support

Add the server to your client and connect. For the modern protocol check, send
`server/discover` first. The result advertises `2026-07-28` under
`supportedVersions` and includes server capabilities. Modern requests are
stateless and do not require an MCP session ID. Compatible legacy clients may
instead use `initialize`; the source includes a `2025-11-25` initialization
contract with a session ID and `notifications/initialized`.

If you write your own modern client, send each request as an HTTP `POST` to
`/mcp` with these headers:

```http
POST /mcp
Authorization: Bearer <FLOW_STEWARD_TOKEN>
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: server/discover

{"jsonrpc": "2.0", "id": 1, "method": "server/discover",
 "params": {"_meta": {
   "io.modelcontextprotocol/protocolVersion": "2026-07-28",
   "io.modelcontextprotocol/clientInfo": {"name": "docs-smoke", "version": "1.0.0"},
   "io.modelcontextprotocol/clientCapabilities": {}}}}
```

For `tools/list` and `tools/call`, change `Mcp-Method` and `method` to match.
Keep the protocol `_meta` in `params` on each request. A `tools/call` request
also sends the tool name in an `Mcp-Name` header.

## List allowed tools

Open the client's tool list for the `flow-steward` server (the client calls
`tools/list`). The list is request-local and scope filtered. It is normal for a
`projects.read` token to see only a subset of the registered tools. Discovery
filters by token scopes; the application API still authorizes each call.

## Call `project_list`

Ask the client to call `project_list`. It takes an empty argument object:

```json
{"name": "project_list", "arguments": {}}
```

For a manual modern request, put these fields in `params` alongside `_meta`,
set `method` and `Mcp-Method` to `tools/call`, and set `Mcp-Name` to
`project_list`.

A successful JSON-RPC result contains MCP `content` with a JSON text envelope
whose `ok` is `true` and whose `data` contains the project list. Only projects
the token may read are returned. This tool requests the first page of at most
200 projects; it does not provide a pagination argument. Use only a returned
project name for subsequent project-scoped calls.

## Continue to workflow discovery

The read-only connection check is complete after `project_list`. To inspect a
workflow, use a token with `workflows.read` as well as the project access needed
to resolve its name, then call `workflow_list` with the returned `project_name`.
Inspect `workflow_contract` before a deliberate launch through
`workflow_trigger`; launching requires `workflows.write` or broader workflow-write
authority, plus the caller's application permissions and project access.

Project-profile and Knowledge Base tools are no longer exposed. Do not call
`project_profile_get`, `project_profile_update`, `kb_search`, or `kb_write`.

## Optional skill package

The **Flow Steward Operator** package teaches a connected client how to work
with Flow Steward: workflows, agents and skills, runs, approvals and reports.
Basic MCP discovery and calls work without it. The package contains no
credentials and starts no additional server. Its Claude plugin manifest can
ask for your server address and token; other clients use the connection you
configure separately. See the download options and per-client steps in
[Connect AI Agents](connect-ai-agents#download). Package installation support
and availability in third-party directories must be checked for your client.

## Cleanup and troubleshooting

Remove the server from the client and revoke the temporary token after the
check. Keep configs containing tokens out of source control.

- Empty tool list: confirm `projects.read`. If `project_list` returns no projects,
  check account/project restrictions and application permissions before widening
  credentials.
- `403` or a tool result with `isError: true`: the tool or project may need a
  scope, permission or project access the token does not hold. API-backed tool
  failures carry an `ok: false` envelope in the error content; inspect its
  `error.code` and message. See [MCP errors](../reference/mcp#errors).
- JSON-RPC invalid params: use `{}` for `project_list` arguments; consult
  `tools/list` for the exact schema of every subsequent tool. Manual modern
  requests must also retain their protocol `_meta`.
- Protocol error: rediscover versions; do not silently reuse a version from a
  different deployment.

See [MCP Reference](../reference/mcp) for representative tool-to-scope mappings.
