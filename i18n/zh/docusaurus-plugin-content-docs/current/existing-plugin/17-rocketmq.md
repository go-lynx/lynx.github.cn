---
id: rocketmq
title: RocketMQ 插件
---

# RocketMQ 插件

本页逐项解释 `lynx-rocketmq/conf/example_config.yml` 里的 YAML 字段。运行时配置前缀就是 `rocketmq`，示例结构可以直接放进 Lynx 启动配置。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-rocketmq` |
| 配置前缀 | `rocketmq` |
| Runtime 插件名 | `rocketmq` |
| 公开 API 形态 | 通过插件管理器获取 `rocketmq`，再调用 `rocketmq.ClientInterface` 方法 |

## YAML 字段拆解

### 顶层 `rocketmq`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `name_server` | RocketMQ NameServer 地址列表。 | 始终生效；为空会直接启动失败。 | 没有安全默认值；健康检查会直接探测这些地址。 | 把 broker 端口误写成 NameServer 端口。 |
| `access_key` | ACL access key。 | 只有 ACL 集群才需要。 | 只有和 `secret_key` 一起存在时才会被使用。 | 只配了半套凭证。 |
| `secret_key` | ACL secret key。 | 只有 ACL 集群才需要。 | 只有和 `access_key` 一起存在时才会被使用。 | 把示例占位值直接留在配置里。 |
| `dial_timeout` | 预期的建连超时控制。 | 排查连接问题、规划连接 SLA 时。 | 省略时默认 `3s`，但当前客户端创建路径不会把它传给 RocketMQ SDK 或 NameServer 探测。 | 调了它却期待启动耗时立刻变化。 |
| `request_timeout` | 预期的请求超时控制。 | 排查请求链路问题时。 | 省略时默认 `30s`，但当前客户端创建路径不会把它传给 RocketMQ SDK。 | 把它当成真正生效的发送超时，而忽略了 `send_timeout`。 |
| `producers` | 命名 producer 定义。 | 服务需要发送 RocketMQ 消息时。 | 启用的 producer 会在启动时创建；第一个启用项会成为默认 producer。 | 服务只需要一个 producer，却把示例里的多个身份都保留下来。 |
| `consumers` | 命名 consumer 定义。 | 服务需要订阅 topic 时。 | 启用的 consumer 会在启动时创建；第一个启用项会成为默认 consumer。 | 以为只写 config topics 就会自动开始消费。 |

### `rocketmq.producers[]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `name` | 业务代码引用的 producer 逻辑名。 | 所有命名发送调用。 | 应保持稳定，因为 `SendMessageWith` 直接按它查找。 | 改了 YAML 名字却没同步改代码。 |
| `enabled` | 是否启用该 producer。 | 需要让这套发送身份真正可用时。 | 关闭后该项会被忽略。 | 把示例里的 batch / high-priority producer 一起带进并不会用到它们的服务。 |
| `group_name` | RocketMQ producer group。 | 每个 producer 都会用到。 | 省略时默认 `lynx-producer-group`。 | 不同服务乱共用 group 名，运维语义混乱。 |
| `max_retries` | 该 producer 期望的重试次数。 | 瞬时 broker 异常时的发送重试。 | 默认 `3`；仓库里还有共享 retry handler，最终发送语义要结合实际调用路径确认。 | 不评估重复副作用就盲目调高。 |
| `retry_backoff` | 预期的重试间隔。 | 发送重试调优时。 | 省略时默认 `100ms`。 | 配得太小，broker 抖动时形成热重试。 |
| `send_timeout` | 单条消息发送超时。 | 每次 producer 发送时。 | 省略时默认 `3s`，当前 producer 创建时会真实传入。 | 大消息或跨地域链路仍保留过小超时。 |
| `enable_trace` | 预期的 producer trace 开关。 | 需要 RocketMQ trace 诊断时。 | 模板暴露了它，但当前 producer 创建路径没有把它接入 SDK。 | 以为 YAML 改成 `true` 就已经开始产出 trace。 |
| `topics` | 该 producer 预期负责的 topic 白名单和评审提示。 | 做发送权限约束和配置评审时更有价值。 | 配置里会校验 topic 合法性，但真正发送时仍要在代码里显式传 topic。 | 只改了 YAML 列表，没同步改代码里的 topic。 |

