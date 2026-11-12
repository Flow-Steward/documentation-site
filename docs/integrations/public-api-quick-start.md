---
sidebar_position: 4
title: Start And Observe A Workflow With The Public API
description: Submit the documentation smoke workflow and follow its durable job.
---

# Start And Observe A Workflow With The Public API

Use the compatible provider-free workflow described in
[First Workflow](../user/first-workflow). An administrator imports the
downloadable v2 fixture (`docs_deterministic_smoke_v2`), reviews it, and enables
it for public API launch. Record its actual ID if the import renamed it.

On 2026-10-05, the legacy `docs_deterministic_smoke_v1` downloadable fixture
completed through the API on a fresh disposable Compact installation at source
commit `eb1626b05d06ca893a451560df2b5e95b972c47e`, returning the declared
`normalized` output. A separate provider-free approval variant also completed
with its approved output; disallowed and stale decisions returned HTTP 409.
These are local installed checks, not production, MCP, or SSE acceptance.
They are historical observations, not verification of a current deployment.
The request contracts below reflect public source behavior available on main;
they do not establish that a release containing that behavior has been published.

## Credentials and scopes

Set `FLOW_STEWARD_URL`, `FLOW_STEWARD_TOKEN`, `PROJECT_ID`, and `WORKFLOW_ID`.
Use the actual recorded ID of the compatible workflow as `WORKFLOW_ID`, including
any import conflict rename. `PROJECT_ID` must be the existing project UUID. The workflow must
admit its `mcp` trigger channel. The narrow minimum scope families are:

| Operation | Any accepted narrow scope |
|---|---|
| Read workflow contract | `workflows.read` |
| Start workflow | `workflows.write` |
| Read job, approval, or SSE | `jobs.read` |
| Submit approval decision or cancel | `jobs.write` |

Broader wildcard/read/command/admin scopes may also authorize these routes, but
do not widen a token merely to make this tutorial pass.

The requests below are written as plain HTTP: method, path relative to
`FLOW_STEWARD_URL`, headers, and JSON body. Send them with your HTTP client or
integration code. Every request carries `Authorization: Bearer <token>`.

An operator on the deployment host can run the same steps with the CLI instead
of the API: `./flow-steward workflows contract`, `./flow-steward workflows run`,
`./flow-steward jobs show`, and `./flow-steward jobs approve`. See
[CLI Reference](../reference/cli).

## Confirm the contract

```http
GET /api/projects/{PROJECT_ID}/workflows/{WORKFLOW_ID}/contract
Authorization: Bearer <FLOW_STEWARD_TOKEN>
```

Confirm the required text input `message` and required text output `greeting`.

## Submit and capture the job ID

```http
POST /api/workflow-runs
Authorization: Bearer <FLOW_STEWARD_TOKEN>
Content-Type: application/json
Idempotency-Key: docs-api-smoke-001

{
  "project_id": "<PROJECT_ID>",
  "workflow_id": "<WORKFLOW_ID>",
  "test_mode": true,
  "inputs": {"message": "hello"}
}
```

Keep the returned `job_id` for the next steps.

HTTP 200 accepts this asynchronous launch; it does not mean execution has
completed. The response supplies `project_id`, `job_id`, `status`, `queue`, and
`deduplicated`. Reuse the same idempotency key for an identical retry; use a new
key only for a deliberately new run. The API does not accept a task summary or
caller task ID in this request. It also accepts bounded `client_context` and,
for workflows declaring file inputs, a JSON `files` array with `input_name`,
`filename`, optional `mime_type`, and strict base64 `content_base64`. Uploads
are limited to 10 entries and 1 MiB of decoded bytes in total, with one upload
per input name. Supply actual file bytes rather than a path or fabricated
artifact reference. This smoke fixture needs no files.

`test_mode` is not a general external-effect sandbox. Safety here comes from
the reviewed provider-free fixture.

## Observe the durable job

```http
GET /api/jobs/{JOB_ID}
Authorization: Bearer <FLOW_STEWARD_TOKEN>
```

Use the nested `workflow_run` field as the stable integration projection.
Wait for `workflow_run.terminal` and inspect `workflow_run.result.outputs` on
success. The expected output is
`workflow_run.result.outputs.greeting: "Hello, hello!"`. Assert that
value as well as `workflow_run.status == "completed"`; a completed job without
the declared output does not pass this check.

For durable state events:

```http
GET /api/events/stream?job_id={JOB_ID}
Authorization: Bearer <FLOW_STEWARD_TOKEN>
Accept: text/event-stream
```

Keep the connection open and read frames as they arrive.

Representative frames include:

```text
id: 1842
event: job.state
data: {"schema_version":"1","job_id":"job-987","project_id":"proj_42","workflow_id":"docs_deterministic_smoke_v2","status":"completed","terminal":true,"updated_at":"2026-09-17T12:00:00Z","result":{"outputs":{"greeting":"Hello, hello!"},"artifacts":{}}}

event: stream.error
data: {"schema_version":"1","code":"stream_unavailable","message":"Public job stream is temporarily unavailable","retryable":true}
```

The `job.state` line above is a complete minimal terminal
`WorkflowRunStateV1` frame; optional step, approval, error, and lifecycle
timestamps are omitted. The `stream.error` line is the exact retryable error
shape emitted when the public job stream is temporarily unavailable.

Reconnect with the last marker in `Last-Event-ID`. On `429`, wait the
`Retry-After` seconds. A `410` means the marker can no longer be resumed: reload
job detail and open a fresh stream from current state.

## Approval discovery and decision

The smoke fixture has no gate. For a different reviewed workflow that reaches
an approval gate, discover the current gate before deciding:

```http
GET /api/jobs/{JOB_ID}/approval
Authorization: Bearer <FLOW_STEWARD_TOKEN>
```

From the response, take the current gate's `thread_id` and `approval_id`, and
check that `allowed_actions` contains `approve`. Never substitute the job ID
for the thread ID or reuse an approval ID from an older gate.

Continue only if both identifiers were returned and `approve` is offered.
For a reviewed human-approval gate offering `approve`, send this explicit
decision with a stable retry key:

```http
POST /api/approvals/{THREAD_ID}
Authorization: Bearer <FLOW_STEWARD_TOKEN>
Content-Type: application/json
Idempotency-Key: docs-approval-{APPROVAL_ID}

{
  "approval_id": "<APPROVAL_ID>",
  "approved": true,
  "action": "approve",
  "comment": "Reviewed for the documentation smoke run."
}
```

HTTP 202 means the decision and resume intent are durable; execution remains
asynchronous. Repeating the same body and key may return a deduplicated result.
Changing the body for the same key is a conflict. A stale or already-resolved
gate returns `409`; an action outside `allowed_actions` also returns `409`
(`approval_action_not_allowed`). An expired replay record returns `410`.
Custom gates may offer `resume` or another action: use only an action offered by
that current gate, with the decision body appropriate to it. Do not treat
`resume` as a universal synonym for approving a human-review gate.

## Cleanup and failures

Cancel only a non-terminal disposable job with
`POST /api/jobs/{job_id}/cancel`. Flow Steward does not expose project creation
or deletion through the public allowlist; fixture lifecycle remains an
administrator responsibility.

Common failures are `403` scope/allowlist mismatch, `404` unknown or unauthorized
project/workflow/job, `409` approval/idempotency conflict,
`422` disabled or contract-invalid workflow, `429` admission pressure, and
`503` unavailable runtime.
