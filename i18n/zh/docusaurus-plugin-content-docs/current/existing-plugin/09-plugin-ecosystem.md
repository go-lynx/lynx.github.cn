---
id: plugin-ecosystem
title: 插件生态
sidebar_label: 插件生态
---

# Lynx 插件生态

这页是导航图，不是插件配置说明。它的作用是帮助你判断下一篇应该读哪个插件页，以及理解某个插件的职责边界到底止步于哪里，哪里开始属于外部系统或其他插件。

## 如何读一篇插件文档

对任意 Lynx 插件来说，最关键的四个事实仍然是：

1. Go module 路径
2. 配置前缀
3. runtime 插件名
4. 启动后的公开 API

靠这四件事，你才能判断插件如何被加载、如何在 runtime 里查找，以及它是否真的适合你的接入点。插件生态页本身没有独立 YAML，因为它不是 runtime 插件。

## 按目标导航

| 目标 | 从这里开始 | 你真正要做的选择 |
|------|------|------|
| 暴露服务入口 | [HTTP](/docs/existing-plugin/http)、[gRPC](/docs/existing-plugin/grpc)、[TLS](/docs/existing-plugin/tls)、[Swagger](/docs/existing-plugin/swagger) | 服务入口、端口、middleware / interceptor 接面 |
| 使用存储与分布式锁 | [Database Plugin](/docs/existing-plugin/db)、[SQL SDK](/docs/existing-plugin/sql-sdk)、[MongoDB](/docs/existing-plugin/mongodb)、[Redis](/docs/existing-plugin/redis)、[Redis Lock](/docs/existing-plugin/redis-lock)、[Etcd Lock](/docs/existing-plugin/etcd-lock) | 共享客户端、锁语义、存储特定 API |
| 接配置中心或治理控制面 | [Apollo](/docs/existing-plugin/apollo)、[Nacos](/docs/existing-plugin/nacos)、[Etcd](/docs/existing-plugin/etcd)、[Polaris](/docs/existing-plugin/polaris) | 外部控制面，而不是业务接口 |
| 接事务或分布式标识能力 | [Seata](/docs/existing-plugin/seata)、[DTM](/docs/existing-plugin/dtm)、[Eon ID](/docs/existing-plugin/eon-id) | 外部协调器、ID 位分配，以及运行所有权边界 |
| 接流量保护与观测钩子 | [Sentinel](/docs/existing-plugin/sentinel)、[Tracer](/docs/existing-plugin/tracer) | 资源命名、保护策略、观测面 |
| 接异步消息系统 | [Kafka](/docs/existing-plugin/kafka)、[RabbitMQ](/docs/existing-plugin/rabbitmq)、[RocketMQ](/docs/existing-plugin/rocketmq)、[Pulsar](/docs/existing-plugin/pulsar) | Broker 客户端、投递语义、topic 所有权 |
| 理解模板与生命周期 | [Layout](/docs/existing-plugin/layout)、[插件使用指南](/docs/getting-started/plugin-usage-guide)、[插件管理](/docs/getting-started/plugin-manager) | 脚手架默认导入了什么、runtime 管什么、插件如何排序 |

## 最重要的依赖边界

| 页面 | 它依赖什么 | 它不负责什么 | 建议一起读 |
|------|------|------|------|
| [Seata](/docs/existing-plugin/seata) | 外部 Seata 协调器，以及被引用的 Seata client YAML | 业务代码里的事务边界定义 | [DTM](/docs/existing-plugin/dtm) |
| [DTM](/docs/existing-plugin/dtm) | 外部 DTM 服务端，以及可选的 gRPC / TLS 资产 | 分支业务接口本身，以及编排语义设计 | [Seata](/docs/existing-plugin/seata) |
| [Sentinel](/docs/existing-plugin/sentinel) | 来自 HTTP、gRPC 或业务 wrapper 的稳定资源名 | 动态配置中心规则装载，以及自动资源命名设计 | [HTTP](/docs/existing-plugin/http)、[gRPC](/docs/existing-plugin/grpc) |
| [Eon ID](/docs/existing-plugin/eon-id) | 开启自动注册时所需的共享 Redis | Redis 的部署，以及关闭自动注册后的唯一性担保 | [Redis](/docs/existing-plugin/redis) |
| [Redis Lock](/docs/existing-plugin/redis-lock) | 可用的 Redis 插件与明确的锁所有权约定 | Redis 部署、连接初始化、业务重试策略 | [Redis](/docs/existing-plugin/redis) |
| [Apollo](/docs/existing-plugin/apollo)、[Nacos](/docs/existing-plugin/nacos)、[Etcd](/docs/existing-plugin/etcd) | 外部配置 / 服务发现控制面 | 应用侧对每个配置 key 的本地语义校验 | [引导配置](/docs/getting-started/bootstrap-config) |

## 一仓不一定一页

- `lynx-mysql`、`lynx-pgsql`、`lynx-mssql` 这些具体 SQL 插件，更适合先通过 [Database Plugin](/docs/existing-plugin/db) 和 [SQL SDK](/docs/existing-plugin/sql-sdk) 一起理解。
- `lynx-layout` 是服务模板，不是 runtime 插件，所以应当归到 [Layout](/docs/existing-plugin/layout)。
- `lynx-redis-lock` 是构建在 Redis 之上的能力层，最好和 [Redis Lock](/docs/existing-plugin/redis-lock) 以及 [Redis](/docs/existing-plugin/redis) 一起读。
- `lynx-eon-id` 以前更像是生态页里的顺带说明，但现在它的 Redis 依赖、fail-closed 行为、位分配约束都足够具体，已经值得单列独立页面。

## 常见消费模式

在代码里，插件访问大致会落到下面几种模式：

- runtime 持有的服务端 Getter：`http.GetHttpServer()`、`grpc.GetGrpcServer(nil)`
- 客户端 Getter：`mongodb.GetMongoDB()`、`elasticsearch.GetElasticsearch()`
- 包级运行时 helper：`eonid.GenerateID()`、`eonid.ParseID(id)`
- plugin-manager lookup：`lynx.Lynx().GetPluginManager().GetPlugin("dtm.server")`
- 插件对象 API：`apolloPlugin.GetConfigValue(...)`、`etcdPlugin.GetClient()`

看文档时，应该优先相信与这些真实查找模式一致的示例。它们往往也是区分“runtime 持有的服务端插件”和“客户端 wrapper / 能力层插件”的最快办法。

## 推荐阅读顺序

1. [插件使用指南](/docs/getting-started/plugin-usage-guide)
2. [引导配置](/docs/getting-started/bootstrap-config)
3. [插件管理](/docs/getting-started/plugin-manager)
4. 你要接入的具体插件页
5. [框架架构](/docs/intro/arch)
