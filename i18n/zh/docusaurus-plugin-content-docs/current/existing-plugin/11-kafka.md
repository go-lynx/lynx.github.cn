---
id: kafka
title: Kafka 插件
---

# Kafka 插件

本页逐项解释 `lynx-kafka/conf/example_config.yml` 里的 YAML 字段。仓库示例使用独立的 `kafka:` 块；当你把它合并进 Lynx 启动配置时，对应路径是 `lynx.kafka`。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-kafka` |
| 配置前缀 | `lynx.kafka` |
| Runtime 插件名 | `kafka.client` |
| 主要 API 形态 | 插件实例方法，例如 `ProduceWith`、`ProduceBatchWith`、`SubscribeWith` |

## YAML 字段拆解

### 顶层 `kafka`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `brokers` | 所有 producer / consumer 共用的 broker 种子地址列表。 | 始终生效。为空会直接启动失败。 | 没有安全默认值。所有运行时客户端都复用它。 | 把 TLS / SASL 流量打到明文端口，或者只留下一个已经失效的 broker。 |
| `tls` | broker 连接的 TLS / mTLS 配置。 | 只有 broker 暴露 TLS listener 时才需要。 | 只有 `tls.enabled: true` 时子字段才有意义。 | 明文 broker 也开 TLS，或者只配了 `cert_file` 没配 `key_file`。 |
| `sasl` | SASL 鉴权配置。 | 只有 Kafka 集群要求 SASL 时才需要。 | 只有 `sasl.enabled: true` 时子字段才有意义；可以和 TLS 叠加。 | 填了用户名密码但没启用，或机制和集群要求不一致。 |
| `dial_timeout` | producer / consumer 建连超时。 | 启动和重连阶段。 | 省略时默认 `10s`。 | 跨可用区环境里配得太小，把超时噪声误判成 broker 不稳定。 |
| `producers` | 命名 producer 定义列表。 | 服务要发布消息时。 | 第一个启用的 producer 会成为未显式传名时的默认 producer。 | 以为禁用项还能在运行时占位保留名字。 |
| `consumers` | 命名 consumer 定义列表。 | 服务要订阅 topic 时。 | consumer 会在 `SubscribeWith` 时懒初始化，不会在启动时全部建好。 | 以为只写配置就会自动开始消费。 |

### `kafka.tls`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `tls.enabled` | 开关 broker TLS。 | 连接 TLS 或 mTLS 集群时。 | 默认 `false`；为 `false` 时其余 `tls.*` 都会被忽略。 | 对非 TLS 端口开启它。 |
| `tls.ca_file` | 自定义 CA 证书链路径。 | broker 证书不在系统信任库时。 | 公共 CA 场景可不填。 | 把客户端证书误填成 CA 文件。 |
| `tls.cert_file` | mTLS 客户端证书。 | 只有 broker 要求客户端证书时。 | 纯服务端 TLS 可不填；必须和 `tls.key_file` 成对出现。 | 只配证书不配私钥。 |
| `tls.key_file` | mTLS 客户端私钥。 | 只有 broker 要求客户端证书时。 | 纯服务端 TLS 可不填；必须和 `tls.cert_file` 成对出现。 | 私钥和证书不匹配。 |
| `tls.insecure_skip_verify` | 跳过 broker 证书校验。 | 只建议本地、临时测试环境。 | 默认 `false`；会弱化证书和主机名校验。 | 在线上环境遗留为 `true`。 |
| `tls.server_name` | 显式指定 SNI / 主机名校验名。 | 证书 SAN/CN 与 `brokers` 里的地址不一致时。 | 默认空；必须配合 `tls.enabled: true`。 | 填成证书里根本不存在的 IP 或别名。 |

### `kafka.sasl`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `sasl.enabled` | 开关 SASL。 | 只有 SASL 集群才需要。 | 默认 `false`；为 `false` 时其余 `sasl.*` 被忽略。 | 配了凭证但没打开开关。 |
| `sasl.mechanism` | SASL 机制名。 | `sasl.enabled: true` 时。 | 允许值为 `PLAIN`、`SCRAM-SHA-256`、`SCRAM-SHA-512`。 | 集群要求 SCRAM 却仍写成 `PLAIN`。 |
| `sasl.username` | SASL 用户名。 | `sasl.enabled: true` 时。 | 没有默认值；启用 SASL 后启动校验要求必填。 | 非本地环境忘记注入密钥。 |
| `sasl.password` | SASL 密码。 | `sasl.enabled: true` 时。 | 没有默认值；启用 SASL 后启动校验要求必填。 | 把明文密码直接提交进仓库。 |

### `kafka.producers[]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `name` | 业务代码引用的 producer 逻辑名。 | 所有命名发布调用。 | 名称应保持稳定，因为 `ProduceWith` 直接按它查找。 | YAML 改名了，代码调用名没同步改。 |
| `enabled` | 是否启用该 producer。 | 想让该实例真正可用时。 | 关闭后该项会被忽略。 | 把示例 producer 原样保留为启用，结果启动出多余实例。 |
| `required_acks` | Kafka ACK 级别。 | 所有发布路径。 | 允许值为 `-1`、`1`、`0`。示例显式写了 `1`；建议保持显式，因为整数字段省略后可能落成 `0`（无 ACK）。 | 忘了填它，业务 topic 变成 fire-and-forget。 |
| `batch_size` | 批发送前允许缓存的最大消息数。 | 吞吐导向 producer。 | 省略时默认 `1000`；和 `batch_timeout` 联动。 | 低延迟链路里盲目调大，尾延迟反而上升。 |
| `batch_timeout` | 未攒满批次时的最长等待时间。 | 吞吐导向 producer。 | 省略时默认 `1s`；`batch_size: 1` 或 `batch_timeout: 0s` 基本等于关闭异步批处理。 | 低延迟 producer 还保留较长等待时间。 |
| `compression` | 压缩算法。 | 带宽和 broker 存储敏感时。 | 默认 `snappy`；允许值为 `none`、`gzip`、`snappy`、`lz4`、`zstd`。 | 选了 broker / 工具链不支持的算法，或对极小消息也期待明显收益。 |
| `topics` | 该 producer 的 topic 白名单和评审提示。 | 一个服务内有多个 producer 身份时更有价值。 | 实际发布仍要在代码里显式传 topic，因此代码和配置里的列表要同步。 | 误以为只改这里就能改掉代码实际发送的 topic。 |

