---
id: plugin-usage-guide
title: 插件使用指南
---

# 插件使用指南

在 Lynx 里，插件不只是另一个 SDK 依赖。它是一种加入统一运行时的能力模块，会先注册进全局插件工厂，再由插件管理器在应用启动阶段完成装配。

本页聚焦的是**基于代码事实的接入路径**：正确模块路径、正确配置前缀、注册机制，以及启动完成后你真正该拿什么 API 来使用插件。

## 你应该记住的接入链路

对大多数 Lynx 插件来说，运行时路径是：

1. 添加正确的 Go 模块
2. 配置对应的 `lynx.<prefix>`
3. 匿名导入模块，让它把自己注册进 `factory.GlobalTypedFactory()`
4. 通过 `boot.NewApplication(wireApp).Run()` 完成运行时装配
5. 启动完成后，用插件暴露的 Getter 或插件管理器获取能力

这条链路很重要，因为仅有配置不会自动加载插件，仅有导入也不会完成初始化。注册和启动装配两个阶段都不能少。

## 1. 添加正确的模块

当前仓库家族大多数插件都已经拆成独立模块。今天更准确的接入方式通常长这样：

```bash
# 框架核心 / 内建能力
go get github.com/go-lynx/lynx

# 服务插件
go get github.com/go-lynx/lynx-http
go get github.com/go-lynx/lynx-grpc

# 存储与缓存
go get github.com/go-lynx/lynx-redis
go get github.com/go-lynx/lynx-mongodb
go get github.com/go-lynx/lynx-elasticsearch
go get github.com/go-lynx/lynx-mysql
go get github.com/go-lynx/lynx-pgsql
go get github.com/go-lynx/lynx-mssql

# 消息
go get github.com/go-lynx/lynx-kafka
go get github.com/go-lynx/lynx-rabbitmq
go get github.com/go-lynx/lynx-rocketmq
go get github.com/go-lynx/lynx-pulsar

# 配置 / 治理 / 可观测性
go get github.com/go-lynx/lynx-polaris
go get github.com/go-lynx/lynx-nacos
go get github.com/go-lynx/lynx-apollo
go get github.com/go-lynx/lynx-etcd
go get github.com/go-lynx/lynx-tracer
go get github.com/go-lynx/lynx-swagger
go get github.com/go-lynx/lynx-sentinel

# 分布式能力
go get github.com/go-lynx/lynx-seata
go get github.com/go-lynx/lynx-dtm
go get github.com/go-lynx/lynx-redis-lock
go get github.com/go-lynx/lynx-etcd-lock
```

这里有两个关键点：

- 模块路径应以各插件仓库的 `go.mod` 为准
- 少数能力仍然在主仓库内，例如 [`tls`](/docs/existing-plugin/tls-manager)，但大多数业务向插件已经是独立模块

## 2. 添加对应的配置前缀

每个插件在代码里都注册了明确的配置前缀，运行时就是靠这个前缀在 `InitializeResources` 阶段读取配置。

当前代码库里已经确认的前缀包括：

| 能力 | 模块 | 配置前缀 |
|------|------|----------|
| HTTP 服务 | `github.com/go-lynx/lynx-http` | `lynx.http` |
| gRPC 服务 | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.service` |
| gRPC 客户端 | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.client` |
| Redis | `github.com/go-lynx/lynx-redis` | `lynx.redis` |
| Elasticsearch | `github.com/go-lynx/lynx-elasticsearch` | `lynx.elasticsearch` |
| MongoDB | `github.com/go-lynx/lynx-mongodb` | `lynx.mongodb` |
| Polaris | `github.com/go-lynx/lynx-polaris` | `lynx.polaris` |
| Apollo | `github.com/go-lynx/lynx-apollo` | `lynx.apollo` |
| Etcd | `github.com/go-lynx/lynx-etcd` | `lynx.etcd` |
| Tracer | `github.com/go-lynx/lynx-tracer` | `lynx.tracer` |
| Sentinel | `github.com/go-lynx/lynx-sentinel` | `lynx.sentinel` |
| Seata | `github.com/go-lynx/lynx-seata` | `lynx.seata` |
| DTM | `github.com/go-lynx/lynx-dtm` | `lynx.dtm` |
| Etcd Lock | `github.com/go-lynx/lynx-etcd-lock` | `lynx.etcd-lock` |
| TLS | `github.com/go-lynx/lynx/tls` | `lynx.tls` |
| RabbitMQ | `github.com/go-lynx/lynx-rabbitmq` | `rabbitmq` |
| RocketMQ | `github.com/go-lynx/lynx-rocketmq` | `rocketmq` |

