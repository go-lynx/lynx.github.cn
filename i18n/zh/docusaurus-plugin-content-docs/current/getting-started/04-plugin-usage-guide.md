---
id: plugin-usage-guide
title: 插件使用指南
slug: getting-started/plugin-usage-guide
---

# 插件使用指南

本文说明在 Go-Lynx 中**如何使用现有插件**的通用步骤，便于快速上手任意插件。

## 四步使用插件

大多数 Lynx 插件都遵循同一套使用方式：

### 1. 添加依赖

使用 Go modules 拉取插件所在模块，例如：

```bash
# 框架内置插件（以主仓库路径为准）
go get github.com/go-lynx/lynx/plugin/redis

# 独立仓库插件
go get github.com/go-lynx/lynx-elasticsearch
go get github.com/go-lynx/lynx-rabbitmq
go get github.com/go-lynx/lynx-dtm
```

具体包名以各插件的 README 或 [插件生态](/docs/existing-plugin/plugin-ecosystem) 为准。

### 2. 在配置中声明

在 `config.yaml`（或 bootstrap 配置）中增加对应段落，键名一般为 `lynx.<插件名>`：

```yaml
lynx:
  redis:
    addr: 127.0.0.1:6379
    password: ""
    db: 0
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
```

部分插件（如 DTM、Etcd Lock）依赖其他插件，需先配置并加载被依赖的插件。

### 3. 注册插件（导入）

在 `main.go` 或初始化入口中**匿名导入**插件包，使框架在启动时加载该插件：

```go
import (
    _ "github.com/go-lynx/lynx/plugin/redis"
    _ "github.com/go-lynx/lynx/plugin/http"
    _ "github.com/go-lynx/lynx-elasticsearch"
)
```

插件会在 [Bootstrap](/docs/getting-started/bootstrap-config) 阶段根据配置与 [插件顺序](/docs/getting-started/plugin-manager) 完成初始化。

### 4. 在业务中注入使用

通过插件提供的 **Getter** 或 **插件管理器** 获取实例，再结合 Wire 或手动注入到业务代码：

```go
// 方式一：插件提供的 GetXxx()
import lynxRedis "github.com/go-lynx/lynx/plugin/redis"

var ProviderSet = wire.NewSet(
    NewData,
    lynxRedis.GetRedis,
)

func NewData(rdb *redis.Client, logger log.Logger) (*Data, error) {
    // 使用 rdb 操作 Redis
    return &Data{rdb: rdb}, nil
}
```

```go
// 方式二：从插件管理器按名称获取（部分插件）
plugin := app.Lynx().GetPluginManager().GetPlugin("rabbitmq")
client := plugin.(rabbitmq.ClientInterface)
```

各插件的 Getter 名称与类型见对应文档（如 [Redis](/docs/existing-plugin/redis)、[HTTP](/docs/existing-plugin/http)）。

## 常见场景速查

| 需求           | 推荐插件与文档 |
|----------------|----------------|
| 提供 HTTP 接口 | [HTTP](/docs/existing-plugin/http) |
| 提供 gRPC 服务 | [gRPC](/docs/existing-plugin/grpc) |
| 关系型数据库   | [Database](/docs/existing-plugin/db) |
| 缓存           | [Redis](/docs/existing-plugin/redis) |
| 全文检索       | [Elasticsearch](/docs/existing-plugin/elasticsearch) |
| 消息队列       | [Kafka](/docs/existing-plugin/kafka) / [RabbitMQ](/docs/existing-plugin/rabbitmq) / [RocketMQ](/docs/existing-plugin/rocketmq) / [Pulsar](/docs/existing-plugin/pulsar) |
| 配置中心       | [Nacos](/docs/existing-plugin/nacos) / [Apollo](/docs/existing-plugin/apollo) / [Etcd](/docs/existing-plugin/etcd) / [Polaris](/docs/existing-plugin/polaris) |
| 服务发现       | [Polaris](/docs/existing-plugin/polaris) / [Nacos](/docs/existing-plugin/nacos) / [Etcd](/docs/existing-plugin/etcd) |
| 分布式事务     | [Seata](/docs/existing-plugin/seata) / [DTM](/docs/existing-plugin/dtm) |
| 分布式锁       | [Redis Lock](/docs/existing-plugin/redis-lock) / [Etcd Lock](/docs/existing-plugin/etcd-lock) |
| 链路追踪       | [Tracer](/docs/existing-plugin/tracer) |
| API 文档       | [Swagger](/docs/existing-plugin/swagger) |
| 限流熔断       | [Sentinel](/docs/existing-plugin/sentinel) |
| 新项目脚手架   | [Layout](/docs/existing-plugin/layout) + [Quick Start](/docs/getting-started/quick-start) |

## 下一步

- [插件生态一览](/docs/existing-plugin/plugin-ecosystem) — 所有插件列表与文档链接  
- [Bootstrap 配置](/docs/getting-started/bootstrap-config) — 配置文件与远程配置  
- [插件管理](/docs/getting-started/plugin-manager) — 加载顺序与自定义插件  
