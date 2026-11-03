---
sidebar_position: 9
title: Workflow Export and Import
description: Copy workflows between local, development, staging, and production environments using YAML export and import.
---

# Workflow Export and Import

Export a workflow from one Flow Steward environment and import it into another,
for example from local development to staging or production. Import creates a
local draft in the target environment; it does not remove the source workflow.

The behavior below is available on main. Confirm that your deployed version
supports it; this page does not establish availability in a published release.

## Export and import steps

1. Build or update the workflow in the source environment.
2. Validate the workflow.
3. Run at least one `Test Run` with representative inputs.
4. Choose `Export YAML`, or `Export YAML with child workflows` to include called
   workflows, when full export is available.
5. Store the bundle with release notes or the change ticket.
6. Open the target environment.
7. Load the bundle in the workflow import page and choose the target project.
8. Run preflight.
9. Resolve missing, conflicting, or protected dependencies. Recheck preflight
   after changing mappings. Blocking topology issues require correcting the
   workflow definition; dependency mappings cannot fix them.
10. Import as disabled. Import creates disabled drafts and does not overwrite
    existing workflow IDs; choose a different target ID when needed.
11. Validate and review trigger/binding/credential differences while disabled.
12. Run a builder `Test Run` with representative target-safe inputs before
    enabling. Current main permits Test Runs of disabled drafts, subject to
    validation, project scope, and input checks. Review provider and side-effect
    behavior before executing the test.
13. Enable only after reviewing the test results and intended triggers.

## Bundled child workflows

Full export can include invoked child workflows and their descendants in one
bundle. Review every included workflow and mapped dependency. Import creates
children before their callers and uses portability metadata to identify the
root workflow, including when its target ID changes. A bundled child can also
be mapped to an existing workflow. Protected references still require the
appropriate target installation or mapping. Catalog templates use this same
import path; they do not bypass preflight or enable the result automatically.

By default, exports also carry reusable agent, skill, manual data contract, and
guardrail definitions. A reference-only export names those dependencies instead.
Import can create bundled definitions when their IDs are free. Existing
 definitions require an explicit reuse or rename decision and are not overwritten.

Project-scoped exports include that project's hook bindings. With child workflows
included, they also follow children selected by those bindings. An export without
project context carries no hook bindings. Importing a bundle with hook bindings
requires a target project; review the restored bindings there.

Canvas note images are not included in exports. Upload them again after import.

## Preflight states

| State | Meaning |
|---|---|
| `resolved` | The dependency is satisfied in the target or by the selected resolution. |
| `create_from_bundle` | Import will create the definition carried in the bundle. |
| `missing` | A required dependency is absent. |
| `conflict` | A target identity is already taken or the selected resolution is incompatible. |
| `requires_mapping` | Map the exported reference to an existing target object. |
| `requires_extension_install` | Install or enable an extension before import can run. |
| `requires_project_connection` | Create or map a compatible project connection. |
| `protected_reference` | The bundle contains a safe reference, not editable extension-owned internals. |
| `blocked` | The workflow cannot be imported until the issue is fixed. |

Import reruns preflight and rejects unresolved blocking dependencies or invalid
topology before creating the workflows.

## Target-environment checks

- Model provider and model catalog entries exist.
- Datasets and data connections point to target-safe systems.
- Extension installs are healthy and enabled.
- Notification routes point to target channels.
- Webhook URLs and external endpoints are target-specific.
- Project bindings use the intended workspace and project.
- Protected references are mapped, not cloned.
- Bundled definitions and reused target objects have been reviewed.
- The imported workflow remains disabled through validation, review, and its
  builder Test Run. Enabling remains a separate trigger/side-effect decision.

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
