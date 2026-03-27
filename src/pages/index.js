import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {oneDark} from 'react-syntax-highlighter/dist/esm/styles/prism';
import ArchDiagram from '@site/src/components/ArchDiagram';

const code_lynx = `func main() {
    if err := boot.NewApplication(wireApp).Run(); err != nil {
        panic(err)
    }
}`;

const contentByLocale = {
  zh: {
    heroEyebrow: '面向插件化微服务的 Go 框架',
    heroTitle: '从脚手架到运行时，把微服务基础设施收进去',
    heroSignals: ['CLI 脚手架', '插件运行时', '服务治理'],
    quickStartTitle: '三步开始使用 Lynx',
    quickStartSteps: [
      {
        title: '1. 安装 CLI 工具',
        desc: 'go install github.com/go-lynx/lynx/cmd/lynx@latest',
      },
      {
        title: '2. 初始化项目',
        desc: 'lynx new demo1 demo2',
      },
      {
        title: '3. 一行启动',
        desc: 'boot.NewApplication(wireApp).Run()',
      },
    ],
    heroSummary:
      'CLI 脚手架、插件注册、配置装配、服务治理与常见中间件接入，统一放进同一套开发体验里。',
    proofPoints: [
      {label: '定位', value: '插件运行时'},
      {label: '入口', value: 'CLI + 文档'},
      {label: '场景', value: '治理型微服务'},
    ],
    runtimeCardTitle: '默认开发路径',
    runtimeCardItems: [
      '用 CLI 起项目与目录骨架',
      '通过配置声明插件能力',
      '按运行时顺序完成装配与启动',
    ],
    ctaPrimary: '快速开始',
    ctaSecondary: '查看插件生态',
    ctaTertiary: '阅读架构设计',
    archTitle: 'Lynx 启动与服务时序',
    archDesc:
      'Lynx 的启动与服务流转一目了然。插件机制可以灵活扩展微服务能力，显著提升开发效率与可维护性。',
    archCta: '查看完整架构图',
    heroSubtitle: '插件驱动的模块化 Go 微服务框架。',
    valueTitle: '为什么首页先看 Lynx',
    valueDesc:
      '它不是再造一个 Web 框架，而是把你在微服务项目里反复拼装的基础能力做成统一的运行时和插件系统。',
    valueItems: [
      {
        title: '用 CLI 起项目，不再从模板手改',
        description: '初始化项目、补齐配置骨架、对齐目录结构，把第一次可运行状态尽快拉起来。',
      },
      {
        title: '用插件接能力，不再散落在业务代码里',
        description: '数据库、消息队列、配置中心、服务发现、链路追踪等能力以统一方式接入与装配。',
      },
      {
        title: '用统一运行时控生命周期',
        description: '插件加载顺序、资源管理与启动流程被放进同一套运行时模型里，减少隐式耦合。',
      },
    ],
  },
  en: {
    heroEyebrow: 'A Plugin-Driven Go Framework for Microservices',
    heroTitle: 'Bring scaffolding, runtime, and service wiring into one system',
    heroSignals: ['CLI Scaffolding', 'Plugin Runtime', 'Service Governance'],
    quickStartTitle: 'Three Steps to Start Lynx',
    quickStartSteps: [
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
        desc: 'boot.NewApplication(wireApp).Run()',
      },
    ],
    heroSummary:
      'Scaffolding, plugin registration, configuration wiring, service governance, and common middleware integrations in one development flow.',
    proofPoints: [
      {label: 'Model', value: 'Plugin Runtime'},
      {label: 'Entry', value: 'CLI + Docs'},
      {label: 'Fit', value: 'Governed Services'},
    ],
    runtimeCardTitle: 'Default Build Path',
    runtimeCardItems: [
      'Create the service scaffold from the CLI',
      'Declare capabilities through config',
      'Wire and boot them in one runtime sequence',
    ],
    ctaPrimary: 'Quick Start',
    ctaSecondary: 'Browse Plugins',
    ctaTertiary: 'Read Architecture',
    archTitle: 'Lynx Boot & Service Sequence',
    archDesc:
      'The Lynx boot and service flow is clear at a glance. The plugin mechanism enables flexible expansion of microservice capabilities, greatly improving development efficiency and maintainability.',
    archCta: 'View Full Architecture Diagram',
    heroSubtitle: 'A modular Go microservices framework built around plugins.',
    valueTitle: 'Why Start With Lynx',
    valueDesc:
      'It is not trying to be another web framework. It packages the repeated microservice setup work into a single runtime and plugin model.',
    valueItems: [
      {
        title: 'Start from CLI instead of hand-editing templates',
        description: 'Create projects, bootstrap config, and get to a runnable service faster with a consistent layout.',
      },
      {
        title: 'Integrate capabilities through plugins instead of scattered glue code',
        description: 'Databases, queues, config centers, service discovery, and tracing follow one integration model.',
      },
      {
        title: 'Control lifecycle through one runtime model',
        description: 'Load order, resource ownership, and startup flow are managed in one place, reducing hidden coupling.',
      },
    ],
  },
};

