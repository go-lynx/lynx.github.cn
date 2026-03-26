---
id: mongodb
title: MongoDB Plugin
---

# MongoDB Plugin

The MongoDB plugin brings a MongoDB client into the Lynx runtime. It handles connection initialization, pooling, health checks, and a stable injection entry. It does not try to replace how your application organizes collections or repositories.

## What it is for

- initializing and owning MongoDB client connectivity
- injecting database objects into the data layer
- centralizing timeout, pool, TLS, and health behavior

## Basic configuration

```yaml
lynx:
  mongodb:
    uri: "mongodb://localhost:27017"
    database: "myapp"
    username: "admin"
    password: "password"
    auth_source: "admin"
    max_pool_size: 100
    min_pool_size: 5
    connect_timeout: "30s"
    server_selection_timeout: "30s"
    enable_metrics: true
    enable_health_check: true
    enable_tls: false
```

## Application integration

The common path is to anonymous-import the plugin and obtain the client or database object through getters:

```go
import (
    mongodb "github.com/go-lynx/lynx-mongodb"
)

client := mongodb.GetMongoDB()
db := mongodb.GetMongoDBDatabase()
```

Once you have `client` or `db`, keep the collection, index, and repository organization in your own data layer.

## Practical guidance

- keep connection and TLS details in startup config
- do not let business collection layout bleed back into the plugin layer
- if all you need is Mongo connectivity, this plugin is enough; if you need higher abstractions, build them in the application layer

## Related pages

- [Database Plugin](/docs/existing-plugin/db)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
