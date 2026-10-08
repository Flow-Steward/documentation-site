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
| General | General platform options. |
| Account | Current user's profile, timezone, and email settings. |
| Users | Human user accounts, roles, lockout, and password reset. |
| Model Providers | Model provider configuration and model catalog settings. |
| Service Accounts | Automation identities and scoped machine tokens. |
| Extensions | Installed or available extension bundles. Older builds may still label this page as `Packs`. |
| Security | Security policy and project security aliases. |
| Retention | Data retention and cleanup policy. |
| Notifications | Project notification routes and provider routing. |

`Packs` is a legacy label for the extension marketplace/installation surface.
Treat it as `Extensions`; it is not a separate product concept.

## Add a model provider



1. Open `Settings`.
2. Open `Model Providers`.
3. Add or edit an account-scoped credential profile. A profile belongs to the
   current account; it is not a platform-global environment key.
4. Store the provider credential through the secret-backed settings flow.
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
action logs, job logs, trash, and terminal job checkpoints. They do not edit
job, event, retry-queue, or registry-changelog retention. During cleanup an
explicit command argument overrides the account value, and the account value
overrides its environment fallback; the system does not choose the shortest of
the three. Coordinate changes with audit, debugging, and compliance needs and
use the [retention dry run](../reference/limits-and-file-formats#retention-precedence-and-dry-run)
before shortening a window.

## Notifications

Use notification settings or project notification routes when approvals and job
state should be sent to an external provider. Test provider health before relying
on notifications for critical approval paths.
