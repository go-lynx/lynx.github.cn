---
id: overview
title: 概览
---

# 概览

Lynx 是一个面向 Go 微服务的**插件编排与运行时框架**。

它的重心不是“再套一层 Web 框架”，而是把微服务项目里反复出现的基础设施装配问题收敛到统一运行时模型中：插件注册、依赖排序、资源装配、生命周期控制、事件流，以及面向服务治理的集成能力。

> “Lynx” 这个名字来自猞猁，强调灵活、敏捷，以及对不同环境的适应能力。

## 现在应该如何理解 Lynx

理解当前 Lynx 代码库，最有效的心智模型是：

- **先看核心运行时**：插件注册、拓扑排序、资源所有权、生命周期和事件流是中心。
- **再看应用启动壳层**：`boot`、应用启动编排，以及面向控制面的辅助能力，用来把服务稳定地拉起来。
- **外围是一组插件家族**：HTTP、gRPC、配置中心、服务发现、数据库、消息队列、追踪、流控、事务和分布式锁等能力，以独立模块的形式接入。

因此在实践里，Lynx 更适合被理解为一层微服务基础设施装配层，而不是某个单一协议或中间件产品的轻量包装。

这点之所以重要，是因为 Lynx 里的大多数真实集成都是 runtime 管理型的：

- 插件先注册进全局 typed factory
- 插件管理器负责准备实例和排序
- unified runtime 暴露共享资源
- 应用代码再通过 Getter 或 plugin-manager lookup 去消费这些资源

## 你能获得什么

使用 Lynx，团队通常会得到：

- **更稳定的启动路径**：插件加载顺序、依赖关系和资源注册由框架统一编排。
- **更少的胶水代码**：数据库、消息队列、配置中心、服务发现、链路追踪等能力遵循同一套接入模型。
- **更清晰的运行时边界**：应用、插件、资源和治理职责更容易划分清楚。
- **更一致的团队工作流**：CLI、项目模板、配置结构、文档和插件契约保持同一条线。

## 当前官方模块范围

当前仓库家族已经覆盖框架核心和较完整的官方模块集合，包括：

- 服务与治理：HTTP、gRPC、Polaris、Nacos、Etcd、Apollo、Sentinel、Swagger、Tracer
- 数据与存储：Redis、MongoDB、Elasticsearch、MySQL、PostgreSQL、SQL Server、SQL SDK
- 消息与异步：Kafka、RabbitMQ、RocketMQ、Pulsar
- 分布式能力：Seata、DTM、Redis Lock、Etcd Lock、Eon ID
- 工程工具：Layout 模板与 Lynx CLI

站点已经覆盖主要模块和接入路径，后续也会继续补充更多模块页面。

从工程边界上看，可以大致分成三块：

- `github.com/go-lynx/lynx`：runtime core、boot、plugin manager、TLS、共享抽象
- `lynx-http`、`lynx-grpc`、`lynx-redis`、`lynx-tracer`、`lynx-sentinel` 这类独立插件模块
- Lynx CLI 和 `lynx-layout` 这类工程工具

## 官方模板实际从什么开始

如果你刚接触 Lynx，一个很实用的捷径是：不要默认以为官方模板会把整个插件家族全开起来。

当前 `lynx-layout` 最容易理解的方式，是把它分成三组：

- 本地 bootstrap 默认项：`lynx.http`、`lynx.grpc.service`、`lynx.mysql`、`lynx.redis`
- 治理 bootstrap 默认项：`lynx.application`、`lynx.polaris`
- 默认不启用：大多数消息、配置中心、锁、保护、文档、TLS 插件

这里还有一个值得单独记住的特例：tracer 已经被模板导入了，但默认本地配置里没有显式展开，所以它更像一个已经预留好的可观测性接入点，而不是一个肉眼可见的默认功能。

这也是为什么现在插件页会明确区分：

- 插件完整支持什么
- 官方模板当前实际启用了什么
- 还有哪些能力要再补一层显式配置才会真正生效

## 推荐阅读顺序

如果你是第一次接触 Lynx，建议按这个顺序读：

1. [快速开始](/docs/getting-started/quick-start)：先把 CLI、模板和启动流程跑起来。
2. [引导配置](/docs/getting-started/bootstrap-config)：理解本地引导配置和远程配置入口。
3. [插件使用指南](/docs/getting-started/plugin-usage-guide)：先掌握通用接入路径，再进入具体插件细节。
4. [插件管理](/docs/getting-started/plugin-manager)：理解排序、依赖解析和装配逻辑。
5. [插件生态](/docs/existing-plugin/plugin-ecosystem)：按能力域选择模块。
6. [框架架构](/docs/intro/arch)：理解分层运行时模型。

## 社区

如果你在使用或扩展 Lynx 时遇到问题，优先走社区渠道：

- [Discord](https://discord.gg/2vq2Zsqq)
- 钉钉 / 微信群（见下方）

### 贡献者列表

<a href="https://github.com/go-lynx/lynx/graphs/contributors">
 <img src="https://contrib.rocks/image?repo=go-lynx/lynx" alt="Contributor List"/>
</a>

### 钉钉群

<img alt="dingtalk" src="/img/dingtalk.png" width="400"/>
