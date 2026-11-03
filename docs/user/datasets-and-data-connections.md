---
sidebar_position: 9
title: Datasets And Data Connections
description: Add data connections, expose safe datasets, and attach them to projects.
---

# Datasets And Data Connections

Data connections and datasets are separate on purpose.

A data connection describes how Flow Steward reaches a source inside one
workspace. A workspace-owned dataset describes which part of that source is
safe and useful for projects and workflows. Installed extensions can also
provide package-owned datasets whose connections are resolved for each project.

This lets a workspace have several projects without giving every project the
same data access. For example, a client workspace can have one CRM database
connection, then separate datasets for the CRM project, public website project,
and reporting workflow.

## Scope model

| Object | Scope | Why it matters |
|---|---|---|
| Data connection | Workspace | Stores endpoint, environment, secret references, health, and schema metadata for a source. |
| Workspace-owned dataset | Workspace, then availability mode | Exposes selected resources and columns from a connection. |
| Package-owned dataset | Installed extension, linked to projects | Uses package-defined configuration and schema with a compatible connection resolved for the project. |
| Project dataset binding | Project | Controls which specific projects can use a dataset when it is not workspace-wide. |
| Workflow `dataset_query` step | Workflow/job | Queries a saved query on the approved dataset during execution. |

Workspace-owned dataset availability has two modes:

- `All workspace projects` makes the dataset available to every project in the
  workspace.
- `Specific projects only` lets you select the projects that may use the
  dataset.

A project cannot attach a workspace-owned dataset from another workspace. A
workspace-owned dataset's workspace cannot be changed after creation; create a
new dataset in the target workspace when the data boundary changes.

Package-owned datasets have no permanent workspace. Their configuration, schema,
and package-owned saved queries are read-only in the registry. Open a project,
link the dataset in `Datasets`, and select a compatible connection in
`Data Connections`. A missing or ambiguous connection prevents execution.

## Install a dataset connector

Dataset connectors come from extensions. The available connector types and
configuration fields depend on the extensions installed and enabled for your
account. The public source does not establish which connector packages are
currently published or installed in your deployment.

If the UI says no connectors are installed, install or enable an extension that
exposes dataset connectors before creating data connections. Query execution
requires an installed and enabled connector extension; a connection record alone
does not provide a database driver or prove live connectivity.

## Add a data connection

[![Data Connections page with workspace-scoped connection records and status](/img/screenshots/2026-10-04/data-connections-list.png)](/img/screenshots/2026-10-04/data-connections-list.png)

*Synthetic data-connection records. Visible status is fixture state, not a live production connectivity test.*

[![Add data connection dialog with workspace, connector, name, environment, description, and tag fields](/img/screenshots/2026-10-04/data-connection-create-form.png)](/img/screenshots/2026-10-04/data-connection-create-form.png)

*The fixture has no installed dataset connector, so Create connection is unavailable. No connection was created.*

Creating data connections requires the `administer_platform` capability.

1. Open `Registry`.
2. Open `Data Connections`.
3. Choose `New Connection`.
4. Select the workspace.
5. Select an available connector.
6. Enter a display name and environment.
7. Fill in the connector-specific connection fields. These may include host,
   port, user, database, or source-specific settings.
8. Enter the connector's required secrets, such as a password. They are stored
   through secret references. When editing, leave a secret field blank to keep
   its existing stored value.
9. Save the connection.
10. Test the connection.
11. Introspect the connection to capture schema metadata.

Connections cannot be deleted while datasets depend on them.

## Create a dataset

[![Datasets page with workspace ownership, availability, and dataset records](/img/screenshots/2026-10-04/datasets-list.png)](/img/screenshots/2026-10-04/datasets-list.png)

*The dataset list in the isolated synthetic workspace.*

[![Create dataset dialog with ownership, availability, connection, project assignment, schema, read-only, and enabled controls](/img/screenshots/2026-10-04/dataset-create-form.png)](/img/screenshots/2026-10-04/dataset-create-form.png)

