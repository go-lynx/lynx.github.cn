---
id: plugin-ecosystem
title: 插件生态
sidebar_label: 插件生态
---

# Lynx 插件生态

Lynx 的仓库族并不是一堆彼此无关的 SDK。核心 `lynx` 运行时会通过统一的插件工厂加载插件、按依赖和权重排序、暴露共享资源，并让业务代码通过稳定的 runtime 名称或 Getter 来消费能力。

## 正确阅读插件文档的方式

对于任意 Lynx 插件，最关键的四个事实是：

1. Go module 路径
2. 配置前缀
3. runtime 插件名
4. 启动后的公开 API

如果文档没有把这四件事写清楚，接入和排障都会很痛苦。

## Runtime 模型

大多数官方插件都遵循同一条路径：

1. 导入模块，让它的 `init()` 把插件注册进全局工厂
2. 在对应前缀下增加配置，例如 `lynx.http` 或 `lynx.apollo`
3. 让统一 runtime 完成资源初始化和 startup task
4. 通过 Getter 或 `GetPlugin("<runtime-name>")` 获取能力

这也是为什么 runtime 插件名不是内部细节，而是插件管理器里的真实查找键。

## 核心示例

| 模块 | Go module | 配置前缀 | Runtime 插件名 | 启动后公开 API |
|------|------|------|------|------|
| [HTTP](/docs/existing-plugin/http) | `github.com/go-lynx/lynx-http` | `lynx.http` | `http.server` | `http.GetHttpServer()` |
| [gRPC 服务端](/docs/existing-plugin/grpc) | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.service` | `grpc.service` | `grpc.GetGrpcServer(nil)` |
| [gRPC 客户端](/docs/existing-plugin/grpc) | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.client` | `grpc.client` | `grpc.GetGrpcClientPlugin(nil)`、`grpc.GetGrpcClientConnection(...)` |
| [Kafka](/docs/existing-plugin/kafka) | `github.com/go-lynx/lynx-kafka` | `lynx.kafka` | `kafka.client` | 插件实例方法，如 `ProduceWith`、`SubscribeWith` |
| [MongoDB](/docs/existing-plugin/mongodb) | `github.com/go-lynx/lynx-mongodb` | `lynx.mongodb` | `mongodb.client` | `GetMongoDB()`、`GetMongoDBDatabase()`、`GetMongoDBCollection()` |
| [Apollo](/docs/existing-plugin/apollo) | `github.com/go-lynx/lynx-apollo` | `lynx.apollo` | `apollo.config.center` | `GetConfigSources()`、`GetConfigValue()` |
| [Etcd](/docs/existing-plugin/etcd) | `github.com/go-lynx/lynx-etcd` | `lynx.etcd` | `etcd.config.center` | `GetClient()`、`GetConfigSources()`、`GetConfigValue()` |
| [Etcd Lock](/docs/existing-plugin/etcd-lock) | `github.com/go-lynx/lynx-etcd-lock` | `lynx.etcd-lock` | `etcd.distributed.lock` | `Lock`、`LockWithOptions`、`NewLockFromClient` |
| [DTM](/docs/existing-plugin/dtm) | `github.com/go-lynx/lynx-dtm` | `lynx.dtm` | `dtm.server` | `NewSaga`、`NewTransactionHelper`、`GetDtmMetrics()` |
| [Sentinel](/docs/existing-plugin/sentinel) | `github.com/go-lynx/lynx-sentinel` | `lynx.sentinel` | `sentinel.flow_control` | `GetSentinel()`、指标 API |
| [Tracer](/docs/existing-plugin/tracer) | `github.com/go-lynx/lynx-tracer` | `lynx.tracer` | `tracer.server` | tracer runtime 入口 |

## 侧边栏之外的仓库族

`lynx/plugins.json` 里当前还包含不少侧边栏没有完全展开说明的模块，例如：

- `lynx-mysql`
- `lynx-pgsql`
- `lynx-mssql`
- `lynx-eon-id`
- `lynx-layout`
- `lynx-sql-sdk`
- `lynx-redis-lock`
- `lynx-polaris`
- `lynx-pulsar`
- `lynx-rabbitmq`
- `lynx-rocketmq`

这些模块里有些是面向应用直接接入的插件，有些是共享能力层或模板工程。文档需要把角色区分开，而不是把它们都写成同一种东西。

## 常见消费模式

在代码里，插件访问大致会落到下面几种模式：

- runtime 持有的服务端 Getter：`http.GetHttpServer()`、`grpc.GetGrpcServer(nil)`
- 客户端 Getter：`mongodb.GetMongoDB()`、`elasticsearch.GetElasticsearch()`
- plugin-manager lookup：`lynx.Lynx().GetPluginManager().GetPlugin("dtm.server")`
- 插件对象 API：`apolloPlugin.GetConfigValue(...)`、`etcdPlugin.GetClient()`

看文档时，应该优先相信和这些真实模式一致的示例。

## 推荐阅读顺序

1. [插件使用指南](/docs/getting-started/plugin-usage-guide)
2. [引导配置](/docs/getting-started/bootstrap-config)
3. [插件管理](/docs/getting-started/plugin-manager)
4. 你要接入的具体插件页
5. [框架架构](/docs/intro/arch)
