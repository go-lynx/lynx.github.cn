---
id: redis-lock
title: Redis Lock Plugin
---

# Redis Lock Plugin

`lynx-redis-lock` provides Redis-based distributed locking for Lynx applications, but it is not registered as a standalone runtime plugin like HTTP or Redis. It is a library layer built on top of `lynx-redis`, and it uses `lynx-redis`'s `GetUniversalRedis()` client under the hood.

## Runtime facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-redis-lock` |
| Own config prefix | none |
| Runtime plugin name | none |
| Dependency | `github.com/go-lynx/lynx-redis` and its `lynx.redis` configuration |

## What the implementation actually provides

- distributed lock acquire and release based on Redis Lua scripts
- reusable lock instances through `NewLock()`
- callback-style helpers through `Lock`, `LockWithOptions`, `LockWithRetry`, and `LockWithToken`
- optional auto-renewal, retry strategy, worker-pool based renewal management, and script call timeouts
- fencing-token support and manager statistics through `GetStats()`

Reentrancy is per lock instance, not per lock key. Reusing the same `*RedisLock` instance can reenter. Creating a new instance for the same key cannot.

## Configuration dependency

`lynx-redis-lock` itself does not read a dedicated `lynx.redis-lock` config tree. It relies on the Redis client plugin:

```yaml
lynx:
  redis:
    addrs:
      - "localhost:6379"
    password: ""
    db: 0
```

## Usage

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

Reusable lock instance:

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

## Practical guidance

- use Redis lock when you already run Redis and the coordination requirement is lightweight
- model expiration, retry, and business idempotency together, otherwise the lock only hides failure cases
- if you need stronger coordination semantics, compare it with [Etcd Lock](/docs/existing-plugin/etcd-lock) before standardizing on Redis

## Related pages

- Repo: [go-lynx/lynx-redis-lock](https://github.com/go-lynx/lynx-redis-lock)
- [Redis](/docs/existing-plugin/redis)
- [Etcd Lock](/docs/existing-plugin/etcd-lock)
