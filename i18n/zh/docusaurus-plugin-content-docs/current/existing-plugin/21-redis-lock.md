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

## Complete YAML Example（完整 YAML 示例）

Redis Lock 没有独立的 `conf/example_config.yml`。因此这里所谓“完整示例”，本质上仍然是在配置它所复用的上游 Redis runtime client。

```yaml
# Redis Lock 没有独立 YAML 前缀。
# 需要配置的是 lynx-redis-lock 复用的上游 Redis runtime client。
lynx:
  redis:
    addrs:
      - "localhost:6379" # 所有 Redis 消费者（包括锁）共享的 Redis 地址。
    password: "" # 共享的 Redis AUTH 密码。
    db: 0 # 共享的逻辑数据库编号。
    min_idle_conns: 5 # 锁流量和其他 Redis 使用方共用的最小空闲连接数。
    max_active_conns: 20 # runtime 持有 client 的共享活跃连接上限。
    max_retries: 3 # 共享 Redis 命令重试次数。
```

## Minimum Viable YAML Example（最小可用 YAML 示例）

这里依然不存在 `lynx.redis-lock` 子树。最小 runtime YAML 只负责创建上游 Redis client；真正的 `key`、`ttl` 等锁参数必须从代码传入。

```yaml
# 不存在 lynx.redis-lock YAML 前缀。
# 最小可用 runtime YAML 只负责创建上游 Redis client：
lynx:
  redis:
    addrs:
      - "localhost:6379"

# 锁参数由代码传入，而不是来自 YAML：
# key: "jobs:reconcile"
# ttl: "30s"
# retry_interval: "250ms"
# max_retries: 5
```

## Related Pages（相关页面）

- [Redis](/docs/existing-plugin/redis)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
