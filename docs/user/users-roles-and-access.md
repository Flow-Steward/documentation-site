---
sidebar_position: 10
title: Users, Roles, And Access
description: Manage users, roles, PATs, service accounts, and machine tokens.
---

# Users, Roles, And Access

Access control is split between human users and automation identities.

Human users sign in to the UI. Service accounts and machine tokens are for
automation, MCP clients, and integrations.

## Roles

| Role | Level | Typical responsibility |
|---|---:|---|
| `viewer` | 1 | Read permitted dashboards, jobs, projects, and reports. Viewer does not have Registry access. |
| `operator` | 2 | Read the Registry and run permitted approvals, acknowledgements, retries, cancellations, and workflow triggers. |
| `admin` | 3 | Author workflows and registry objects; manage users, accounts, service accounts, tokens, settings, and high-risk configuration. |

Service accounts act with operator-level intent by default. System actors are
admin-level internal principals.

## Add a user

[![Add user dialog with display name, email, temporary password, roles, active state, and password-change control](/img/screenshots/2026-10-04/user-create-form.png)](/img/screenshots/2026-10-04/user-create-form.png)

*The Add user dialog. The screenshot contains blank credential fields and does not create an account.*

1. Open `Settings`.
2. Open `Users`.
3. Create a new user.
4. Enter email and display name.
5. Choose roles.
6. Set a temporary password of at least 10 characters.
7. Enable **Require password change** when the user must change that temporary
   password on the next sign-in.
8. Save.

The browser Add User form has no account-ID field. Managed-account scoping is a
separate API/CLI concern, not an alternative browser step. After creation, use
**Set temporary password** for credential replacement and **Require password
reset** for the independent next-sign-in flag. Use `Unlock` after lockout
conditions are resolved.

## Change user roles

1. Open `Settings`.
2. Open `Users`.
3. Edit the user.
4. Select roles.
5. Save.

Give users the lowest role that lets them do their work. Most people should
start as `viewer` or `operator`; reserve `admin` for platform owners.

## Personal access tokens

Use a personal access token when a human user needs an API or MCP credential tied
to their account.

Typical uses:

- local MCP sessions;
- personal automation scripts;
- one-off integration testing.

Treat PATs like passwords. Rotate them when they are shared accidentally, no
longer needed, or used from an untrusted environment.

Create a PAT under `Settings > Account > Personal tokens`. Set a short useful
expiry, choose only the required scopes, and narrow project/workflow allowlists
when possible. Copy the token once into the client's secret store. Verify it
with a read-only request, then revoke the old token after rotation.

[![Create personal token dialog with expiration, scopes, project restrictions, and workflow restrictions](/img/screenshots/2026-10-04/personal-token-create-form.png)](/img/screenshots/2026-10-04/personal-token-create-form.png)

*The token form opened, but the fixture also reported that its existing token list could not be loaded. No token was created and no secret was revealed.*

To connect an AI agent, use **Settings → Account → AI agents** instead: it
creates a token with a fitting access preset and expiry for the chosen client
and fills it into that client's setup. See
[Connect AI Agents](../integrations/connect-ai-agents).

### A token cannot outlive the token that creates it

A token can itself call the token routes when its role and scopes allow. On
main, a personal access token or machine token that has an expiry can only create
tokens that expire no later than itself; a request for a later expiry or for a
token without expiry is refused with "Requested expiry exceeds the caller's
token lifetime". This source-backed behavior does not establish which published
release includes it. New token scopes are checked against the caller's authority,
and restricted project/workflow allowlists can only be narrowed, not widened or
removed. Signed-in browser sessions and tokens without an expiry are not subject
to the caller-lifetime limit.

## Connected AI apps

Cloud AI apps (Claude.ai, Cowork, ChatGPT) connect through OAuth rather than
personal tokens: the user signs in to Flow Steward and approves an access
level, projects and an expiry of 7, 30 or 90 days. The approved apps are listed
under **Settings → Account → Personal tokens → Connected AI apps**, below the
personal token list. Each row shows the app, its access and scopes, projects,
created and expiry dates, last use and status. **Revoke access** removes access
at once, including the app's refresh token. Users see only their own apps.

An administrator controls this per account in **Settings → Security → Cloud AI
apps (OAuth)**. The switch is off by default and works only on an installation
with a public HTTPS address. Turning it off immediately rejects every OAuth
token of the account; the granted access stays listed and can be revoked.
Personal access tokens are not affected. These controls are available on main;
the public source does not establish current compatibility or availability in
each external AI provider. See
[Cloud AI apps](../integrations/connect-ai-agents#cloud-ai-apps-claudeai-cowork-chatgpt).

## Service accounts

Use service accounts when the actor is not a person. Managing service accounts
and issuing their tokens requires administrator access.

1. Open `Settings`.
2. Open `Service Accounts`.
3. Enter a service account key, display name, and description.
4. Select scopes such as `jobs.read`, `jobs.write`, `projects.read`,
   `registry.read`, or `workflows.write`.
5. Limit allowed project IDs and workflow IDs when possible.
6. Create the service account.
7. Select it and create a token.
8. Set token scopes and expiration.
9. Copy the token once and store it in the integration secret store.

The service account's scopes define its maximum authority. The token form only
allows scopes within that authority; selecting no token scopes grants no access.

Revoke tokens when an integration is retired. Delete tokens only when you are
sure no audit or rollback workflow needs to refer to them.

## Account settings

Users can manage preferences such as timezone from the account settings pages.
Email change is available only for local-auth accounts and always requires
verification and working email delivery. An unconfigured mail service prevents
the request with HTTP 503; a delivery failure prevents completion rather than
bypassing verification.