*The form exposes dataset scope and schema controls, but the fixture reports no installed dataset connector. No dataset was created or introspected.*

Creating workspace-owned datasets requires the `administer_platform` capability.

1. Open `Registry`.
2. Open `Datasets`.
3. Choose `New Dataset`.
4. Enter a display name and description.
5. Select the workspace owner.
6. Choose availability:
   - `All workspace projects` for broad shared datasets.
   - `Specific projects only` for tighter access; select the intended projects.
7. Select a data connection from the same workspace.
8. Click `Introspect schema`.
9. Select only the tables, resources, and columns that should be exposed.
10. Save the dataset.

The connection must have an introspected schema, and the selected resource
scope must expose at least one resource.

Start with a narrow resource selection. You can widen access later after the
workflow proves what it actually needs.

Use `All workspace projects` for genuinely shared reference data. Use `Specific
projects only` for customer data, production data, or data that should be
visible only to one delivery target.

## Attach datasets to a project

1. Open the project.
2. Open the `Datasets` tab.
3. Select available datasets.
4. Save project datasets.

Workspace-wide datasets are available to all projects in the workspace.
Specific-project datasets are available only where they are explicitly linked.
Workspace-owned datasets from other workspaces are intentionally unavailable.
For package-owned datasets, also select a compatible data connection for the
project.

## Create and verify a saved query

The dataset detail page requires the `administer_platform` capability.
Package-owned saved-query definitions can be inspected but cannot be edited.

1. Open the dataset detail page and its `Saved queries` tab.
2. Create a stable query ID and parameterized SQL template. Use named parameters
   such as `:status`; do not concatenate user text into SQL.
3. Configure input parameter types and required flags, then select output
   columns. The input type selector offers text, whole number, decimal number,
   and yes/no. Existing object, array, and null parameter types are preserved
   as read-only types. Output column types come from introspection.
4. Save and validate the query before enabling it.
5. Preview with a small non-sensitive parameter set and compare the returned
   columns/types with the output schema. If prompted, choose a project so the
   connection can be resolved in that project's scope.
6. Enable the query only after validation and preview succeed.
7. Bind the dataset to the intended project, then select the saved query from a
   `dataset_query` step and map its bounded result.

The core saved-query contract supports SQL only. It requires a single read-only
`SELECT` statement containing `WHERE` or `LIMIT`, rejects referenced resources
outside the dataset scope, and rejects undeclared SQL parameters. Workflow
execution also checks parameter mappings and project/account/tenant/workspace
scope.

Connector actions perform validation and preview against the source. Do not
assume that validation proves every output column/type matches the declared
schema; compare the preview yourself. Preview requests are clamped to 1–1000
rows and do not promise that an unrestricted export is safe or supported.

## Use datasets in workflows

Use a `dataset_query` workflow step when workflow logic needs structured data.
The step must reference a saved query template; raw SQL in the step is rejected.
That keeps project access and resource scope enforceable.

Typical flow:

1. Add a data connection.
2. Introspect the source.
3. Create a dataset with a narrow resource scope.
4. Attach the dataset to a project.
5. Create and verify an enabled saved query, then select it in a `dataset_query`
   step and map its parameters and result target.
6. Run a test job and review logs/results.

The behavior on main bounds each query's materialized result with a positive
`row_limit`. Its default is 100 rows, or the deployment maximum if lower.
`FS_DATASET_QUERY_MAX_RUNTIME_ROWS` sets that maximum and defaults to 1000.
Requests above the maximum fail before fetching rather than being silently
reduced. The result is held in workflow state, so increasing the maximum costs
source database load, worker memory, and checkpoint storage. Preview limits are
separate. For larger volumes, prepare an export on the source side and read the
file instead.

Use datasets for workflow-time data access. Assign relevant workspace data
connections to the project for internal project context and package-owned
dataset connection resolution. This does not restore the removed project KB
page, repository index, or schema-index service.
See [Project Context](project-knowledge-and-code-intelligence).
