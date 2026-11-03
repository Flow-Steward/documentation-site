---
sidebar_position: 15
title: Settings And Model Providers
description: Configure model providers, retention, security, and notifications.
---

# Settings And Model Providers

Settings have different scopes. Provider credentials and retention values in
this guide are account-scoped; other pages may govern the current user, a
project, or the deployment. Most changes still require an admin.

## Settings pages

| Page | Use it for |
|---|---|
| General | An overview of deployment sign-in capabilities and configured model providers, with links to configuration pages. |
| User Settings (Account) | Current user's profile, timezone, email and sign-in settings, personal tokens with **Connected AI apps**, and the **AI agents** connection page. |
| Users & access | Human user accounts, roles, lockout, and password reset. |
| Model Providers | Model provider configuration and model catalog settings. |
| Service Accounts | Automation identities and scoped machine tokens. |
| Extensions | Installed or available extension bundles. |
| Security | Security policy and the **Cloud AI apps (OAuth)** switch for cloud client connections. |
| Retention | Data retention and cleanup policy. |
| Notifications | Project notification routes and provider routing. |

User Settings and Extensions have their own navigation entries rather than
being tabs in the Settings hub. Available pages depend on your permissions.

The account's **Cloud AI apps (OAuth)** switch is off by default and requires a
public HTTPS installation address. Users must also sign in and approve access.
Turning it off immediately rejects the account's OAuth tokens; personal access
tokens are unaffected. The AI agents page offers connection guidance for
Claude.ai, Cowork and ChatGPT, but this does not certify current third-party
client availability or compatibility.

## Add a model provider

1. Open `Settings`.
2. Open `Model Providers`.
3. Add or edit an account-scoped credential profile. A profile belongs to the
   current account; it is not a platform-global environment key.
4. Choose OpenAI, Anthropic, Google, OpenAI Compatible, or Azure OpenAI, and
   enter the credential and selected model. Official provider types use fixed
   endpoints. OpenAI Compatible and Azure OpenAI require a permitted HTTPS base
   URL; Azure OpenAI also requires an API version and deployment name. Credentials
   are stored through the encrypted, secret-backed settings flow.
5. Save. Saving can retain the profile even when its immediate verification
   fails or is stale; a saved profile is not proof that it is selectable.
6. Read the returned verification state. `passed` is required; treat `failed`
   and `stale` as unavailable until corrected and reverified.
7. If needed, correct the endpoint, credential, or model configuration and use
   the separate **Verify** action. Verification must be no older than 30 days.
8. Confirm the effective catalog now includes the models workflows should use.
   Effective choices are enabled, active, freshly verified profiles that also
   pass the catalog allowlist/visibility rules.
9. For model-backed agents, confirm verification established chat, tool-use,
   and structured-output capabilities. A credential test alone is insufficient.
10. Select the profile/model at the project or agent boundary and run a low-risk
    job.

Keep provider keys out of documentation, screenshots, and source control.
Flow Steward does not promise automatic cross-provider fallback. If the chosen
model is unavailable, the run surfaces `model_unavailable`; choose another
permitted profile/model deliberately.

If a previously selectable provider disappears, first check whether its
verification is older than 30 days, then use **Verify** and review its capability
results. The extension-provider path has its own provider configuration and
fresh-verification gate; verifying a custom profile on this page does not verify
an extension-provided model, or vice versa.

## Retention and cleanup

Retention settings are account-scoped and edit four positive whole-day values:
action logs, job logs, trash, and terminal job checkpoints. They also edit
`revisions_keep`, a positive whole-number count of the newest content revisions
kept per registry item and live settings revisions kept per project. Trashed
project settings revisions follow the trash policy. Day values range from 1 to
3,650; revision counts range from 1 to 100. Environment defaults are 30 days for
each window and 5 revisions per item.

These settings do not edit job, event, or retry-queue retention. During cleanup
an explicit command argument overrides the account value, and the account value
overrides its environment fallback; the system does not choose the shortest of
the three. Coordinate changes with audit, debugging, and compliance needs and
use the [retention dry run](../reference/limits-and-file-formats#retention-precedence-and-dry-run)
before shortening a window or reducing the revision count.

## Notifications

In notification settings, select a project before editing its notification
routes. Routing is per project and determines which workflows can send to each
email, chat, or webhook destination. Use notification settings or project
notification routes when approvals and job state should be sent to an external
provider. Test provider health before relying on notifications for critical
approval paths.
