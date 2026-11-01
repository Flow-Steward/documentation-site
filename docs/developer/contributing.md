---
title: Contributing Code
description: The full path from finding a Flow Steward bug to a merged pull request - issue, fork, Development environment, regression test, quality tiers, pull request and review.
---

# Contributing Code

This page walks through one contribution to the core repository,
[Flow-Steward/flow-steward-app](https://github.com/Flow-Steward/flow-steward-app),
from a bug you noticed to a merged pull request. The repository is licensed
under Apache-2.0; by contributing you agree that your contribution is submitted
under that license.

Extensions and workflow templates are not added to the core repository. See
[Publish an Extension](publish-extension) and
[Publish a Workflow Template](publish-workflow).

The repository's own rules are the source of truth. They apply to people and
AI agents alike:

- `AGENTS.md` at the repository root;
- `docs/standards/README.md`, then `agent-workflow-standard.md` and
  `testing-standard.md`, then the standard for the area you touch
  (`architecture-standard.md`, `backend-python-standard.md`,
  `frontend-standard.md`, `security-standard.md`, `configuration-standard.md`);
- the ADRs in `docs/architecture/adr/`.

## 1. Find or open an issue

Search the [issues](https://github.com/Flow-Steward/flow-steward-app/issues)
first. If the problem is new, open an issue as described in
[Report a Bug or Request a Feature](../user/file-an-issue), with the System
Diagnostics report.

Say in the issue that you want to work on it. For anything larger than a small
bug fix — a new feature, a changed API or CLI contract, a database change, a
new dependency, a new architectural pattern — wait until a maintainer agrees on
the approach. One issue, one pull request, one change.

Security vulnerabilities go privately to `security@flow-steward.org`, never to
a public issue or pull request.

## 2. Fork, clone and branch

```bash
gh repo fork Flow-Steward/flow-steward-app --clone
cd flow-steward-app
git switch -c fix/<issue-number>-<short-slug>
pre-commit install --hook-type pre-commit
```

Use a full clone, not a shallow one. Before you start and before you open the
pull request, bring the branch up to date:

```bash
git fetch upstream
git rebase upstream/main
```

## 3. Install the Development environment

Develop on a Development installation, never on a production one:

```bash
./install.sh --environment development --file-storage bundled
./flow-steward status
./flow-steward doctor
```

Development installs the core, the frontend and the `fs-test-runner` and
`fs-audit` containers used by tests and quality gates. Docker with Compose v2
is the only host requirement. `./flow-steward environment show` tells which
environment is installed. Hot reload and the Compose helpers are described in
[Local Development](local-development).

## 4. Reproduce and fix

1. **Find the owning code and its tests.** Read the callers before you change
   a function.
2. **Write the regression test first** and run it to see it fail for the
   expected reason (see the Tier 1 command below).
3. **Fix the code** in the right layer: `core/entrypoints/` only adapts HTTP,
   CLI, MCP and other transports; `core/application/` owns business logic and
   repositories; `core/infrastructure/` owns technical adapters. Frontend code
   lives in `assets/frontend/` and reuses the existing components.
4. **Database changes** after 1.0 are SQL files in
   `db/migrations/YYYYMMDDHHMMSS_slug.sql`. `db/schema/` is the 1.0 baseline.
5. **Documentation**: update the guides in the same pull request when behavior,
   a command, an API or a setting changes. An architectural decision needs an
   ADR.
6. Keep unrelated cleanup out of the change.

After each batch of edits, format only the files you changed:

```bash
python -m ruff check --fix <changed-python-files>
python -m ruff format <changed-python-files>

cd assets/frontend
npx --no-install eslint --fix <changed-ts-or-tsx-files>
```

## 5. Verify in three tiers

All tiers run inside the disposable `fs-audit` container through
`./core/entrypoints/cli/scripts/lint.sh`. A test run on the host is not
evidence. [Quality And Testing](quality-and-testing) lists every check.

| Tier | When | Command |
|---|---|---|
| 1 — iteration | while fixing; stops at the first failure | `./core/entrypoints/cli/scripts/lint.sh --checks targeted-tests --test-paths "auto tests/unit/<regression_test>.py"` |
| 1 — frontend | when you changed `assets/frontend/` | `./core/entrypoints/cli/scripts/lint.sh --checks frontend-targeted-tests --test-paths auto` |
| 2 — commit | before every commit; the pre-commit hook runs it | `./core/entrypoints/cli/scripts/lint.sh --fast` |
| 3 — pull request | once, from the final commit | `./core/entrypoints/cli/scripts/lint.sh --full` |

`auto` picks the tests related to your diff against `main`. Add by path what
the import graph cannot see, such as runtime, database or extension tests.
Diagnose a failure before you run it again.

`--full` runs the complete backend suite to the end: group the failures by
root cause and fix them as one batch, then run `--full` again. Database,
authentication, security, runtime, extension-framework and deployment changes
always need Tier 3, however small the diff.

GitHub Actions are disabled in the repository. Your local gate result is the
evidence reviewers see, so keep the exact commands, exit codes and commit SHA.

## 6. Commit

Commit after Tier 2 passes. Never use `--no-verify`. Write a one-line summary
of what changes, in plain words, for example
`Keep every lane's writes when parallel lanes finish together`, and a body that
says why. Reference the issue with `Refs #<number>`.

Do not commit secrets, `.env` files, logs, screenshots, task plans or audit
reports. Tracked `docs/` holds current guides, contracts, standards and ADRs
only.

## 7. Open the pull request

```bash
git push -u origin fix/<issue-number>-<short-slug>
gh pr create --repo Flow-Steward/flow-steward-app --base main \
  --title "<one-line summary>" --body-file pr.md
```

Write the description for a reviewer who has not seen your work:

```markdown
Fixes #<issue>

## What was wrong
<one or two sentences>

## What changed
<the change, file areas, any docs or migration>

## Verification
- Regression test: `tests/unit/<file>.py::<test>` (failed before, passes now)
- `lint.sh --checks targeted-tests --test-paths "auto ..."`: exit 0
- `lint.sh --full` on <commit SHA>: exit 0
- Screenshots: <before / after, for UI changes>

## Risk and not verified
<for example: not tried on ARM64 or on Scalable>
```

## 8. Review and merge

Answer every review comment, either with a change or with a reason. Push
fixes as new commits on the same branch. Rerun Tier 1 for the touched area and
`--fast` before each commit, then `--full` once on the final commit, and update
the verification section with the new SHA before asking for another review.

A maintainer merges the pull request. Do not merge your own.

## With an AI agent

The [Flow Steward Developer package](../integrations/agent-plugin) includes the
`flow-steward-contribute-code` skill. It follows this page: issue first,
Development environment, regression test, the three tiers, and a pull request
with evidence. The agent still needs your approval to push and to open the
pull request.
