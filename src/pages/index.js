import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {solarizedlight} from 'react-syntax-highlighter/dist/esm/styles/prism';
import Typewriter from 'typewriter-effect';
import ArchDiagram from './ArchDiagram.mdx';

const code_lynx = `
func main() {
    boot.LynxApplication(wireApp).Run()
}
`;

const quickStartSteps = [
  {
    title: '1. Install CLI Tool',
    desc: 'go install github.com/go-lynx/lynx/cmd/lynx@latest',
  },
  {
    title: '2. Initialize Project',
    desc: 'lynx new demo1 demo2',
  },
  {
    title: '3. Start with One Line',
    desc: 'boot.LynxApplication(wireApp).Run()',
  },
];

function QuickStartSteps() {
  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Three Steps to Start <span className={styles.gradientText}>Go-Lynx</span></h2>
        <div className={styles.quickStartFlowWrap}>
          {quickStartSteps.map((step, idx) => (
            <div className={styles.quickStartCardGlass} key={idx}>
              <div className={styles.quickStartCircle}>
                <span>{idx + 1}</span>
              </div>
              <div className={styles.quickStartStep}>{step.title}</div>
              <div className={styles.quickStartDesc}><code>{step.desc}</code></div>
              {idx < quickStartSteps.length - 1 && (
                <svg className={styles.quickStartArrow} width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="arrowGradient" x1="0" y1="12" x2="48" y2="12" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#e98c63"/>
                      <stop offset="1" stopColor="#ffb86c"/>
                    </linearGradient>
                  </defs>
                  <path d="M4 12H44M44 12L36 4M44 12L36 20" stroke="url(#arrowGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section className={styles.archSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Lynx Boot & Service Sequence</h2>
        <div className={styles.archMermaidWrap}>
          <ArchDiagram />
        </div>
        <p className={styles.archDesc}>
          The Lynx boot and service flow is clear at a glance. The plugin mechanism enables flexible expansion of microservice capabilities, greatly improving development efficiency and maintainability.
        </p>
        <div className={styles.archBtnWrap}>
          <Link className={styles.archBtn} to="/docs/intro/arch">
            View Full Architecture Diagram
          </Link>
        </div>
      </div>
    </section>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className={styles.heroInner}>
        <img className={styles.banner_logo} alt="Lynx" src="img/logo.png" />
        <Heading as="h1" className={styles.heroTitle}>
          <Typewriter
            options={{
              strings: [siteConfig.tagline],
              autoStart: true,
              loop: false,
            }}
          />
        </Heading>
        <p className={styles.heroSubtitle}>
          Plugin-driven, modular Go microservices framework. One line to run.
        </p>
        <div className={styles.buttons}>
          <Link className={styles.ctaPrimary} to="/docs/intro/overview">
            Get Started
          </Link>
          <a className={styles.ctaSecondary} href="https://github.com/go-lynx/lynx" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
        <div className={styles.codeBlock}>
          <SyntaxHighlighter language="go" style={solarizedlight} showLineNumbers={false} PreTag="div">
            {code_lynx}
          </SyntaxHighlighter>
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
        <QuickStartSteps/>
        <HomepageFeatures/>
        <ArchitectureSection/>
      </main>
    </Layout>
  );
}
