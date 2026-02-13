---
id: redis-lock
title: Redis 分布式锁 Plugin
slug: existing-plugin/redis-lock
---

# Redis 分布式锁 Plugin

Go-Lynx 的 Redis 分布式锁插件基于 Redis 提供分布式锁能力，支持自动续期、重试、可重入（同一实例）、兼容 standalone/Cluster/Sentinel。

## 功能概览

- **分布式锁**：基于 Redis 的加锁/解锁
- **自动续期**：可配置续期阈值与间隔，避免业务执行时间超过 TTL
- **重试**：可配置重试次数与退避策略
- **可重入**：同一 `*RedisLock` 实例可多次 Acquire/Release
- **健康与指标**：Prometheus 指标与优雅关闭

## 前置条件

需先启用 [Redis Plugin](/docs/existing-plugin/redis)，以提供 Redis 连接（插件内部使用 `GetUniversalRedis()`，兼容单机/集群/哨兵）。

## 配置说明

在 `config.yaml` 的 `lynx.redis` 下增加 `lock` 段：

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

长耗时任务建议开启 `renewal_enabled` 并适当增大 `default_timeout`。

## 如何使用

### 1. 引入依赖

```bash
go get github.com/go-lynx/lynx-redis-lock
```

### 2. 简单加锁执行（推荐）

```go
import (
    "context"
    "github.com/go-lynx/lynx-redis-lock"
)

err := redislock.Lock(ctx, "my-lock", 30*time.Second, func() error {
    // 临界区业务逻辑
    return nil
})
if err != nil {
    log.Printf("lock failed: %v", err)
}
```

### 3. 自定义选项（超时、重试、续期）

```go
options := redislock.LockOptions{
    Expiration:       60 * time.Second,
    RetryStrategy:    redislock.RetryStrategy{MaxRetries: 3, RetryDelay: 100 * time.Millisecond},
    RenewalEnabled:   true,
    RenewalThreshold: 0.5,
}
err := redislock.LockWithOptions(ctx, "my-lock", options, func() error {
    // 长耗时逻辑
    return nil
})
```

### 4. 手动加锁/解锁

```go
lock, err := redislock.NewLock(ctx, "my-lock", options)
if err != nil {
    return err
}
if err := lock.Acquire(ctx); err != nil {
    return err
}
defer lock.Release(ctx)
// 业务逻辑
held, err := lock.IsLocked(ctx)
```

### 5. 优雅关闭

```go
if err := redislock.Shutdown(ctx); err != nil {
    log.Printf("shutdown: %v", err)
}
```

## 设计说明与限制

- 可重入仅在同一 `*RedisLock` 实例内有效；每次 `NewLock`/`Lock()` 为不同实例，不共享重入计数。
- 单节点 Redis 与 Redlock、进程暂停与 TTL、fencing token 等说明见仓库 [LIMITATIONS.md](https://github.com/go-lynx/lynx-redis-lock/blob/main/LIMITATIONS.md)。

## 相关链接

- 仓库：[go-lynx/lynx-redis-lock](https://github.com/go-lynx/lynx-redis-lock)
- [Redis Plugin](/docs/existing-plugin/redis) | [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
