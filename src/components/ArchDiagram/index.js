import React from 'react';
import {useLocation} from '@docusaurus/router';
import Mermaid from '@theme/Mermaid';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const zhDiagram = `
flowchart TB
  classDef entry fill:#1f2937,stroke:#111827,color:#f9fafb,stroke-width:2px
  classDef core fill:#0f766e,stroke:#134e4a,color:#ecfeff,stroke-width:2px
  classDef runtime fill:#0b57d0,stroke:#1d4ed8,color:#eff6ff,stroke-width:2px
  classDef plugin fill:#d97706,stroke:#92400e,color:#fff7ed,stroke-width:2px
  classDef service fill:#7c3aed,stroke:#5b21b6,color:#f5f3ff,stroke-width:2px
  classDef observability fill:#be185d,stroke:#9d174d,color:#fdf2f8,stroke-width:2px
  classDef resource fill:#475569,stroke:#334155,color:#f8fafc,stroke-width:2px

  User([开发者 / 运维]):::entry --> CLI[CLI / main.go]:::entry
  CLI --> Boot[Boot 配置装配]:::core
  Boot --> Lynx[Lynx Application]:::core

  subgraph RuntimePlane[统一运行时]
    direction TB
    Manager[Plugin Manager]:::runtime
    Resolver[依赖解析 / 拓扑排序]:::runtime
    Lifecycle[生命周期编排]:::runtime
    Lynx --> Manager
    Manager --> Resolver
    Resolver --> Lifecycle
  end

  subgraph PluginPlane[插件能力层]
    direction LR
    DB[(DB / SQL)]:::plugin
    Cache[(Redis / Cache)]:::plugin
    MQ[(MQ / Streaming)]:::plugin
    Discovery[(Registry / Discovery)]:::plugin
    Tracing[(Tracing / Metrics)]:::observability
  end

  Lifecycle --> DB
  Lifecycle --> Cache
  Lifecycle --> MQ
  Lifecycle --> Discovery
  Lifecycle --> Tracing

  subgraph ResourcePlane[资源与治理]
    direction LR
    Private[私有资源]:::resource
    Shared[共享资源]:::resource
    Events[事件系统]:::resource
    Guard[熔断 / 限流 / 健康检查]:::observability
  end

  DB --> Private
  Cache --> Shared
  MQ --> Events
  Discovery --> Guard
  Tracing --> Guard

  subgraph ServicePlane[服务出口]
    direction LR
    Http[HTTP]:::service
    Grpc[gRPC]:::service
    Admin[Control Plane]:::service
  end

  Shared --> Http
  Shared --> Grpc
  Guard --> Admin
  Events -.监控与回传.-> Lynx
`;

const enDiagram = `
flowchart TB
  classDef entry fill:#1f2937,stroke:#111827,color:#f9fafb,stroke-width:2px
  classDef core fill:#0f766e,stroke:#134e4a,color:#ecfeff,stroke-width:2px
  classDef runtime fill:#0b57d0,stroke:#1d4ed8,color:#eff6ff,stroke-width:2px
  classDef plugin fill:#d97706,stroke:#92400e,color:#fff7ed,stroke-width:2px
  classDef service fill:#7c3aed,stroke:#5b21b6,color:#f5f3ff,stroke-width:2px
  classDef observability fill:#be185d,stroke:#9d174d,color:#fdf2f8,stroke-width:2px
  classDef resource fill:#475569,stroke:#334155,color:#f8fafc,stroke-width:2px

  User([Developer / Operator]):::entry --> CLI[CLI / main.go]:::entry
  CLI --> Boot[Boot Config Wiring]:::core
  Boot --> Lynx[Lynx Application]:::core

  subgraph RuntimePlane[Unified Runtime]
    direction TB
    Manager[Plugin Manager]:::runtime
    Resolver[Dependency Graph / Sort]:::runtime
    Lifecycle[Lifecycle Orchestration]:::runtime
    Lynx --> Manager
    Manager --> Resolver
    Resolver --> Lifecycle
  end

  subgraph PluginPlane[Capability Plugins]
    direction LR
    DB[(DB / SQL)]:::plugin
    Cache[(Redis / Cache)]:::plugin
    MQ[(MQ / Streaming)]:::plugin
    Discovery[(Registry / Discovery)]:::plugin
    Tracing[(Tracing / Metrics)]:::observability
  end

  Lifecycle --> DB
  Lifecycle --> Cache
  Lifecycle --> MQ
  Lifecycle --> Discovery
  Lifecycle --> Tracing

  subgraph ResourcePlane[Resources & Governance]
    direction LR
    Private[Private Resources]:::resource
    Shared[Shared Resources]:::resource
    Events[Event System]:::resource
    Guard[Circuit Breaker / Rate Limit / Health]:::observability
  end

  DB --> Private
  Cache --> Shared
  MQ --> Events
  Discovery --> Guard
  Tracing --> Guard

  subgraph ServicePlane[Service Surface]
    direction LR
    Http[HTTP]:::service
    Grpc[gRPC]:::service
    Admin[Control Plane]:::service
  end

  Shared --> Http
  Shared --> Grpc
  Guard --> Admin
  Events -.feedback / telemetry.-> Lynx
`;

export default function ArchDiagram() {
  const {i18n} = useDocusaurusContext();
  const location = useLocation();
  const locale =
    i18n?.currentLocale === 'zh' || location.pathname.startsWith('/zh')
      ? 'zh'
      : 'en';

  return (
    <Mermaid
      value={locale === 'zh' ? zhDiagram : enDiagram}
      config={{
        theme: 'base',
        securityLevel: 'loose',
        flowchart: {
          curve: 'basis',
          htmlLabels: true,
          nodeSpacing: 34,
          rankSpacing: 44,
          useMaxWidth: false,
        },
      }}
    />
  );
}
