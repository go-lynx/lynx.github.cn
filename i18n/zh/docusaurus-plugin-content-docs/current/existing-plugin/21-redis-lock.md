---
id: redis-lock
title: Redis Lock 插件
---

# Redis Lock 插件

`lynx-redis-lock` 是构建在 `lynx-redis` runtime client 之上的 Redis 分布式锁库。它不是一个独立可配置的 runtime 插件，而且本仓库也没有给它提供单独的 `conf/example_config.yml`。

## Boundary And Ownership（边界与归属）

| 关注点 | 归属方 |
| --- | --- |
| Redis 地址、认证、库号、TLS、Sentinel / Cluster 拓扑 | 上游 Redis 插件的 `lynx.redis` 配置 |
| Redis client 生命周期与 shared-resource 注册 | `lynx-redis` runtime 插件 |
| 锁 TTL、重试策略、续租、fencing token 行为 | 业务代码里的 `LockOptions` / 重试结构体 |
| Redis Lock 自己的 runtime 插件名 / 配置前缀 | 不存在 |

## What This Means In Practice（这在实践里意味着什么）

- 不要新增 `lynx.redis-lock` 或 `lynx.redis.lock` 这样的 YAML 块。当前仓库不会读取它们。
- Redis Lock 会复用 `lynx-redis` 暴露出来的上游 client，不应该在 runtime 持有的连接池之外再创建第二套 Redis pool。
- 任何和锁相关服务的 YAML 仍然写在 [Redis](/docs/existing-plugin/redis) 页面所归属的上游 Redis 配置里，地址、密码、拓扑模式、传输参数都在那里。
- 锁获取行为是代码配置，不是 `example_config.yml` 配置，包括 lease 时长、重试 / backoff、自动续租和 callback 风格执行业务。

## Dependency Notes（依赖说明）

- 这个锁库依赖 `github.com/go-lynx/lynx-redis`。
- 单机 Redis、Redis Cluster、Redis Sentinel 的支持，全部建立在 `lynx.redis` 已经正确配置的前提上。
- 如果旧文档或旧片段里出现了锁专属 YAML 子树，应当把它们视为历史示例，而不是当前仓库的事实来源。

## Public Surface（公开接口）

常用 API 包括 `Lock`、`LockWithToken`、`LockWithRetry`、`LockWithOptions`、`NewLock`、`UnlockByValue`、`GetStats()`、`Shutdown()`。

## Related Pages（相关页面）

- [Redis](/docs/existing-plugin/redis)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