### `kafka.consumers[]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `name` | consumer 实例逻辑名。 | 所有 `SubscribeWith` 调用。 | 名称应保持稳定，代码和监控都会依赖它。 | 改了配置名，订阅代码还在用旧名字。 |
| `enabled` | 是否启用该 consumer 定义。 | 想让它可被订阅时。 | 关闭后该项会被忽略。 | 以为禁用项还能被代码选中。 |
| `group_id` | Kafka consumer group ID。 | 启用 consumer 时必填。 | 没有默认值；为空会启动失败。 | 不同业务误共用一个 group，导致分区抢占和重平衡异常。 |
| `auto_commit` | 是否自动提交 offset。 | 所有消费路径。 | 默认 `true`；为 `false` 时要由业务显式掌握提交时机。 | 需要“下游成功后再提交”却仍保持 `true`。 |
| `auto_commit_interval` | 自动提交 offset 的时间间隔。 | 只有 `auto_commit: true` 时。 | 省略时默认 `5s`。 | `auto_commit` 已经关闭了，还继续调它。 |
| `start_offset` | 新 group 首次启动时的起始位点。 | group 还没有已保存 offset 时。 | 默认 `latest`；允许值为 `latest`、`earliest`。 | 在线上切成 `earliest` 后意外回放历史数据。 |
| `max_concurrency` | 该 consumer 的最大处理并发。 | 所有活跃 consumer group。 | 默认 `10`；必须大于 `0`。 | 不评估幂等性和分区顺序要求就盲目拉高。 |
| `rebalance_timeout` | group rebalance 的时间预算。 | consumer 重分配和扩缩容时。 | 省略时默认 `30s`。 | 配得低于实际启动和分配耗时。 |
| `topics` | 该 consumer 预期负责的 topic 列表。 | 适合作为配置评审和运行说明。 | 代码仍要在 `SubscribeWith` 再传一次 topics，所以两边必须同步。 | 只改了 YAML，忘了同步订阅代码。 |

## 配置来源

- `lynx-kafka/conf/example_config.yml`

## 如何使用

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("kafka.client")
kafkaClient := plugin.(*kafka.Client)

err := kafkaClient.ProduceWith(ctx, "default", "orders", key, value)
err = kafkaClient.SubscribeWith(ctx, "group_a", []string{"topic_a"}, handler)
```

## 相关页面

- [Pulsar](/docs/existing-plugin/pulsar)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
