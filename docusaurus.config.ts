import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)
const siteUrl = process.env.SITE_URL ?? 'https://flowsteward.org';
const baseUrl = process.env.BASE_URL ?? '/';

const config: Config = {
  title: 'Flow Steward',
  tagline: 'AI workflow automation with human approval gates',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: siteUrl,
  baseUrl,

  organizationName: 'Flow-Steward',
  projectName: 'documentation-site',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexBlog: false,
      },
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Flow Steward',
      logo: {
        alt: 'Flow Steward Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/docs/intro', label: 'Start Here', position: 'left'},
        {to: '/docs/user/dashboard', label: 'User Guide', position: 'left'},
        {to: '/docs/deploy/deployment-checklist', label: 'Deploy & Run', position: 'left'},
        {to: '/docs/integrations/built-in-mcp-quick-start', label: 'Integrations', position: 'left'},
        {to: '/docs/reference/cli', label: 'Reference', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Start Here',
              to: '/docs/intro',
            },
            {
              label: 'Dashboard',
              to: '/docs/user/dashboard',
            },
            {
              label: 'Workflow Export and Import',
              to: '/docs/user/workflow-promotion',
            },
          ],
        },
        {
          title: 'Operate',
          items: [
            {
              label: 'Deployment Checklist',
              to: '/docs/deploy/deployment-checklist',
            },
            {
              label: 'Observability',
              to: '/docs/deploy/observability',
            },
            {
              label: 'Events And Redrive',
              to: '/docs/admin/events-and-redrive',
            },
            {
              label: 'Backups And Restore',
              to: '/docs/deploy/backups-and-restore',
            },
          ],
        },
        {
          title: 'Build',
          items: [
            {
              label: 'Local Development',
              to: '/docs/developer/local-development',
            },
            {
              label: 'Build An Extension',
              to: '/docs/integrations/build-an-extension',
            },
            {
              label: 'Documentation Site',
              to: '/docs/developer/documentation-site',
            },
          ],
        },
        {
          title: 'Reference',
          items: [
            {
              label: 'CLI',
              to: '/docs/reference/cli',
            },
            {
              label: 'Configuration',
              to: '/docs/reference/configuration',
            },
            {
              label: 'Environment Variables',
              to: '/docs/reference/environment-variables',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Flow Steward contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
