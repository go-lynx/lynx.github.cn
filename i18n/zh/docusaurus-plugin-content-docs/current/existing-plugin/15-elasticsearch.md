---
id: elasticsearch
title: Elasticsearch 插件
---

# Elasticsearch 插件

`lynx-elasticsearch` 把官方 Elasticsearch client 接入 Lynx 的 runtime 启动流程。它负责 client 初始化、连接策略、metrics / health 配置，以及 index prefix 处理；但查询 DSL、mapping 设计和索引治理仍然属于你的业务代码层。

## 运行时事实

| 项目 | 值 |
| --- | --- |
| Go 模块 | `github.com/go-lynx/lynx-elasticsearch` |
| 配置前缀 | `lynx.elasticsearch` |
| runtime 插件名 | `elasticsearch.client` |
| 主要 Getter | `GetElasticsearch()`、`GetElasticsearchPlugin()`、`GetIndexName(name)` |

## 实现里实际提供了什么

- 从 `lynx.elasticsearch` 初始化 Elasticsearch client
- 支持多节点地址、认证字段、重试、超时、健康检查与 metrics 配置
- 通过 `GetElasticsearch()` 暴露原始 client
- 通过插件实例暴露 `GetConnectionStats()` 和带 prefix 的索引名生成能力

## 配置示例

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

## 使用方式

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

## 实践建议

- 多应用或多环境共用一个集群时，优先使用 `index_prefix`
- schema、alias 和 query 组合逻辑应保留在你的服务层，而不是塞进插件配置
- 需要运行时观测时，优先使用 `GetConnectionStats()`，不要再自己拼一套临时探针

## 相关页面

- 仓库: [go-lynx/lynx-elasticsearch](https://github.com/go-lynx/lynx-elasticsearch)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
