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
          <img src="/img/lynx-arch.svg" alt="Lynx Architecture Sequence Diagram" className={styles.archImg} />
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
    <header className={clsx('hero hero--primary', styles.heroBanner, styles.heroGradient)}>
      <div className="container">
        <img className={styles.banner_logo} alt={'logo'} src={'img/logo.png'}/>
        <Heading as="h1" className="hero__title">
          <Typewriter
            options={{
              strings: [
                siteConfig.tagline,
                'Plug-and-Play Go Microservices Framework',
                'Plugin-driven, Modular, Easy to Use',
                'Make microservices development easier!',
              ],
              autoStart: true,
              loop: true,
              delay: 60,
              deleteSpeed: 40,
              pauseFor: 1800,
            }}
          />
        </Heading>
        <p className="hero__subtitle">
          Lynx proudly introduces a plugin-driven modular design, enabling the combination of microservice functionality modules through plugins. This unique approach allows for high customizability and adaptability to diverse business needs.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg started-button getStartedBtn"
            to="/docs/intro/overview">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h7v8l8-12h-7z" fill="#fff"/>
            </svg>
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg githubBtn"
            to="https://github.com/go-lynx/lynx">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.49 2.87 8.3 6.84 9.64.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" fill="#181717"/>
            </svg>
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
        <QuickStartSteps/>
        <HomepageFeatures/>
        <ArchitectureSection/>
      </main>
    </Layout>
  );
}
