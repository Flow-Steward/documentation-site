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

The commands and verification policy below reflect current `main`; they do not
establish that a particular release has been published.

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

You need Git, GitHub access (the examples use `gh`), Docker with Compose v2,
and `pre-commit` for the local hooks.

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

Develop on a Development installation, never on a production one. Select
Scalable explicitly: the default Compact profile requires Production.
Run the installer as the deployment owner, without `sudo`:

```bash
./install.sh --environment development --deployment-profile scalable --file-storage bundled
./flow-steward status
./flow-steward doctor
```

Development installs the core, the frontend and the `fs-test-runner` and
`fs-audit` containers used by tests and quality gates. Docker with Compose v2
runs the product and tests. `./flow-steward environment show` tells which
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
4. **Database changes** use SQL files in
   `db/migrations/YYYYMMDDHHMMSS_slug.sql`. `db/schema/` is the 1.0 baseline,
   but installed databases never re-read it. Changes to a released baseline,
   including the 0.9.x baseline, also need an idempotent migration and an
   updated `baseline_schema_fingerprint` in `db/released_migrations.json`.
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

Inspect the diff and return to the repository root before running the gate.

## 5. Verify in three tiers

All tiers run inside the disposable `fs-audit` container through
`./core/entrypoints/cli/scripts/lint.sh`. A test run on the host is not
evidence. Tier 1 runs locally; Tier 2 and Tier 3 run on disposable
GitHub-hosted Linux runners in the public source repository. Local Docker
runs of those gates remain a diagnostic or fallback option.
[Quality And Testing](quality-and-testing) describes the checks; the repository's
current testing standard defines their ownership and evidence rules.

| Tier | When | Command |
|---|---|---|
| 1 — iteration | while fixing; stops at the first failure | `./core/entrypoints/cli/scripts/lint.sh --checks targeted-tests --test-paths "auto tests/unit/<regression_test>.py"` |
| 1 — frontend | when you changed `assets/frontend/` | `./core/entrypoints/cli/scripts/lint.sh --checks frontend-targeted-tests --test-paths auto` |
| 2 — pushed change | after every public branch push | `./core/entrypoints/cli/scripts/lint.sh --fast` |
| 3 — merge | from the final committed public candidate, before merge to main | `./core/entrypoints/cli/scripts/lint.sh --full` |

`auto` picks the tests related to your diff against `main`. Add by path what
the import graph cannot see, such as runtime, database or extension tests.
The pre-commit hooks run affected backend and frontend Tier 1 tests with
`auto:HEAD`, selecting the current commit's delta. Those results do not replace
the remote gates.

The `Remote quality pilot` workflow runs Tier 2 after public branch pushes.
Its manual `release` mode runs the cumulative pre-merge gate; `release-sonar`
also runs the disposable Sonar pilot. The workflow is restricted to the public
`Flow-Steward/flow-steward-app` repository, so a fork push alone does not produce
that official evidence. Coordinate the public candidate with a maintainer.
A pull request may report Tier 3 as pending, but it must pass before merge.

Before expensive verification, integrate current main into the candidate.
Recheck main after verification and immediately before merge; if it advances
beyond the candidate, integrate it and verify the new SHA again.

`--full` validates or refreshes Tier 2 evidence for the candidate, runs the
Tier 3 checks and validates the cumulative result. The backend suite runs to
the end: group failures by root cause and fix them as one batch. Before another
full gate, run the failed and affected tests using `auto:<failed-sha>` plus
explicit failed backend test paths. For frontend retries, use either
`auto:<failed-sha>` or an explicit list that includes failed files and affected
consumers; do not combine both forms in one selection.

Database, authentication, security, runtime, extension-framework and deployment
changes always need Tier 3 before merge, however small the diff. Substantial
core changes also require full frontend/backend Sonar analysis; the disposable
pilot does not replace the existing Sonar release check until its baseline and
gates are reconciled.

Keep exact commands, exit codes, achieved tiers, candidate SHA and remote run
links. Check each run's repository, workflow, event, head SHA and conclusion;
the workflow configuration alone does not prove a run succeeded. A result for
another commit is not evidence for yours, except where the registry explicitly
allows reuse through a matching input fingerprint. Report blocked or unrun
checks explicitly.

## 6. Commit

Commit after the local Tier 1 checks pass. Never use `--no-verify`. Review and
stage regenerated tracked artifacts explicitly; the hooks do not stage them
for you. Write a one-line summary of what changes, in plain words, for example
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
- Tier 1: `lint.sh --checks targeted-tests --test-paths "auto ..."`: exit 0
- Tier 2: `lint.sh --fast` on <public commit SHA>: <result and run link>
- Tier 3: `lint.sh --full` on <public commit SHA>: <result and run link, or pending before merge>
- Screenshots: <before / after, for UI changes>

## Risk and not verified
<for example: not tried on ARM64 or on Scalable>
```

## 8. Review and merge

Answer every review comment, either with a change or with a reason. Push
fixes as new commits on the same branch. Rerun Tier 1 for the touched area,
let the local hooks pass before committing, and obtain remote Tier 2 evidence
after every public branch push. Update the verification section with the new
SHA and any pending checks before asking for another review.

Before merge, obtain a clean cumulative `--full` result for the final public
candidate with current main integrated. Recheck main and the evidence before
merging. A maintainer merges the pull request. Do not merge your own.

## With an AI agent

The [Flow Steward Developer package](../integrations/agent-plugin) includes the
`flow-steward-contribute-code` skill for this process. Follow the repository's
current `AGENTS.md` and canonical standards when the skill's embedded steps
lag behind them, including the verification tiers above. Agent permissions
also depend on your task instructions and client settings.
