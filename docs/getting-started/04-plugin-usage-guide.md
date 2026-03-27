---
id: plugin-usage-guide
title: Plugin Usage Guide
---

# Plugin Usage Guide

In Lynx, a plugin is not just another SDK dependency. It is a capability module that joins the shared runtime, is registered into the global plugin factory, and is then assembled by the plugin manager during application startup.

This page focuses on the **code-backed integration path** you will use for most Lynx plugins: correct module path, correct config prefix, registration mechanism, and the public API you actually obtain after startup.

## The integration chain you should keep in mind

For most Lynx plugins, the runtime path is:

1. add the correct Go module
2. configure the matching `lynx.<prefix>`
3. anonymous-import the module so it registers itself into `factory.GlobalTypedFactory()`
4. let `boot.NewApplication(wireApp).Run()` assemble the runtime
5. obtain the capability through the plugin's exported Getter or through the plugin manager

That chain matters because configuration alone does not load a plugin, and importing a package alone does not initialize it. Both registration and startup assembly have to happen.

## 1. Add the correct module

The current repository family is mostly split into standalone plugin modules. In practice, the imports you want today look more like this:

```bash
# framework core / built-in capabilities
go get github.com/go-lynx/lynx

# service plugins
go get github.com/go-lynx/lynx-http
go get github.com/go-lynx/lynx-grpc

# storage and cache
go get github.com/go-lynx/lynx-redis
go get github.com/go-lynx/lynx-mongodb
go get github.com/go-lynx/lynx-elasticsearch
go get github.com/go-lynx/lynx-mysql
go get github.com/go-lynx/lynx-pgsql
go get github.com/go-lynx/lynx-mssql

# messaging
go get github.com/go-lynx/lynx-kafka
go get github.com/go-lynx/lynx-rabbitmq
go get github.com/go-lynx/lynx-rocketmq
go get github.com/go-lynx/lynx-pulsar

# config / governance / observability
go get github.com/go-lynx/lynx-polaris
go get github.com/go-lynx/lynx-nacos
go get github.com/go-lynx/lynx-apollo
go get github.com/go-lynx/lynx-etcd
go get github.com/go-lynx/lynx-tracer
go get github.com/go-lynx/lynx-swagger
go get github.com/go-lynx/lynx-sentinel

# distributed capability
go get github.com/go-lynx/lynx-seata
go get github.com/go-lynx/lynx-dtm
go get github.com/go-lynx/lynx-redis-lock
go get github.com/go-lynx/lynx-etcd-lock
```

Two important notes:

- the documentation should follow the module path in each plugin repository's `go.mod`
- some capabilities still live in the main repository, such as [`tls`](/docs/existing-plugin/tls-manager), while most business-facing plugins live in standalone modules

## 2. Add the matching config prefix

Each plugin registers with a concrete config prefix in code. That prefix is what the runtime scans during `InitializeResources`.

Examples from the current codebase:

| Capability | Module | Config prefix |
|------|------|------|
| HTTP server | `github.com/go-lynx/lynx-http` | `lynx.http` |
| gRPC service | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.service` |
| gRPC client | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.client` |
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

For example:

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

## 3. Register the plugin with an anonymous import

Most plugins register themselves through `factory.GlobalTypedFactory().RegisterPlugin(...)` in `init()`. That means you usually need an anonymous import:

```go
import (
    _ "github.com/go-lynx/lynx-http"
    _ "github.com/go-lynx/lynx-grpc"
    _ "github.com/go-lynx/lynx-redis"
    _ "github.com/go-lynx/lynx-tracer"
)
```

This is not a cosmetic detail. Without importing the module, the plugin factory registration does not happen, so the plugin manager has nothing to assemble even if configuration exists.

## 4. Let startup assemble the runtime

The recommended startup entry remains:

```go
func main() {
    if err := boot.NewApplication(wireApp).Run(); err != nil {
        panic(err)
    }
}
```

At this stage, Lynx:

- reads bootstrap configuration
- resolves plugin load order and dependencies
- initializes plugin resources
- runs startup tasks
- exposes shared resources and service endpoints

That is why plugin documentation should be read in runtime terms, not only in SDK terms.

## 5. Obtain the capability after startup

There are three common patterns in the current codebase.

### Pattern A: direct Getter returning the runtime-owned object

This is common for service and datastore plugins:

```go
httpServer, err := lynxhttp.GetHttpServer()
grpcServer, err := lynxgrpc.GetGrpcServer(nil)

rdb := redis.GetUniversalRedis()
es := elasticsearch.GetElasticsearch()
db := mongodb.GetMongoDBDatabase()
```

