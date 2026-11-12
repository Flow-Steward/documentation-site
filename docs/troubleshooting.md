---
title: Troubleshooting
sidebar_label: Troubleshooting
description: Find a problem by its symptom and follow the fix — installation, upgrades, sign-in, limits, jobs, and integrations.
---

# Troubleshooting

Find your symptom in the table, jump to the entry, and follow it. Every entry
has the same shape: **what you see**, **why**, **what to do**, and **how to
check** that it worked.

Commands starting with `./flow-steward` or `./install.sh` run on the Docker host,
from the installation folder. Where Compact and Scalable differ, the entry says
so. Behavior and values describe Flow Steward 0.9.14.

:::warning[Before you change anything]
Keep the first error message and the log path it prints. Do not delete Docker
volumes, regenerate secrets, or switch off TLS or authentication to make a
check pass — each of those destroys data or hides the cause.
:::

## Find your problem

| Area | Symptom |
|---|---|
| Installation | [The first-administrator setup link expired](#setup-link-expired) |
| Installation | [The first user has no admin rights](#first-user-is-viewer) |
| Installation | [The installer stopped or exited with `core_readiness_blocked`](#installer-interrupted) |
| Installation | [`ambiguous_installation_state` or `schema_baseline_failed`](#ambiguous-state) |
| Installation | [The installer builds from source instead of pulling images](#builds-from-source) |
| Installation | [The site, HTTPS, or the MCP endpoint is unreachable](#site-unreachable) |
| Installation | [Docker Desktop on macOS: stale files or a crashing proxy](#docker-desktop-macos) |
| Installation | [Railway, Render, Fly.io: the service restarts in a loop or stays down](#platform-restart-loop) |
| Upgrade | [A release upgrade timed out or stopped](#upgrade-stopped) |
| Sign-in | [A user is locked out after failed sign-ins](#sign-in-lockout) |
| Sign-in | [The password was changed but a reset is still demanded](#reset-still-demanded) |
| Sign-in | [There is no "Forgot password?" link, or emails do not arrive](#no-email) |
| Settings | [A setting was changed but the old value is still used](#setting-not-applied) |
| Limits | [A file upload is refused](#upload-refused) |
| Limits | [An external MCP response is too large](#mcp-response-too-large) |
| Limits | [Requests are refused with 429](#rate-limited) |
| Limits | [A service on a private network cannot be connected](#private-network) |
| Limits | [Disk space is running out](#disk-space) |
| Jobs | [A job stays queued and does not start](#job-queued) |
| Jobs | [A workflow looks stuck but shows no error](#workflow-waiting) |
| Jobs | [A job finished but has no Result](#no-result) |
| Jobs | [`timeout_unknown`: it is unclear whether an external action happened](#timeout-unknown) |
| Jobs | [`model_unavailable: no configured provider/model route`](#model-unavailable) |
| Jobs | [An artifact does not download, or its link stopped working](#artifact-download) |
| Integrations | [A data connection fails with correct credentials](#data-connection) |
| Integrations | [An MCP connector is connected but its tools are missing](#mcp-tools-missing) |
| Integrations | [An OAuth connection stopped working](#oauth-stopped) |
| Integrations | [An extension does not install or update](#extension-install) |
| Integrations | [A trigger does not start the workflow](#trigger-not-firing) |

## Start here: status and doctor {/* #start-here */}

When something is wrong and you do not yet know what, run these two read-only
commands first:

```bash
./flow-steward status
./flow-steward doctor
```

`status` is a short readiness summary. `doctor` inspects the installation and
reports each problem with its cause and next step. A plain `doctor` changes
nothing.

**Use `doctor` when:**

- an installation or upgrade stopped and you are not sure what state it left;
- the site does not answer, or answers with errors after a restart;
- jobs are not being picked up;
- you are about to report a problem.

**Read the result by its exit code:**

| Exit code | Meaning |
|---|---|
| 0 | No findings. |
| 4 | Findings were reported, or Flow Steward is not installed in this folder. |
| 5 | Nothing could be checked — for example inside a platform container that has no Docker access. This is not a health pass. |
| 6 | An installer or repair is already running; rerun when it has finished. |

**Let `doctor` repair what it can.** Name the checks you want repaired:

```bash
./flow-steward doctor --fix stack_stopped --confirm
```

| Check | What it means | `--fix` |
|---|---|---|
| `lifecycle_interrupted` | A lifecycle operation did not finish. | Yes, when the operation can be continued; otherwise it prints its own recovery command. |
| `stack_stopped` | Services are not running. | Yes, unless images are missing or an update was interrupted. |
| `maintenance_left_enabled` | Maintenance is on with no operation running. | Yes |
| `shared_dirs_modes` | Shared folders have wrong groups or modes. | Yes |
| `secrets_modes` | Secret or state files are readable by others. | Yes |
| `graph_catalog` | Graph identifiers do not match after a restore. | Yes |
| `release_retention` | Superseded releases take disk space. | Yes, when something is beyond retention. |
| `container_names` | Temporary container names were left behind. | Yes |
| `stale_cli_runtime` | The retained CLI container is stale (Scalable only). | Yes |
| `orphan_installer` | An installer container runs with no `./install.sh` behind it. | Yes |
| `schema_state` | Migrations are unknown, drifted, or pending. | No — see [upgrade stopped](#upgrade-stopped). |
| `backup_freshness` | There is no verified recent backup. | No |
| `certificate_expiry` | The TLS certificate is missing or expiring. | No |
| `public_route` | The public URL does not answer. | No — see [site unreachable](#site-unreachable). |
| `docker_host_gateway` | Docker cannot resolve the host gateway. | No |
| `workers_consuming` | No worker is consuming the queue. | No — see [job queued](#job-queued). |
| `worker_count_recorded` | Running workers differ from the configuration. | No |
| `recorded_images_present` | Images named in the configuration are missing. | No |

During maintenance, run `doctor` without `--fix`: an unqualified repair can
switch maintenance off.

**Attach a report to a bug report:**

```bash
./flow-steward reports diagnostics
```

It writes a JSON file under `.flow-steward/diagnostics/` and prints its path.
The file holds no secrets, logs, or job content. The same report is available
in the UI under **Monitoring → Download diagnostics**.

**Where the logs are:**

| What | Where |
|---|---|
| Installer, upgrade, and `doctor --fix` logs | `.flow-steward/logs/install-*.log` |
| Service logs, Scalable | `./flow-steward stack logs --service fs-app --tail 200` |
| Service logs, Compact | `docker logs <container>` for the container whose name contains `compact-runtime` (find it with `docker ps`). `stack` commands do not exist on Compact. |
| Service logs, managed platform | The platform's own log viewer. |

More detail: [Diagnose, Repair, and Move a Server](deploy/diagnostics-and-migration)
and [Monitoring](user/monitoring).

## Installation and first sign-in

### The first-administrator setup link expired {/* #setup-link-expired */}

**What you see.** The `/bootstrap` page shows "Bootstrap setup token has
expired", or "Invalid bootstrap setup token".

**Why.** The one-time setup link is short-lived: 60 minutes when the installer
or the CLI issued it, 15 minutes when a platform container printed it to its
log.

**What to do.** Pick the first option that fits.

1. **Create the administrator from the console.** This needs no token and works
   on both profiles. The password is read from standard input and must be at
   least 10 characters:

   ```bash
   read -rs FS_PW && printf '%s\n' "$FS_PW" | ./flow-steward users create --email admin@example.com --display-name "Admin" --role admin --password-stdin --confirm; unset FS_PW
   ```

2. **Get a new link from the installer.** Rerun `./install.sh` in the same
   folder. It keeps the installation and prints a new 60-minute link.

3. **Scalable only: issue a new token.**

   ```bash
   ./flow-steward users issue-bootstrap-token --confirm
   ```

   The command prints the path of the token file. Open
   `https://<your-host>/bootstrap#setup-token=<token>`. Compact refuses this
   command and points you to options 1 and 2.

4. **Managed platform (Railway, Render, Fly.io).** Restart the service. While
   no administrator exists, each start prints a new 15-minute link to the
   container log. This applies only where the installer did not run; on a
   Docker host installed with `./install.sh`, a restart does not renew the
   link.

A new token can be issued only while no users exist. If someone already created
a user, see [the first user has no admin rights](#first-user-is-viewer).

**How to check.** Sign in at `/login`. `./flow-steward users list` shows the
account with `roles=admin`.

More detail: [Installation And Updates](user/installation-and-updates).

### The first user has no admin rights {/* #first-user-is-viewer */}

**What you see.** You can sign in, but Settings shows "Access denied" and the
navigation is reduced.

**Why.** `users create` without `--role` creates a `viewer`. Creating any user
also closes the first-administrator setup page.

**What to do.**

```bash
./flow-steward users set-roles --email user@example.com --role admin --confirm
```

`set-roles` replaces the whole role set — repeat `--role` to keep several
roles. It also signs the user out and revokes their personal access tokens.

**How to check.** `./flow-steward users list` shows `roles=admin`. Sign in
again.

More detail: [Users, Roles, And Access](user/users-roles-and-access).

### The installer stopped or exited with `core_readiness_blocked` {/* #installer-interrupted */}

**What you see.** `./install.sh` was interrupted (closed terminal, lost SSH
session, reboot), or it ended with exit code 4 and `core_readiness_blocked`.

**Why.** The installer records its progress. An interrupted run is resumable.
`core_readiness_blocked` means the services started but a readiness check did
not pass within its deadline — on a slow first start this can be only a matter
of time.

**What to do.**

1. Rerun `./install.sh` from the same folder with the same options. It resumes
   where it stopped.
2. If it stops again, run `./flow-steward doctor`, fix only what it reports,
   and rerun `./install.sh`.
3. If it says "A previous interrupted installation still requires manual
   recovery" (exit code 10), run `./flow-steward doctor` and resolve the
   resources it lists before running the installer again.
4. If it says another installer is running (exit code 6), wait for that run to
   finish. `./flow-steward` refuses changes while `./install.sh` is running.

| Exit code | Meaning |
|---|---|
| 3 | An option or path is invalid. |
| 4 | A precondition failed: run as root, readiness blocked, less than 4 GiB free disk. |
| 6 | Another installer run is active. |
| 7 | Docker, its socket, or a required image is unavailable. |
| 8 | An installation step failed. |
| 9 | The installation state is ambiguous — see the next entry. |
| 10 | The run was interrupted, or manual recovery is required. |

**How to check.** The installer ends with the sign-in address, and
`./flow-steward status` reports ready.

More detail: [Installer Reference](reference/installer).

### `ambiguous_installation_state` or `schema_baseline_failed` {/* #ambiguous-state */}

**What you see.** The installer refuses with exit code 9 and
`ambiguous_installation_state`, listing "Detected resources"; or an update
stops with `schema_baseline_failed`.

**Why.** `ambiguous_installation_state`: Docker resources that look like a Flow
Steward installation exist, but they do not match this folder — volumes left by
an earlier installation, a folder copied without its volumes, or two
installations sharing the default Compose project name `flow-steward`. The
installer preserves everything and refuses to guess.

`schema_baseline_failed`: the database does not match what this release
expects.

**What to do.**

- **For a new, separate installation:** use a clean checkout in a new folder
  and give it its own project name:

  ```bash
  FS_COMPOSE_PROJECT_NAME=flow-steward-two ./install.sh
  ```

  The name is lowercase letters, digits, `-` and `_`.

- **For the existing installation:** run `./flow-steward doctor` and resolve
  the identity or secret mismatch it reports. Do not delete volumes.

- **For `schema_baseline_failed`:** if the output says migration history does
  not match this release, follow the migration sequence in
  [upgrade stopped](#upgrade-stopped). Otherwise run
  `./flow-steward database status` and read the output above the error.

**How to check.** `./install.sh` runs past the classification step, and
`./flow-steward doctor` no longer reports the mismatch.

### The installer builds from source instead of pulling images {/* #builds-from-source */}

**What you see.** Installation takes much longer than expected and the output
shows image builds.

**Why.** The installer announces its mode at the start. It prints either
"installing official release vX from ... (no local product image
build)" or "building product images from this checkout". It builds only when
asked to with `--from-source`, or when a source installation is being resumed.
A production installation without `--from-source` needs a clean checkout of a
published release tag; otherwise it stops with
`production_release_checkout_required` instead of building silently.

Installers before the 0.9 release line could build from source by default.

**What to do.**

1. Check the mode of the current installation:

   ```bash
   ./flow-steward release info
   ```

2. To install published images, check out a release tag in a clean folder and
   run `./install.sh` without `--from-source`.

**How to check.** `release info` reports an official release and its version.

### The site, HTTPS, or the MCP endpoint is unreachable {/* #site-unreachable */}

**What you see.** The installer finished, but the browser cannot open the
site, shows a certificate error, or an MCP client cannot connect.

**Why.** Reaching the application depends on DNS, open ports, the certificate,
and any reverse proxy in front — separately from whether the application is
healthy.

**What to do.** Check from the inside out.

1. **Is the application healthy?** `./flow-steward status`, then
   `./flow-steward doctor` — look at `public_route` and `certificate_expiry`.
2. **Does the address match?** Compare the public host, port, and TLS mode you
   chose at installation with the URL you open. `/health/ready` on that address
   answers 200 when the application is ready.
3. **Certificate warning.** The `local` and `self_signed` TLS modes use a
   certificate your browser does not trust. Flow Steward sends an HSTS header,
   so some browsers offer no "proceed anyway" button. Trust the certificate in
   your operating system, or reinstall with a public certificate (`acme`) or
   your own (`provided`).
4. **Your own Apache, Nginx, or Traefik in front.** Run
   `./flow-steward proxy-fragment --json` to see the route destinations Flow
   Steward expects. The proxy must pass WebSocket and server-sent-event
   traffic. A stock Nginx rejects request bodies over 1 MiB until you raise
   `client_max_body_size`.
5. **MCP endpoint.** The path is `/mcp`. Without a token it answers 401 — that
   is correct and means the route works. Send
   `Authorization: Bearer <token>`. A token sees only the tools its scopes
   allow, so a short tool list is not proof that tools are missing.

**How to check.** The sign-in page opens over HTTPS without a warning, and the
MCP client lists tools.

More detail: [Answer the Installer Questions](deploy/installer-walkthrough) and
[MCP Reference](reference/mcp).

### Docker Desktop on macOS: stale files or a crashing proxy {/* #docker-desktop-macos */}

**What you see.** One of:

- `./install.sh` stops with exit code 7 and "[docker-desktop] Containers see a
  stale copy of ...";
- containers fail with `ModuleNotFoundError`, a syntax error in the middle of
  a line, or an image-metadata mismatch, although the files on disk are fine;
- the built-in proxy dies with `fatal error: lfstack.push`.

**Why.** Docker Desktop can serve containers an outdated copy of files from the
Mac. Separately, an amd64 image on an Apple Silicon Mac runs under emulation,
which the proxy does not survive.

**What to do.**

- **Stale files:** restart Docker Desktop (whale menu → Restart) and rerun. If
  it comes back, open Settings → General → Virtual Machine Manager and switch
  from Docker VMM to Apple Virtualization framework.
- **Wrong architecture:** pull the image for your Mac again:

  ```bash
  docker pull --platform linux/arm64 <image>
  ```

  Do not run amd64 Flow Steward images on Apple Silicon.

**How to check.** `./install.sh` runs past its Docker checks and the services
stay up.

### Railway, Render, Fly.io: the service restarts in a loop or stays down {/* #platform-restart-loop */}

**What you see.** On a managed platform the Flow Steward service crash-loops
right after creation, or does not come back after a restart or redeploy.

**Why.** The Compact container needs its database, message broker, volume, and
variables to exist before its first start. It also exits with code 0 on a
normal shutdown, so a restart policy of "on failure" leaves it stopped.

**What to do.**

1. Create things in dependency order: database, then broker, then the Flow
   Steward service with its volume and variables, and deploy last.
2. Set the restart policy to **Always**, run exactly one instance with no
   overlap between deployments, and allow at least 180 seconds for shutdown.
3. Use `/health/ready` as the health check.
4. Expect a short interruption while the service restarts; retry after it
   reports ready.

The first-administrator link is in the service log — see
[setup link expired](#setup-link-expired).

**How to check.** The platform shows the service healthy and `/health/ready`
answers 200.

More detail: [Platform Deployment](deploy/platforms) and
[Render (Compact)](deploy/render).

## Upgrades

### A release upgrade timed out or stopped {/* #upgrade-stopped */}

**What you see.** `./flow-steward release upgrade` ends with one of:

| Code | Message |
|---|---|
| `release_upgrade_timeout` | "Release X installer exceeded its N-second activation budget." |
| `release_upgrade_pending` | "Release X is already pending." Also shown when you rerun `./install.sh` during an unfinished upgrade. |
| `release_migration_required` | "The target release requires an explicit database migration before activation." |
| `release_maintenance_required` | "Release upgrade requires maintenance to be fully enabled." |

**Why.** An upgrade runs under maintenance and within a time budget — 1800
seconds by default. A slow image pull or a cold start can exceed it. An
unfinished upgrade stays *pending* until you resume it; nothing else may be
selected meanwhile. A release that changes the database stops and waits for you
to back up and migrate.

**What to do.**

- **Timed out or pending.** Keep maintenance enabled and resume the same
  target version. Give a slow host more time, up to 3600 seconds:

  ```bash
  ./flow-steward release info
  ./flow-steward maintenance status
  ./flow-steward release upgrade --target-version X.Y.Z --timeout-seconds 3600 --confirm
  ```

- **Migration required.** Run the sequence in this order:

  ```bash
  ./flow-steward maintenance enable --confirm
  ./flow-steward backup create
  ./flow-steward database preflight
  ./flow-steward database upgrade --maintenance-confirmed --confirm
  ./flow-steward release upgrade --target-version X.Y.Z --confirm
  ./flow-steward maintenance disable --confirm
  ```

- **Maintenance required.** Run `./flow-steward maintenance enable --confirm`
  and repeat the upgrade.

Downgrades are refused. To go back, follow the
[Rollback Runbook](deploy/rollback).

**How to check.** `./flow-steward release info` shows the new version,
`./flow-steward status` reports ready, and maintenance is off.

More detail: [Upgrade Reference](reference/upgrade).

## Users and sign-in

### A user is locked out after failed sign-ins {/* #sign-in-lockout */}

**What you see.** The sign-in page shows "Too many sign-in attempts. Try again
in N seconds."

**Why.** Five failed sign-ins within five minutes lock the account for 15
minutes. Attempts are counted per username and per IP address. These thresholds
are fixed in 0.9.14.

**What to do.**

- **Wait.** The lock ends on its own after 15 minutes.
- **In the UI:** Settings → Users → the user's menu → **Clear sign-in
  lockout**.
- **From the console:**

  ```bash
  ./flow-steward users unlock --email user@example.com --confirm
  ```

Unlocking clears the count for the username. The count for the IP address is
not cleared: further wrong passwords from the same address are refused until
the 15 minutes pass. A successful sign-in clears both.

**If the password is correct and sign-in still fails** with "We couldn't sign
you in", the account may be deactivated — that looks the same as a wrong
password. Check with `./flow-steward users list --include-inactive` and
reactivate:

```bash
./flow-steward users set-active --email user@example.com --is-active --confirm
```

**How to check.** The user signs in.

### The password was changed but a reset is still demanded {/* #reset-still-demanded */}

**What you see.** An administrator set a new password, but at sign-in the user
is still asked to choose a new one.

**Why.** "Must change password" is a separate flag. `users set-password`
leaves it as it was unless told otherwise, so a flag set earlier by a forced
reset stays on.

**What to do.** Set the password and clear the flag in one command:

```bash
read -rs FS_PW && printf '%s\n' "$FS_PW" | ./flow-steward users set-password --email user@example.com --password-stdin --no-must-change-password --confirm; unset FS_PW
```

In the UI: Settings → Users → edit the user and untick **Require password
change**.

Alternatively let the user finish it: signing in with the temporary password
shows new-password fields. The new password must be at least 10 characters and
differ from the temporary one.

**How to check.** `./flow-steward users list` shows `reset=false` for the user.

### There is no "Forgot password?" link, or emails do not arrive {/* #no-email */}

**What you see.** The sign-in page has no "Forgot password?" link; or
notification emails are not delivered.

**Why.** Flow Steward has no built-in mail server. All email — password reset
and workflow notifications — goes through an email extension with an enabled
connection. Until one is configured, the link is hidden. Test runs do not send
notifications by design; such deliveries are recorded as `test_mode_suppressed`.

**What to do.**

1. Install the Outgoing Email extension from the catalog, add an SMTP
   connection, and enable it. The link appears within about 30 seconds.
2. Until then, an administrator resets passwords in Settings → Users or with
   `users set-password`.
3. To test delivery, use a real run or a schedule's run, not a test run.
4. If the mail server is on a private network, see
   [private network](#private-network).

**How to check.** The sign-in page shows "Forgot password?" and a real run
delivers its notification.

More detail: [Settings And Model Providers](user/settings-and-model-providers).

## Settings, limits, and resources

### A setting was changed but the old value is still used {/* #setting-not-applied */}

**What you see.** You ran `config set`, or edited `.env.prod`, and the
application behaves as before.

**Why.** `config set` only stages a change. Nothing reaches the running
services until `config apply`. A restart alone does not help: containers keep
the environment they were created with. Hand edits to `.env.prod` are not a
supported path — most names are never passed to the services, and the managed
block of that file is rewritten on apply.

**What to do.**

```bash
./flow-steward config set FS_MCP_HTTP_RESPONSE_MAX_BYTES=8388608
./flow-steward config show
./flow-steward config validate
./flow-steward config apply --confirm
```

- `config show` lists active values and pending changes.
- `config validate` checks the pending change.
- `config apply` applies it, checks health, and rolls back on failure.
- An empty value, `NAME=`, resets a setting to its default.

On a Docker-host Compact installation the same commands work. The equivalent
one-step form is `./install.sh --setting NAME=VALUE`, which keeps the
installation and restarts the runtime.

**Settings you can change this way:**

| Setting | Purpose |
|---|---|
| `FS_ALLOW_PRIVATE_REMOTE_URLS` | Allow connections to private network addresses. |
| `FS_MCP_HTTP_RESPONSE_MAX_BYTES` | Largest response accepted from an external MCP server. |
| `FS_AGENT_FILE_INLINE_MAX_CHARS` | Largest file an agent reads in one piece. |
| `FS_AGENT_FILE_PAGE_CHARS` | Page size when an agent reads a file in pages. |
| `FS_AGENT_TOOL_RESULT_MAX_CHARS` | Longest tool result passed back to an agent. |
| `FS_AGENT_TEXT_FILE_EXTENSIONS` | File extensions agents treat as text. |

Topology values — worker count, ports, storage, TLS — are changed with the
same `config set` and `config apply` pair. Any other name is refused with "is
not a setting you can change".

**How to check.** `./flow-steward config show` lists the value as active with
no pending change.

More detail: [Configuration](reference/configuration) and
[Limits And File Formats](reference/limits-and-file-formats).

### A file upload is refused {/* #upload-refused */}

**What you see.** One of these messages:

| Message | Limit | Can it be changed? |
|---|---|---|
| "File too large: ..." | 20 MiB per attached file | No, fixed in 0.9.14. |
| "Too many files — maximum N files per task" | 10 files per task | No, fixed in 0.9.14. |
| "Unsupported file type: ..." | Images (PNG, JPEG, WebP, GIF), PDF, XLSX, XLS, DOCX, TXT, MD, CSV | No |
| "File uploads exceed 1 MiB decoded total" | Files sent inline in an API run request | No — send large files through a webhook entrypoint instead. |
| "Request body exceeds size limit", "Uploaded file exceeds size limit", "Too many uploaded files" (413) | Per webhook entrypoint: 44 MiB body, 10 MiB per file, 4 files by default | Yes, in the entrypoint's own settings. |
| "The file exceeds the N MB test-file limit" | 50 MiB for a workflow test file | — |
| "The file is too large to preview" | 20 MiB for an inline preview | The file still downloads. |
| "Extension archive is too large" | 50 MiB per extension archive | No |

**Why.** Each upload path has its own limit, so the first step is to see which
message you got.

**What to do.**

1. Match the message to the row above.
2. For a webhook entrypoint, raise its limits in the entrypoint settings.
3. For a fixed limit, reduce or split the file, or pass a link to the file
   instead of the file.
4. If you get a bare 413 with none of these messages, the request was stopped
   before Flow Steward — check your own reverse proxy. A stock Nginx allows
   1 MiB until `client_max_body_size` is raised.

**How to check.** The same upload succeeds.

More detail: [Limits And File Formats](reference/limits-and-file-formats).

### An external MCP response is too large {/* #mcp-response-too-large */}

**What you see.** "MCP server response exceeded the configured limit of N
bytes. Increase FS_MCP_HTTP_RESPONSE_MAX_BYTES or reduce the server response."

**Why.** Responses from external MCP servers are capped at 4 MiB by default.

**What to do.**

1. Prefer a smaller response: narrow the query, request fewer fields, or use
   the server's pagination.
2. Otherwise raise the cap (up to 1 GiB):

   ```bash
   ./flow-steward config set FS_MCP_HTTP_RESPONSE_MAX_BYTES=16777216
   ./flow-steward config apply --confirm
   ```

A related case: a tool result handed to an agent is cut at 6,000 characters
with "[...truncated — N chars omitted]". Raise
`FS_AGENT_TOOL_RESULT_MAX_CHARS` the same way if agents need longer results.

**How to check.** The same tool call returns without the error.

### Requests are refused with 429 {/* #rate-limited */}

**What you see.** HTTP 429 or a "rate limit" message. The message tells you
whose limit it is:

| Message | Source | What to do |
|---|---|---|
| "Too many login attempts. Try again later." | Sign-in protection | See [sign-in lockout](#sign-in-lockout). |
| "Too many password reset requests" | Password reset: 5 per 5 minutes | Wait 15 minutes. |
| "Too many job-scoped SSE connections" | Live job streams: 10 per user, 100 per account | Close unused job tabs or client streams. |
| "Workflow submission capacity is exhausted; retry later" | Webhook entrypoints preparing uploads at once | Retry after the `Retry-After` interval; send fewer uploads in parallel. |
| "Model provider verification rate limit exceeded" | Model checks: 3 per 5 minutes | Wait, then verify again. |
| "MCP rate limit exceeded for principal ..." | An agent calling a built-in tool: 100 calls per minute per tool | Reduce the loop in the agent's task. |
| A job failure summarized as a provider rate limit | Your AI provider | Agents already wait and retry up to three times. Lower parallelism or raise the quota with the provider. |

**Why.** These limits protect sign-in, the server, and your provider quota.
Flow Steward's own limits in this table are fixed in 0.9.14.

A 503 with "Maintenance Mode is enabled; retry later." is not a rate limit —
maintenance is on. Check `./flow-steward maintenance status`.

**How to check.** The request succeeds after the wait.

### A service on a private network cannot be connected {/* #private-network */}

**What you see.** A connection to something on your own network — a local
Ollama, an internal SMTP server, a document service, an MCP server — is
refused with "host '...' is not allowed", "points to a private network
address", or the code `network_blocked`.

**Why.** By default Flow Steward refuses to call private and loopback
addresses, so that a workflow cannot be used to reach internal systems.

**What to do.** If the target really is yours, allow private addresses:

```bash
./flow-steward config set FS_ALLOW_PRIVATE_REMOTE_URLS=1
./flow-steward config apply --confirm
```

On Compact you can also run
`./install.sh --setting FS_ALLOW_PRIVATE_REMOTE_URLS=1`.

This applies to extensions, MCP connectors, AI providers, and the HTTP Request
step. Link-local and cloud-metadata addresses stay blocked regardless. Leave
the setting off on installations that run workflows you do not fully control.

**How to check.** The connection test or the step succeeds.

### Disk space is running out {/* #disk-space */}

**What you see.** The installer refuses with "Less than 4 GiB of free disk
space is available", builds fail with input/output errors, or the host fills
up over time.

**Why.** Several things grow independently:

| What grows | How to control it |
|---|---|
| Superseded releases and their images | `./flow-steward doctor --fix release_retention --confirm` |
| Jobs, events, logs, messages, trash, and their artifacts | **Settings → Retention**. Cleanup runs daily; deleting a job deletes its artifacts. Defaults are 30 days. |
| Backups | Not pruned automatically. Remove old backups yourself after verifying a newer one. |
| Docker build cache and unused images | `docker system df` to see them, `docker builder prune` to clear the build cache. |
| Container logs | Managed by your Docker logging configuration. |

**What to do.**

1. Run `./flow-steward doctor` — `release_retention` reports reclaimable
   space.
2. Run `docker system df` to see what Docker itself holds.
3. Shorten retention if job history is the main consumer.

Never free space with `docker system prune --volumes` or by deleting volumes:
the volumes hold your database and files. On a Mac, low disk space is often
macOS swap rather than Docker.

**How to check.** `df -h` shows free space and `doctor` no longer reports
`release_retention`.

More detail: [Storage And Artifacts](deploy/storage-and-artifacts) and
[Backups And Restore](deploy/backups-and-restore).

## Workflows and jobs

### A job stays queued and does not start {/* #job-queued */}

**What you see.** A new job waits in the queue while nothing seems to be
running, or runs start one after another instead of together.

**Why.** Most often this is by design: a project runs **one job at a time** by
default. Adding workers lets different projects run in parallel; it does not
lift the per-project limit. Other causes are no running worker and maintenance
mode, during which workers pick up nothing.

**What to do.**

1. Check whether another job in the same project is running or waiting for
   approval. To allow more at once, raise the concurrency cap in the project's
   policy settings.
2. Check workers: `./flow-steward doctor` (`workers_consuming`) and
   **Monitoring**.
3. Check maintenance: `./flow-steward maintenance status`.
4. To add capacity across projects:

   ```bash
   # Compact
   ./flow-steward config set worker_processes=4
   # Scalable
   ./flow-steward config set --worker-replicas 2
   # then, on either profile
   ./flow-steward config apply --confirm
   ```

**How to check.** `./flow-steward jobs list` shows the job running.

More detail: [Queues, Concurrency, Retries, And DLQ](admin/queues-concurrency-retries-dlq).

### A workflow looks stuck but shows no error {/* #workflow-waiting */}

**What you see.** A job has not moved for a long time and reports no failure.

**Why.** It is usually waiting, not stuck. The job status says for what:

| Status | Meaning | What to do |
|---|---|---|
| Waiting for approval | A person must decide. Approvals do not time out. | Open the job and approve or reject. |
| Waiting for timer | A Wait step is counting down. The job page shows "Waiting until ...". | Nothing; it resumes on its own. |
| Waiting for child workflow | A child run has not finished. The job page links to it. | Open the child job. |
| Waiting on an external system | An external operation is in progress. | Check that system. |
| Resume queued | A decision was made; the job waits for a worker. | See [job queued](#job-queued). |
| Stuck | No progress was detected. | Read the job's log and errors, then use the watchdog — see [Monitoring](user/monitoring). |

**What to do.** Open the job page, or from the console:

```bash
./flow-steward jobs status <job-id>
./flow-steward jobs errors <job-id>
./flow-steward jobs list --status failed,stuck
```

**How to check.** The job continues or finishes after the decision, timer, or
child run completes.

More detail: [Jobs And Approvals](user/jobs-and-approvals) and
[Failed-Run Diagnostics](user/failed-run-diagnostics).

### A job finished but has no Result {/* #no-result */}

**What you see.** The job succeeded, but the job page has no **Result** card,
or the result is not the outputs you declared. Or the job fails at the end with
"The workflow reached its success stop, but its output contract failed".

**Why.** Declared outputs are returned only when the **workflow interface** is
enabled. With it off, outputs are ignored without an error. With it on, a
required output that is missing or empty fails the job: "Workflow output
'...' is required but empty".

**What to do.**

1. In the builder open **Workflow settings → Smart setup → Workflow
   interface** and switch on **Enable workflow interface**. The builder warns
   with "Workflow interface is off" when outputs are declared but the switch
   is off.
2. Check **Expected outputs**: mark an output as not required if it can
   legitimately be empty.

**How to check.** Run the workflow again; the job page shows the Result card
with your outputs.

More detail: [Workflows](user/workflows).

### `timeout_unknown`: it is unclear whether an external action happened {/* #timeout-unknown */}

**What you see.** A step that changes something in an external system — sends
a message, creates a record, places an order — fails with `timeout_unknown` or
`external_effect_timeout_unknown`.

**Why.** The request was sent, but the answer never arrived. The action may
have happened. Flow Steward does not retry it automatically, because a blind
retry could send the email or create the record twice.

**What to do.**

1. **Check the external system first.** Look for the record, message, or
   order.
2. **Record what you found.** For an extension action, open the extension's
   page; the pending action offers:
   - **Operation completed — continue** — it did happen; do not repeat it;
   - **Operation not completed — retry** — it did not happen; run it again;
   - **Decide later**.

   A comment is required.
3. **For recurring cases,** connect the step's error path to an Approval step
   in the workflow. The approver can then check the external system and
   authorize a retry inside the same run.
4. Where the external system supports idempotency keys, use them — a repeat
   then cannot create a duplicate.

**How to check.** The external system holds exactly one copy of the effect,
and the action no longer shows as pending.

More detail: [Failed-Run Diagnostics](user/failed-run-diagnostics).

### `model_unavailable: no configured provider/model route` {/* #model-unavailable */}

**What you see.** An agent step fails with this message; the job summary says
"No model available for this agent".

**Why.** The agent has no model to use. Flow Steward looks for one in this
order: the project's override for that agent, the project's default model, the
agent's own model. None is set, or the one that is set was removed.

**What to do.**

1. Make sure a provider is connected and has a verified model: **Settings →
   Model providers**.
2. Set a model in one of two places:
   - the project: edit the project → **Models** → **Default provider** and
     **Default model**;
   - the agent: **Registry → Agents** → the agent → **Provider** and
     **Model**.
3. If a selection shows "(unavailable)", choose another model or clear it.

**If the provider's key is wrong.** With current Ollama and OpenRouter
extensions, **Discover models** reports "The provider rejected the API key.
Check that you copied the whole key, then save it again." Older extension
versions could list models with a wrong or truncated key and fail only at run
time — update the extension and paste the full key.

If the model list is empty, tick **Show all models**: models that do not
report tool calling and structured output are hidden by default.

**How to check.** Model verification passes and the agent step runs.

More detail: [Settings And Model Providers](user/settings-and-model-providers).

### An artifact does not download, or its link stopped working {/* #artifact-download */}

**What you see.** A download link that worked earlier now fails; or a download
returns 503 "Artifact download is not available".

**Why.** With external S3 storage, clicking download redirects you to a
temporary signed address that is valid for at most 10 minutes. A copied
address stops working after that. The download button inside Flow Steward does
not expire — it creates a fresh address on every click. A 503 means the file
storage itself is not reachable.

**What to do.**

1. Open the job in Flow Steward and download again. Do not bookmark or share
   the redirected storage address.
2. For a 503, check storage: **Monitoring → Storage** and
   `./flow-steward doctor`. With local file storage, the data volume must be
   attached and writable. On a managed platform the service needs a durable
   volume; without one, files are lost at every restart.
3. If the job was removed by retention, its artifacts were removed with it.

**How to check.** The file downloads from the job page.

More detail: [Storage And Artifacts](deploy/storage-and-artifacts).

## Integrations and extensions

### A data connection fails with correct credentials {/* #data-connection */}

**What you see.** **Test** on a data connection fails, or a workflow cannot
query data, although the credentials are right.

**Why.** The credentials are one of several things that must be in place.

| Message or code | Cause | What to do |
|---|---|---|
| "Data connector is unavailable." (`connector_runtime_unavailable`) | The extension that provides this connector type was removed or cannot be loaded. | Reinstall or enable the extension. |
| "This extension is disabled—ask an admin to enable it." | The extension is switched off. | Enable it on the Extensions page. |
| "The selected data connector is invalid. Save the connection again." | The connection points at an outdated connector. | Open the connection and save it again. |
| "This configuration uses stored secrets and has not been approved since it changed." | The connection uses stored secrets and was changed. | On the project's connections page select **Approve use of secrets**. |
| `network_blocked` or "is not allowed" | The database is on a private network. | See [private network](#private-network). |
| "Unable to connect to the database." | Network or host problem. | Check that the host and port are reachable from the Flow Steward server, not from your own machine. |

Also confirm that the dataset is enabled, available to the project, and that
the resource you query is selected in it.

**How to check.** **Test** shows "Connection test succeeded."

More detail: [Datasets And Data Connections](user/datasets-and-data-connections).

### An MCP connector is connected but its tools are missing {/* #mcp-tools-missing */}

**What you see.** The connector shows as connected, but an agent cannot use
its tools, or the tool list is empty.

**Why.** A tool reaches an agent only after four steps: it is discovered, it
is allowed on the connector, the connector belongs to the project, and the
tool is assigned to the agent.

**What to do.**

1. **Sync.** Registry → MCP → the connector → **Sync**. If the server needs
   authorization, authorize the connector first.
2. **Allow.** On the connector page tick the tools under Remote Tools and
   select **Save allowlist**.
3. **Project.** Connectors and their OAuth credentials belong to one project.
   Add the connector in the project that runs the workflow.
4. **Assign.** Registry → Agents → the agent → **Tool Access** → select the
   tools → **Save tools**.

Only streamable HTTP servers are supported. Servers that offer only `stdio` or
SSE transport are refused.

For the built-in Flow Steward MCP server, an external client sees only the
tools its token scopes allow.

**How to check.** The connector page lists the tools under Projected Tools and
the agent's run calls them.

More detail: [Tools And MCP](user/tools-and-mcp).

### An OAuth connection stopped working {/* #oauth-stopped */}

**What you see.** A connection that worked shows **Reconnect required** or
**Needs attention**, and steps using it fail.

**Why.**

| Status | Cause | What to do |
|---|---|---|
| Reconnect required | The provider no longer accepts the stored authorization — access was revoked, the password changed, or the grant expired. | Select **Reconnect** and approve access again. |
| Needs attention (`invalid_client`) | The provider rejected the app's client ID or client secret. | Check the client ID, select **Replace**, paste the current client secret, and save. |
| "The redirect URI of this provider is not registered yet" | The provider does not know Flow Steward's callback address. | Copy the **OAuth Redirect URI** from the setup page and register exactly that address with the provider. |

The redirect address is built from the installation's public HTTPS address. If
you changed the domain, register the new address with every provider.

A Google app left in **Testing** mode issues authorizations that expire after
about seven days — a Google policy. Publish the app to stop weekly reconnects.

**How to check.** The connection shows as connected and a step using it
succeeds.

### An extension does not install or update {/* #extension-install */}

**What you see.** Installing or updating an extension is refused.

| Message | Cause | What to do |
|---|---|---|
| "is not compatible with Flow Steward ..." or "Platform version ... is below required minimum" | The extension needs a newer Flow Steward. | Upgrade Flow Steward, or install an older extension version. |
| "runtime.contract_version must be 'extension_host_v2'" | The extension release is too old for this Flow Steward. | Install a current release of the extension. |
| "Extension archive is too large — maximum 52428800 bytes" | The archive exceeds 50 MiB. | Use the catalog release, or a smaller per-architecture archive. |
| "is already installed. There is nothing to update." | That version is already installed. | Nothing to do. |
| "Downgrade not supported" | An older version than the installed one. | Uninstall first if you really need the older version. |
| "changed since it was listed ... Reload the catalog and try again." | The catalog entry changed while the page was open. | Reload the catalog page. |
| "Couldn't load the extension catalog." or "The catalog host did not answer." | The catalog is unreachable. | Check outbound internet access from the server and try again after 10 seconds. |
| "The extension catalog isn't set up on this server." | No catalog address is configured. | Install from an archive file instead. |

**Why.** Extensions are versioned separately from Flow Steward and state which
Flow Steward they need.

**Compact and the console.** `./flow-steward extensions install` is refused on
Compact. Install and update extensions in the UI instead: **Extensions** →
catalog, or upload an archive.

**A new version does not show.** The update check is cached for an hour.
Select **Check again** on the Extensions page.

**How to check.** The extension shows the new version and its health check
passes.

More detail: [Extensions](user/extensions).

### A trigger does not start the workflow {/* #trigger-not-firing */}

**What you see.** A webhook call, a schedule, or a message in a chat does not
start a run.

**Why and what to do.** It depends on the trigger.

**Incoming webhook.** The response to the call tells you the cause:

| Response | Cause | What to do |
|---|---|---|
| 404 "Workflow entrypoint not found" | Wrong address or deleted entrypoint. | Copy the address again from the workflow. |
| 409 "Workflow entrypoint is disabled" | The entrypoint is off. | Enable it. |
| 409 "This workflow is turned off. Enable it before sending a webhook." | The workflow is disabled. | Enable the workflow. |
| 404 "No enabled project is linked to the selected workflow" | The workflow is not attached to an enabled project. | Link it to a project. |
| 404 "Workflow is unavailable" | The workflow was moved to Trash. | Restore it, then check that its triggers are enabled. |
| 401 or 403 | Wrong credentials, or the caller's address is not allowed. | Check the entrypoint's authentication settings. |

A successful call answers 202. Flow Steward does not send the run's result in
that response — post results back with an HTTP Request step.

**Schedule.** If the workflow shows "Schedule is turned off for this
workflow", select **Turn on Schedule** in Trigger channels and save. Each
schedule also has its own on/off switch.

**Telegram.** A chat starts workflows only if it is saved as a channel, the
channel is enabled, and **Workflow trigger** is switched on for it. Messages
from other chats are ignored silently. Incoming messages must be switched on
on the extension's Inbound page. In groups, the bot sees messages only when
they are addressed to it or when its privacy mode is off.

**WhatsApp.** Incoming messages need a public HTTPS address that Meta can
reach; there is no polling. Only saved contacts with **Workflow trigger**
switched on start a workflow. Copy the callback address and verify token into
Meta and subscribe to `messages`.

**Where to look.** **Monitoring → Events** shows whether an event was
recorded, matched, delivered, skipped, or failed. Failed deliveries can be
sent again with **Redrive failed dispatches**.

**How to check.** The event appears as Delivered and a job starts.

More detail: [Incoming Workflow Webhooks](integrations/incoming-workflow-webhooks)
and [Events And Redrive](admin/events-and-redrive).

## Still stuck?

1. Run `./flow-steward reports diagnostics` and keep the file.
2. Note the exact error text, its code, and the log path it printed.
3. Follow [File An Issue](user/file-an-issue).

## Related pages

- [Diagnose, Repair, and Move a Server](deploy/diagnostics-and-migration)
- [Monitoring](user/monitoring)
- [Failed-Run Diagnostics](user/failed-run-diagnostics)
- [Limits And File Formats](reference/limits-and-file-formats)
- [CLI Reference](reference/cli)
