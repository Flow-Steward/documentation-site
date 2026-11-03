---
sidebar_position: 11
title: Extensions
description: Install and operate task, notification, and tool provider extensions.
---

# Extensions

Extensions let Flow Steward work with external providers without importing
provider-specific code into the core server.

## Extension kinds

| Kind | Purpose |
|---|---|
| `task_provider` | Receive or normalize external tasks and webhooks. |
| `notification_provider` | Send notifications and receive approval callbacks. |
| `tool_provider` | Expose tools, dataset connectors, or provider actions. |

Provider implementations are distributed separately from the core application.
The core checkout's `extensions/` directory is an installation location, not a
shipped catalog of built-in integrations. Local leftover directories or cached
files do not prove a provider is available.

The **Extension Catalog** under `Extensions > Marketplace` lists separately
published integrations from Flow Steward and community contributors. Standard
configuration uses the official catalog; available entries change as releases
are published. Use it or a reviewed release bundle to discover
what is actually available. Confirm its version, declared features, provenance,
required credentials, and deployment compatibility. A catalog entry is not proof
of installation, configuration, fresh model verification, or runtime health.
Live catalog availability and external provider operation are not established by
the core source checkout.

LLM-provider extensions can project verified model routes into the model
catalog. Dataset-provider extensions can project scoped data connectors. Both
still require the owning extension's configuration and health/verification gates.

## Install or enable an extension

[![Extensions hub with catalog and installed-extension controls](/img/screenshots/2026-10-04/extensions-hub.png)](/img/screenshots/2026-10-04/extensions-hub.png)

*The Extensions hub from the reviewed application revision. No bundle was installed, enabled, or invoked during capture.*

1. Open `Extensions` as an administrator.
2. Open **Marketplace**, review a catalog entry, and choose **Install**. To
   install a `.zip` archive you received or built, choose **Install extension
   from file**, or drop the `.zip` on the extensions list.
3. Review the install result and enabled state. A new archive installation
   enables the extension automatically; disable it while completing setup if needed.
4. Configure required credentials and connections, and check declared features,
   scopes, callbacks, and health endpoint before using it.
5. Enable the extension if it is disabled and ready for use.
6. Run `Health`.
7. Invoke or test a low-risk action.
8. Configure callback registrations if the provider sends webhooks or approval
   responses.

Installation, enabled state, configuration, health, and action testing are
separate checks; an enabled install is not proof that setup is complete. Record
the exact bundle version and provenance, then review the uninstall impact plan.
Required dependents can block uninstall; some dependent workflows can instead be
preserved and disabled, while model consumers can be listed as stopping working.
Review the plan and confirm its current revision rather than assuming disable
is cleanup.

The Extensions hub and Marketplace are administrator-only. Authenticated users
can reach individual extension pages, subject to their action permissions.
Install, update, and uninstall require an administrator and are deployment-scoped
operations supported only in the default account. On a Compact installation,
install archives through the UI (or the install API); copying a folder into the
server is not an install.

## Update an extension from a file

Install a `.zip` of a **higher** version with **Install extension from file**.
Flow Steward recognises the installed extension and updates it in place: it
runs the release's data migrations, keeps the extension's configuration and
connections, and keeps a disabled extension disabled. On a failure before commit,
it attempts to restore the previous version. Check the error: it distinguishes
preservation of the previous version from incomplete recovery. Do not assume the
previous version is active after every failure. The same version or an older
one is refused.

An archive may be built for one server architecture (its name ends in
`-linux-amd64` or `-linux-arm64`). Install the one that matches your server;
a package declaring a different runtime target is refused.

## Catalog installation and model dependencies

Catalog installation pins an extension ID, version, and release digest. Review
requested browser authority separately when the installation requires it.
When a newer release is listed, **Update available** leads to **Update to X**
on the catalog entry. An administrator can apply that release through the same
verified installer used for installation. Review additional permissions and data
migrations first. Updates are deliberate; a disabled install remains disabled.
Same-version reinstallation and downgrades through the catalog are refused.

See [Workflow and Extension Catalogs](workflow-and-extension-catalogs) for catalog
browsing, installation, troubleshooting, and contribution instructions.

## Update notices

On the reviewed main revision, Flow Steward checks the extension catalog for
newer releases of the extensions you have installed and shows notices beyond
the Marketplace. This source review does not establish which published release
first included these notices.

- **Menu counter.** For administrators, the **Extensions** item in the navigation
  shows the number of installed extensions with an update, for example
  "2 updates available".
- **Installed tab.** Under the extension's row a notice says **There is a new
  version of \<name\> available.**, with a **View version X details** link to
  the release notes and an **Update to vX** button when updating is permitted.
- **Extension page.** The same notice appears at the top of the extension's
  own page, together with any permissions the new release adds ("This version
  also asks for: …").
- **Does not work with this server.** When the newer release needs a different
  Flow Steward version or runtime, the notice reads **There is a new version of
  \<name\> available, but it does not work with this server.** and names the
  version requirement or unavailable runtime package. It has no Update button:
  use a compatible server version and runtime, or keep the installed version.

The release notes link opens the extension's GitHub release when the catalog
archive URL points to a GitHub release asset, otherwise the catalog entry.
Only administrators can update; other authenticated users can see the notice on
an extension's individual page without the button. An update uses the same
verified installer as **Update to X** in the Marketplace, and a disabled
extension stays disabled.

The check reuses the catalog's answer for up to an hour. When the catalog
cannot be reached, the Installed tab shows **Couldn't check for extension
updates.** with a **Check again** button; installed extensions keep working.

Before uninstalling an LLM provider, review dependent project defaults,
per-agent overrides, workflows, and project/agent model selections in the uninstall
plan. Removing and reinstalling a provider can create a new provider identity;
old saved model routes may then be unavailable and need explicit reselection.

## Operate an extension

Use the extension page to answer:

- Is the extension installed?
- Is it enabled?
- Does health pass?
- Which callbacks are registered?
- Which actions or dataset connectors does it provide?
- Did the last invocation succeed?

If an enabled extension provides dataset connectors, those connectors appear in
`Registry > Data Connections` and `Registry > Datasets`.

## Custom logic in workflows

Flow Steward has no step that runs code typed into a workflow. Custom logic is
written as an extension, tested and versioned like other code, and then used in
workflows through the **Extension tools** step. See
[Custom code](../reference/workflow-step-kinds#custom-code-code-step) and
[Build An Extension](../integrations/build-an-extension).

## Safe operating habits

- Keep provider credentials outside docs and source control.
- Enable only extensions that are needed.
- Test health after deployment or credential rotation.
- Keep callback URLs and secrets provider-specific.
- Disable an extension before deleting dependent workflows, notification routes,
  or datasets.
