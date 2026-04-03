---
id: pulsar
title: Pulsar 插件
---

# Pulsar 插件

本页逐项解释 `lynx-pulsar/conf/example_config.yml` 里的 YAML 字段。该示例本身就位于正确的运行时路径下，也就是 `lynx.pulsar`。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-pulsar` |
| 配置前缀 | `lynx.pulsar` |
| Runtime 插件名 | `pulsar.client` |
| 公开 API | `GetPulsarClient()`、`GetPulsarClientByName()` |

`GetPulsarClientByName()` 虽然存在，但当前实现仍然返回主运行时 client，而不是按名字完全隔离的独立插件实例。

## YAML 字段拆解

### 顶层 `lynx.pulsar`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `service_url` | Pulsar 服务端点。 | 始终生效；没有可达 URL 就无法启动。 | 构造器默认是 `pulsar://localhost:6650`；服务配置里仍建议显式写出。 | `pulsar://` 与 `pulsar+ssl://` 和实际 TLS 姿态不匹配。 |
| `auth` | 认证配置块。 | 集群要求 token、OAuth2 或 TLS auth 时。 | 只有与 `auth.type` 匹配的子块才真正有意义。 | 多种认证子块都填了，最后自己也不知道哪套在生效。 |
| `tls` | 传输层 TLS 配置块。 | 连接 TLS broker 时。 | 它与 `auth.tls_auth` 不同：前者负责连接加密，后者负责客户端证书认证。 | 开了传输 TLS，却没配信任链或主机名校验策略。 |
| `connection` | 连接与池化相关配置。 | 长生命周期服务运行时。 | 当前只有其中一部分会映射进 `pulsar.ClientOptions`。 | 以为示例里每个连接字段都已经接入当前启动逻辑。 |
| `producers` | 命名 producer 定义。 | 服务要向 Pulsar topic 发布时。 | 所有启用的 producer 都会在启动时创建。 | 把模板中的示例 producer 一起保留，接管了本不属于该服务的 topic。 |
| `consumers` | 命名 consumer 定义。 | 服务要从 Pulsar topic 消费时。 | 所有启用的 consumer 都会在启动时创建。 | 把示例 consumer 当成“默认安全值”，而不是明确的运行时契约。 |
| `retry` | 共享 retry manager 配置。 | 运行时重试辅助和运维策略。 | 仓库会按这个块创建并注册 retry manager。 | 以为它会自动改写所有 producer / consumer 的实际行为，却没验证调用路径。 |
| `monitoring` | 指标与健康检查配置。 | 运行时可观测性。 | 健康检查是否启动由这里控制，但不是所有指标 / tracing 开关都已完整接入。 | 只改 namespace 就期待现有 exporter / dashboard 自动切换。 |

### `lynx.pulsar.auth`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `auth.type` | 认证模式选择：空、`token`、`oauth2`、`tls`。 | 需要认证时始终要看它。 | 为空表示无认证；它决定哪个子块真正生效。 | token / OAuth2 子块都填了，但 `type` 还是空。 |
| `auth.token` | token 认证所用的 token 值。 | 只有 `auth.type: "token"` 时。 | 其他模式下会被忽略。 | 把占位 token 留在配置里，最后在 broker 侧查鉴权失败。 |
| `auth.oauth2.issuer_url` | OAuth2 issuer 地址。 | 只有 `auth.type: "oauth2"` 时。 | 当前实现会把它传入 Pulsar OAuth2 认证参数。 | 用成应用登录 issuer，而不是 Pulsar 对接的 issuer。 |
| `auth.oauth2.client_id` | OAuth2 client ID。 | 只有 `auth.type: "oauth2"` 时。 | OAuth2 场景必需。 | 轮换 secret 后忘记 client_id 也变了。 |
| `auth.oauth2.client_secret` | OAuth2 client secret。 | 只有 `auth.type: "oauth2"` 时。 | 应走密钥管理，不应提交进仓库。 | 和普通非敏感配置放在一起明文管理。 |
| `auth.oauth2.audience` | OAuth2 audience。 | 只有 `auth.type: "oauth2"` 时。 | 必须与身份提供方对 Pulsar 的配置一致。 | 复用 HTTP API 的 audience，导致 broker 不认。 |
| `auth.oauth2.scope` | OAuth2 scope 字符串。 | 只有 `auth.type: "oauth2"` 且提供方要求 scope 时。 | 是否必填取决于身份提供方。 | 配了 broker 集成根本不会授予的 scope。 |
| `auth.tls_auth.cert_file` | TLS 认证客户端证书路径。 | 只有 `auth.type: "tls"` 时。 | 它用于 Pulsar 认证，不是通用信任链配置。 | 和 `tls.trust_certs_file` 混淆。 |
| `auth.tls_auth.key_file` | TLS 认证客户端私钥路径。 | 只有 `auth.type: "tls"` 时。 | 必须和客户端证书匹配。 | 证书和私钥配错对。 |
| `auth.tls_auth.ca_file` | TLS 认证 CA 文件。 | 只有 `auth.type: "tls"` 时。 | 应与 broker 信任链保持一致。 | 把客户端证书链误当成 CA bundle。 |

