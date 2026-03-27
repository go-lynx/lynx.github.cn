---
id: rabbitmq
title: RabbitMQ 插件
---

# RabbitMQ 插件

RabbitMQ 插件是一个由 runtime 管理的消息客户端，内部维护命名 producer channel 和 consumer channel。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-rabbitmq` |
| 配置前缀 | `rabbitmq` |
| Runtime 插件名 | `rabbitmq` |
| 公开 API 形态 | 通过 plugin-manager 取 `rabbitmq`，再使用 `rabbitmq.ClientInterface` 方法 |

## 实现支持什么

从代码看，这个插件提供：

- 一个受管的 AMQP 连接
- 命名 producer channel
- 命名 consumer channel
- 启动阶段完成 exchange 和 queue 声明
- health checker 和 connection manager
- retry 处理

这比“支持发布和订阅”要具体得多。

## 配置

```yaml
rabbitmq:
  urls:
    - "amqp://guest:guest@localhost:5672/"
  virtual_host: "/"
  dial_timeout: 3s
  heartbeat: 30s
  channel_pool_size: 10
  producers:
    - name: "order-producer"
      enabled: true
      exchange: "orders.exchange"
      exchange_type: "direct"
      routing_key: "orders.create"
  consumers:
    - name: "order-consumer"
      enabled: true
      queue: "orders.queue"
      exchange: "orders.exchange"
      routing_key: "orders.create"
```

要注意，当前插件前缀是 `rabbitmq`，不是 `lynx.rabbitmq`。

## 如何使用

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("rabbitmq")
client := plugin.(rabbitmq.ClientInterface)
```

之后再通过 client interface 暴露的命名 producer / consumer API 使用能力。

## 相关页面

- [RocketMQ](/docs/existing-plugin/rocketmq)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
