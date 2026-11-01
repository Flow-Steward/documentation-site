---
title: Report a Bug or Request a Feature
description: Report a Flow Steward problem on GitHub with the System Diagnostics report, clear steps to reproduce, and no private data.
---

# Report a Bug or Request a Feature

Bugs and feature requests go to the issue tracker of the application
repository: [Flow-Steward/flow-steward-app issues](https://github.com/Flow-Steward/flow-steward-app/issues).
A good report lets a maintainer reproduce the problem without asking you
anything else. This page shows what to collect and how to send it.

:::danger[Security problems are not public issues]
If the problem lets someone read, change or run something they should not,
do not open an issue. Email `security@flow-steward.org` with the subject prefix
`[SECURITY]`, as the repository's `SECURITY.md` describes.
:::

## 1. Search first

Search the [existing issues](https://github.com/Flow-Steward/flow-steward-app/issues?q=is%3Aissue),
open and closed, with a few words from the error message. If someone already
reported it, add a comment with your version and diagnostics instead of
opening a duplicate.

## 2. Download the System Diagnostics report

Attach this file to every bug report. It is one JSON file that says how your
installation is built and how it runs:

- Flow Steward version and image identity;
- Compact or Scalable, CPU architecture and resources;
- database and message broker versions;
- each service and its health;
- installed extensions with their version and state;
- which settings are customised.

It has **no logs, no job content and no setting values**, apart from a short
list of deployment-shape settings such as the profile, the storage backend and
the log level. Every configured secret is removed wherever it appears.

Get it in one of these ways (administrator only):

| Where | How | File |
|---|---|---|
| UI | **System → Monitoring**, then **Download diagnostics** | `flow-steward-diagnostics-<UTC stamp>.json` in your downloads |
| Server | `./flow-steward reports diagnostics` in the installation folder | `.flow-steward/diagnostics/flow-steward-diagnostics-<UTC stamp>.json` |
| API | `GET /api/system/diagnostics/report` with an administrator token | the same JSON |

The server command gives the most complete report, because it also records the
host, Docker, container and `doctor` facts. If you are not an administrator,
ask your administrator for the file. If the installation is too broken for
either method, include the output of `./flow-steward status` and
`./flow-steward doctor` instead.

**Open the file and glance through it before you attach it.** It is redacted,
but it still names your host, your extensions and which settings you changed.
See [Diagnose, Repair, and Move a Server](../deploy/diagnostics-and-migration#attach-a-diagnostic-report-to-a-bug-report)
for the full description.

:::warning[The job's "Download full report" is different]
A job page also offers **Download full report**. Secrets are redacted in it,
but it contains the job's messages, logs, events and step data, which is often
customer data. Do not attach it to a public issue. Say that you have it; a
maintainer can ask for it privately.
:::

## 3. Collect the facts

- **Version**: in the diagnostics file, or `./flow-steward release info`.
- **Exact error text**, copied rather than retyped.
- **Steps to reproduce**, numbered, from a known starting point. Repeat them
  once to make sure the problem still happens.
- **Expected and actual result**, one sentence each.
- **Job id, workflow id and the failing step** when a run failed. See
  [Failed-Run Diagnostics](failed-run-diagnostics) to find them.
- **Screenshots** of the error, cropped so they show no customer data, tokens
  or email addresses.
- **Since when**: did it work in an earlier version, and what changed (an
  update, a new extension, a setting)?

## 4. Never publish

Passwords, API keys, tokens, cookies, `.env` contents, connection strings,
private keys, setup links, or customer data (names, emails, orders, file
contents). Check log excerpts and screenshots too. Replace a value with
`<redacted>` when its shape matters.

## 5. Open the issue

Use a title that says what is wrong and where, for example "Workflow import
fails when a child workflow uses a Wait step". On GitHub, open
[New issue](https://github.com/Flow-Steward/flow-steward-app/issues/new/choose)
and pick **Bug report**: its form has a required field for the diagnostics
file and one field per section below. If you file from the command line with
`gh issue create`, paste this text instead:

```markdown
## What happened
<exact error text and where it appears>

## Steps to reproduce
1. ...

## Expected
...

## Actual
...

## Environment
- Flow Steward version: <x.y.z>
- Profile: Compact | Scalable
- Job id / workflow id: <if any>
- System Diagnostics report: attached

## Notes
<since when, what changed, workaround if any>
```

Then attach the diagnostics JSON and screenshots by dragging them into the
issue text box. If your browser refuses the `.json` file, zip it first.

From a terminal with the [GitHub CLI](https://cli.github.com/):

```bash
gh issue create --repo Flow-Steward/flow-steward-app --title "<title>" --body-file issue.md
```

`gh` cannot attach files: open the created issue in the browser and add the
diagnostics file in a comment.

### Feature requests

Describe the problem you have today, what you would like to do instead, and
how you work around it now. Diagnostics are optional for a feature request.

## Let an AI agent do it

The [Flow Steward agent plugin](../integrations/agent-plugin) includes the
`flow-steward-report-issue` skill. Ask your agent "Report this as a Flow
Steward bug": it searches existing issues, asks you for the diagnostics file,
drafts the issue for your review, and files it only after you agree.

## What happens next

A maintainer reads the issue and may ask a question. If you want to fix it
yourself, see [Contributing Code](../developer/contributing).
