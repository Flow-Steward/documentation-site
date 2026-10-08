import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Start Here',
      link: {
        type: 'generated-index',
        description: 'Fast orientation for builders, admins, operators, developers, and MCP client users.',
      },
      items: [
        'intro',
        'user/product-tour',
        'user/use-cases',
        'user/getting-started',
        'user/core-concepts',
        'user/feature-catalog',
      ],
    },
    {
      type: 'category',
      label: 'User Guide',
      link: {
        type: 'generated-index',
        description: 'Use Flow Steward through the UI: dashboards, projects, workflows, jobs, agents, data, MCP, extensions, and lifecycle controls.',
      },
      items: [
        'user/dashboard',
        'user/workspaces-and-projects',
        'user/project-knowledge-and-code-intelligence',
        'user/workflows',
        'user/workflow-and-extension-catalogs',
        'user/first-workflow',
        'user/workflow-promotion',
        'user/failed-run-diagnostics',
        'user/jobs-and-approvals',
        'user/agents-and-skills',
        'user/tools-and-mcp',
        'user/datasets-and-data-connections',
        'user/extensions',
        'user/registry-management',
        'user/trash-and-lifecycle',
      ],
    },
    {
      type: 'category',
      label: 'Admin & Operations',
      link: {
        type: 'generated-index',
        description: 'Administer users, providers, policy, audit evidence, events, queues, and operational controls.',
      },
      items: [
        'user/users-roles-and-access',
        'user/settings-and-model-providers',
        'admin/security-policy-and-redaction',
        'user/feature-configuration',
        'admin/events-and-redrive',
        'admin/audit-trail',
        'admin/queues-concurrency-retries-dlq',
        'user/monitoring-and-troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Deploy & Run',
      link: {
        type: 'generated-index',
        description: 'Install, update, observe, back up, recover, and troubleshoot Flow Steward deployments.',
      },
      items: [
        'deploy/installation',
        'deploy/installer-walkthrough',
        'deploy/platforms',
        'deploy/render',
        'deploy/elestio',
        'deploy/diagnostics-and-migration',
        'user/installation-and-updates',
        {
          type: 'link',
          label: 'Installer Reference',
          href: '/docs/reference/installer',
        },
        {
          type: 'link',
          label: 'Upgrade Reference',
          href: '/docs/reference/upgrade',
        },
        'deploy/deployment-checklist',
        {
          type: 'link',
          label: 'Environment Variables',
          href: '/docs/reference/environment-variables',
        },
        {
          type: 'link',
          label: 'Configuration',
          href: '/docs/reference/configuration',
        },
        'deploy/backups-and-restore',
        'deploy/storage-and-artifacts',
        'deploy/observability',
        'deploy/troubleshooting',
        'deploy/rollback',
        'deploy/architecture',
      ],
    },
    {
      type: 'category',
      label: 'Integrations & Extensions',
      link: {
        type: 'generated-index',
        description: 'Connect external systems, MCP clients, data sources, webhooks, and extension bundles.',
      },
      items: [
        'integrations/incoming-workflow-webhooks',
        'integrations/external-mcp-catalogs',
        'integrations/built-in-mcp-quick-start',
        'integrations/agent-plugin',
        'integrations/public-api-quick-start',
        {
          type: 'link',
          label: 'Datasets And Data Connections',
          href: '/docs/user/datasets-and-data-connections',
        },
        'integrations/extension-operator-guide',
        'integrations/build-an-extension',
        'integrations/extension-authoring-skill',
        'developer/integrations',
        'developer/extensions',
      ],
    },
    {
      type: 'category',
      label: 'Developer Platform',
      link: {
        type: 'generated-index',
        description: 'Develop Flow Steward itself and understand internal architecture, runtime, tests, and extension points.',
      },
      items: [
        'developer/local-development',
        'developer/quality-and-testing',
        'developer/architecture',
        'developer/workflow-runtime',
        'developer/mcp-server',
        'developer/project-knowledge-and-code-intelligence',
        'developer/operations-internals',
        'developer/cli-and-automation',
        'developer/documentation-site',
        'developer/contributing-documentation',
      ],
    },
    {
      type: 'category',
      label: 'API & Reference',
      link: {
        type: 'generated-index',
        description: 'Exact lookup for CLI, API, MCP, installer, environment, configuration, upgrades, and workflow contracts.',
      },
      items: [
        'reference/cli',
        'reference/api',
        'reference/configuration',
        'reference/environment-variables',
        'reference/mcp',
        'reference/workflow-step-kinds',
        'reference/limits-and-file-formats',
        'reference/installer',
        'reference/upgrade',
      ],
    },
  ],
};

export default sidebars;
