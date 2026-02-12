/**
 * Creating a sidebar enables you to:
 * - create an ordered group of docs
 * - render a sidebar for each doc of that group
 * - provide next/previous navigation
 *
 * Explicitly list Existing-Plugin docs so all 14 plugin pages (including 09-14) appear in the menu.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Intro',
      link: { type: 'generated-index' },
      items: [
        'intro/01-overview',
        'intro/02-design',
        'intro/04-arch',
      ],
    },
    {
      type: 'category',
      label: 'Getting-Started',
      link: { type: 'generated-index' },
      items: [
        'getting-started/01-quick-start',
        'getting-started/02-bootstrap-config',
        'getting-started/03-plugin-manager',
      ],
    },
    {
      type: 'category',
      label: 'Existing-Plugin',
      link: { type: 'generated-index' },
      items: [
        'existing-plugin/01-tls-manager',
        'existing-plugin/02-db',
        'existing-plugin/03-http',
        'existing-plugin/04-grpc',
        'existing-plugin/05-polaris',
        'existing-plugin/06-tracer',
        'existing-plugin/07-seata',
        'existing-plugin/08-redis',
        'existing-plugin/09-plugin-ecosystem',
        'existing-plugin/10-nacos',
        'existing-plugin/11-kafka',
        'existing-plugin/12-mongodb',
        'existing-plugin/13-sentinel',
        'existing-plugin/14-swagger',
      ],
    },
  ],
};

export default sidebars;
