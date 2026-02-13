---
id: etcd-lock
title: Etcd 分布式锁 Plugin
slug: existing-plugin/etcd-lock
---

# Etcd 分布式锁 Plugin

Go-Lynx 的 Etcd 分布式锁插件基于 etcd 实现强一致分布式锁，支持自动续期、重试与优雅关闭。依赖 [Etcd Plugin](/docs/existing-plugin/etcd) 提供连接。

## 功能概览

- **强一致**：基于 etcd 的分布式锁
- **自动续期**：可选续期，避免长任务超时
- **重试策略**：可配置重试次数与间隔
- **健康与指标**：健康检查与 Prometheus 指标
- **优雅关闭**：关闭时正确释放资源

## 前置条件

需先配置并加载 [Etcd Plugin](/docs/existing-plugin/etcd)，在 `lynx.etcd` 中配置好 `endpoints` 等。etcd-lock 的锁参数主要通过代码选项设置。

## 如何使用

### 1. 引入依赖

```bash
go get github.com/go-lynx/lynx-etcd-lock
```

### 2. 简单加锁执行

```go
import (
    "context"
    "time"
    "github.com/go-lynx/lynx/plugin/etcd-lock"
)

err := etcdlock.Lock(ctx, "my-lock-key", 30*time.Second, func() error {
    // 需要加锁的业务逻辑
    return nil
})
if err != nil {
    log.Printf("lock failed: %v", err)
}
```

### 3. 使用选项（续期、重试）

```go
options := etcdlock.LockOptions{
    Expiration:     30 * time.Second,
    RenewalEnabled: true,
    RetryStrategy: etcdlock.RetryStrategy{
        MaxRetries: 3,
        RetryDelay: 100 * time.Millisecond,
    },
}
err := etcdlock.LockWithOptions(ctx, "my-lock-key", options, func() error {
    return nil
})
```

### 4. 带重试策略的加锁

```go
strategy := etcdlock.RetryStrategy{MaxRetries: 5, RetryDelay: 200 * time.Millisecond}
err := etcdlock.LockWithRetry(ctx, "my-lock-key", 20*time.Second, fn, strategy)
```

### 5. 可复用的锁实例

```go
lock, err := etcdlock.NewLockFromClient(ctx, "my-lock-key", options)
if err != nil {
    return err
}
// 随后可多次 Acquire/Release（具体 API 以仓库为准）
```

## API 摘要

- `Lock(ctx, key, expiration, fn)`：加锁后执行回调，结束后自动释放。
- `LockWithOptions(ctx, key, options, fn)`：带完整选项的加锁执行。
- `LockWithRetry(ctx, key, expiration, fn, strategy)`：带重试策略的加锁执行。
- `NewLockFromClient(ctx, key, options)`：创建可复用的锁实例。

## 相关链接

- 仓库：[go-lynx/lynx-etcd-lock](https://github.com/go-lynx/lynx-etcd-lock)
- [Etcd Plugin](/docs/existing-plugin/etcd) | [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
