---
id: kafka
title: Kafka 插件
---

# Kafka 插件

Kafka 模块是一个由 runtime 管理的客户端插件，内部支持命名生产者和命名消费者实例，而不是只有一个全局 producer。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-kafka` |
| 配置前缀 | `lynx.kafka` |
| Runtime 插件名 | `kafka.client` |
| 主要 API 形态 | 插件实例方法，例如 `ProduceWith`、`ProduceBatchWith`、`SubscribeWith` |

## 代码实际支持什么

从实现看，这个插件提供：

- 多个命名 producer
- 多个命名 consumer
- 在 `SubscribeWith` 时延迟初始化 consumer
- 每个 producer 独立的 retry handler
- 每个 producer 独立的 circuit breaker
- 可选 SASL 和 TLS
- producer 批处理
- 连接管理与健康状态上报

第一个启用的 producer 会成为默认 producer，供未显式指定名称的方法使用。

## 配置形态

```yaml
lynx:
  kafka:
    brokers:
      - "127.0.0.1:9092"
    producers:
      - name: order-producer
        enabled: true
        topics: ["orders"]
        batch_size: 1000
    consumers:
      - name: order-consumer
        enabled: true
        group_id: order-group
        topics: ["orders"]
        max_concurrency: 10
```

代码里的校验要求必须配置 brokers；如果开启 SASL 或 TLS，对应字段也必须合法；consumer group 配置也会被校验。

## 如何使用

通常通过 runtime 取出插件实例，再调用它的方法：

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("kafka.client")
kafkaClient := plugin.(*kafka.Client)

err := kafkaClient.ProduceWith(ctx, "order-producer", "orders", key, value)
err = kafkaClient.SubscribeWith(ctx, "order-consumer", []string{"orders"}, handler)
```

## 实际注意点

- producer 会在插件启动阶段初始化。
- consumer 不会在启动时全部创建，而是在订阅时初始化。
- `required_acks`、压缩、重试、批处理和 offset 策略都直接影响语义，不只是吞吐参数。

## 相关页面

- [插件生态](/docs/existing-plugin/plugin-ecosystem)
- [Tracer](/docs/existing-plugin/tracer)
