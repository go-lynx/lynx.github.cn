---
id: mongodb
title: MongoDB 插件
slug: existing-plugin/mongodb
---

# MongoDB 插件

MongoDB 插件为 Lynx 提供 **MongoDB** 集成，包括连接池、TLS、读写关注、健康检查与指标。

## 功能

- **MongoDB 客户端**：完整驱动能力。
- **连接池**：可配置最小/最大连接数。
- **鉴权**：多种认证方式。
- **TLS/SSL**：安全连接。
- **读写关注**：可配置 read/write concern。
- **重试**：自动重试写入。
- **健康检查**：内置健康检查。
- **指标**：Prometheus 指标与热更新配置。

## 配置

在配置文件中增加 `lynx.mongodb` 段：

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

## 使用

导入插件后，通过插件的 getter（如 `mongodb.GetMongoDB()`、`mongodb.GetMongoDBDatabase()`）获取客户端与数据库，在数据层配合官方 `go.mongodb.org/mongo-driver` 使用。

```go
import (
    "github.com/go-lynx/lynx/app/boot"
    "github.com/go-lynx/lynx-mongodb"
)

// 启动后
client := mongodb.GetMongoDB()
db := mongodb.GetMongoDBDatabase()
```

## 安装

```bash
go get github.com/go-lynx/lynx-mongodb
```

注意：MongoDB 插件可能位于独立仓库（lynx-mongodb），请以该插件 README 中的模块路径为准。
