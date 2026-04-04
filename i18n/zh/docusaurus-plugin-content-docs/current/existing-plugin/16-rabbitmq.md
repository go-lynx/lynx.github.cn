---
id: rabbitmq
title: RabbitMQ 插件
---

# RabbitMQ 插件

本页逐项解释 `lynx-rabbitmq/conf/example_config.yml` 里的 YAML 字段。运行时配置前缀就是 `rabbitmq`，因此示例可以直接放进 Lynx 启动配置，不需要额外再包一层 `lynx.`。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-rabbitmq` |
| 配置前缀 | `rabbitmq` |
| Runtime 插件名 | `rabbitmq` |
| 公开 API 形态 | 通过插件管理器获取 `rabbitmq`，再调用 `rabbitmq.ClientInterface` 方法 |

## YAML 字段拆解

### 顶层 `rabbitmq`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `urls` | RabbitMQ 服务 URL 列表。 | 始终生效；连不上就启动失败。 | 当前启动路径只会拨第一个 URL。 | 以为写多个地址就已经有客户端侧故障切换或轮询。 |
| `username` | broker 认证用户名兜底值。 | 你不想把凭证直接写进 URL 时。 | 示例值是 `guest`；但真实连接通常还是以 URL 内容为准。 | `urls` 和 `username` / `password` 写了不同凭证，自己也分不清哪组在生效。 |
| `password` | broker 认证密码兜底值。 | 与 `username` 相同。 | 示例值是 `guest`；生产环境应走密钥管理。 | 把本地 `guest` 密码直接带到非本地环境。 |
| `virtual_host` | RabbitMQ vhost。 | 每次连接。 | 默认是 `/`；连接配置会把它传给 AMQP。 | 凭证是对的，但 vhost 写错，最后误判成网络问题。 |
| `dial_timeout` | 预期的建连超时控制。 | 排查连接问题、规划连接 SLA 时。 | 模板写的是 `3s`，但当前启动路径没有把它传给 `amqp.DialConfig`。 | 调了它却期待当前实现里的连接耗时立刻变化。 |
| `heartbeat` | AMQP 心跳间隔。 | 长连接场景。 | 仓库默认值是 `30s`。 | 噪声网络里配得太小，导致误判断线。 |
| `channel_pool_size` | 预期的共享 channel 池大小。 | 吞吐规划时。 | 示例值 `10`；当前客户端内部 goroutine pool 仍固定初始化为 `10`。 | 只改这个值就期待发布 / 消费并发自动变化。 |
| `producers` | 命名 producer 定义。 | 服务需要向 exchange 发布消息时。 | 每个启用的 producer 都会在启动时声明自己的 exchange。 | 把示例里的所有 producer 都保留为启用，结果多建了无用拓扑。 |
| `consumers` | 命名 consumer 定义。 | 服务需要消费队列时。 | 每个启用的 consumer 都会在启动时声明自己的 queue。 | 以为模板会顺便自动做 queue 和 exchange 的绑定。 |

### `rabbitmq.producers[]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `name` | 业务代码引用的 producer 逻辑名。 | 所有命名发布调用。 | 应保持稳定，因为 `PublishMessageWith` 直接按它查找。 | 配置改名了，调用代码和监控没跟着改。 |
| `enabled` | 是否启用该 producer。 | 需要通过这套 exchange 配置发布时。 | 关闭后该项会被忽略。 | 把示例 producer 原样带到生产环境。 |
| `exchange` | producer 目标 exchange 名。 | 启动和发布阶段。 | 非空时启动路径会先声明 exchange。 | 留空却以为默认 exchange 行为符合你的业务路由设计。 |
| `exchange_type` | exchange 类型，支持 `direct`、`fanout`、`topic`、`headers`。 | 声明 exchange 和设计路由语义时。 | 示例覆盖了四种模式。 | 用了 `fanout` 或 `headers`，却仍然期待 routing key 生效。 |
| `routing_key` | 发布 routing key。 | 除纯 `fanout` 或纯 header 路由外的发布场景。 | 要和 consumer 绑定规则保持一致。 | 在 `direct` exchange 上误用了 topic 风格的通配符。 |
| `max_retries` | 预期的发布重试次数。 | 发送异常重试时。 | 示例值按 producer 各不相同；仓库里的 retry helper 会把 producer 重试配置当作发布重试提示使用，但它不影响 exchange 声明。 | 非幂等业务消息也盲目把它调高。 |
| `retry_backoff` | 预期的发布重试间隔。 | 发送异常重试时。 | 示例值在 `100ms` 到 `200ms` 之间。 | 配得太小，broker 故障时形成重试风暴。 |
| `publish_timeout` | 预期的发布超时时间。 | 发送消息时。 | 示例值在 `3s` 到 `5s` 之间；不会影响启动时的 exchange 声明。 | 试图靠它解决拓扑声明失败，而不是发送超时。 |
| `exchange_durable` | exchange 是否可持久化到 broker 重启后。 | 设计 exchange 生命周期时。 | 示例值是 `true`；启动声明时会真实传进去。 | 业务 exchange 却设成 `false`。 |
| `exchange_auto_delete` | exchange 是否在无人使用时自动删除。 | 临时 exchange 场景。 | 模板暴露了它，但当前启动声明路径仍固定使用 `false`。 | 以为改了 YAML 就已经会自动删 exchange。 |
| `message_persistent` | 发布消息是否标记为持久化。 | 设计消息持久性时。 | 只在真正发布消息时有意义，不影响 exchange 声明。 | 以为开了它就能弥补非持久化拓扑本身的风险。 |

