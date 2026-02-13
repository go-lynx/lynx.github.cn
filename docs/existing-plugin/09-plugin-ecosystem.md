---
id: plugin-ecosystem
title: 插件生态
sidebar_label: 插件生态
slug: existing-plugin/plugin-ecosystem
---

# Go-Lynx 插件生态

Go-Lynx 提供丰富的**生产级插件**，覆盖服务通信、数据存储、消息队列、配置中心、可观测性与分布式能力。所有插件均采用统一的即插即用方式：在 YAML 中配置，由框架完成注入。

## 插件分类

### 服务与通信

| 插件 | 说明 | 文档 |
|--------|-------------|-----|
| [HTTP](/zh/docs/existing-plugin/http) | HTTP/HTTPS 服务，支持 TLS、中间件、指标与健康检查 | 有 |
| [gRPC](/zh/docs/existing-plugin/grpc) | gRPC 服务端与客户端，支持服务发现、TLS、熔断 | 有 |
| [Polaris](/zh/docs/existing-plugin/polaris) | 服务注册发现与流量管理 | 有 |
| [Nacos](/zh/docs/existing-plugin/nacos) | Nacos 注册发现与配置中心 | 有 |

### 数据库与存储

| 插件 | 说明 | 文档 |
|--------|-------------|-----|
| [Database](/zh/docs/existing-plugin/db) | 通用数据库（MySQL/PostgreSQL/SQL Server 等） | 有 |
| [Redis](/zh/docs/existing-plugin/redis) | Redis 客户端，连接池与指标 | 有 |
| [MongoDB](/zh/docs/existing-plugin/mongodb) | MongoDB 客户端，连接池、TLS、健康检查 | 有 |
| [Elasticsearch](/zh/docs/existing-plugin/elasticsearch) | Elasticsearch 集成，检索/索引/聚合 | 有 |

### 消息队列

| 插件 | 说明 | 文档 |
|--------|-------------|-----|
| [Kafka](/zh/docs/existing-plugin/kafka) | Apache Kafka 生产者/消费者，SASL、TLS、指标 | 有 |
| [RabbitMQ](/zh/docs/existing-plugin/rabbitmq) | RabbitMQ 生产者/消费者，多实例、健康与指标 | 有 |
| [RocketMQ](/zh/docs/existing-plugin/rocketmq) | Apache RocketMQ，集群/广播消费 | 有 |
| [Pulsar](/zh/docs/existing-plugin/pulsar) | Apache Pulsar，批处理、Schema、多租户 | 有 |

### 配置与发现

| 插件 | 说明 | 文档 |
|--------|-------------|-----|
| [Polaris](/zh/docs/existing-plugin/polaris) | 服务发现与配置 | 有 |
| [Nacos](/zh/docs/existing-plugin/nacos) | Nacos 配置与命名 | 有 |
| [Apollo](/zh/docs/existing-plugin/apollo) | Apollo 配置中心，多命名空间 | 有 |
| [Etcd](/zh/docs/existing-plugin/etcd) | Etcd 配置中心与服务注册发现 | 有 |

### 可观测与安全

| 插件 | 说明 | 文档 |
|--------|-------------|-----|
| [Tracer](/zh/docs/existing-plugin/tracer) | OpenTelemetry 分布式追踪 | 有 |
| [Swagger](/zh/docs/existing-plugin/swagger) | Swagger/OpenAPI 文档与 UI（仅开发/测试） | 有 |
| [Sentinel](/zh/docs/existing-plugin/sentinel) | 流控、熔断与系统保护 | 有 |
| [TLS Manager](/zh/docs/existing-plugin/tls-manager) | TLS 与证书管理 | 有 |

### 分布式与锁

| 插件 | 说明 | 文档 |
|--------|-------------|-----|
| [Seata](/zh/docs/existing-plugin/seata) | 分布式事务（Seata） | 有 |
| [DTM](/zh/docs/existing-plugin/dtm) | 分布式事务（DTM，SAGA/TCC/XA/二阶段消息） | 有 |
| [Redis Lock](/zh/docs/existing-plugin/redis-lock) | 基于 Redis 的分布式锁，续期、可重入 | 有 |
| [Etcd Lock](/zh/docs/existing-plugin/etcd-lock) | 基于 Etcd 的强一致分布式锁 | 有 |

### 其他

| 插件 | 说明 | 文档 |
|--------|-------------|-----|
| [Layout](/zh/docs/existing-plugin/layout) | 官方项目模板与脚手架 | 有 |
| [SQL SDK](/zh/docs/existing-plugin/sql-sdk) | SQL 基座、健康与指标、多数据源工具 | 有 |

图例：本站有文档 | 请参阅 GitHub 仓库

## 使用方式

1. **添加依赖**：`go get github.com/go-lynx/lynx/plugins/<名称>`（或该插件的模块路径）。
2. **配置**：在 `config.yaml` 中增加 `lynx.<插件>` 配置段。
3. **导入**：在 `main.go` 中 `import _ "github.com/go-lynx/lynx/plugins/<名称>"`（或按插件要求）。
4. **注入**：在 wire 中使用插件提供的 getter（如 `db.GetDriver`、`lynxRedis.GetRedis`）。

启动与插件顺序详见 [启动与配置](/zh/docs/getting-started/bootstrap-config) 与 [插件管理](/zh/docs/getting-started/plugin-manager)。

**相关文档：** [快速开始](/zh/docs/getting-started/quick-start) | [引导配置](/zh/docs/getting-started/bootstrap-config) | [插件管理](/zh/docs/getting-started/plugin-manager) | [框架架构](/zh/docs/intro/arch)
