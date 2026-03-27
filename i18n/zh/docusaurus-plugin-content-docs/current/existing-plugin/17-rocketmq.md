---
id: rocketmq
title: RocketMQ 插件
---

# RocketMQ 插件

RocketMQ 插件是一个由 runtime 管理的客户端，内部维护命名 producer 和 consumer 实例。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-rocketmq` |
| 配置前缀 | `rocketmq` |
| Runtime 插件名 | `rocketmq` |
| 公开 API 形态 | 通过 plugin-manager 取 `rocketmq`，再使用 `rocketmq.ClientInterface` 方法 |

## 实现支持什么

代码里支持：

- 多个命名 producer
- 多个命名 consumer
- 默认 producer 和默认 consumer 选择
- producer / consumer 两侧独立的 connection manager
- retry 处理
- metrics 和 health check
- 集群消费与广播消费模型
- 顺序消费与并发消费模式

## 配置

```yaml
rocketmq:
  name_server:
    - "127.0.0.1:9876"
  producers:
    - name: "order-producer"
      enabled: true
      group_name: "order-producer-group"
      topics: ["orders"]
  consumers:
    - name: "order-consumer"
      enabled: true
      group_name: "order-consumer-group"
      consume_model: "CLUSTERING"
      consume_order: "CONCURRENTLY"
      topics: ["orders"]
```

和 RabbitMQ 一样，当前前缀是 `rocketmq`，不是 `lynx.rocketmq`。

## 如何使用

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("rocketmq")
client := plugin.(rocketmq.ClientInterface)
```

之后再通过 client interface 里已有的命名 producer / consumer API 调用。

## 相关页面

- [RabbitMQ](/docs/existing-plugin/rabbitmq)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