### `rabbitmq.consumers[]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `name` | 业务代码引用的 consumer 逻辑名。 | 所有命名订阅调用。 | 应保持稳定，因为 `SubscribeWith` 直接按它查找。 | 改了配置名，处理代码还在用旧名字。 |
| `enabled` | 是否启用该 consumer 定义。 | 需要让该实例可被消费时。 | 关闭后该项会被忽略。 | 以为禁用的示例 consumer 以后还能直接被选中。 |
| `queue` | 要声明并消费的 queue 名。 | 启动和消费阶段。 | 非空时启动路径会调用 `QueueDeclare`。 | 以为 queue 创建出来就已经自动绑定到 exchange。 |
| `exchange` | 该 queue 预期绑定的 exchange。 | 设计队列拓扑时。 | 应与 producer 的 exchange 名一致；当前启动路径不会自动做绑定。 | 认为只写这一行就会完成绑定。 |
| `routing_key` | 预期的 queue 绑定 routing key。 | 设计队列绑定时。 | 应与 producer 发布 key 保持一致；当前启动路径不会调用 `QueueBind`。 | 一直改它，但实际上并没有执行绑定步骤。 |
| `consumer_tag` | broker 侧看到的 consumer tag。 | 排查线上活跃 consumer 时。 | 只有真正开始消费时才有意义。 | 把它当作 queue 名或者唯一身份约束。 |
| `max_concurrency` | 预期的消息处理并发。 | 设计消费工作线程时。 | 要和下游安全性、顺序性一起考虑；当前启动路径不会在声明 queue 时强制执行它。 | 拉高并发后还默认认为单消息顺序不受影响。 |
| `prefetch_count` | AMQP QoS 预取数。 | 所有活跃 consumer channel。 | 默认 `1`；当前启动路径会通过 `Qos` 应用它。 | 慢 handler 却把 prefetch 开得很高，导致不公平和积压。 |
| `queue_durable` | queue 是否在 broker 重启后保留。 | 设计 queue 生命周期时。 | 示例值是 `true`；启动声明时会真实传进去。 | 业务队列却设成 `false`。 |
| `queue_auto_delete` | queue 是否无人使用时自动删除。 | 临时 queue 场景。 | 模板暴露了它，但当前启动声明路径仍固定使用 `false`。 | 以为改了 YAML 就已经会自动删队列。 |
| `queue_exclusive` | queue 是否独占单连接。 | 私有队列、单 consumer 场景。 | 模板暴露了它，但当前启动声明路径仍固定使用 `false`。 | 以为它已经能阻止其他连接附着。 |
| `auto_ack` | 是否自动 ACK 消息。 | 真正的消费逻辑里。 | 通常建议保持 `false` 做至少一次处理；它不影响 queue 声明。 | 开成 `true`，但业务仍然期待失败后重新投递。 |

## 完整 YAML 示例

```yaml
rabbitmq:
  urls:
    - amqp://guest:guest@localhost:5672/ # 当前启动路径会优先拨号列表中的第一个 URL
    - amqp://guest:guest@localhost:5673/ # 可选的第二个 broker URL，用于故障切换预案

  username: guest # 当 URL 中未包含凭证时使用的兜底用户名
  password: guest # 兜底密码；本地开发之外应改走密钥管理
  virtual_host: / # broker vhost；默认值为 /
  dial_timeout: 3s # 配置层暴露的预期建连超时
  heartbeat: 30s # AMQP 连接的心跳间隔
  channel_pool_size: 10 # 配置层暴露的预期共享 channel 池大小

  producers:
    - name: default-producer # 业务代码使用的 producer 名
      enabled: true # 禁用项会被忽略
      exchange: lynx.exchange # 要声明并发布到的 exchange
      exchange_type: direct # direct | fanout | topic | headers
      routing_key: lynx.routing.key # 纯 fanout exchange 会忽略该值
      max_retries: 3 # 配置层暴露的预期发布重试次数
      retry_backoff: 100ms # 重试之间的退避间隔
      publish_timeout: 3s # 配置层暴露的预期发布超时
      exchange_durable: true # 业务 exchange 通常应保持 true
      exchange_auto_delete: false # 仅临时 exchange 才建议自动删除
      message_persistent: true # 消息持久化投递提示

  consumers:
    - name: default-consumer # 业务代码使用的 consumer 名
      enabled: true # 禁用项会被忽略
      queue: lynx.queue # 要声明并消费的 queue
      exchange: lynx.exchange # 该 queue 预期绑定的 exchange
      routing_key: lynx.routing.key # 该 queue 预期绑定的 routing key
      consumer_tag: lynx.consumer # broker 侧可见的 consumer tag
      max_concurrency: 4 # 配置层暴露的预期消息处理并发
      prefetch_count: 10 # 启动时实际应用的 QoS 预取数
      queue_durable: true # 服务自有业务队列通常应保持 true
      queue_auto_delete: false # 仅临时队列才建议自动删除
      queue_exclusive: false # 独占队列不能被其他连接共享
      auto_ack: false # false 才能保留至少一次处理语义
```

## 最小可用 YAML 示例

```yaml
rabbitmq:
  urls:
    - amqp://guest:guest@localhost:5672/
  producers:
    - name: default-producer
      enabled: true
      exchange: lynx.exchange
      exchange_type: direct
```

## 配置来源

- `lynx-rabbitmq/conf/example_config.yml`

## 如何使用

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("rabbitmq")
client := plugin.(rabbitmq.ClientInterface)
```

拿到插件后，通过 `rabbitmq.ClientInterface` 暴露的命名 producer / consumer API 使用它。

## 相关页面

- [RocketMQ](/docs/existing-plugin/rocketmq)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