### `lynx.pulsar.tls`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `tls.enable` | 是否开启传输层 TLS。 | 连接 TLS broker 时。 | 默认 `false`；通常与 `pulsar+ssl://...` 一起出现。 | 仍用明文 broker URL 却打开了它。 |
| `tls.allow_insecure_connection` | 是否允许不安全 TLS 校验。 | 只建议本地或短期测试。 | 默认 `false`；会削弱校验。 | 证书切换完毕后忘了关回去。 |
| `tls.trust_certs_file` | broker 证书校验所用 trust bundle。 | broker CA 不在系统信任库时。 | 公共 CA 或系统已信任时可不填。 | 把客户端证书路径误填进来。 |
| `tls.verify_hostname` | 是否校验证书主机名。 | TLS 连接场景。 | 默认 `true`；会与 broker URL 主机名一起工作。 | 把它关掉来掩盖真实的证书命名问题。 |

### `lynx.pulsar.connection`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `connection.connection_timeout` | 连接超时。 | client 启动和重连路径。 | 构造器默认 `30s`，当前会传入 `pulsar.ClientOptions`。 | 配得低于正常握手耗时。 |
| `connection.operation_timeout` | 操作超时。 | Pulsar client 自身操作。 | 默认 `30s`，当前会传入 `pulsar.ClientOptions`。 | 把它当成业务 handler 超时。 |
| `connection.keep_alive_interval` | keep-alive 间隔。 | 长连接场景。 | 默认 `30s`，当前会传入 `pulsar.ClientOptions`。 | 配得过低，制造无意义后台流量。 |
| `connection.max_connections_per_host` | 每个 broker host 的最大连接数。 | 高吞吐、多 topic 场景。 | 默认 `1`，当前会传入 `pulsar.ClientOptions`。 | 不评估 broker 和客户端内存就盲目加大。 |
| `connection.connection_max_lifetime` | 预期的单连接最大生命周期。 | 需要连接轮转策略时。 | 示例里 `0s` 表示不限制；当前 `buildClientOptions` 路径没有接入它。 | 改了 YAML 就期待连接立刻开始轮转。 |
| `connection.enable_connection_pooling` | 预期的连接池开关。 | 规划吞吐和连接管理策略时。 | 构造器默认 `true`；当前 `buildClientOptions` 路径没有直接消费它。 | 以为改成 `false` 就表示当前实现已彻底不做连接池。 |