例如：

```yaml
lynx:
  http:
    addr: 0.0.0.0:8000
    timeout: 5s

  redis:
    addrs:
      - 127.0.0.1:6379
    password: ""
    db: 0

  tracer:
    enable: true
    addr: "127.0.0.1:4317"
```

## 3. 通过匿名导入完成注册

大多数插件都是在 `init()` 里调用 `factory.GlobalTypedFactory().RegisterPlugin(...)` 完成注册的，因此通常需要匿名导入：

```go
import (
    _ "github.com/go-lynx/lynx-http"
    _ "github.com/go-lynx/lynx-grpc"
    _ "github.com/go-lynx/lynx-redis"
    _ "github.com/go-lynx/lynx-tracer"
)
```

这不是可有可无的细节。如果模块没被导入，插件工厂里就没有注册项，即使配置存在，插件管理器也无从装配。

## 4. 让启动流程完成运行时装配

当前推荐的启动入口依然是：

```go
func main() {
    if err := boot.NewApplication(wireApp).Run(); err != nil {
        panic(err)
    }
}
```

在这个阶段，Lynx 会：

- 读取引导配置
- 解析插件顺序与依赖关系
- 初始化插件资源
- 执行启动任务
- 暴露共享资源和服务出口

这也是为什么插件文档必须按“运行时能力”来理解，而不只是按 SDK 调用来理解。

## 5. 启动完成后如何拿能力

当前代码里常见有三种方式。

### 方式 A：直接拿运行时持有的对象

这在服务插件和数据插件里很常见：

```go
httpServer, err := lynxhttp.GetHttpServer()
grpcServer, err := lynxgrpc.GetGrpcServer(nil)

rdb := redis.GetUniversalRedis()
es := elasticsearch.GetElasticsearch()
db := mongodb.GetMongoDBDatabase()
```

### 方式 B：拿插件对象本身

当插件除了底层连接，还暴露了更多高层方法时，这种方式更常见：

```go
plugin, err := polaris.GetPolarisPlugin()
instances, err := polaris.GetServiceInstances("user-service")
cfg, err := polaris.GetConfig("application.yaml", "DEFAULT_GROUP")
```

### 方式 C：通过插件管理器自行断言

这在偏动态的插件里更常见：

```go
plugin := app.Lynx().GetPluginManager().GetPlugin("dtm.server")
dtmClient := plugin.(*dtm.DTMClient)

mqPlugin := app.Lynx().GetPluginManager().GetPlugin("rabbitmq")
client := mqPlugin.(rabbitmq.ClientInterface)
```

## 代码里已经存在的公开入口

下面这些 API 都已经在代码里存在，文档应该优先围绕它们来写，而不是模糊描述：

