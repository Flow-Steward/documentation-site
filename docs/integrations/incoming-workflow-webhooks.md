---
sidebar_position: 1
title: Incoming Workflow Webhooks
description: Receive external events and start Flow Steward workflows.
---

# Incoming Workflow Webhooks

Incoming workflow webhooks let external systems start Flow Steward work through a
controlled workflow entrypoint.

The behavior below is available on main; availability in a published release or
an external provider's deployment is not established here.

## Use webhooks when

- an issue tracker, support tool, or internal service should submit work;
- a workflow must react to an external event;
- the caller should not use the full UI;
- the payload needs a stable workflow contract.

## Safe setup

1. Create or select the workflow that should receive the event and bind the
   entrypoint to a project linked to that workflow.
2. Define expected inputs and validation rules.
3. Configure the webhook entrypoint. Ingress is
   `POST /webhook/workflows/{entry_key}`. Generated absolute URLs use the
   configured platform public base URL; without it, the API returns a relative
   path.
4. Restrict content types, payload size, file count, and source IPs when
   possible.
5. Use a scoped token or secret per external system.
6. Run a test request with low-risk data.
7. Open the resulting job and verify inputs, messages, logs, events, and
   artifacts.

## Request and replay contract

Entry points can accept JSON, form, or multipart data according to their
declared content types. Map inputs only from supported roots: body, headers,
query, form, and files. Sensitive headers, including authentication headers and
configured signature/timestamp headers, cannot be mapped into workflow inputs.
Authentication modes are bearer token, shared-secret header, basic auth, legacy
HMAC-SHA256 (`hmac_sha256`), or configurable **Signed webhook (HMAC)**
(`webhook_signature`). Follow the saved entrypoint's authentication configuration
and the sender's signing requirements.

The configurable signed-webhook mode supports raw, prefixed, or comma-separated
key/value signatures, hex or base64 digests, and optional timestamp validation.
It verifies the exact raw request body using the configured signed-payload
recipe; do not reserialize JSON before signing. The editor supports generating a
signing secret or supplying an existing provider signing secret.

Configure body bytes, per-file bytes, file count, content types, and exact
IP/CIDR restrictions on the entry point. IP restrictions use the request's
client address, not forwarded headers. Creation defaults and maximums are
not the same as task-upload, provider-webhook, or extension-callback limits.
Oversize requests return `413`; admission pressure can return `429` with
`Retry-After`.

See [Workflow-run inputs and attachments](../reference/limits-and-file-formats#workflow-run-inputs-and-attachments)
for the current entrypoint defaults, create/update ranges, multipart field and
part limits, body-read timeout, and concurrent-preparation admission controls.
The default allowed content type is JSON; allow multipart explicitly before
accepting file-bearing requests.

Use `Idempotency-Key` when header idempotency is enabled. A successful replay
returns the same job with `deduplicated: true` and status `200`, unless response
mode is `no_content`, which returns an empty `204`. Payload conflicts return
`409`; expired replay results return `410`. For a new submission, response mode
is `accepted` (`202`), `ok` (`200`), or `no_content` (`204`). These modes acknowledge
submission rather than waiting for workflow completion.

Use the entry point's dry-run to check input mapping and validation, then inspect
delivery history for actual requests. Dry-run does not test ingress
authentication or launch a job. Rotate secrets or regenerate the entry key
deliberately; regenerating the key requires senders to use the new URL.

Provider triggers are a different ingress surface:
`POST /webhook/providers/{provider_key}`. Follow that provider integration's
signature and mapping contract; do not assume a generic workflow-webhook
configuration applies. The default provider body cap is 1 MiB, configurable via
`FS_PROVIDER_WEBHOOK_BODY_MAX_BYTES`. Pending provider delivery reservations can
be reclaimed after 120 seconds; this is a stale-processing threshold, not a
signature freshness or replay-retention window.

## Payload safety

Treat webhook payloads as untrusted. Apply project security policy, scan or
redact sensitive fields, and avoid passing raw external text into powerful tools
without validation.

## Related pages

- [Workflows](../user/workflows)
- [Workflow Export and Import](../user/workflow-promotion)
- [Events And Redrive](../admin/events-and-redrive)
