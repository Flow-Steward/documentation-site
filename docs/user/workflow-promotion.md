---
sidebar_position: 9
title: Workflow Export and Import
description: Copy workflows between local, development, staging, and production environments using YAML export and import.
---

# Workflow Export and Import

Export a workflow from one Flow Steward environment and import it into another,
for example from local development to staging or production. Import creates a
local draft in the target environment; it does not remove the source workflow.

## Export and import steps

1. Build or update the workflow in the source environment.
2. Validate the workflow.
3. Run at least one `Test Run` with representative inputs.
4. Export the workflow YAML bundle when full export is available.
5. Store the bundle with release notes or the change ticket.
6. Open the target environment.
7. Import the bundle.
8. Run preflight.
9. Resolve missing, conflicting, or protected dependencies.
10. Import as disabled.
11. Validate and review trigger/binding/credential differences while disabled.
12. Record the current limitation: execution Test Run rejects a disabled
    workflow with HTTP 422. Use a separately isolated provider-free target
    fixture for an execution check, or obtain an application fix before
    retaining a test-before-enable gate for an effectful workflow.

## Bundled child workflows

Full export can include invoked child workflows and their descendants in one
bundle. Review every included workflow and mapped dependency. Import creates
children before their callers and preserves the root workflow identity through
its portability metadata. Protected references still require the appropriate
target installation or mapping. Catalog templates use this same import path;
they do not bypass preflight or enable the result automatically.

## Preflight states

| State | Meaning |
|---|---|
| `resolved` | Target already has the dependency. |
| `missing` | A workflow, tool, dataset, extension, connection, or route is absent. |
| `conflict` | Target has an object with the same identity but different details. |
| `requires_mapping` | Map the exported reference to an existing target object. |
| `requires_extension_install` | Install or enable an extension before import can run. |
| `requires_project_connection` | Create or map a project connection before execution. |
| `protected_reference` | The bundle contains a safe reference, not editable extension-owned internals. |
| `blocked` | The workflow cannot be imported until the issue is fixed. |

## Target-environment checks

- Model provider and model catalog entries exist.
- Datasets and data connections point to target-safe systems.
- Extension installs are healthy and enabled.
- Notification routes point to target channels.
- Webhook URLs and external endpoints are target-specific.
- Project bindings use the intended workspace and project.
- Protected references are mapped, not cloned.
- The imported workflow remains disabled through validation and review. A
  disabled workflow cannot currently be execution-tested; enabling requires a
  separate trigger/side-effect decision, not a hidden workaround.

## Release evidence

Keep this with the change record:

- source and target environment names;
- exported workflow id and version or timestamp;
- preflight output;
- dependency mappings;
- test-run job id in the source environment;
- test-run job id in the target environment;
- operator who enabled the workflow.

## Related pages

- [Workflows](workflows)
- [First Workflow](first-workflow)
- [Incoming Workflow Webhooks](../integrations/incoming-workflow-webhooks)
