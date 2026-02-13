---
id: plugin-usage-guide
title: Plugin Usage Guide
slug: getting-started/plugin-usage-guide
---

# Plugin Usage Guide

This page describes the **general steps for using existing plugins** in Go-Lynx, so you can get started with any plugin quickly.

## Four Steps to Use a Plugin

Most Lynx plugins follow the same usage pattern:

### 1. Add dependency

Pull the plugin module with Go modules, for example:

```bash
# In-repo plugins (path may vary by main repo)
go get github.com/go-lynx/lynx/plugin/redis

# Standalone repos
go get github.com/go-lynx/lynx-elasticsearch
go get github.com/go-lynx/lynx-rabbitmq
go get github.com/go-lynx/lynx-dtm
```

Check each plugin's README or the [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem) for the exact package path.

### 2. Declare in configuration

Add the corresponding section in `config.yaml` (or bootstrap config). The key is usually `lynx.<plugin-name>`:

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

Some plugins (e.g. DTM, Etcd Lock) depend on others; configure and load those first.

### 3. Register the plugin (import)

In `main.go` or your init entry, **anonymous import** the plugin package so the framework loads it at startup:

```go
import (
    _ "github.com/go-lynx/lynx/plugin/redis"
    _ "github.com/go-lynx/lynx/plugin/http"
    _ "github.com/go-lynx/lynx-elasticsearch"
)
```

Plugins are initialized during [Bootstrap](/docs/getting-started/bootstrap-config) according to config and [plugin order](/docs/getting-started/plugin-manager).

### 4. Inject and use in business code

Obtain the instance via the plugin's **Getter** or the **plugin manager**, then inject with Wire or manually:

```go
// Option 1: plugin GetXxx()
import lynxRedis "github.com/go-lynx/lynx/plugin/redis"

var ProviderSet = wire.NewSet(
    NewData,
    lynxRedis.GetRedis,
)

func NewData(rdb *redis.Client, logger log.Logger) (*Data, error) {
    // use rdb for Redis
    return &Data{rdb: rdb}, nil
}
```

```go
// Option 2: get by name from plugin manager (some plugins)
plugin := app.Lynx().GetPluginManager().GetPlugin("rabbitmq")
client := plugin.(rabbitmq.ClientInterface)
```

See each plugin's doc for the exact Getter name and type (e.g. [Redis](/docs/existing-plugin/redis), [HTTP](/docs/existing-plugin/http)).

## Scenario index

| Need | Recommended plugin & doc |
|------|---------------------------|
| HTTP API | [HTTP](/docs/existing-plugin/http) |
| gRPC service | [gRPC](/docs/existing-plugin/grpc) |
| Relational DB | [Database](/docs/existing-plugin/db) |
| Cache | [Redis](/docs/existing-plugin/redis) |
| Full-text search | [Elasticsearch](/docs/existing-plugin/elasticsearch) |
| Message queue | [Kafka](/docs/existing-plugin/kafka) / [RabbitMQ](/docs/existing-plugin/rabbitmq) / [RocketMQ](/docs/existing-plugin/rocketmq) / [Pulsar](/docs/existing-plugin/pulsar) |
| Config center | [Nacos](/docs/existing-plugin/nacos) / [Apollo](/docs/existing-plugin/apollo) / [Etcd](/docs/existing-plugin/etcd) / [Polaris](/docs/existing-plugin/polaris) |
| Service discovery | [Polaris](/docs/existing-plugin/polaris) / [Nacos](/docs/existing-plugin/nacos) / [Etcd](/docs/existing-plugin/etcd) |
| Distributed transaction | [Seata](/docs/existing-plugin/seata) / [DTM](/docs/existing-plugin/dtm) |
| Distributed lock | [Redis Lock](/docs/existing-plugin/redis-lock) / [Etcd Lock](/docs/existing-plugin/etcd-lock) |
| Tracing | [Tracer](/docs/existing-plugin/tracer) |
| API docs | [Swagger](/docs/existing-plugin/swagger) |
| Rate limit & circuit break | [Sentinel](/docs/existing-plugin/sentinel) |
| Project scaffold | [Layout](/docs/existing-plugin/layout) + [Quick Start](/docs/getting-started/quick-start) |

## Next steps

- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem) — Full plugin list and doc links  
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config) — Config file and remote config  
- [Plugin Management](/docs/getting-started/plugin-manager) — Load order and custom plugins  
