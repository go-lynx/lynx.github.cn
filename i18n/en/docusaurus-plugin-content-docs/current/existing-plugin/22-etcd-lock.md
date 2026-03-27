---
id: etcd-lock
title: Etcd Lock Plugin
---

# Etcd Lock Plugin

The Etcd Lock plugin is a distributed lock layer that depends on the Etcd plugin's client resource. It is not an independent storage connector.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-etcd-lock` |
| Config prefix | `lynx.etcd-lock` |
| Runtime plugin name | `etcd.distributed.lock` |
| Dependency | runtime resource `etcd.config.center` |
| Public APIs | `Lock`, `LockWithOptions`, `LockWithRetry`, `NewLockFromClient`, `GetStats()` |

## What The Implementation Provides

From the code, this plugin:

- resolves the Etcd client from the Etcd plugin during initialization
- exposes helper APIs for lock acquisition and automatic release
- supports retry strategy and operation timeout
- supports automatic renewal for long-running locks
- maintains global lock-manager stats

The lock helper API is intentionally business-facing; you do not need to work with raw Etcd leases for common cases.

## Usage Pattern

```go
err := etcdlock.Lock(ctx, "order:123", 15*time.Second, func() error {
    return doBusinessWork()
})
```

For more control:

```go
opts := etcdlock.DefaultLockOptions
opts.RenewalEnabled = true
opts.RetryStrategy.MaxRetries = 3

err := etcdlock.LockWithOptions(ctx, "order:123", opts, fn)
```

## Important Constraint

This plugin fails initialization if `etcd.config.center` is not loaded first, because it reads the shared Etcd client from that runtime resource.

## Related Pages

- [Etcd](/docs/existing-plugin/etcd)
- [Redis Lock](/docs/existing-plugin/redis-lock)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