### `lynx.pulsar.producers[]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `producers[].name` | producer 逻辑名。 | 所有运行时 producer 查找。 | 应保持稳定，因为代码和监控都直接引用它。 | 改名了却没同步 producer 选择逻辑。 |
| `producers[].enabled` | 是否启用该 producer 定义。 | 启动阶段。 | 关闭后该项会被忽略。 | 把示例 producer 一起启用，接管了无关 topic。 |
| `producers[].topic` | 该 producer 对应的目标 topic。 | 所有发布路径。 | 一个 producer 定义只对应一个 topic。 | 把一个 producer 当成多 topic 通配发布入口。 |
| `producers[].options.producer_name` | broker 侧可见的 producer 名覆盖值。 | 诊断和 broker 可观测性。 | 可选；当前创建 producer 时会用它。 | 以为它会替代 Lynx 里的逻辑 producer 名。 |
| `producers[].options.send_timeout` | 单条消息发送超时。 | 每次 producer 发送。 | 构造器默认 `30s`；当前有值时会应用。 | 大消息、跨地域链路仍保留极小超时。 |
| `producers[].options.max_pending_messages` | 内存里允许挂起的消息数。 | 背压和内存规划。 | 构造器默认 `1000`；大于 `0` 时当前会应用。 | 不增加内存预算就盲目加大。 |
| `producers[].options.max_pending_messages_across_partitions` | 预期的跨分区挂起上限。 | 分区 topic 背压规划。 | 模板暴露了它，但当前 producer 创建路径没有接入。 | 以为它已经能保护分区 fan-out 场景的内存。 |
| `producers[].options.block_if_queue_full` | 预期的队列满时阻塞 / 失败策略。 | 背压策略设计。 | 模板暴露了它，但当前 producer 创建路径没有接入。 | 以为写成 `true` 调用方就会自动阻塞。 |
| `producers[].options.batching_enabled` | 是否开启批量发送。 | 吞吐导向工作负载。 | 构造器默认 `true`；为 `false` 时其余 batching 子字段都失去意义。 | 已关闭 batching 却还在调 batch delay / batch size。 |
| `producers[].options.batching_max_publish_delay` | 最大攒批延迟。 | 只有 `batching_enabled: true` 时。 | 构造器默认 `10ms`；当前有值时会应用。 | 低延迟链路还配得很大。 |
| `producers[].options.batching_max_messages` | 单批最大消息数。 | 只有 `batching_enabled: true` 时。 | 构造器默认 `1000`；当前创建路径会应用。 | 批次过大，导致下游消费突刺。 |
| `producers[].options.batching_max_size` | 单批最大字节数。 | 只有 `batching_enabled: true` 时。 | 当前 batching 开启时会应用。 | 忘了 broker 或网络层的最大消息限制。 |
| `producers[].options.compression_type` | 预期的压缩算法。 | 带宽和存储调优时。 | 示例允许 `none`、`lz4`、`zlib`、`zstd`、`snappy`，但当前 producer 创建路径没有接入。 | 只改 YAML 就期待线上流量已经压缩。 |
| `producers[].options.hashing_scheme` | 预期的分区哈希策略。 | 设计分区路由语义时。 | 模板暴露了它，但当前 producer 创建路径没有接入。 | 以为 key 路由已经按新哈希策略生效。 |
| `producers[].options.message_routing_mode` | 预期的分区路由模式。 | 设计分区分发策略时。 | 模板暴露了它，但当前 producer 创建路径没有接入。 | 以为 YAML 改成 `single_partition` 就已经固定分区。 |
| `producers[].options.enable_chunking` | 是否开启大消息 chunking。 | 发送大 payload 时。 | 默认 `false`；为 `true` 时 `chunk_max_size` 才有意义且当前会应用。 | 开了 chunking，却没确认 broker 和 consumer 都支持。 |
| `producers[].options.chunk_max_size` | chunk 最大大小。 | 只有 `enable_chunking: true` 时。 | 当前 chunking 开启时会应用。 | 配得超过 broker / 网络上限。 |

