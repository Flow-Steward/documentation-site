---
sidebar_position: 3
title: First Workflow
description: Review and run a provider-free documentation smoke workflow.
---

# First Workflow

The intended smoke workflow transforms the required JSON `payload` into the
declared JSON `normalized` output, then stops successfully. Its authored steps
need no model, agent, skill, tool, connector, HTTP call, extension, or child
workflow.

**Compatibility limitation on current main:** the downloadable
[`deterministic-smoke-workflow.yaml`](/examples/deterministic-smoke-workflow.yaml)
still uses `platform.workflow_bundle.v1` and phase-based steps. The current
importer accepts `platform.workflow_bundle.v2` and rejects that download with
`bundle_schema_unsupported`. It does not convert phases into an execution graph.
Do not change only the schema version or expect the linked file to import.
An administrator must recreate the equivalent workflow in the builder and
review its explicit execution graph before continuing. A compatible export of
that recreated workflow can then be used for the import sequence below.

These instructions describe behavior supported by the reviewed source on main;
they do not establish which published release or deployed installation includes
it. The linked legacy download is not a runnable current-main tutorial fixture.

Import preflight alone does not prove readiness or execution. Follow the full
sequence below only with a compatible, reviewed equivalent and check the final
output value, not only the job status.

## Roles and prerequisites

- An administrator imports, reviews, binds, enables, and can use builder **Test
  Run**. The builder route is currently administrator-only.
- An operator can launch the administrator-provisioned enabled workflow through
  the API or MCP and inspect its durable job. An operator must not be directed
  into the guarded builder route.
- Use a disposable project with no notification routes or external
  connections. Record its project ID for the API tutorial.

## 1. Inspect the workflow

Use the legacy YAML as a description of the intended transformation, not as a
current import bundle. Verify these contracts in the recreated workflow and its
compatible export:

| Contract | Value |
|---|---|
| Workflow ID | `docs_deterministic_smoke_v1` (or record the recreated ID) |
| Bundle schema | `platform.workflow_bundle.v2` |
| Required input | `payload` (`json`), containing `{"message":"hello"}` |
| Required output | `normalized` (`json`) |
| Step | `transform` reads `state.inputs.payload`, copies its `message` field as text, and writes `state.normalized` |
| Terminal | `stop_success` |
| Graph | Entry at the transform step, with its success route leading to the terminal step |
| Import state | Draft and disabled |

Keep the callable input contract strict, with `payload` required, and declare
`normalized` as the required variable output. Preserve the `ui`, `api`, and `mcp`
trigger channels. The legacy fixture declares empty dependency lists; verify
that the recreated equivalent also needs no external dependencies or configured
schedules, webhooks, or provider triggers. Do not add models, tools, or
connections merely to complete this smoke test.

## 2. Import and bind as an administrator

If the recreated workflow is already in the disposable project, verify its
binding and readiness directly. To import its compatible export instead:

1. Open **Registry → Workflows** and choose **Import YAML**.
2. Select the disposable project. Import resolves project-owned connections and
   other dependencies against this project context.
3. Upload the reviewed `platform.workflow_bundle.v2` export, not the linked
   legacy download.
4. Run import preflight. Confirm there are no unresolved dependencies and
   record the target workflow ID, including any conflict rename.
5. Apply the import as a draft.
6. Open the imported workflow and confirm the two steps, execution graph, and
   callable interface match the contracts above.
7. Confirm the disposable project binding.
8. Check workflow validation/readiness. Resolve errors before Test Run. Keep the
   workflow disabled until the administrator has reviewed it for normal launch.

[![Import workflow YAML page with project selection, YAML input, upload control, target ID, and preflight action](/img/screenshots/2026-10-04/workflow-import-form.png)](/img/screenshots/2026-10-04/workflow-import-form.png)

*Import entry screen captured on 2026-10-04. No file was uploaded in this capture. The separate builder/Test Run screenshot elsewhere uses a synthetic QA workflow; it is not evidence that this downloadable tutorial fixture was imported or executed. The capture does not establish the current deployed UI.*

Validation/preflight does not execute the workflow. Current main allows a
Test Run of a disabled draft when its definition passes validation; enabling
it is not a prerequisite for the builder test. Test Run is still execution,
so review the authored steps and project configuration first. Do not generalize
this provider-free example to workflows with connectors, HTTP calls, or other
external effects.

## 3. Run the administrator Test Run

1. Open the workflow **Overview**, then choose **Test Run**. This opens the
   administrator-only builder route.
2. Select the disposable project and link it if prompted.
3. Enter `{"message":"hello"}` for the required JSON `payload` input.
4. Ensure the transform step has no kept test output: kept outputs can replace
   step execution during workflow Test Runs.
5. Submit the Test Run once.

The endpoint accepts a durable execution asynchronously and returns a job ID.
The builder shows compact Test Run results, including the executed definition
revision, run inputs and outputs, and individual step passes. Expand the
transform pass to inspect what it read and wrote, and confirm it executed rather
than returning a kept output. Use **Open full Job Details** for the complete
record, including logs and other job evidence. The expected terminal output is:

```json
{
  "normalized": {
    "message": "hello"
  }
}
```

If an approval is added later, the results surface can show an approval
decision; the intended smoke workflow has no approval gate. A legacy
**Latest workflow test run** rendering remains as a fallback, while the current
verified-run surface uses compact results.

## 4. Start through the public API or MCP

After an administrator has imported or recreated, bound, reviewed, and enabled
the compatible workflow, use the
[Public API Quick Start](../integrations/public-api-quick-start) with its
project UUID, recorded workflow ID, and
`inputs: {"payload":{"message":"hello"}}`.
The public launch endpoint uses the `mcp` trigger-channel contract, so the
workflow must admit that channel. MCP clients can use `workflow_trigger` with
`project_name`, the recorded `workflow_id`, and
`payload: {"payload":{"message":"hello"}}`: the outer `payload` is the tool
argument; the inner one is this workflow's input field.

Follow the returned job under **Jobs** and verify `normalized.message` equals
`hello`. `test_mode` is not a general external-effect sandbox; the reviewed
authored graph must remain provider-free.

## Diagnose a mismatch

- Unsupported bundle schema: the linked legacy download is v1. Recreate the
  workflow in the builder and use a current v2 export; changing the schema
  label alone does not convert the workflow.
- Other import errors: compare the compatible export with the recorded workflow
  ID, typed interface, empty dependencies, two steps, and explicit graph.
- Test Run rejected: inspect validation, project binding, inputs, and any
  revision conflict. On current main, a disabled draft alone is not a reason
  to enable the workflow to bypass an error.
- Missing input: the callable contract is strict and requires JSON `payload`.
- No output: inspect the transform step; its result target is `state.normalized`
  and source is `state.inputs.payload`. The submitted payload must contain
  `message`. Check that the transform pass executed without a kept output.
- Authorization failure: the builder route requires an administrator; use the
  pre-provisioned API/MCP launch path as an operator.

## Cleanup

Disable the workflow first if it was enabled for normal launch. Review its
project binding and retained job evidence, then use the administrator-approved
deletion lifecycle. Project deletion is not part of the public API allowlist.
Preserve any evidence required by your retention policy before removing the
disposable objects.
