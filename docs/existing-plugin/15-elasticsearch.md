---
id: elasticsearch
title: Elasticsearch Plugin
---

# Elasticsearch Plugin

The Elasticsearch plugin brings search capability into the Lynx runtime. Its job is to handle client initialization, connection parameters, health state, and a stable integration entry. It does not try to own your query DSL or index design.

## What it is for

- managing Elasticsearch client connectivity
- providing one client entry for search, indexing, and aggregation workflows
- centralizing retry, timeout, health, and metrics behavior

## Basic configuration

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
    index_prefix: "myapp"
```

## Basic usage

```go
import (
    elasticsearch "github.com/go-lynx/lynx-elasticsearch"
)

client := elasticsearch.GetElasticsearch()
indexName := elasticsearch.GetIndexName("documents")
```

Once you have the client, index creation, document writes, and searches still use the official Elasticsearch client APIs.

## Practical guidance

- configure multiple `addresses` for multi-node clusters
- use `index_prefix` when environments or apps share one cluster
- keep query models and index structure in the application layer instead of forcing them into plugin config

## Related pages

- Repo: [go-lynx/lynx-elasticsearch](https://github.com/go-lynx/lynx-elasticsearch)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
