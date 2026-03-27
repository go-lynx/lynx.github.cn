---
id: redis
title: Redis Plugin
---

# Redis Plugin

The Redis plugin is a runtime-managed UniversalClient layer, not only a single-node `*redis.Client`.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-redis` |
| Config prefix | `lynx.redis` |
| Runtime plugin name | `redis.client` |
| Public APIs | `GetRedis()`, `GetUniversalRedis()` |

## What The Implementation Actually Supports

The plugin is built on go-redis UniversalClient and supports:

- standalone, cluster, and sentinel topologies
- TLS
- startup and readiness checks
- command-level metrics and pool metrics
- shared runtime resource exposure for higher-level plugins

`GetRedis()` only returns `*redis.Client` in standalone mode. `GetUniversalRedis()` is the stable API across all topologies.

## Configuration

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

The old `addr` examples are outdated. Current config is centered on `addrs`.

## How To Consume It

```go
import redisplug "github.com/go-lynx/lynx-redis"

universal := redisplug.GetUniversalRedis()
singleNode := redisplug.GetRedis()
```

Prefer `GetUniversalRedis()` unless you know you only run in standalone mode.

## Related Pages

- [Redis Lock](/docs/existing-plugin/redis-lock)
- [Etcd Lock](/docs/existing-plugin/etcd-lock)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
