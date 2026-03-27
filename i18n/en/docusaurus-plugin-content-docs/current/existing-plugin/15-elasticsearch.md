---
id: elasticsearch
title: Elasticsearch Plugin
---

# Elasticsearch Plugin

`lynx-elasticsearch` integrates the official Elasticsearch client into Lynx runtime startup. Its role is to own client initialization, connection policy, metrics and health settings, and index-prefix handling, while leaving your query DSL and index mapping design in application code.

## Runtime facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-elasticsearch` |
| Config prefix | `lynx.elasticsearch` |
| Runtime plugin name | `elasticsearch.client` |
| Main getters | `GetElasticsearch()`, `GetElasticsearchPlugin()`, `GetIndexName(name)` |

## What the implementation actually provides

- initializes the Elasticsearch client from `lynx.elasticsearch`
- supports multiple node addresses, auth fields, retries, timeouts, health checks, and metrics
- exposes the raw client through `GetElasticsearch()`
- exposes plugin-level helpers such as `GetConnectionStats()` and prefixed index name generation

## Configuration

```yaml
lynx:
  elasticsearch:
    addresses:
      - "http://localhost:9200"
      - "http://localhost:9201"
    username: "elastic"
    password: "changeme"
    connect_timeout: "30s"
    max_retries: 3
    enable_metrics: true
    enable_health_check: true
    health_check_interval: "30s"
    index_prefix: "myapp"
```

## Usage

```go
import elasticsearch "github.com/go-lynx/lynx-elasticsearch"

client := elasticsearch.GetElasticsearch()
plugin := elasticsearch.GetElasticsearchPlugin()
indexName := elasticsearch.GetIndexName("documents")
stats := plugin.GetConnectionStats()

_ = client
_ = indexName
_ = stats
```

## Practical guidance

- use `index_prefix` when multiple apps or environments share one cluster
- keep schema, aliases, and query composition in your own service layer, not in plugin config
- if you need runtime introspection, prefer `GetConnectionStats()` over inventing ad hoc health probes

## Related pages

- Repo: [go-lynx/lynx-elasticsearch](https://github.com/go-lynx/lynx-elasticsearch)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
