---
id: redis
title: Redis Plugin
---

# Redis Plugin

The Redis plugin brings a Redis client into the Lynx runtime. It moves connection initialization, timeout control, lifecycle ownership, and a stable injection entry into the plugin layer instead of having each business package create clients ad hoc.

## Common use cases

- cache
- shared session or state
- lightweight message distribution
- base resource for higher-level capabilities such as distributed locks

## Basic configuration

```yaml
lynx:
  redis:
    addr: 127.0.0.1:6379
    password: ""
    db: 0
    dial_timeout: 3s
    read_timeout: 1s
    write_timeout: 1s
```

Once configured, the Redis client is initialized during application startup and managed by the runtime.

## How to obtain the client in application code

```go
import (
    lynxRedis "github.com/go-lynx/lynx/plugin/redis"

    "github.com/google/wire"
    "github.com/redis/go-redis/v9"
)

var ProviderSet = wire.NewSet(
    NewData,
    lynxRedis.GetRedis,
)

type Data struct {
    rdb *redis.Client
}

func NewData(rdb *redis.Client, logger log.Logger) (*Data, error) {
    return &Data{rdb: rdb}, nil
}
```

`lynxRedis.GetRedis` returns the `*redis.Client` already created by the plugin, which you can inject directly into the data or repository layer.

## Integration steps

1. add the plugin module `github.com/go-lynx/lynx/plugin/redis`
2. add `lynx.redis` configuration
3. anonymous-import the plugin in `main`
4. include `lynxRedis.GetRedis` in your Wire set

## Related pages

- [Redis Lock](/docs/existing-plugin/redis-lock)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
