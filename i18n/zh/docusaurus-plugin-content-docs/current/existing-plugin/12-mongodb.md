---
id: mongodb
title: MongoDB 插件
---

# MongoDB 插件

`lynx-mongodb` 是 Lynx 运行时持有的 MongoDB client。本页严格围绕 `lynx-mongodb/conf/example_config.yml` 里的字段来说明每个 YAML 键什么时候生效、默认值如何交互，以及最容易踩到的误配点。

## Runtime Facts（运行时事实）

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-mongodb` |
| 配置前缀 | `lynx.mongodb` |
| Runtime 插件名 | `mongodb.client` |
| 公开 getter | `GetMongoDB()`、`GetMongoDBDatabase()`、`GetMongoDBCollection(name)`、`GetMetricsGatherer()`、`GetMongoDBPlugin()` |

## Template Field Guide（模板字段说明）

| 字段 | 作用 | 什么时候启用 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `uri` | MongoDB 连接 URI。 | 始终需要。 | 默认 `"mongodb://localhost:27017"`。副本集、分片、SRV 这类选项仍应写在 URI 里。 | 把同一套部署信息一部分写 URI，一部分写顶层 YAML，最后没人说得清谁才是主配置。 |
| `database` | `GetMongoDBDatabase()` 返回的默认数据库。 | 始终需要。 | 默认 `"test"`。所有 `GetMongoDBCollection(name)` 都从这个数据库解析。 | 忘了改模板值，结果集合全建到错误数据库。 |
| `username` | MongoDB 认证用户名。 | 走 URI 外的显式凭证认证时。 | 默认空。只有 `username` 和 `password` 同时非空时，插件才会真正设置认证。 | 只填用户名就以为已经启用认证。 |
| `password` | MongoDB 认证密码。 | 走 URI 外的显式凭证认证时。 | 默认空。没有 `username` 就不会生效。 | 填了密码，但用户名留空。 |
| `auth_source` | 认证数据库。 | 只有和 `username`、`password` 配套时才有意义。 | 默认空。认证启用时会一起传入。 | 单独设置 `auth_source`，却没有真正启用凭证认证。 |
| `max_pool_size` | MongoDB 驱动连接池最大值。 | 一般都应考虑。 | 默认 `100`。 | 设得过低，业务并发一上来就把锅甩给 MongoDB。 |
| `min_pool_size` | MongoDB 驱动连接池最小值。 | 想保留一定空闲连接时。 | 默认 `5`。 | 低流量服务把它拉太高，白白占着连接。 |
| `connect_timeout` | 初始连接超时。 | 一般都应考虑。 | 默认 `"30s"`。会影响启动和重连。 | 跨可用区或冷启动场景里设得太小。 |
| `server_selection_timeout` | 选择 MongoDB server 的时间预算。 | 尤其在副本集和分片场景重要。 | 默认 `"30s"`。 | failover 场景里设得太小。 |
| `socket_timeout` | Socket 读写超时。 | 一般都应考虑。 | 默认 `"30s"`。 | 合法的长查询还没完成就被超时打断。 |
| `heartbeat_interval` | 驱动心跳间隔。 | 通常保留默认值即可。 | 默认 `"10s"`。更低能更快感知拓扑变化，但会增加后台流量。 | 没评估集群开销就一味调低。 |
| `enable_metrics` | 开启插件本地 Prometheus 指标。 | 计划把插件 gatherer 暴露到 `/metrics` 时。 | 默认 `false`。 | 开了它，却从来没把 `GetMetricsGatherer()` 并进应用指标端点。 |
| `enable_health_check` | 开启后台健康检查。 | 需要周期性运行时健康可见性时。 | 默认 `false`。无论开不开，启动时都会做连通性测试。 | 设成 `false`，却以为启动 ping 也不会跑。 |
| `health_check_interval` | 后台健康检查间隔。 | 只有 `enable_health_check: true` 时。 | 默认 `"30s"`。 | 改了这个值，却没开健康检查。 |
| `enable_tls` | 为 client options 启用 TLS 文件处理。 | 部署要求 TLS，且你使用文件式 TLS 材料时。 | 默认 `false`。当前实现只会根据提供的证书文件构造 TLS config；如果 `enable_tls: true` 但所有 TLS 文件路径都为空，并不会自动注入自定义 TLS config。 | 只把 `enable_tls` 改成 `true`，却既没提供证书文件，也没在 URI 里写 TLS 选项。 |
| `tls_cert_file` | 客户端证书路径。 | `enable_tls: true` 且需要 mTLS 时。 | 默认空。 | 证书路径填了，但 `enable_tls` 仍是关闭的。 |
| `tls_key_file` | 客户端私钥路径。 | `enable_tls: true` 且需要 mTLS 时。 | 默认空。 | 只配证书不配匹配的私钥。 |
| `tls_ca_file` | 自定义 CA 证书路径。 | 集群 CA 不在主机默认信任链中时。 | 默认空。 | 以为私有 CA 会被系统自动信任。 |
| `enable_compression` | 开启 MongoDB 压缩协商。 | 需要节省网络且集群支持压缩时。 | 默认 `false`。当前实现会启用 `zlib` 和 `snappy`。 | 只改 `compression_level`，却期待压缩已经生效。 |
| `compression_level` | 保存压缩级别提示。 | 目前只能当元数据。 | 默认 `0`。当前实现会保存它，但不会把它应用到驱动选项里。 | 调这个值，却期待立即改变运行时行为。 |
| `enable_retry_writes` | 开启可重试写。 | 部署拓扑支持 retryable writes 时。 | 默认 `false`。 | 在不支持 retryable writes 的拓扑上硬开。 |
| `enable_read_concern` | 给 client 应用 read concern。 | 需要显式读一致性语义时。 | 默认 `false`。 | 只配 `read_concern_level`，忘了开关本身。 |
| `read_concern_level` | Read concern 级别。 | 只有 `enable_read_concern: true` 时。 | 默认 `"local"`。当前实现遇到未知值会退回 `local`。 | 拼写错误后悄悄退回 `local`。 |
| `enable_write_concern` | 给 client 应用 write concern。 | 需要显式持久化语义时。 | 默认 `false`。 | 配了 `write_concern_w` / `write_concern_timeout`，却忘了打开这个开关。 |
| `write_concern_w` | Write concern 确认级别。 | 只有 `enable_write_concern: true` 时。 | 默认 `1`。 | 没确认副本拓扑和延迟预算，就盲目调高。 |
| `write_concern_timeout` | Write concern 超时。 | 只有 `enable_write_concern: true` 时。 | 默认 `"5s"`。 | 设得比正常副本确认延迟还短。 |

## Practical Notes（实际注意点）

- `GetMongoDBCollection(name)` 永远基于默认 `database` 解析；集合创建、索引、文档模型仍属于业务代码。
- metrics 和后台健康检查是两套独立开关：前者控制指标导出，后者控制周期性探活。
- 如果你更倾向于把认证或 TLS 放在 URI 里，就尽量把同类信息集中到一个地方，不要 URI 和顶层 YAML 混着配。

## Related Pages（相关页面）

- [数据库插件](/docs/existing-plugin/db)
- [Layout](/docs/existing-plugin/layout)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