### `lynx.pulsar.consumers[]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `consumers[].name` | consumer 逻辑名。 | 运行时 consumer 查找和指标区分。 | 应保持稳定，因为 handler 和运维工具都会用到它。 | 改了名字却没同步代码和告警。 |
| `consumers[].enabled` | 是否启用该 consumer 定义。 | 启动阶段。 | 关闭后该项会被忽略。 | 把示例 consumer 保留为启用，结果接管了不该消费的 topic。 |
| `consumers[].topics` | 该 consumer 要订阅的 topic 列表。 | 所有启动时创建的 Pulsar subscription。 | 当前会直接写入 `pulsar.ConsumerOptions`。 | 复制 topic 列表时混入错误 tenant / namespace。 |
| `consumers[].subscription_name` | subscription 名。 | 每个 consumer。 | 当前会直接写入 `pulsar.ConsumerOptions`。 | 不相关应用复用同一个 subscription，意外共享游标状态。 |
| `consumers[].options.consumer_name` | broker 侧可见的 consumer 名覆盖值。 | 诊断和 broker 可观测性。 | 可选；当前有值时会应用。 | 以为它会替代 Lynx 里的逻辑 consumer 名。 |
| `consumers[].options.subscription_type` | 订阅类型。 | 设计 consumer 扇出语义时。 | 构造器默认是 `exclusive`；当前解析器遇到非法值也会回退到 `exclusive`。 | 大小写写错，以为仍能保留原语义。 |
| `consumers[].options.subscription_initial_position` | 初始游标位置。 | 新 subscription 首次启动时。 | 构造器默认 `latest`；非法值也会回退到 `latest`。 | 长保留 topic 上改成 `earliest`，却没评估历史回放量。 |
| `consumers[].options.subscription_mode` | 预期的 durable / non-durable 模式。 | 设计游标保留策略时。 | 模板暴露了它，但当前 consumer 创建路径没有接入。 | 以为只改 YAML 就已经变成 non-durable。 |
| `consumers[].options.receiver_queue_size` | 本地接收缓冲大小。 | 吞吐和内存调优。 | 大于 `0` 时当前会应用。 | 缓冲配得太大，把背压变成内存压力。 |
| `consumers[].options.max_total_receiver_queue_size_across_partitions` | 预期的跨分区接收缓冲上限。 | 分区 topic 缓冲规划时。 | 模板暴露了它，但当前 consumer 创建路径没有接入。 | 以为它已经能限制总缓冲量。 |
| `consumers[].options.consumer_name_prefix` | 预期的动态 consumer 名前缀。 | 设计动态命名策略时。 | 模板暴露了它，但当前 consumer 创建路径没有接入。 | 以为 broker 侧名字已经会自动带前缀。 |
| `consumers[].options.read_compacted` | 预期的 compacted topic 读取模式。 | 处理 compacted topic 时。 | 模板暴露了它，但当前 consumer 创建路径没有接入。 | 非 compacted topic 也开它，还期待有任何效果。 |
| `consumers[].options.enable_retry_on_message_failure` | 预期的失败重试开关。 | 设计失败处理策略时。 | 模板暴露了它，但当前 consumer 创建路径没有接入。 | 以为写成 `true` 就已经有失败重试流。 |
| `consumers[].options.retry_enable` | 预期的 consumer retry 开关。 | 设计失败处理策略时。 | 模板暴露了它，但当前 consumer 创建路径没有接入。 | 没验证真实实现就认为 retry 已开启。 |
| `consumers[].options.ack_timeout` | 预期的 ACK 超时。 | 设计超时重投策略时。 | 模板暴露了它，但当前 consumer 创建路径没有接入。 | 以为改 YAML 后超时重投就会自动发生。 |
| `consumers[].options.negative_ack_delay` | negative ACK 后的重投延迟。 | 失败恢复调优时。 | 构造器默认 `1m`；当前有值时会应用。 | 配得太小，把仍未恢复的下游持续打爆。 |
| `consumers[].options.priority_level` | 预期的 consumer 优先级。 | 设计 broker 优先级调度时。 | 模板暴露了它，但当前 consumer 创建路径没有接入。 | 以为 broker 优先级已经变化。 |
| `consumers[].options.crypto_failure_action` | 预期的加密失败处理动作。 | 处理加密 topic 失败时。 | 模板暴露了它，但当前 consumer 创建路径没有接入。 | 以为 `discard` / `consume` 已经按 YAML 生效。 |
| `consumers[].options.properties` | 额外 consumer 元数据。 | 标识归属、追踪和诊断时。 | 当前有值时会直接应用。 | 把敏感信息塞进 properties。 |
| `consumers[].options.dead_letter_policy.max_redeliver_count` | 预期的进入 DLQ 前最大重投次数。 | 设计 DLQ 策略时。 | 模板暴露了它，但当前 consumer 创建路径没有接入 dead-letter policy。 | 以为 DLQ 已经会自动接管消息。 |
| `consumers[].options.dead_letter_policy.dead_letter_topic` | 预期的 DLQ topic。 | 设计 DLQ 策略时。 | 模板暴露了它，但当前 consumer 创建路径没有接入 dead-letter policy。 | 只创建了名字，却以为订阅流已经会使用它。 |
| `consumers[].options.dead_letter_policy.initial_subscription_name` | 预期的 DLQ 初始 subscription 名。 | 设计 DLQ 所有权时。 | 模板暴露了它，但当前 consumer 创建路径没有接入 dead-letter policy。 | 以为 DLQ subscription 已经自动建好并归属明确。 |

