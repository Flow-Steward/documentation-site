---
sidebar_position: 4
title: Deployment Checklist
description: Evidence checklist before a Flow Steward stack is opened to shared or production work.
---

# Deployment Checklist

Use this checklist for the final release candidate, not merely for a source
checkout that happens to build. Provider-specific guides are considered tested
only when they name the candidate, topology, successful health evidence, and
verification date. The [Installation](installation), [Render](render), and
[Elestio](elestio) guides retain dated provider acceptance from upstream main,
including their image identities and restart-preservation checks. These are
bounded installation checks; they do not certify AI workflows, full recovery,
or every later source candidate. Record fresh evidence for the version you deploy.

## Host and installation evidence

- The exact candidate SHA or immutable image set is recorded.
- For a checkout installation, Docker and Compose are already installed and
  available to the non-root operator. For provider Compact, the provider
  deployment/volume contract is verified separately.
- The applicable installation procedure completed: checkout `./install.sh`
  completed/resumed without ambiguous/recovery-required state, or the provider
  procedure has independent candidate-specific evidence.
- The selected environment, storage, TLS mode, public host, and public port are
  recorded from installer-owned configuration.
- Required ports are exposed only to approved networks. A host reverse proxy
  uses loopback backends; a Docker proxy uses a dedicated shared network.
  Public TLS, DNS and streaming are checked separately. Current Docker-proxy
  readiness limitations in the [walkthrough](installer-walkthrough) are resolved
  before declaring that branch accepted.
- Durable PostgreSQL, queue, bundled-storage, logs, extensions, projects, TLS,
  and installer-state locations are understood.

## Production provenance

Scalable production Compose requires independent role images and provenance, including:

- `FS_APP_IMAGE` and `FS_APP_IMAGE_DIGEST`;
- `FS_WORKER_IMAGE` and `FS_WORKER_IMAGE_DIGEST`;
- `FS_CONTROL_IMAGE` and `FS_CONTROL_IMAGE_DIGEST`;
- `MCP_IMAGE`, `MCP_IMAGE_DIGEST`, and their release revision values.

`FS_IMAGE` is not a replacement for this role-specific set. Record the catalog
or source evidence that supplied each pin. Compact has a different runtime topology;
record its Compact runtime image and the retained database/queue identities rather
than requiring separate app/worker/MCP images.

## Core readiness

```bash
./flow-steward status
./flow-steward doctor
./flow-steward release info
./flow-steward release check
./flow-steward database status
```

On Scalable, also inspect `./flow-steward stack status`. Compact does not carry
that retained CLI command. Check each selected profile separately.

- Core checks are green; optional AI warnings are classified separately.
  Doctor **NOT CHECKED** entries and provider `no_docker` output are recorded as
  unavailable checks, not successful ones. Intentional maintenance is understood
  before any targeted `doctor --fix`.
- First-administrator bootstrap is complete and the bootstrap-only path is
  closed.
- PostgreSQL, RabbitMQ, app, worker, control plane, MCP, CLI runtime, public
  route, and selected storage pass their applicable readiness checks.
- Production-required secrets such as `FS_METRICS_TOKEN`, signing/encryption
  keys, worker MCP identity, and the separate `FS_BACKUP_ENCRYPTION_KEY` are
  present without being copied into the evidence record.

Model-provider credentials are not a core-install prerequisite. Configure and
verify a supported account provider only before testing AI-dependent features.

## Recovery readiness

- On checkout installations, `./flow-steward backup create`, `backup list`, and
  `backup verify` have been exercised on the candidate. Provider deployments
  have separately tested PostgreSQL/broker/persistent-volume recovery.
- Off-host copies exist for encrypted database backups and the key needed to
  decrypt them.
- Object storage, extensions/projects, TLS material, configuration, image pins,
  and external-system state have their own recovery plan.
- A destructive restore was rehearsed only against a disposable target and its
  parity evidence was retained.
- Upgrade and rollback procedures keep Maintenance Mode enabled until health
  and preservation checks pass.
- A server move uses the [Clone migration procedure](diagnostics-and-migration),
  retains the source in maintenance and reviews copied external effects before
  cutover. A separate target rollback Clone exists when required.

## Product smoke test

1. Sign in with the role being documented.
2. Verify workspace/project scope and create no real external effects.
3. Run the deterministic local workflow tutorial.
4. Inspect the resulting job, logs/messages, artifacts, approvals, and events.
5. Test API or MCP access only with a minimum-scope disposable token.
6. Verify one supported integration only when test credentials and cleanup are
   available.
7. Capture sanitized evidence and remove disposable records where supported.

## Readiness decision

Record documentation readiness, installation readiness, and release/deployment
status separately. A successful documentation build is not installation proof.
If no supported setup path has completed on the final candidate, report a
release/tester blocker instead of checking this list as complete.

## Related pages

- [Installation And Updates](../user/installation-and-updates)
- [Installer Reference](../reference/installer)
- [Backups And Restore](backups-and-restore)
- [Observability](observability)
