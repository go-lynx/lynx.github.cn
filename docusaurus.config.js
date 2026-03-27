// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

function getSearchPlugins() {
  try {
    require('@node-rs/jieba');
    return [
      [
        require.resolve('@easyops-cn/docusaurus-search-local'),
        {
          hashed: true,
          language: ['en', 'zh'],
        },
      ],
    ];
  } catch (error) {
    console.warn(
      '[docusaurus] Local search disabled because @node-rs/jieba is unavailable:',
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}


/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Lynx',
  tagline: 'The Plug-and-Play Go Microservices Framework',

  // Set the production url of your site here
  url: 'https://go-lynx.cn',
  // 站点在域名根路径（https://go-lynx.cn/），必须用 baseUrl: '/'
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'go-lynx',
  projectName: 'lynx.github.cn',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  deploymentBranch: 'gh-pages',

  // Use directory-style routes so locale switches and direct opens resolve to
  // .../index.html on static hosts instead of relying on .html fallback rules.
  trailingSlash: true,

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    // Keep the default locale first so `docusaurus start` serves the English
    // root routes locally instead of booting the dev server in `/zh/` only.
    locales: ['en', 'zh'],
    localeConfigs: {
      zh: {
        label: '中文',
      },
      en: {
        label: 'English',
      },
    },
  },
  plugins: getSearchPlugins(),
  presets: [
    [
      '@docusaurus/preset-classic',
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editLocalizedFiles: true,
          sidebarCollapsible: true,
          sidebarCollapsed: false,
          editUrl: 'https://github.com/go-lynx/lynx.github.cn/edit/main/',
        },
        blog: {
          showReadingTime: true,
          editLocalizedFiles: true,
          editUrl: 'https://github.com/go-lynx/lynx.github.cn/edit/main/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  themeConfig:
  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Go-Lynx',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Docs',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/go-lynx/lynx',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Overview', to: '/docs/intro/overview' },
              { label: 'Quick Start', to: '/docs/getting-started/quick-start' },
              { label: 'Plugin Usage Guide', to: '/docs/getting-started/plugin-usage-guide' },
              { label: 'Plugin Ecosystem', to: '/docs/existing-plugin/plugin-ecosystem' },
            ],
          },
          {
            title: 'Community',
            items: [
              { label: 'Discord', href: 'https://discord.gg/2vq2Zsqq' },
              { label: 'GitHub', href: 'https://github.com/go-lynx/lynx' },
            ],
          },
          {
            title: 'More',
            items: [
              { label: 'Website', href: 'https://go-lynx.cn' },
              { label: 'Blog', to: '/blog' },
              { label: 'GitHub', href: 'https://github.com/go-lynx/lynx' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Go-Lynx. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },
};

export default config;
