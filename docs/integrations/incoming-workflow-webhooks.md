---
sidebar_position: 1
title: Incoming Workflow Webhooks
description: Receive external events and start Flow Steward workflows.
---

# Incoming Workflow Webhooks

Incoming workflow webhooks let external systems start Flow Steward work through a
controlled workflow entrypoint.

## Use webhooks when

- an issue tracker, support tool, or internal service should submit work;
- a workflow must react to an external event;
- the caller should not use the full UI;
- the payload needs a stable workflow contract.

## Safe setup

1. Create or select the workflow that should receive the event.
2. Define expected inputs and validation rules.
3. Configure the webhook entrypoint. Ingress is
   `POST /webhook/workflows/{entry_key}`.
4. Restrict content types, payload size, file count, and source IPs when
   possible.
5. Use a scoped token or secret per external system.
6. Run a test request with low-risk data.
7. Open the resulting job and verify inputs, messages, logs, events, and
   artifacts.

## Request and replay contract

Entry points can accept JSON, form, or multipart data according to their
declared content types. Map inputs only from supported roots: body, headers,
query, form, and files. Authentication modes are bearer token, shared-secret
header, basic auth, or HMAC-SHA256; the UI-generated secret and signature
instructions for that entry point are authoritative.

Configure body bytes, per-file bytes, file count, content types, and exact
IP/CIDR restrictions on the entry point. Creation defaults and maximums are
not the same as task-upload, provider-webhook, or extension-callback limits.
Oversize requests return `413`; admission pressure can return `429` with
`Retry-After`.

See [Workflow-run inputs and attachments](../reference/limits-and-file-formats#workflow-run-inputs-and-attachments)
for the current entrypoint defaults, create/update ranges, multipart field and
part limits, body-read timeout, and concurrent-preparation admission controls.
The default allowed content type is JSON; allow multipart explicitly before
accepting file-bearing requests.

Use `Idempotency-Key` when header idempotency is enabled. A replay returns the
same job with `deduplicated: true`; conflicting or expired keys return `409` or
`410`. Response mode is `accepted` (`202`), `ok` (`200`), or `no_content`
(`204`). Use the entry point's dry-run and delivery history before enabling an
external sender, then rotate secrets or regenerate the entry key deliberately.

Provider triggers are a different ingress surface:
`POST /webhook/providers/{provider_key}`. Their signature header/algorithm and
mapping are provider-specific; do not reuse a generic workflow-webhook HMAC
recipe. The default provider body cap is 1 MiB and the replay window is 120
seconds in this candidate.

## Payload safety

Treat webhook payloads as untrusted. Apply project security policy, scan or
redact sensitive fields, and avoid passing raw external text into powerful tools
without validation.

## Related pages

- [Workflows](../user/workflows)
- [Workflow Export and Import](../user/workflow-promotion)
- [Events And Redrive](../admin/events-and-redrive)
