---
sidebar_position: 5
title: Extension Operator Guide
description: Install, preview, enable, health-check, and disable Flow Steward extension bundles.
---

# Extension Operator Guide

Extensions let Flow Steward connect to task providers, notification providers,
tool providers, dataset connectors, callbacks, and provider-specific actions
without loading provider code into the core server process.

## Operator lifecycle

1. Review the extension descriptor and declared scopes.
2. Validate or preview the bundle before enabling it.
3. Install or import the bundle.
4. Configure provider credentials and callback secrets.
5. Enable the extension.
6. Run health.
7. Test one low-risk action, callback, or dataset connector.
8. Monitor extension health and invocation errors.
9. Disable before deleting dependent workflows, routes, or datasets.
10. Preview the uninstall plan and confirm only its current revision when
    removal is intended.

## What to review before install

- extension id and version;
- kind: `task_provider`, `notification_provider`, or `tool_provider`;
- required scopes;
- callback routes;
- action and query manifests;
- schemas and UI manifest;
- health endpoint;
- machine-auth requirements;
- `python_requirements` and bundled `wheels/` when the extension has subprocess
  Python dependencies;
- release or provenance notes.

By default, extension installs are offline with respect to Python dependencies:
declared requirements must have matching bundled wheels and hashes. Operators
should only allow install-time dependency fetching when the deployment has
explicitly enabled `FS_EXTENSION_DEPS_FETCH=allowlist`.

## Review an update

In `Extensions > Marketplace`, open the entry with **Update available** and
review its **Update to X** action, including newly requested permissions. The
catalog update uses the verified archive installer; it is administrator-only
and does not enable an extension that was disabled. See
[Workflow and Extension Catalogs](../user/workflow-and-extension-catalogs).

An update is not only a version change. Compare the installed and candidate
`lifecycle.data_schema_version` values and the candidate's ordered
`data_migrations`. A persisted-data version change without a migration path is
a compatibility blocker. Validate the candidate bundle, review scope/browser
authority changes, install it in a disposable environment, and verify migrated
data plus health before approving production replacement. This documentation
pass did not execute an update.

## Plan and confirm uninstall

Disable the extension, then request the current plan:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer ${FLOW_STEWARD_TOKEN}" \
  "${FLOW_STEWARD_URL}/api/extensions/${EXTENSION_ID}/uninstall-plan"
```

Review the returned dependents, retained/deleted data, connection and OAuth
effects, shared runtime-package decision, and `revision`. Resolve or explicitly
accept every listed effect. Confirm that exact plan revision:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer ${FLOW_STEWARD_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"revision\":\"${UNINSTALL_REVISION}\"}" \
  "${FLOW_STEWARD_URL}/api/extensions/${EXTENSION_ID}/uninstall"
```

The service locks and recomputes the plan during confirmation. If inventory or
dependents changed, the revision is stale: fetch and review a new plan instead
of replaying the old confirmation. After removal, verify the extension is
absent, browser permissions/registries refreshed, dependent workflows handled,
and retained data/evidence matches the reviewed plan. Remote OAuth revocation
is best-effort after local removal, so verify it separately with the provider.

## Related pages

- [Extensions](../user/extensions)
- [Build An Extension](build-an-extension)
- [Events And Redrive](../admin/events-and-redrive)