### `rocketmq.consumers[]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `name` | 业务代码引用的 consumer 逻辑名。 | 所有命名订阅调用。 | 应保持稳定，因为 `SubscribeWith` 直接按它查找。 | 改了配置名，handler 还在用旧名字。 |
| `enabled` | 是否启用该 consumer。 | 需要让它真正可被订阅时。 | 关闭后该项会被忽略。 | 以为禁用的示例 consumer 之后还能直接被选中。 |
| `group_name` | RocketMQ consumer group。 | 每个 consumer 都会用到。 | 省略时默认 `lynx-consumer-group`。 | 不同工作负载混进同一个 group，最后负载共享行为完全失控。 |
| `consume_model` | 投递模型，支持 `CLUSTERING` / `BROADCASTING`。 | 设计消费扩缩容语义时。 | 当前 consumer 创建路径会把它映射进 SDK。 | 想要广播语义，却还按集群消费的容量模型估算。 |
| `consume_order` | 处理顺序模式，支持 `CONCURRENTLY` / `ORDERLY`。 | 设计 handler 语义和 topic 分区时。 | 当前 consumer 创建路径会把它映射进 SDK。 | 开了顺序消费，但 handler 自身并不满足顺序约束。 |
| `max_concurrency` | 消费 goroutine 最大数。 | 所有活跃 consumer。 | 省略时默认 `1`，当前实现会传给 SDK。 | 没评估幂等性和顺序要求就直接拉高。 |
| `pull_batch_size` | 每次拉取的消息条数。 | 吞吐调优时。 | 省略时默认 `32`，当前实现会传给 SDK。 | 一次拉太多，导致单批处理耗时或内存暴涨。 |
| `pull_interval` | 拉取循环间隔。 | 吞吐和 broker 压力平衡时。 | 省略时默认 `100ms`，当前实现会传给 SDK。 | 配得太低，让空闲 consumer 变成紧轮询。 |
| `enable_trace` | 预期的 consumer trace 开关。 | 需要 trace 诊断时。 | 模板暴露了它，但当前 consumer 创建路径没有把它接入 SDK。 | 以为只改 YAML 就已经打开 trace。 |
| `topics` | 该 consumer 预期负责的 topic 列表。 | 配置评审和 handler 设计时。 | 配置里会校验 topic，但应用代码在 `SubscribeWith` 里仍要再传一次 topics。 | 只改了一边列表，另一边没同步。 |

## 完整 YAML 示例

```yaml
rocketmq:
  name_server:
    - 127.0.0.1:9876 # 启动与健康探测所需的 NameServer 地址
    - 127.0.0.1:9877 # 可选的第二个 NameServer，用于高可用启动

  access_key: your-access-key # 只有 ACL 集群才需要填写
  secret_key: your-secret-key # 与 access_key 配对使用的 ACL 密钥
  dial_timeout: 3s # 配置层暴露的预期建连超时
  request_timeout: 30s # 配置层暴露的预期请求超时

  producers:
    - name: default-producer # 业务代码使用的 producer 名
      enabled: true # 禁用项会被忽略
      group_name: lynx-producer-group # 省略时默认 lynx-producer-group
      max_retries: 3 # 配置层暴露的预期发送重试次数
      retry_backoff: 100ms # 发送重试之间的退避间隔
      send_timeout: 3s # 当前实际生效的 SDK 发送超时
      enable_trace: false # 配置层暴露的预期 producer trace 开关
      topics:
        - test-topic # 该 producer 配置对应的预期 topic 列表
        - user-events

  consumers:
    - name: default-consumer # 业务代码使用的 consumer 名
      enabled: true # 禁用项会被忽略
      group_name: lynx-consumer-group # 省略时默认 lynx-consumer-group
      consume_model: CLUSTERING # CLUSTERING | BROADCASTING
      consume_order: CONCURRENTLY # CONCURRENTLY | ORDERLY
      max_concurrency: 4 # 当前实际生效的 SDK 消费 goroutine 数
      pull_batch_size: 32 # 当前实际生效的 SDK 拉取批大小
      pull_interval: 100ms # 当前实际生效的 SDK 拉取间隔
      enable_trace: false # 配置层暴露的预期 consumer trace 开关
      topics:
        - test-topic # 需与应用代码中的 SubscribeWith topics 保持一致
        - user-events
```

## 最小可用 YAML 示例

```yaml
rocketmq:
  name_server:
    - 127.0.0.1:9876
  producers:
    - name: default-producer
      enabled: true
```

## 配置来源

- `lynx-rocketmq/conf/example_config.yml`

## 如何使用

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("rocketmq")
client := plugin.(rocketmq.ClientInterface)
```

拿到插件后，通过 `rocketmq.ClientInterface` 暴露的命名 producer / consumer 方法使用它。

## 相关页面

- [RabbitMQ](/docs/existing-plugin/rabbitmq)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
