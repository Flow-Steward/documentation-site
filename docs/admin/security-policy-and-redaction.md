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
| `hard_redact` | Scanned text should replace detected PII with redaction markers. |
| `allow` | You need PII findings while preserving detected PII values in scanned text. Other scanners can still redact or block the payload. |

Pseudonyms are deterministic within a project for a given `SECURITY_PII_SALT`.
In production, set this variable to a unique secret value; startup rejects missing
or placeholder salts. Outside production, an unset salt is generated per process,
so pseudonyms can change across restarts.

Use project-level custom regex rules for identifiers that matter to your
organization, such as customer ids, employee ids, ticket ids, internal tenant
ids, or provider-specific token formats.

Account-wide policy supplies defaults; project overrides replace configured
fields and inherit the others. Policy controls scanner enablement, severity
thresholds, PII mode, and whether inbound, outbound, and tool surfaces are scanned
or skipped. Redaction depends on the enabled detectors and matching rules; it is
not a guarantee that every sensitive value will be detected.

## Scan enforcement

PII handling and scan enforcement are separate choices. The configured PII mode
does not by itself prove that an operation will be blocked.

Set the runtime scan mode with `SECURITY_SCAN_MODE`.

| Scan mode | Behavior |
|---|---|
| `disabled` | Security scanners are off. |
| `monitor` | Scan findings are recorded and stored-data redaction remains active, but the findings do not block the operation. Policy parse/resolution failures can still fail closed when `SECURITY_FAIL_CLOSED_ON_POLICY_ERROR=1`; see [Environment Variables](../reference/environment-variables). |
| `enforce_standard` | Applies the effective policy's enforcement decisions, including blocking. |
| `enforce_strict` | Also enables enforcement of the effective policy; this scan-mode value alone does not select the strict policy preset. |

The current main source defaults to `enforce_standard` in production and
`monitor` outside production. An absent deployment-environment marker is treated
as production. Invalid scan-mode values fall back to the environment's default.

Policy level (`minimal`, `standard`, or `strict`) is a separate setting. The
`strict` preset selects low severity thresholds, all injection contexts, and
`hard_redact` PII handling; explicit overrides are applied after the preset.
Disabled policies, disabled scanners, and skipped surfaces can bypass scanning
even when runtime enforcement is enabled.

The Security settings page shows a notice when its posture response explicitly
reports that blocking is off. Its security posture is a periodic snapshot of
recorded findings, not a manual “run scan” action. A high posture score does not
prove that blocking is enabled.

## Operating guidance

- Keep `SENTRY_SEND_DEFAULT_PII=0` unless policy explicitly allows otherwise.
- Keep `FS_EXTENSION_DEBUG_PAYLOADS=0` in normal production operation; enabling it bypasses extension payload redaction and truncation in the payload logger.
- Keep detailed runtime debug logs off unless investigating a specific issue.
- Review retention windows for logs, messages, events, trash, and artifacts.
- Confirm MCP and extension credentials use the narrowest practical scope.
- Treat screenshots and exported evidence as sensitive unless reviewed.

## Related pages

- [Feature Configuration](../user/feature-configuration)
- [Settings And Model Providers](../user/settings-and-model-providers)
- [Audit Trail](audit-trail)
- [Storage And Artifacts](../deploy/storage-and-artifacts)
