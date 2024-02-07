---
id: redis
title: redis
---

# redis插件

Go-Lynx 提供了redis连接插件，我们可以不用关心如何去编写连接redis的相关代码，只需要提供对应的redis配置文件即可自动进行redis连接初始化，目前部分配置参数还不够完整（例如：ssl加密通讯，多数据源配置），目前还在持续开发中，敬请期待。

## redis配置

指定redis需要在配置文件中进行配置，文件内容如下：

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

其中的 `lynx.redis` 相关内容就是redis配置信息。目前默认是使用的 `go-redis` 进行redis连接，后面会持续支持更多的连接包。
配置完成之后，应用程序一旦启动就会根据插件顺序进行加载redis。

如何获取redis客户端？

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
    rdb   *redis.Client
}

func NewData(rdb *redis.Client,logger log.Logger) (*Data, error) {
    d := &Data{
        rdb:  rdb
    }
    return d, nil
}
```

我们提供了 `lynxRedis.GetRedis` 方法，该方法会从插件中返回连接对象信息，再配合 `wire` 框架帮助我们进行方法调用生成即可。以上就是如何完整的使用redis插件的方式。