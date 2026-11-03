---
sidebar_position: 7
title: Audit Trail
description: Understand what operational evidence Flow Steward records and where to inspect it.
---

# Audit Trail

Flow Steward's audit trail is distributed across job evidence, events, approvals,
runtime logs, lifecycle plans, and extension records. Start with the page that
matches the question you are trying to answer, then follow ids across surfaces.

The evidence described here reflects the reviewed source on main. Availability
in an installation depends on its version, configured storage, access scope, and
retention. Some observability writes are best-effort; an absent record does not
prove that an operation never happened.

## Evidence map

| Question | Primary surface |
|---|---|
| Who started this work? | Job detail and trigger metadata; command audit records with account, actor type, actor id, target, status, and result where the command dispatch path is used. |
| What did the agent or workflow do? | Job messages, logs, step traces, artifacts, and events. |
| Who approved or rejected a gate? | Approval packet and job approval history, including approval id, action, actor, comment, and timestamp where recorded. |
| Which external provider was called? | Extension invocation, MCP connector records, HTTP step trace, or notification delivery. |
| Why did a deletion happen? | Available trash, restore, or hard-delete plans and lifecycle action records; hard-delete audit records include the entity, actor, account, and status. |
| Was sensitive data detected or changed? | Security events and findings with recorded actions and redacted previews, project policy, and persisted job evidence. |
| Was an event replayed? | Event dispatch history, linked commands, and available `event.redrive.requested` records. |
| What authentication activity was recorded? | Action log entries with an `auth_` action type, username, status, and authentication details where emitted. |

Extension invocation audit payloads are bounded projections of identifiers,
status codes, counts, and selected context. Do not expect a complete request or
response transcript.

Notification configuration and extension health do not establish delivery.
Review delivery status, errors, and provider message ids where recorded. These
records alone cannot certify receipt or processing by an external system.

## Investigation order

1. Open the job, workflow, project, or event that triggered the question.
2. Capture the stable id before navigating away; preserve related command,
   dispatch, approval, and trace ids where available.
3. Review the chronological event timeline. Event detail includes dispatch
   attempts and linked commands.
4. Open job logs and messages for model, connector, and runtime evidence.
5. Review approvals before trusting a downstream action.
6. Check extension health and notification delivery records when an external
   system is involved.
7. Review lifecycle action records and any preserved plans for deleted or
   restored objects. Preserve a plan before executing it when it is needed for
   your investigation.
8. Export or preserve evidence according to your incident process.

Manual event redrive requeues failed dispatches; it does not prove successful
replay. Check subsequent attempts and outcomes. The redrive audit event is
best-effort.

## Retention boundaries

Audit evidence is only useful while it is retained. Coordinate settings for job
logs, messages, events, retry queue records, trash, and artifacts with your
support and compliance needs.

System retention settings cover action logs, job messages, trash, terminal job
checkpoints, and retained revisions. Their fallback defaults are 30 days for the
four time windows and five revisions; saved account settings can override them.
These controls do not represent one universal retention window for every audit
surface. Review the retention cleanup configuration and artifact lifecycle
separately.

Short retention reduces storage and sensitive-data exposure. Longer retention
improves incident reconstruction. Pick windows intentionally and document the
trade-off.

## Sensitive evidence

Treat these as sensitive by default:

- prompt and model-facing context;
- uploaded files and generated artifacts;
- extension request and response payloads;
- webhook payloads;
- provider credentials or callback secrets;
- PII findings and redacted previews;
- debug logs from application services or extension runtimes.

Security finding records contain redacted previews rather than raw secrets or
PII. Their persistence is best-effort. Check the active scan mode as well as the
findings: monitor mode does not block operations, and disabled mode turns the
scanners off. Missing findings are not proof that data was scanned or safe.

Do not paste raw evidence into public issues or external support channels
without redaction.

## Related pages

- [Events And Redrive](events-and-redrive)
- [Jobs And Approvals](../user/jobs-and-approvals)
- [Trash And Lifecycle](../user/trash-and-lifecycle)
- [Security, Policy, And Redaction](security-policy-and-redaction)