function QuickStartSteps({copy}) {
  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>{copy.quickStartTitle}</h2>
        <div className={styles.quickStartFlowWrap}>
          {copy.quickStartSteps.map((step, idx) => (
            <div className={styles.quickStartCardGlass} key={idx}>
              <div className={styles.quickStartCircle}>
                <span>{idx + 1}</span>
              </div>
              <div className={styles.quickStartStep}>{step.title}</div>
              <div className={styles.quickStartDesc}><code>{step.desc}</code></div>
              {idx < copy.quickStartSteps.length - 1 && (
                <svg className={styles.quickStartArrow} width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="arrowGradient" x1="0" y1="12" x2="48" y2="12" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#c96f4a"/>
                      <stop offset="1" stopColor="#e98c63"/>
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

function ArchitectureSection({copy}) {
  const archPath = useBaseUrl('/docs/intro/arch');

  return (
    <section className={styles.archSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>{copy.archTitle}</h2>
        <div className={styles.archMermaidWrap}>
          <ArchDiagram />
        </div>
        <p className={styles.archDesc}>{copy.archDesc}</p>
        <div className={styles.archBtnWrap}>
          <Link className={styles.archBtn} to={archPath}>
            {copy.archCta}
          </Link>
        </div>
      </div>
    </section>
  );
}

function HomepageHeader() {
  const {i18n} = useDocusaurusContext();
  const location = useLocation();
  const currentLocale =
    i18n?.currentLocale === 'zh' || location.pathname.startsWith('/zh')
      ? 'zh'
      : i18n?.currentLocale;
  const copy = contentByLocale[currentLocale === 'en' ? 'en' : 'zh'];
  const overviewPath = useBaseUrl('/docs/intro/overview');
  const pluginPath = useBaseUrl('/docs/existing-plugin/plugin-ecosystem');
  const architecturePath = useBaseUrl('/docs/intro/design');

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className={styles.heroInner}>
        <div className={styles.heroLayout}>
          <div className={styles.heroCopy}>
            <div className={styles.heroLead}>
              <img className={styles.banner_logo} alt="Lynx" src="img/logo.png" />
              <div className={styles.heroLeadText}>
                <div className={styles.heroEyebrow}>{copy.heroEyebrow}</div>
                <p className={styles.heroSubtitle}>{copy.heroSubtitle}</p>
                <p className={styles.heroSummary}>{copy.heroSummary}</p>
              </div>
            </div>
            <div className={styles.buttons}>
              <Link className={styles.ctaPrimary} to={overviewPath}>
                {copy.ctaPrimary}
              </Link>
              <Link className={styles.ctaSecondary} to={pluginPath}>
                {copy.ctaSecondary}
              </Link>
              <Link className={styles.ctaGhost} to={architecturePath}>
                {copy.ctaTertiary}
              </Link>
              <a className={styles.ctaGhost} href="https://github.com/go-lynx/lynx" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
            <div className={styles.signalRow}>
              {copy.heroSignals.map((signal) => (
                <span className={styles.signalChip} key={signal}>{signal}</span>
              ))}
            </div>
            <div className={styles.proofGrid}>
              {copy.proofPoints.map((point) => (
                <div className={styles.proofCard} key={point.label}>
                  <span className={styles.proofLabel}>{point.label}</span>
                  <strong className={styles.proofValue}>{point.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.runtimeCard}>
              <span className={styles.runtimeCardKicker}>
                {currentLocale === 'zh' ? '运行时' : 'Runtime'}
              </span>
              <h3>{copy.runtimeCardTitle}</h3>
              <ul className={styles.runtimeList}>
                {copy.runtimeCardItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.codeBlockWindow}>
              <div className={styles.codeBlockWindowTitle}>
                <div className={styles.codeBlockWindowDots}>
                  <span className={styles.codeBlockWindowDot} />
                  <span className={styles.codeBlockWindowDot} />
                  <span className={styles.codeBlockWindowDot} />
                </div>
                <span className={styles.codeBlockWindowFilename}>main.go</span>
              </div>
              <div className={styles.codeBlock}>
                <SyntaxHighlighter language="go" style={oneDark} showLineNumbers={false} PreTag="div">
                  {code_lynx}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ValueSection({copy}) {
  return (
    <section className={styles.valueSection}>
      <div className="container">
        <div className={styles.valueIntro}>
          <h2 className={styles.sectionTitle}>{copy.valueTitle}</h2>
          <p className={styles.valueDesc}>{copy.valueDesc}</p>
        </div>
        <div className={styles.valueGrid}>
          {copy.valueItems.map((item, index) => (
            <article className={styles.valueCard} key={item.title}>
              <span className={styles.valueCardIndex}>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig, i18n} = useDocusaurusContext();
  const location = useLocation();
  const currentLocale =
    i18n?.currentLocale === 'zh' || location.pathname.startsWith('/zh')
      ? 'zh'
      : i18n?.currentLocale;
  const copy = contentByLocale[currentLocale === 'en' ? 'en' : 'zh'];
  const description =
    currentLocale === 'zh'
      ? 'Go-Lynx 是面向微服务的插件编排与运行时框架，提供 CLI 脚手架、统一运行时、服务治理与常见中间件接入能力。'
      : 'Go-Lynx is a plugin orchestration and runtime framework for microservices with CLI scaffolding, a unified runtime, service governance, and common middleware integrations.';
  return (
    <Layout
      title={`${siteConfig.title}`}
      description={description}>
      <HomepageHeader/>
      <main>
        <QuickStartSteps copy={copy}/>
        <ValueSection copy={copy}/>
        <HomepageFeatures/>
        <ArchitectureSection copy={copy}/>
      </main>
    </Layout>
  );
}
