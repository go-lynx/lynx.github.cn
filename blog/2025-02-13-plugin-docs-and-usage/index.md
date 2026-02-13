---
slug: plugin-docs-and-usage-guide
title: Go-Lynx 插件文档完善与使用指南
authors: [lynx-team]
tags: [docs, plugins, guide, elasticsearch, rabbitmq, rocketmq, pulsar, apollo, etcd, dtm, redis-lock, layout]
---

# Go-Lynx 插件文档完善与使用指南

**发布日期**: 2025年2月13日

本站对 Go-Lynx 的**插件文档**做了一轮补充与整理：新增十余个插件的独立说明页，并增加了统一的**插件使用指南**，方便你从配置到上手指南一站查全。

<!--truncate-->

## 文档更新概览

### 新增插件文档页

以下插件此前仅在 [插件生态](/docs/existing-plugin/plugin-ecosystem) 中提供 GitHub 链接，现已在本站拥有独立文档，包含**配置说明**与**如何使用**：

- **[Elasticsearch](/docs/existing-plugin/elasticsearch)** — 全文检索、索引与聚合，健康检查与指标
- **[RabbitMQ](/docs/existing-plugin/rabbitmq)** — 多实例生产者/消费者、Exchange 类型与健康指标
- **[RocketMQ](/docs/existing-plugin/rocketmq)** — 集群/广播消费、多 Topic 订阅与健康检查
- **[Pulsar](/docs/existing-plugin/pulsar)** — 生产/消费、批处理、Schema、多租户与 TLS
- **[Apollo](/docs/existing-plugin/apollo)** — 配置中心、多 Namespace、监听与熔断
- **[Etcd](/docs/existing-plugin/etcd)** — 配置中心与服务注册发现
- **[Redis 分布式锁](/docs/existing-plugin/redis-lock)** — 基于 Redis 的分布式锁、续期与可重入
- **[Etcd 分布式锁](/docs/existing-plugin/etcd-lock)** — 基于 Etcd 的强一致分布式锁
- **[DTM](/docs/existing-plugin/dtm)** — 分布式事务（SAGA、TCC、XA、二阶段消息）
- **[Layout](/docs/existing-plugin/layout)** — 官方项目模板与本地无 Polaris 开发
- **[SQL SDK](/docs/existing-plugin/sql-sdk)** — SQL 公共能力与多数据源

上述页面中均包含：**功能概览**、**配置项说明**、**依赖与引入**、**代码示例**（获取客户端、发送/消费、健康与指标）以及**相关链接**。

### 新增「插件使用指南」

在 [入门](/docs/getting-started/quick-start) 中新增 **[插件使用指南](/docs/getting-started/plugin-usage-guide)**，统一说明：

1. **添加依赖** — 如何通过 `go get` 引入插件
2. **在配置中声明** — `lynx.<插件名>` 的配置方式与依赖关系
3. **注册插件** — 匿名导入与启动时加载
4. **在业务中注入使用** — Getter 与插件管理器的使用方式

并附**常见场景速查表**（HTTP/gRPC、数据库、缓存、消息队列、配置中心、服务发现、分布式事务与锁、链路追踪、脚手架等），便于按需求快速跳到对应插件文档。

### 插件生态页更新

[插件生态](/docs/existing-plugin/plugin-ecosystem) 中的表格已更新：原先仅链到 GitHub 的插件，现已改为链到本站对应文档，并补充了简短描述，方便在站内完成从选型到配置、使用的闭环。

## 如何使用插件（速览）

- 打开 **[插件生态](/docs/existing-plugin/plugin-ecosystem)** 按类别找到目标插件。
- 阅读该插件的独立文档（配置 + 如何使用）。
- 若不熟悉通用流程，可先看 **[插件使用指南](/docs/getting-started/plugin-usage-guide)** 中的四步用法与场景速查。

## 后续计划

- 继续补充各插件的**最佳实践**与**常见问题**。
- 根据社区反馈增加更多示例（如多数据源、多实例消息队列等）。
- 保持与主仓库及各插件仓库 README 的同步更新。

感谢使用 Go-Lynx。若有文档建议或发现错误，欢迎在 [lynx.github.cn](https://github.com/go-lynx/lynx.github.cn) 提 Issue 或 PR。

## 相关链接

- **文档首页**: [go-lynx.cn](https://go-lynx.cn)
- **插件生态**: [插件生态一览](/docs/existing-plugin/plugin-ecosystem)
- **插件使用指南**: [插件使用指南](/docs/getting-started/plugin-usage-guide)
- **快速开始**: [Quick Start](/docs/getting-started/quick-start)
