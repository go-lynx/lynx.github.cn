---
id: redis
title: Redis Plugin
slug: existing-plugin/redis
---

# Redis Plugin

Go-Lynx provides a Redis connection plugin, which allows us to connect to Redis without worrying about writing the connection code. Simply provide the corresponding Redis configuration file, and the plugin will automatically initialize the Redis connection. Some configuration parameters are not yet complete (such as SSL encrypted communication, multi-data source configuration), but development is ongoing, so stay tuned.

## Redis Configuration

To specify Redis, you need to configure it in the configuration file as follows:

```yaml
lynx:
  redis:
    addr: 127.0.0.1:6379
    password: 123456
    db: 0
    dial_timeout: 3s
    read_timeout: 1s
    write_timeout: 1s
```

The `lynx.redis` section contains the Redis configuration information. Currently, the default is to use `go-redis` for Redis connections, and more connection packages will be supported in the future.

After the configuration is complete, the application will load the Redis plugin according to the plugin order upon startup.

How to obtain the Redis client?

```go
import (
  lynxRedis "github.com/go-lynx/lynx/plugin/redis"
  "github.com/redis/go-redis/v9"
)

var ProviderSet = wire.NewSet(
    NewData,
    lynxRedis.GetRedis
)

type Data struct {
    rdb *redis.Client
}

func NewData(rdb *redis.Client, logger log.Logger) (*Data, error) {
    d := &Data{
        rdb: rdb,
    }
    return d, nil
}
```

We provide the `lynxRedis.GetRedis` method, which returns the connection object information from the plugin. Combined with the `wire` framework, we can generate method calls to use the Redis plugin. This is how you can fully utilize the Redis plugin.

## 使用步骤小结

1. **添加依赖**：`go get github.com/go-lynx/lynx/plugin/redis`（或主仓库对应路径）。
2. **配置**：在 `config.yaml` 的 `lynx.redis` 中设置 `addr`、`password`、`db`、超时等。
3. **注册**：在 `main.go` 中 `import _ "github.com/go-lynx/lynx/plugin/redis"`。
4. **注入使用**：在 Wire 的 `ProviderSet` 中加入 `lynxRedis.GetRedis`，在构造函数中接收 `*redis.Client` 即可在业务层使用。