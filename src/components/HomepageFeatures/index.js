import clsx from 'clsx';
import {useLocation} from '@docusaurus/router';
import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

const featureContent = {
  zh: {
    title: 'Lynx 首页该先记住什么',
    subtitle: '不是能力列表堆砌，而是三件最容易感知到差异的事情。',
    list: [
      {
        icon: 'CLI',
        title: 'CLI 脚手架',
        description: '从初始化项目、生成配置骨架到本地启动，先把服务跑起来，再逐步接入业务模块。',
      },
      {
        icon: 'PLG',
        title: '插件式能力接入',
        description: '数据库、消息队列、配置中心、服务发现、链路追踪等能力遵循同一套插件模型。',
      },
      {
        icon: 'RT',
        title: '统一运行时',
        description: '插件注册、生命周期、资源装配与启动顺序被收敛到同一层，减少胶水代码。',
      },
    ],
  },
  en: {
    title: 'What To Remember First',
    subtitle: 'Not a vague feature list, but the three differences you will notice immediately.',
    list: [
      {
        icon: 'CLI',
        title: 'CLI Scaffolding',
        description: 'Create a service, generate the config skeleton, and reach a runnable state before wiring business modules.',
      },
      {
        icon: 'PLG',
        title: 'Plugin-Based Integration',
        description: 'Databases, queues, config centers, service discovery, and tracing all follow the same plugin model.',
      },
      {
        icon: 'RT',
        title: 'Unified Runtime',
        description: 'Registration, lifecycle, resource wiring, and startup order are managed in one runtime layer.',
      },
    ],
  },
};


function Feature({icon, title, description}) {
  return (
    <article className={styles.featureCard}>
      <div className={styles.featureIconWrap}>
        <span className={styles.featureIcon}>{icon}</span>
      </div>
      <div className={styles.featureBody}>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </article>
  );
}

export default function HomepageFeatures() {
  const {i18n} = useDocusaurusContext();
  const location = useLocation();
  const currentLocale =
    i18n?.currentLocale === 'zh' || location.pathname.startsWith('/zh')
      ? 'zh'
      : i18n?.currentLocale;
  const copy = featureContent[currentLocale === 'zh' ? 'zh' : 'en'];
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featuresIntro}>
          <span className={styles.sectionKicker}>Capabilities</span>
          <Heading as="h2" className="hero__title">
            {copy.title}
          </Heading>
          <p className="hero__subtitle">{copy.subtitle}</p>
        </div>
        <div className={styles.featureGrid}>
          {copy.list.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
