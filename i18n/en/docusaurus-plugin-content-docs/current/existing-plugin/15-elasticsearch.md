---
id: elasticsearch
title: Elasticsearch Plugin
slug: existing-plugin/elasticsearch
---

# Elasticsearch Plugin

The Go-Lynx Elasticsearch plugin provides full Elasticsearch integration for your application: full-text search, indexing, aggregation, connection pooling, health checks, metrics, and hot config updates.

## Features

- **Full ES client** — Based on official go-elasticsearch/v8
- **Multiple auth** — Username/password, API Key, Service Token
- **TLS/SSL** — Secure connections
- **Connection pool & retry** — Configurable connect timeout and max retries
- **Health & metrics** — Prometheus metrics and health probes
- **Hot config** — Runtime config updates

## Configuration

Add `lynx.elasticsearch` in `config.yaml`:

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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `addresses` | `[]string` | `["http://localhost:9200"]` | ES node addresses |
| `username` / `password` | string | empty | Basic auth |
| `api_key` / `service_token` | string | empty | API Key or Service Token |
| `max_retries` | int | 3 | Max retries |
| `connect_timeout` | string | "30s" | Connect timeout |
| `enable_metrics` | bool | false | Enable Prometheus metrics |
| `enable_health_check` | bool | false | Enable health check |
| `index_prefix` | string | empty | Index name prefix (e.g. GetIndexName("documents") => "myapp_documents") |

## How to use

### 1. Add dependency

```bash
go get github.com/go-lynx/lynx-elasticsearch
```

### 2. Register plugin

Anonymous import in `main.go` (or register via Lynx plugin list):

```go
import (
    _ "github.com/go-lynx/lynx-elasticsearch"
)
```

### 3. Get client and call APIs

```go
import (
    "context"
    "github.com/go-lynx/lynx-elasticsearch"
    "github.com/elastic/go-elasticsearch/v8/esapi"
)

client := elasticsearch.GetElasticsearch()
if client == nil {
    log.Fatal("failed to get elasticsearch client")
}

indexName := elasticsearch.GetIndexName("documents") // e.g. "myapp_documents"

req := esapi.IndexRequest{
    Index:      indexName,
    DocumentID: "1",
    Body:       strings.NewReader(`{"title":"hello","content":"world"}`),
    Refresh:    "true",
}
res, err := req.Do(context.Background(), client)
```

### 4. Plugin stats and index name

```go
plugin := elasticsearch.GetElasticsearchPlugin()
stats := plugin.GetConnectionStats()
indexName := plugin.GetIndexName("documents")
```

## Recommendations

- In production, enable `enable_metrics` and `enable_health_check`, and set `connect_timeout` and `max_retries` appropriately.
- Use multiple `addresses` for higher availability.
- Use `index_prefix` to separate indices per environment or app when sharing a cluster.

## See also

- Repo: [go-lynx/lynx-elasticsearch](https://github.com/go-lynx/lynx-elasticsearch)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
