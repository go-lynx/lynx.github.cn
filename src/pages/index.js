import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {solarizedlight} from 'react-syntax-highlighter/dist/esm/styles/prism';

const code_lynx = `
func main() {
    boot.LynxApplication(wireApp).Run()
}
`;

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <img className={styles.banner_logo} alt={'logo'} src={'img/logo.png'}/>
        <Heading as="h1" className="hero__title">
          {siteConfig.tagline}
        </Heading>
        <p className="hero__subtitle">
          Lynx proudly introduces a plugin-driven modular design, enabling the combination of microservice functionality
          modules through plugins. This unique approach allows for high customizability and adaptability to diverse
          business needs.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg started-button"
            to="/docs/docs">
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="https://github.com/go-lynx/lynx">
            GitHub
          </Link>
        </div>
        <div className={styles.code_view}>
          <h4 className={styles.code_title}>
            Quick Start Code
          </h4>
          <div className="content">
            <SyntaxHighlighter language="go" style={solarizedlight}>
              {code_lynx}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader/>
      <main>
        <HomepageFeatures/>
      </main>
    </Layout>
  );
}