| 能力 | 公开入口 |
|------|----------|
| HTTP | `http.GetHttpServer()` |
| gRPC 服务 | `grpc.GetGrpcServer(nil)` |
| Redis | `redis.GetRedis()`、`redis.GetUniversalRedis()` |
| MongoDB | `mongodb.GetMongoDB()`、`mongodb.GetMongoDBDatabase()`、`mongodb.GetMongoDBCollection()` |
| Elasticsearch | `elasticsearch.GetElasticsearch()`、`elasticsearch.GetElasticsearchPlugin()`、`elasticsearch.GetIndexName()` |
| Pulsar | `pulsar.GetPulsarClient()` |
| Polaris | `polaris.GetPolarisPlugin()`、`polaris.GetServiceInstances()`、`polaris.GetConfig()`、`polaris.GetMetrics()` |
| Sentinel | `sentinel.GetSentinel()`、`sentinel.GetMetrics()`、`sentinel.GetResourceStats()` |
| Seata | `seata.GetPlugin()` |
| TLS | `GetCertificate()`、`GetPrivateKey()`、`GetRootCACertificate()` 等证书提供能力 |

如果插件页里已经明确给出 Getter，就应该优先把它视为稳定接入入口，而不是“顺手提供的 helper”。

## 你在插件管理器里会看到的插件名

如果你直接使用 `GetPlugin(...)`，当前代码库里常见的插件名包括：

| 能力 | 插件名 |
|------|--------|
| HTTP | `http.server` |
| gRPC 服务 | `grpc.service` |
| Redis | `redis.client` |
| Elasticsearch | `elasticsearch.client` |
| MongoDB | `mongodb.client` |
| Polaris | `polaris.control.plane` |
| Apollo | `apollo.config.center` |
| Etcd | `etcd.config.center` |
| Tracer | `tracer.server` |
| Seata | `seata.server` |
| DTM | `dtm.server` |
| Sentinel | `sentinel.flow_control` |
| Etcd Lock | `etcd.distributed.lock` |

这在插件页写“通过插件管理器获取实例”时尤其关键。

## 按场景选插件

| 需求 | 推荐模块 | 常见接入方式 |
|------|----------|-------------|
| HTTP API | `lynx-http` | `GetHttpServer()` |
| gRPC 服务 | `lynx-grpc` | `GetGrpcServer(nil)` |
| gRPC 客户端订阅 | `lynx-grpc` 客户端插件 / `lynx/subscribe` | 插件管理器或订阅辅助 API |
| 缓存 / 共享状态 | `lynx-redis` | `GetUniversalRedis()` |
| 搜索 | `lynx-elasticsearch` | `GetElasticsearch()` |
| 文档型数据库 | `lynx-mongodb` | `GetMongoDBDatabase()` |
| SQL 数据库 | `lynx-mysql` / `lynx-pgsql` / `lynx-mssql` | SQL 插件 Getter / provider |
| 配置中心 / 服务发现 | `lynx-polaris`、`lynx-nacos`、`lynx-apollo`、`lynx-etcd` | 插件 API + 运行时装配 |
| 消息队列 | `lynx-kafka`、`lynx-rabbitmq`、`lynx-rocketmq`、`lynx-pulsar` | 插件管理器或公开 Getter |
| 分布式事务 | `lynx-seata`、`lynx-dtm` | 插件对象 / helper API |
| 分布式锁 | `lynx-redis-lock`、`lynx-etcd-lock` | 锁 helper API |
| API 文档 / 链路追踪 / 流控 | `lynx-swagger`、`lynx-tracer`、`lynx-sentinel` | 插件 API / 中间件接入 |

## 实用规则

- 模块路径以插件仓库里的 `go.mod` 为准，不要凭印象猜
- 配置前缀以插件代码里的常量为准，不要写模糊别名
- 要记住并不是所有插件都用 `lynx.<name>` 这种前缀，例如 `rabbitmq` 和 `rocketmq`
- 插件已经提供 Getter 时，优先使用 Getter
- 只有在需要更丰富的插件能力或动态接入时，再退回到 `GetPlugin(...)`
- 读插件文档时，要把它和引导配置、启动顺序一起理解，因为很多能力依赖的是运行时装配顺序，而不只是配置结构

## 下一步

- [插件生态](/docs/existing-plugin/plugin-ecosystem)
- [引导配置](/docs/getting-started/bootstrap-config)
- [插件管理](/docs/getting-started/plugin-manager)
