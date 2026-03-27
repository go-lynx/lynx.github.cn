---
id: redis-lock
title: Redis Lock 插件
---

# Redis Lock 插件

`lynx-redis-lock` 为 Lynx 应用提供基于 Redis 的分布式锁能力，但它并不是像 HTTP、Redis 那样注册到 runtime 里的独立插件。它本质上是构建在 `lynx-redis` 之上的库层能力，内部直接复用 `lynx-redis` 暴露的 `GetUniversalRedis()` client。

## 运行时事实

| 项目 | 值 |
| --- | --- |
| Go 模块 | `github.com/go-lynx/lynx-redis-lock` |
| 自有配置前缀 | 无 |
| runtime 插件名 | 无 |
| 依赖 | `github.com/go-lynx/lynx-redis` 以及它的 `lynx.redis` 配置 |

## 实现里实际提供了什么

- 基于 Redis Lua script 的分布式加锁和解锁
- 通过 `NewLock()` 创建可复用的锁实例
- 提供 `Lock`、`LockWithOptions`、`LockWithRetry`、`LockWithToken` 这类 callback 风格辅助方法
- 支持自动续租、重试策略、基于 worker pool 的续租管理、script 调用超时
- 提供 fencing token 能力，以及通过 `GetStats()` 暴露管理器统计信息

需要明确的一点是：可重入是“按锁实例”生效，不是“按 key”生效。复用同一个 `*RedisLock` 实例可以重入；同 key 新建实例不算重入。

## 配置依赖

`lynx-redis-lock` 自己不会读取单独的 `lynx.redis-lock` 配置树，它依赖 Redis 插件本身：

```yaml
lynx:
  redis:
    addrs:
      - "localhost:6379"
    password: ""
    db: 0
```

## 使用方式

```go
import (
    "context"
    "time"

    redislock "github.com/go-lynx/lynx-redis-lock"
)

func run(ctx context.Context) error {
    return redislock.LockWithRetry(
        ctx,
        "order:close:123",
        30*time.Second,
        func() error {
            return doBusiness()
        },
        redislock.RetryStrategy{
            MaxRetries: 3,
            RetryDelay: 100 * time.Millisecond,
        },
    )
}
```

复用锁实例的写法：

```go
options := redislock.LockOptions{Expiration: 30 * time.Second}
lock, err := redislock.NewLock(ctx, "inventory:deduct:sku-1", options)
if err != nil {
    return err
}
if err := lock.Acquire(ctx); err != nil {
    return err
}
defer lock.Release(ctx)
```

## 实践建议

- 如果你的基础设施已经稳定使用 Redis，且协调需求偏轻量，Redis lock 是合适的
- 过期时间、重试策略和业务幂等补偿必须一起设计，否则锁只是把问题往后推
- 如果场景需要更强的一致性语义，优先和 [Etcd Lock](/docs/existing-plugin/etcd-lock) 做对比再决定

## 相关页面

- 仓库: [go-lynx/lynx-redis-lock](https://github.com/go-lynx/lynx-redis-lock)
- [Redis](/docs/existing-plugin/redis)
- [Etcd Lock](/docs/existing-plugin/etcd-lock)
