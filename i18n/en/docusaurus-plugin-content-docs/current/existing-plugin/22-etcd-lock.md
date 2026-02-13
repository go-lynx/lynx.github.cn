---
id: etcd-lock
title: Etcd Distributed Lock Plugin
slug: existing-plugin/etcd-lock
---

# Etcd Distributed Lock Plugin

The Go-Lynx Etcd distributed lock plugin provides strongly consistent distributed locking based on etcd, with automatic renewal, retries, and graceful shutdown. It depends on the [Etcd Plugin](/docs/existing-plugin/etcd) for connectivity.

## Features

- **Strong consistency** — Distributed lock backed by etcd
- **Automatic renewal** — Optional renewal so long-held locks do not expire
- **Retry strategy** — Configurable retries and delay
- **Health & metrics** — Health checks and Prometheus metrics
- **Graceful shutdown** — Proper resource cleanup

## Prerequisites

Configure and load the [Etcd Plugin](/docs/existing-plugin/etcd); set `lynx.etcd` with `endpoints` and related options. Lock options are primarily set in code.

## How to use

### 1. Add dependency

```bash
go get github.com/go-lynx/lynx-etcd-lock
```

### 2. Simple lock and run

```go
import (
    "context"
    "time"
    "github.com/go-lynx/lynx/plugin/etcd-lock"
)

err := etcdlock.Lock(ctx, "my-lock-key", 30*time.Second, func() error {
    // business logic that needs the lock
    return nil
})
if err != nil {
    log.Printf("lock failed: %v", err)
}
```

### 3. With options (renewal, retry)

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

### 4. Lock with retry strategy

```go
strategy := etcdlock.RetryStrategy{MaxRetries: 5, RetryDelay: 200 * time.Millisecond}
err := etcdlock.LockWithRetry(ctx, "my-lock-key", 20*time.Second, fn, strategy)
```

### 5. Reusable lock instance

```go
lock, err := etcdlock.NewLockFromClient(ctx, "my-lock-key", options)
if err != nil {
    return err
}
// then Acquire/Release as needed (see repo API)
```

## API summary

- `Lock(ctx, key, expiration, fn)` — Acquire, run callback, release.
- `LockWithOptions(ctx, key, options, fn)` — Full options.
- `LockWithRetry(ctx, key, expiration, fn, strategy)` — With retry.
- `NewLockFromClient(ctx, key, options)` — Create reusable lock instance.

## See also

- Repo: [go-lynx/lynx-etcd-lock](https://github.com/go-lynx/lynx-etcd-lock)
- [Etcd Plugin](/docs/existing-plugin/etcd) | [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
