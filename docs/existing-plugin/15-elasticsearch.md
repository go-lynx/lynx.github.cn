---
id: elasticsearch
title: Elasticsearch Plugin
slug: existing-plugin/elasticsearch
---

# Elasticsearch Plugin

Go-Lynx 的 Elasticsearch 插件为应用提供完整的 Elasticsearch 集成能力，支持全文检索、索引、聚合等能力，并具备连接池、健康检查、指标监控与热更新。

## 功能概览

- **完整 ES 客户端**：基于官方 go-elasticsearch/v8
- **多种认证**：用户名/密码、API Key、Service Token
- **TLS/SSL**：安全连接
- **连接池与重试**：可配置连接超时与最大重试次数
- **健康检查与指标**：Prometheus 指标与健康探针
- **热配置更新**：支持运行时配置更新

## 配置说明

在 `config.yaml` 中增加 `lynx.elasticsearch` 配置：

```yaml
lynx:
  elasticsearch:
    addresses:
      - "http://localhost:9200"
      - "http://localhost:9201"
    username: "elastic"
    password: "changeme"
    max_retries: 3
    connect_timeout: "30s"
    enable_metrics: true
    enable_health_check: true
    health_check_interval: "30s"
    compress_request_body: true
    index_prefix: "myapp"
```

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `addresses` | `[]string` | `["http://localhost:9200"]` | ES 节点地址列表 |
| `username` / `password` | string | 空 | 基础认证 |
| `api_key` / `service_token` | string | 空 | API Key 或 Service Token |
| `max_retries` | int | 3 | 最大重试次数 |
| `connect_timeout` | string | "30s" | 连接超时 |
| `enable_metrics` | bool | false | 是否开启 Prometheus 指标 |
| `enable_health_check` | bool | false | 是否开启健康检查 |
| `index_prefix` | string | 空 | 索引名前缀（如 `myapp` 则 GetIndexName("documents") => "myapp_documents"） |

## 如何使用

### 1. 引入依赖

```bash
go get github.com/go-lynx/lynx-elasticsearch
```

### 2. 注册插件

在 `main.go` 中匿名导入插件（或通过 Lynx 的插件列表注册）：

```go
import (
    _ "github.com/go-lynx/lynx-elasticsearch"
)
```

### 3. 获取客户端并调用

```go
import (
    "context"
    "github.com/go-lynx/lynx-elasticsearch"
    "github.com/elastic/go-elasticsearch/v8/esapi"
)

// 获取 ES 客户端
client := elasticsearch.GetElasticsearch()
if client == nil {
    log.Fatal("failed to get elasticsearch client")
}

// 带前缀的索引名（若配置了 index_prefix）
indexName := elasticsearch.GetIndexName("documents") // 如 "myapp_documents"

// 创建索引、写入文档、搜索等均通过 esapi 与 client 完成
req := esapi.IndexRequest{
    Index:      indexName,
    DocumentID: "1",
    Body:       strings.NewReader(`{"title":"hello","content":"world"}`),
    Refresh:    "true",
}
res, err := req.Do(context.Background(), client)
```

### 4. 通过 Plugin 获取统计与索引名

```go
plugin := elasticsearch.GetElasticsearchPlugin()
stats := plugin.GetConnectionStats()
indexName := plugin.GetIndexName("documents")
```

## 使用建议

- 生产环境建议开启 `enable_metrics`、`enable_health_check`，并合理设置 `connect_timeout`、`max_retries`。
- 多节点时配置多个 `addresses` 以提升可用性。
- 使用 `index_prefix` 便于多环境/多应用共用集群时区分索引。

## 相关链接

- 仓库：[go-lynx/lynx-elasticsearch](https://github.com/go-lynx/lynx-elasticsearch)
- [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