### `lynx.pulsar.retry`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `retry.enable` | 是否启用共享 retry manager。 | 重试辅助逻辑。 | 构造器默认 `true`；建议在服务配置中显式写清楚。 | 改成 `false`，却仍然认为重试辅助逻辑和指标还在生效。 |
| `retry.max_attempts` | 最大重试次数。 | 共享重试策略。 | 构造器默认 `3`。 | 不限制总延迟就盲目调高。 |
| `retry.initial_delay` | 第一次重试延迟。 | 共享重试策略。 | 构造器默认 `100ms`。 | 配得低于下游瞬时故障的恢复时间。 |
| `retry.max_delay` | 重试延迟上限。 | 共享重试策略。 | 构造器默认 `30s`。 | 没设置好上限，指数退避把等待时间拖得过长。 |
| `retry.retry_delay_multiplier` | 指数退避倍率。 | 共享重试策略。 | 构造器默认 `2.0`。 | 高倍率叠加高重试次数，尾延迟异常夸张。 |
| `retry.jitter_factor` | 重试抖动比例。 | 共享重试策略。 | 构造器默认 `0.1`。 | 设成 `0`，多副本一起整齐重试。 |

### `lynx.pulsar.monitoring`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `monitoring.enable_metrics` | 预期的指标开关。 | 设计指标 / exporter 策略时。 | 构造器默认 `true`，但当前插件无论该值如何都会创建内存中的 metrics 结构。 | 以为改成 `false` 就代表进程内完全不再追踪指标。 |
| `monitoring.metrics_namespace` | 预期的指标命名空间前缀。 | 设计 dashboard 和告警命名时。 | 构造器默认 `lynx_pulsar`，但当前仓库没有把它完整接入专门 exporter 路径。 | 改了它就期待现有 dashboard 自动发现新名字。 |
| `monitoring.enable_health_check` | 是否启动后台健康检查器。 | 启动和持续健康检查时。 | 构造器默认 `true`；只有为 `true` 时健康检查器才会启动。 | 关掉它后还期待插件级健康状态持续更新。 |
| `monitoring.health_check_interval` | 健康检查间隔。 | `enable_health_check: true` 时。 | 构造器默认 `30s`；当前会用于初始化 health checker。 | 配得过小，把轻量检查变成噪声后台任务。 |
| `monitoring.enable_tracing` | 预期的 tracing 开关。 | 设计 tracing / exporter 策略时。 | 模板暴露了它，但当前插件启动路径没有按这个开关接入 tracing。 | 只改这行就以为 tracing 已经打开。 |

## 配置来源

- `lynx-pulsar/conf/example_config.yml`

## 如何使用

```go
import pulsarplug "github.com/go-lynx/lynx-pulsar"

client, err := pulsarplug.GetPulsarClient()
```

应优先使用运行时托管的 client 以及它暴露的 producer / consumer helper，而不是把每个命名 producer 视为独立插件实例。

## 相关页面

- [Kafka](/docs/existing-plugin/kafka)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
