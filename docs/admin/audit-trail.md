---
sidebar_position: 7
title: Audit Trail
description: Understand what operational evidence Flow Steward records and where to inspect it.
---

# Audit Trail

Flow Steward's audit trail is distributed across job evidence, events, approvals,
runtime logs, lifecycle plans, and extension records. Start with the page that
matches the question you are trying to answer, then follow ids across surfaces.

## Evidence map

| Question | Primary surface |
|---|---|
| Who started this work? | Job detail, submitted task metadata, API caller, MCP caller, or scheduled task. |
| What did the agent or workflow do? | Job messages, logs, step traces, artifacts, and events. |
| Who approved or rejected a gate? | Approval packet and job approval history. |
| Which external provider was called? | Extension invocation, MCP connector records, HTTP step trace, or notification delivery. |
| Why did a deletion happen? | Trash lifecycle plan, restore plan, hard-delete plan, and operator action log. |
| Was sensitive data detected or changed? | Security findings, redaction records, project policy, and persisted job evidence. |
| Was an event replayed? | Event dispatch history and redrive metadata. |

## Investigation order

1. Open the job, workflow, project, or event that triggered the question.
2. Capture the stable id before navigating away.
3. Review the chronological event timeline.
4. Open job logs and messages for model, connector, and runtime evidence.
5. Review approvals before trusting a downstream action.
6. Check extension health and notification delivery records when an external
   system is involved.
7. Check trash lifecycle plans for deleted or restored objects.
8. Export or preserve evidence according to your incident process.

## Retention boundaries

Audit evidence is only useful while it is retained. Coordinate settings for job
logs, messages, events, retry queue records, trash, and artifacts with your
support and compliance needs.

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
- PII findings and redaction traces;
- debug logs from application services or extension runtimes.

Do not paste raw evidence into public issues or external support channels
without redaction.

## Related pages

- [Events And Redrive](events-and-redrive)
- [Jobs And Approvals](../user/jobs-and-approvals)
- [Trash And Lifecycle](../user/trash-and-lifecycle)
- [Security, Policy, And Redaction](security-policy-and-redaction)
