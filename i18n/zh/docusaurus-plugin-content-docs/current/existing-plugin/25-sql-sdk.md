---
id: sql-sdk
title: SQL SDK
---

# SQL SDK

`lynx-sql-sdk` 是 MySQL、PostgreSQL、MSSQL 等具体 SQL 插件共用的底层能力层，它本身不是 `plugins.json` 里的独立插件条目。

## 它本质上是什么

这个 SDK 提供：

- 共享的 `interfaces.SQLPlugin` 契约
- 稳定的 `DBProvider` 抽象
- SQL 插件通用配置字段
- 可复用的 `base.SQLPlugin` 基类实现

具体 SQL 插件会嵌入这层基础能力，再补上各自 driver 的差异化逻辑。

## 共享的 Runtime 能力

从基类实现来看，具体 SQL 插件会继承这些行为：

- 启动期连接与校验
- 连接重试
- 连接池监控与阈值告警
- 健康检查
- 自动重连
- 连接预热
- 慢查询监控
- 连接泄漏检测

这些都是真实的 runtime 行为，不只是若干辅助类型定义。

## 关键接口

`interfaces.SQLPlugin` 是插件化 SQL 访问的核心契约：

- `GetDB()`
- `GetDBWithContext(ctx)`
- `GetValidatedConn(ctx)`
- `GetDialect()`
- `IsConnected()`

`interfaces.DBProvider` 则是更稳妥的抽象，适合调用方动态解析当前连接池，而不是缓存一个过期的 `*sql.DB`。

## 什么时候该看这个页面

这个页面主要在以下场景有价值：

- 你在实现或审查具体 SQL 插件
- 你想理解 MySQL、PostgreSQL、MSSQL 插件到底共享了哪些语义
- 你需要分析 SQL 栈里的重连与连接池行为

对于普通业务接入，应该先读具体数据库插件页面。

## 相关页面

- [数据库插件](/docs/existing-plugin/db)
- [Layout](/docs/existing-plugin/layout)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
