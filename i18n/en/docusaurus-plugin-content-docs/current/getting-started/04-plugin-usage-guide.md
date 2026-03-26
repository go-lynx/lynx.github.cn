---
id: plugin-usage-guide
title: Plugin Usage Guide
---

# Plugin Usage Guide

In Lynx, a plugin is not just another SDK dependency. It is a capability module that joins a shared runtime. Most plugins follow the same path: **add the module, provide config, anonymously import it, let startup assemble it, then obtain the instance in application code**.

This page does not try to document every plugin parameter. Its purpose is to explain the common integration path you will use for most Lynx plugins.

## Standard integration flow

### 1. Add the plugin module

Bring the plugin module into your project first. Different plugins may live in different repositories:

```bash
# in-repo plugins
go get github.com/go-lynx/lynx/plugin/http
go get github.com/go-lynx/lynx/plugin/redis

# standalone plugin repos
go get github.com/go-lynx/lynx-kafka
go get github.com/go-lynx/lynx-rabbitmq
go get github.com/go-lynx/lynx-tracer
```

If you are unsure about the module path, start with the [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem) page or the plugin repository README.

### 2. Add startup-critical configuration

Plugins need configuration to initialize. In practice you usually add a `lynx.<plugin>` block in local config or remote config, for example:

```yaml
lynx:
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
  redis:
    addr: 127.0.0.1:6379
    password: ""
    db: 0
```

Two rules matter here:

- keep startup-critical information in bootstrap entry config
- keep large amounts of mutable business configuration in application or remote config

The rationale for that split is covered in [Bootstrap Configuration](/docs/getting-started/bootstrap-config).

### 3. Register the plugin with an anonymous import

Most Lynx plugins are registered through anonymous imports. That means configuration alone is not enough; the plugin package also needs to be loaded at startup:

```go
import (
    _ "github.com/go-lynx/lynx/plugin/http"
    _ "github.com/go-lynx/lynx/plugin/redis"
    _ "github.com/go-lynx/lynx-kafka"
)
```

The point of the anonymous import is to register the plugin factory into the runtime. The actual initialization is still controlled by the plugin manager and the startup flow, not by import time side effects alone.

### 4. Let the application startup assemble the runtime

The recommended startup entry today is:

```go
func main() {
    if err := boot.NewApplication(wireApp).Run(); err != nil {
        panic(err)
    }
}
```

Through this path, Lynx reads configuration, builds the runtime, resolves plugin dependencies, and initializes plugins in order.

If one plugin depends on another, such as a distributed lock depending on Redis or governance capabilities depending on a registry, that dependency chain is handled in this stage as well. See [Plugin Management](/docs/getting-started/plugin-manager) for the runtime side of that process.

### 5. Obtain the capability in business code

Once startup finishes, there are two common ways to use a plugin.

The first is to use the Getter exposed by the plugin, which works well with Wire:

```go
import (
    "github.com/google/wire"
    lynxRedis "github.com/go-lynx/lynx/plugin/redis"
)

var ProviderSet = wire.NewSet(
    NewData,
    lynxRedis.GetRedis,
)
```

The second is to obtain the plugin instance through the runtime or plugin manager, which is useful for more dynamic integration paths:

```go
plugin := app.Lynx().GetPluginManager().GetPlugin("rabbitmq")
client := plugin.(rabbitmq.ClientInterface)
```

Whether a plugin exposes `GetXxx`, what type it returns, and whether helper wrappers exist depends on the plugin itself. Check the corresponding plugin document.

## Common integration scenarios

| Need | Recommended plugins |
|------|---------------------|
| HTTP APIs | [HTTP](/docs/existing-plugin/http) |
| gRPC services | [gRPC](/docs/existing-plugin/grpc) |
| Relational database access | [Database](/docs/existing-plugin/db) / [SQL SDK](/docs/existing-plugin/sql-sdk) |
| Cache and shared state | [Redis](/docs/existing-plugin/redis) |
| Full-text search | [Elasticsearch](/docs/existing-plugin/elasticsearch) |
| Message queues | [Kafka](/docs/existing-plugin/kafka) / [RabbitMQ](/docs/existing-plugin/rabbitmq) / [RocketMQ](/docs/existing-plugin/rocketmq) / [Pulsar](/docs/existing-plugin/pulsar) |
| Config center and service discovery | [Nacos](/docs/existing-plugin/nacos) / [Apollo](/docs/existing-plugin/apollo) / [Etcd](/docs/existing-plugin/etcd) / [Polaris](/docs/existing-plugin/polaris) |
| Distributed transactions | [Seata](/docs/existing-plugin/seata) / [DTM](/docs/existing-plugin/dtm) |
| Distributed locks | [Redis Lock](/docs/existing-plugin/redis-lock) / [Etcd Lock](/docs/existing-plugin/etcd-lock) |
| Observability and API docs | [Tracer](/docs/existing-plugin/tracer) / [Swagger](/docs/existing-plugin/swagger) / [Sentinel](/docs/existing-plugin/sentinel) |

## Practical rules

- only promote capabilities into plugins when they truly need shared lifecycle and runtime ownership
- keep bootstrap config focused on what startup must know
- prefer explicit application startup and dependency injection over global-singleton-first usage
- if an official plugin already exists, prefer it over scattering one-off glue code in business packages

## Next steps

- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
- [Plugin Management](/docs/getting-started/plugin-manager)
