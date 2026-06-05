import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Flow Steward',
  tagline: 'Autonomous software delivery with human approval gates',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://flowsteward.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'flow-steward',
  projectName: 'flow-steward-doc',

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
    image: 'img/flow-steward-workflow-builder.png',
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
        {to: '/docs/user/getting-started', label: 'User Guides', position: 'left'},
        {to: '/docs/developer/local-development', label: 'Developer', position: 'left'},
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
              label: 'Overview',
              to: '/docs/intro',
            },
            {
              label: 'Getting Started',
              to: '/docs/user/getting-started',
            },
            {
              label: 'Architecture',
              to: '/docs/developer/architecture',
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
              label: 'Extensions',
              to: '/docs/developer/extensions',
            },
            {
              label: 'Release Readiness',
              to: '/docs/reference/release-readiness',
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
