---
id: redis-lock
title: Redis Distributed Lock Plugin
slug: existing-plugin/redis-lock
---

# Redis Distributed Lock Plugin

The Go-Lynx Redis distributed lock plugin provides Redis-based distributed locking with automatic renewal, retries, reentrancy (same instance), and support for standalone, Cluster, and Sentinel via `redis.UniversalClient`.

## Features

- **Distributed lock** — Lock/unlock via Redis
- **Automatic renewal** — Configurable threshold and interval so long-running work does not exceed TTL
- **Retry** — Configurable retries and backoff
- **Reentrant** — Same `*RedisLock` instance can Acquire/Release multiple times
- **Health & metrics** — Prometheus metrics and graceful shutdown

## Prerequisites

Enable the [Redis Plugin](/docs/existing-plugin/redis) first; the lock plugin uses `GetUniversalRedis()` (standalone/cluster/sentinel).

## Configuration

Add a `lock` section under `lynx.redis` in `config.yaml`:

```yaml
lynx:
  redis:
    addrs: ["localhost:6379"]
    password: ""
    db: 0
    lock:
      default_timeout: 30s
      default_retry_interval: 100ms
      max_retries: 3
      renewal_enabled: true
      renewal_threshold: 0.5
      renewal_interval: 10s
```

Enable `renewal_enabled` and consider a larger `default_timeout` for long-running work.

## How to use

### 1. Add dependency

```bash
go get github.com/go-lynx/lynx-redis-lock
```

### 2. Simple lock and run (recommended)

```go
import (
    "context"
    "github.com/go-lynx/lynx-redis-lock"
)

err := redislock.Lock(ctx, "my-lock", 30*time.Second, func() error {
    // critical section
    return nil
})
if err != nil {
    log.Printf("lock failed: %v", err)
}
```

### 3. Custom options (timeout, retry, renewal)

```go
options := redislock.LockOptions{
    Expiration:       60 * time.Second,
    RetryStrategy:    redislock.RetryStrategy{MaxRetries: 3, RetryDelay: 100 * time.Millisecond},
    RenewalEnabled:   true,
    RenewalThreshold: 0.5,
}
err := redislock.LockWithOptions(ctx, "my-lock", options, func() error {
    // long-running logic
    return nil
})
```

### 4. Manual lock/unlock

```go
lock, err := redislock.NewLock(ctx, "my-lock", options)
if err != nil {
    return err
}
if err := lock.Acquire(ctx); err != nil {
    return err
}
defer lock.Release(ctx)
// business logic
held, err := lock.IsLocked(ctx)
```

### 5. Graceful shutdown

```go
if err := redislock.Shutdown(ctx); err != nil {
    log.Printf("shutdown: %v", err)
}
```

## Design and limitations

Reentrancy is per lock instance; each `NewLock`/`Lock()` is a different instance. See the repo’s [LIMITATIONS.md](https://github.com/go-lynx/lynx-redis-lock/blob/main/LIMITATIONS.md) for single-node vs Redlock, process pause/TTL, and fencing tokens.

## See also

- Repo: [go-lynx/lynx-redis-lock](https://github.com/go-lynx/lynx-redis-lock)
- [Redis Plugin](/docs/existing-plugin/redis) | [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