### Pattern B: Getter returning the plugin object itself

This is common when the plugin exposes richer methods than one client handle:

```go
plugin, err := polaris.GetPolarisPlugin()
instances, err := polaris.GetServiceInstances("user-service")
cfg, err := polaris.GetConfig("application.yaml", "DEFAULT_GROUP")
```

### Pattern C: obtain by plugin manager and assert the concrete type or interface

This is common for modules that are intentionally more dynamic:

```go
plugin := app.Lynx().GetPluginManager().GetPlugin("dtm.server")
dtmClient := plugin.(*dtm.DTMClient)

mqPlugin := app.Lynx().GetPluginManager().GetPlugin("rabbitmq")
client := mqPlugin.(rabbitmq.ClientInterface)
```

## Public entry points you will actually use

The following APIs are already present in code and are worth knowing because they are better than guessing.

| Capability | Public entry points |
|------|------|
| HTTP | `http.GetHttpServer()` |
| gRPC service | `grpc.GetGrpcServer(nil)` |
| Redis | `redis.GetRedis()`, `redis.GetUniversalRedis()` |
| MongoDB | `mongodb.GetMongoDB()`, `mongodb.GetMongoDBDatabase()`, `mongodb.GetMongoDBCollection()` |
| Elasticsearch | `elasticsearch.GetElasticsearch()`, `elasticsearch.GetElasticsearchPlugin()`, `elasticsearch.GetIndexName()` |
| Pulsar | `pulsar.GetPulsarClient()` |
| Polaris | `polaris.GetPolarisPlugin()`, `polaris.GetServiceInstances()`, `polaris.GetConfig()`, `polaris.GetMetrics()` |
| Sentinel | `sentinel.GetSentinel()`, `sentinel.GetMetrics()`, `sentinel.GetResourceStats()` |
| Seata | `seata.GetPlugin()` |
| TLS | certificate provider methods such as `GetCertificate()`, `GetPrivateKey()`, `GetRootCACertificate()` |

When a plugin document names a Getter, it should be read as a stable integration entry, not as a random convenience helper.

## Plugin names you may see in the plugin manager

If you inspect the plugin manager directly, the current codebase uses names such as:

| Capability | Plugin manager name |
|------|------|
| HTTP | `http.server` |
| gRPC service | `grpc.service` |
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

This matters when you use `GetPlugin(...)` manually.

## Scenario-oriented recommendations

| Need | Recommended modules | Common access pattern |
|------|---------------------|-----------------------|
| HTTP API | `lynx-http` | `GetHttpServer()` |
| gRPC service | `lynx-grpc` | `GetGrpcServer(nil)` |
| gRPC client subscriptions | `lynx-grpc` client plugin / `lynx/subscribe` | plugin manager or helper loader |
| Cache / shared state | `lynx-redis` | `GetUniversalRedis()` |
| Search | `lynx-elasticsearch` | `GetElasticsearch()` |
| Document database | `lynx-mongodb` | `GetMongoDBDatabase()` |
| SQL database | `lynx-mysql` / `lynx-pgsql` / `lynx-mssql` | SQL plugin Getter / provider |
| Config center / discovery | `lynx-polaris`, `lynx-nacos`, `lynx-apollo`, `lynx-etcd` | plugin API + runtime wiring |
| Messaging | `lynx-kafka`, `lynx-rabbitmq`, `lynx-rocketmq`, `lynx-pulsar` | plugin manager or exported Getter |
| Distributed transaction | `lynx-seata`, `lynx-dtm` | plugin object / helper APIs |
| Distributed lock | `lynx-redis-lock`, `lynx-etcd-lock` | lock helper APIs |
| API docs / tracing / flow control | `lynx-swagger`, `lynx-tracer`, `lynx-sentinel` | plugin API / middleware integration |

## Practical rules

- use the real module path from the plugin repository, not guessed import paths
- use the real config prefix from plugin code, not a hand-waved alias
- remember that some plugins do not use a `lynx.<name>` prefix even though they are Lynx plugins, such as `rabbitmq` and `rocketmq`
- prefer the exported Getter when it already exists; it is usually the intended public entry
- drop down to `GetPlugin(...)` only when you need plugin-specific rich methods or dynamic integration
- read plugin pages together with bootstrap configuration and runtime ordering, because many capabilities depend on startup sequence, not only config shape

## Next steps

- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
- [Plugin Management](/docs/getting-started/plugin-manager)
