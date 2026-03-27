---
id: redis
title: Redis 插件
---

# Redis 插件

Redis 插件是一个由 runtime 管理的 UniversalClient 能力层，而不只是单机模式下的 `*redis.Client`。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-redis` |
| 配置前缀 | `lynx.redis` |
| Runtime 插件名 | `redis.client` |
| 公开 API | `GetRedis()`、`GetUniversalRedis()` |

## 实现里真正支持什么

这个插件基于 go-redis UniversalClient，支持：

- 单机、集群、哨兵三种拓扑
- TLS
- 启动期和就绪态健康检查
- 命令级指标与连接池指标
- 作为更高层插件的共享 runtime 资源

`GetRedis()` 只会在单机模式下返回 `*redis.Client`；跨拓扑稳定的 API 是 `GetUniversalRedis()`。

## 配置

```yaml
lynx:
  redis:
    addrs:
      - "127.0.0.1:6379"
    db: 0
    min_idle_conns: 5
    max_active_conns: 20
    dial_timeout: 5s
    read_timeout: 5s
    write_timeout: 5s
```

旧文档里用 `addr` 的示例已经过时，当前配置中心是 `addrs`。

## 如何使用

```go
import redisplug "github.com/go-lynx/lynx-redis"

universal := redisplug.GetUniversalRedis()
singleNode := redisplug.GetRedis()
```

除非你明确只跑单机模式，否则应该优先使用 `GetUniversalRedis()`。

## 相关页面

- [Redis Lock](/docs/existing-plugin/redis-lock)
- [Etcd Lock](/docs/existing-plugin/etcd-lock)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
