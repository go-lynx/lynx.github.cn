import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Microservice Features',
    description: (
      <>
        Equipped with all aspects of microservices, including service discovery and registration, configuration center,
        distributed transaction management, communication encryption, and more.
      </>
    ),
  },
  {
    title: 'Plug-and-Play',
    description: (
      <>
        Go-lynx features plug-and-play integration of third-party functionalities. All modules are integrated in the
        form of <code>plugins</code>, which can be combined with each other, greatly enhancing the expandability of the
        plugins.
      </>
    ),
  },
  {
    title: 'Easy to Use',
    description: (
      <>
        The framework design is simple enough to eliminate complex design logic, allowing more focus on different
        plugins. Starting a microservice requires only a single line of code.
      </>
    ),
  },
];


function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          What Go-Lynx can do
        </Heading>
        <p className="hero__subtitle">Lynx is equipped with a comprehensive set of key microservices capabilities</p>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
