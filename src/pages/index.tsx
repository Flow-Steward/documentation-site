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
          Operate autonomous delivery workflows with clear human control.
        </Heading>
        <p className={styles.heroCopy}>
          Flow Steward plans, runs, reviews, and coordinates AI-assisted software
          delivery while keeping approvals, jobs, tools, skills, and extensions
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
    title: 'User Guides',
    href: '/docs/user/getting-started',
    body: 'Install the stack, create the first admin user, load demo data, and understand the operator workspace.',
  },
  {
    title: 'Developer Docs',
    href: '/docs/developer/local-development',
    body: 'Work on the FastAPI, worker, React, database, extension, and quality-gate surfaces with the repo conventions.',
  },
  {
    title: 'Reference',
    href: '/docs/reference/cli',
    body: 'Keep CLI commands, configuration profiles, and release-readiness checks in one stable place.',
  },
];

const releaseTracks = [
  'Public quick start that can be followed from a clean checkout.',
  'Developer setup that separates product runtime, frontend iteration, and test runners.',
  'Extension authoring notes for tool, notification, and task providers.',
  'Release checklist for open source hygiene, security intake, and version policy.',
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="Flow Steward Documentation"
      description="Documentation for Flow Steward, an autonomous AI software delivery platform with human approval gates.">
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
