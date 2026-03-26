---
id: mongodb
title: MongoDB Plugin
---

# MongoDB Plugin

The MongoDB plugin provides **MongoDB** integration for the Lynx framework, including connection pool, TLS, read/write concern, health checks, and metrics.

## Features

- **MongoDB client**: Full driver support.
- **Connection pool**: Configurable min/max pool size.
- **Authentication**: Multiple auth methods.
- **TLS/SSL**: Secure connections.
- **Read/Write concern**: Configurable read and write concern.
- **Retries**: Automatic retry writes.
- **Health checks**: Built-in health checks.
- **Metrics**: Prometheus metrics and hot config updates.

## Configuration

Add under `lynx.mongodb` in your config file:

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
    enable_compression: true
    enable_retry_writes: true
```

## Usage

Import the plugin and obtain the client and database via the plugin’s getters (e.g. `mongodb.GetMongoDB()`, `mongodb.GetMongoDBDatabase()`). Use them in your data layer with the official `go.mongodb.org/mongo-driver` APIs.

```go
import (
    "github.com/go-lynx/lynx/app/boot"
    "github.com/go-lynx/lynx-mongodb"
)

// After bootstrap
client := mongodb.GetMongoDB()
db := mongodb.GetMongoDBDatabase()
```

## Installation

```bash
go get github.com/go-lynx/lynx-mongodb
```

Note: The MongoDB plugin may live in a separate repo (`lynx-mongodb`). Use the module path indicated in the plugin’s README.
