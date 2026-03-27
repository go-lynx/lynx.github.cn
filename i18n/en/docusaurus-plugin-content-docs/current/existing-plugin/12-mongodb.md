---
id: mongodb
title: MongoDB Plugin
---

# MongoDB Plugin

The MongoDB plugin is a runtime-owned Mongo client with pool, timeout, metrics, and health-check management.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-mongodb` |
| Config prefix | `lynx.mongodb` |
| Runtime plugin name | `mongodb.client` |
| Public APIs | `GetMongoDB()`, `GetMongoDBPlugin()`, `GetMongoDBDatabase()`, `GetMongoDBCollection()`, `GetMetricsGatherer()` |

## What The Implementation Actually Does

The plugin initializes one managed MongoDB client and can enable:

- pool sizing and timeout control
- TLS configuration
- read concern and write concern settings
- Prometheus command and pool monitoring
- periodic health checks

This means the plugin is responsible for connectivity and operational behavior. Your repository layer remains responsible for collection structure and query design.

## Configuration

```yaml
lynx:
  mongodb:
    uri: "mongodb://localhost:27017"
    database: "app"
    max_pool_size: 100
    min_pool_size: 5
    connect_timeout: 30s
    server_selection_timeout: 30s
    enable_metrics: true
    enable_health_check: true
```

## How To Consume It

```go
import mongodb "github.com/go-lynx/lynx-mongodb"

client := mongodb.GetMongoDB()
db := mongodb.GetMongoDBDatabase()
orders := mongodb.GetMongoDBCollection("orders")
gatherer := mongodb.GetMetricsGatherer()
```

`GetMetricsGatherer()` matters if you want to merge plugin metrics into your application's `/metrics` endpoint.

## Practical Notes

- The plugin tests connectivity during startup.
- Background metrics and health-check goroutines are started only when enabled.
- If you need higher-level repository abstractions, build them above this plugin rather than inside it.

## Related Pages

- [Database Plugin](/docs/existing-plugin/db)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
