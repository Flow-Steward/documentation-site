---
sidebar_position: 5
title: Security, Policy, And Redaction
description: Configure security scanning, PII handling, and sensitive operational evidence.
---

# Security, Policy, And Redaction

Security policy controls how Flow Steward treats untrusted input, model-facing
context, tool payloads, and persisted operational evidence. Configure it before
running production workflows that process customer, employee, credential, or
repository data.

## Surfaces to review

| Surface | Risk |
|---|---|
| Task text and webhook payloads | External users can send sensitive or hostile input. |
| Tool and extension payloads | Providers may return secrets, PII, or large raw records. |
| Project knowledge | Curated records can expose sensitive context if their scope or content is wrong. |
| Model prompts and outputs | Prompt context can contain private business or code data. |
| Logs, events, and traces | Debug evidence can outlive the original job. |

## PII handling choices

| Mode | Use it when |
|---|---|
| `pseudonymize` | Operators need correlation without raw identifiers. |
| `hard_redact` | Stored evidence should remove detected sensitive values. |
| `allow` | You need detection records but must preserve payloads for a controlled environment. |

Use project-level custom regex rules for identifiers that matter to your
organization, such as customer ids, employee ids, ticket ids, internal tenant
ids, or provider-specific token formats.

## Scan enforcement


PII handling and scan enforcement are separate choices. The configured PII mode
does not by itself prove that an operation will be blocked.

| Scan mode | Behavior |
|---|---|
| `disabled` | Scanners are off. |
| `monitor` | Scan findings are recorded and stored-data redaction remains active, but the findings do not block the operation. Policy parse/resolution failures can still fail closed when `SECURITY_FAIL_CLOSED_ON_POLICY_ERROR=1`; see [Environment Variables](../reference/environment-variables). |
| `enforce_standard` | Standard enforcement can block operations that violate policy. |
| `enforce_strict` | Strict enforcement applies the blocking policy. |

The Security settings page shows a notice when blocking is off. Its security
posture is a periodic snapshot of recorded findings, not a manual “run scan”
action.

## Operating guidance

- Keep `SENTRY_SEND_DEFAULT_PII=0` unless policy explicitly allows otherwise.
- Disable extension debug payloads in normal production operation.
- Keep detailed runtime debug logs off unless investigating a specific issue.
- Review retention windows for logs, messages, events, trash, and artifacts.
- Confirm MCP and extension credentials use the narrowest practical scope.
- Treat screenshots and exported evidence as sensitive unless reviewed.

## Related pages

- [Feature Configuration](../user/feature-configuration)
- [Settings And Model Providers](../user/settings-and-model-providers)
- [Audit Trail](audit-trail)
- [Storage And Artifacts](../deploy/storage-and-artifacts)
