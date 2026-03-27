---
id: mongodb
title: MongoDB 插件
---

# MongoDB 插件

MongoDB 插件是一个由 runtime 持有的 Mongo Client，同时负责连接池、超时、指标和健康检查。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-mongodb` |
| 配置前缀 | `lynx.mongodb` |
| Runtime 插件名 | `mongodb.client` |
| 公开 API | `GetMongoDB()`、`GetMongoDBPlugin()`、`GetMongoDBDatabase()`、`GetMongoDBCollection()`、`GetMetricsGatherer()` |

## 实现里真正做了什么

插件会初始化一个受管的 MongoDB Client，并可按配置启用：

- 连接池和超时控制
- TLS 配置
- read concern 与 write concern
- Prometheus command 与 pool 监控
- 周期性健康检查

也就是说，插件负责连接性和运行时行为；集合设计、索引设计和查询模型仍然归你的 repository 层。

## 配置

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

## 官方模板实际怎么用

官方模板默认并不会接 MongoDB。它当前在 `bootstrap.local.yaml` 里是从 MySQL + Redis 起步的。

这不是文档漏写，而是模板有意做的取舍：

- 模板先选一条具体 SQL 路径
- MongoDB 仍然是你在服务真正需要文档型存储时再补进去的可选数据层
- 所以这页描述的是“受支持插件”，不是“默认脚手架依赖”

## 如何使用

```go
import mongodb "github.com/go-lynx/lynx-mongodb"

client := mongodb.GetMongoDB()
db := mongodb.GetMongoDBDatabase()
orders := mongodb.GetMongoDBCollection("orders")
gatherer := mongodb.GetMetricsGatherer()
```

如果你想把插件指标并入应用自身的 `/metrics`，`GetMetricsGatherer()` 就很重要。

## 实际注意点

- 插件会在启动阶段测试连接。
- 只有启用相关功能时，后台 metrics 和 health-check goroutine 才会启动。
- 如果需要更高层的仓储抽象，应当构建在插件之上，而不是塞回插件内部。

## 相关页面

- [数据库插件](/docs/existing-plugin/db)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
