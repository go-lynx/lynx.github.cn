---
id: elasticsearch
title: Elasticsearch 插件
---

# Elasticsearch 插件

`lynx-elasticsearch` 持有 Lynx 运行时 Elasticsearch client。本页严格对齐 `lynx-elasticsearch/conf/example_config.yml`，说明每个 YAML 字段真正改动的是什么、什么时候有意义，以及最容易把模板用错的地方。

## Runtime Facts（运行时事实）

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-elasticsearch` |
| 配置前缀 | `lynx.elasticsearch` |
| Runtime 插件名 | `elasticsearch.client` |
| 公开 getter | `GetElasticsearch()`、`GetElasticsearchPlugin()`、`GetIndexName(name)` |

## Template Field Guide（模板字段说明）

| 字段 | 作用 | 什么时候启用 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `addresses` | Elasticsearch 节点 bootstrap 地址。 | 始终需要。 | 默认 `["http://localhost:9200"]`。 | 生产环境还保留本地地址，或原本想做多节点 bootstrap 却只配了一个地址。 |
| `username` | Basic Auth 用户名。 | 只有走 Basic Auth 时。 | 默认空。只有 `username` 和 `password` 同时非空时，插件才会发送 Basic Auth。 | 只填用户名就以为认证已生效。 |
| `password` | Basic Auth 密码。 | 只有走 Basic Auth 时。 | 默认空。 | 一边想迁移到 API Key，一边还保留这里的旧密码。 |
| `api_key` | Elasticsearch API Key 认证。 | 集群采用 API Key 时。 | 默认空。当前实现会把所有非空认证字段都转发进 client config。 | 同时保留 `api_key` 与 `username/password` 或 `service_token`，造成认证归属不清。 |
| `service_token` | Elasticsearch Service Token 认证。 | 平台统一使用 service token 时。 | 默认空。和 `api_key` 一样，应当成为唯一激活的认证路径。 | 在另一种认证方式之上再叠加它，最后排错时找错方向。 |
| `certificate_fingerprint` | TLS 证书指纹钉扎。 | 使用 HTTPS 且希望显式证书钉扎时。 | 默认空。 | 在明文 `http://` 地址上期待它生效。 |
| `compress_request_body` | HTTP 请求体压缩。 | 主要用于 bulk index 或大写入负载。 | 默认 `false`。 | 小请求也开启它，却期待明显吞吐提升。 |
| `connect_timeout` | transport dialer 的 TCP 建连超时。 | 一般都应考虑。 | 默认 `"30s"`。它是建连超时，不是整次请求超时。 | 把它当成 search/index 请求的完整 deadline。 |
| `max_retries` | 客户端 HTTP 重试次数。 | 一般都应考虑。 | 默认 `3`。 | 设得过高，集群出问题时尾延迟暴涨。 |
| `enable_metrics` | 开启 Elasticsearch 指标采集。 | 需要插件本地指标时。 | 默认 `false`。开启后会安装带指标的 transport，并启动后台 metrics 收集。 | 开了它，却没计划这些指标怎么采集、怎么查。 |
| `enable_health_check` | 开启后台健康检查。 | 需要周期性 cluster-health 探测时。 | 默认 `false`。即使关闭它，启动时的 ping 仍然会执行。 | 以为关掉它就不会有启动连通性测试。 |
| `health_check_interval` | 后台健康检查间隔。 | 只有 `enable_health_check: true` 时。 | 默认 `"30s"`。 | 改了它，却没开健康检查。 |
| `index_prefix` | `GetIndexName(name)` 使用的前缀。 | 共享集群里需要按服务或环境隔离时。 | 默认空。它只影响 helper，不会替你创建索引、mapping 或 alias。 | 期待插件自动创建带前缀的索引或迁移。 |
| `log_level` | 保存日志级别意图的字段。 | 只有你想把预期级别留在配置里时。 | 默认空。当前实现会保存它，但不会用它重配日志级别。 | 改了这个字段，却期待插件日志级别立刻变化。 |

## Practical Notes（实际注意点）

- 认证路径只保留一套：Basic Auth、API Key、Service Token 三选一。
- `enable_metrics` 和 `enable_health_check` 是 runtime 开关；`index_prefix` 只是 `GetIndexName` 的命名辅助。
- 插件负责 client 启动、重试和健康循环；索引创建、mapping、alias、查询 DSL 仍然由业务自己负责。

## Related Pages（相关页面）

- [Layout](/docs/existing-plugin/layout)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
