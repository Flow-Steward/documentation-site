---
sidebar_position: 4
title: Start And Observe A Workflow With The Public API
description: Submit the documentation smoke workflow and follow its durable job.
---

# Start And Observe A Workflow With The Public API

Use the same provider-free fixture as [First Workflow](../user/first-workflow).
An administrator must first import, bind, review, and enable
`docs_deterministic_smoke_v1`. On 2026-10-05, the exact downloadable fixture
completed through the API on a fresh disposable Compact installation at source
commit `eb1626b05d06ca893a451560df2b5e95b972c47e`, returning the declared
`normalized` output. A separate provider-free approval variant also completed
with its approved output; disallowed and stale decisions returned HTTP 409.
These are local installed checks, not production, MCP, or SSE acceptance.

## Credentials and scopes

Set `FLOW_STEWARD_URL`, `FLOW_STEWARD_TOKEN`, `PROJECT_ID`, and `WORKFLOW_ID`.
Use `WORKFLOW_ID=docs_deterministic_smoke_v1` unless import conflict handling
renamed it. `PROJECT_ID` must be the existing project UUID. The workflow must
admit its `mcp` trigger channel. The narrow minimum scope families are:

| Operation | Any accepted narrow scope |
|---|---|
| Read workflow contract | `workflows.read` |
| Start workflow | `workflows.write` |
| Read job, approval, or SSE | `jobs.read` |
| Submit approval decision or cancel | `jobs.write` |

Broader wildcard/read/command/admin scopes may also authorize these routes, but
do not widen a token merely to make this tutorial pass.

## Confirm the contract

```bash
curl --fail-with-body \
  -H "Authorization: Bearer ${FLOW_STEWARD_TOKEN}" \
  "${FLOW_STEWARD_URL}/api/projects/${PROJECT_ID}/workflows/${WORKFLOW_ID}/contract"
```

Confirm the required JSON input `payload` and required JSON output `normalized`.

## Submit and capture the job ID

This example requires `jq` only to capture the returned identifier:

```bash
response_file=$(mktemp)
curl --fail-with-body \
  -H "Authorization: Bearer ${FLOW_STEWARD_TOKEN}" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: docs-api-smoke-001' \
  -d "{\"project_id\":\"${PROJECT_ID}\",\"workflow_id\":\"${WORKFLOW_ID}\",\"test_mode\":true,\"inputs\":{\"payload\":{\"message\":\"hello\"}}}" \
  "${FLOW_STEWARD_URL}/api/workflow-runs" \
  -o "${response_file}"

JOB_ID=$(jq -er '.job_id' "${response_file}")
rm "${response_file}"
```

HTTP 200 accepts this asynchronous launch; it does not mean execution has
completed. The response supplies `project_id`, `job_id`, `status`, `queue`, and
`deduplicated`. Reuse the same idempotency key for an identical retry; use a new
key only for a deliberately new run. The API does not accept a task summary,
caller task ID, or file uploads in this request.

`test_mode` is not a general external-effect sandbox. Safety here comes from
the reviewed provider-free fixture.

## Observe the durable job

```bash
curl --fail-with-body \
  -H "Authorization: Bearer ${FLOW_STEWARD_TOKEN}" \
  "${FLOW_STEWARD_URL}/api/jobs/${JOB_ID}"
```

Wait for a terminal state and inspect the returned outputs. The expected output
variable is `normalized: {"message":"hello"}`. Assert that value as well as
`completed`; a completed job without the declared output does not pass this check.

For durable state events:

```bash
curl --no-buffer --fail-with-body \
  -H "Authorization: Bearer ${FLOW_STEWARD_TOKEN}" \
  -H 'Accept: text/event-stream' \
  "${FLOW_STEWARD_URL}/api/events/stream?job_id=${JOB_ID}"
```

Representative frames include:

```text
id: 1842
event: job.state
data: {"schema_version":"1","job_id":"job-987","project_id":"proj_42","workflow_id":"docs_deterministic_smoke_v1","status":"completed","terminal":true,"updated_at":"2026-09-17T12:00:00Z","result":{"outputs":{"normalized":{"message":"hello"}},"artifacts":{}}}

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

```bash
curl --fail-with-body \
  -H "Authorization: Bearer ${FLOW_STEWARD_TOKEN}" \
  "${FLOW_STEWARD_URL}/api/jobs/${JOB_ID}/approval"
```

Capture the current gate identifiers; never substitute the job ID for the
thread ID or reuse an approval ID from an older gate:

```bash
gate_file=$(mktemp)
curl --fail-with-body \
  -H "Authorization: Bearer ${FLOW_STEWARD_TOKEN}" \
  "${FLOW_STEWARD_URL}/api/jobs/${JOB_ID}/approval" \
  -o "${gate_file}"

THREAD_ID=$(jq -er '.thread_id' "${gate_file}")
APPROVAL_ID=$(jq -er '.approval_id' "${gate_file}")
jq -e '.allowed_actions | index("approve") != null' "${gate_file}"
rm "${gate_file}"
```

Continue only if both identifiers were returned and the action check succeeded.
For a reviewed human-approval gate offering `approve`, send this explicit
decision with a stable retry key:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer ${FLOW_STEWARD_TOKEN}" \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: docs-approval-${APPROVAL_ID}" \
  -d "{\"approval_id\":\"${APPROVAL_ID}\",\"approved\":true,\"action\":\"approve\",\"comment\":\"Reviewed for the documentation smoke run.\"}" \
  "${FLOW_STEWARD_URL}/api/approvals/${THREAD_ID}"
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
