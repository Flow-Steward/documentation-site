import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader(): ReactNode {
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <p className={styles.kicker}>Flow Steward Documentation</p>
        <Heading as="h1" className={styles.heroTitle}>
          Operate AI workflows with clear human control.
        </Heading>
        <p className={styles.heroCopy}>
          Flow Steward runs, reviews, and coordinates AI-assisted
          workflows while keeping approvals, jobs, tools, skills, and extensions
          visible to the operator.
        </p>
        <div className={styles.actions}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intro">
            Start Reading
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/user/getting-started">
            Quick Start
          </Link>
        </div>
      </div>
    </header>
  );
}

const docAreas = [
  {
    title: 'User Guide',
    href: '/docs/user/dashboard',
    body: 'Use the dashboard, projects, workflows, jobs, agents, datasets, MCP catalogs, extensions, and lifecycle controls.',
  },
  {
    title: 'Admin & Operations',
    href: '/docs/admin/events-and-redrive',
    body: 'Administer users, providers, security policy, audit evidence, events, queues, retries, and monitoring.',
  },
  {
    title: 'Deploy & Run',
    href: '/docs/deploy/deployment-checklist',
    body: 'Install, update, observe, back up, recover, and troubleshoot production-like Flow Steward stacks.',
  },
  {
    title: 'Integrations & Extensions',
    href: '/docs/integrations/built-in-mcp-quick-start',
    body: 'Connect AI clients, external MCP catalogs, webhooks, data sources, provider callbacks, and extension bundles.',
  },
  {
    title: 'Developer Platform',
    href: '/docs/developer/local-development',
    body: 'Work on the app codebase, runtime, frontend, database, tests, MCP internals, and extension points.',
  },
  {
    title: 'API & Reference',
    href: '/docs/reference/cli',
    body: 'Look up CLI commands, API surfaces, MCP tools, workflow step kinds, installer options, config, and upgrades.',
  },
];

const releaseTracks = [
  'Start Here routes builders, admins, operators, developers, extension authors, and MCP users to the right lane.',
  'Admin and deploy runbooks separate production operations from everyday product usage.',
  'Integration docs give MCP and extension work a discoverable home without implying unsupported embedding features.',
  'Maintainer notes preserve audit coverage and documentation debt outside the primary customer path.',
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="Flow Steward Documentation"
      description="Documentation for Flow Steward, an AI workflow automation platform with human approval gates.">
      <HomepageHeader />
      <main>
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Documentation map</p>
              <Heading as="h2">Start with the path that matches your role.</Heading>
            </div>
            <div className={styles.docGrid}>
              {docAreas.map((area) => (
                <Link className={styles.docTile} to={area.href} key={area.title}>
                  <span>{area.title}</span>
                  <p>{area.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className="container">
            <div className={styles.releaseLayout}>
              <div>
                <p className={styles.eyebrow}>First release shape</p>
                <Heading as="h2">A public docs shell that can grow with the product.</Heading>
                <p>
                  This first cut uses docs-as-code: content lives as Markdown in
                  the site repository, builds to static files, and can be
                  deployed independently from the Flow Steward application.
                </p>
              </div>
              <ul className={styles.releaseList}>
                {releaseTracks.map((track) => (
                  <li key={track}>{track}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
