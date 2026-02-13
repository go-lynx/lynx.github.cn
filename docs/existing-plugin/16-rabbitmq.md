---
id: rabbitmq
title: RabbitMQ Plugin
slug: existing-plugin/rabbitmq
---

# RabbitMQ Plugin

Go-Lynx 的 RabbitMQ 插件用于集成 RabbitMQ 消息队列，支持多实例生产者/消费者、健康检查、指标采集、重试与优雅关闭。

## 功能概览

- **多实例**：支持多个 Producer/Consumer 实例
- **健康与指标**：内置健康检查与 Prometheus 指标
- **重试**：可配置重试与退避
- **连接与通道池**：高效连接与 channel 管理
- **交换机与队列**：支持声明 Exchange、Queue 及绑定

## 配置说明

在配置文件中增加 `lynx.rabbitmq`（或项目实际使用的配置键，如 `rabbitmq`）段：

```yaml
lynx:
  rabbitmq:
    urls:
      - "amqp://guest:guest@localhost:5672/"
    username: "guest"
    password: "guest"
    virtual_host: "/"
    dial_timeout: "3s"
    heartbeat: "30s"
    channel_pool_size: 10

    producers:
      - name: "default-producer"
        enabled: true
        exchange: "lynx.exchange"
        exchange_type: "direct"
        routing_key: "lynx.routing.key"
        max_retries: 3
        retry_backoff: "100ms"
        publish_timeout: "3s"
        exchange_durable: true
        message_persistent: true

    consumers:
      - name: "default-consumer"
        enabled: true
        queue: "lynx.queue"
        exchange: "lynx.exchange"
        routing_key: "lynx.routing.key"
        consumer_tag: "lynx.consumer"
        max_concurrency: 1
        prefetch_count: 1
        queue_durable: true
        auto_ack: false
```

Producer 常用字段：`enabled`、`exchange`、`exchange_type`（direct/fanout/topic/headers）、`routing_key`、`max_retries`、`retry_backoff`、`publish_timeout`。  
Consumer 常用字段：`enabled`、`queue`、`exchange`、`routing_key`、`max_concurrency`、`prefetch_count`、`auto_ack`。

## 如何使用

### 1. 引入依赖

```bash
go get github.com/go-lynx/lynx-rabbitmq
```

### 2. 从插件管理器获取客户端

```go
import (
    "context"
    "github.com/go-lynx/lynx/plugin/rabbitmq"
    amqp "github.com/rabbitmq/amqp091-go"
)

// 从 Lynx 插件管理器获取 RabbitMQ 客户端（具体 API 以项目为准）
client := pluginManager.GetPlugin("rabbitmq").(rabbitmq.ClientInterface)
```

### 3. 发送消息

```go
err := client.PublishMessage(ctx, "test.exchange", "test.routing.key", []byte("Hello RabbitMQ"))

// 指定 producer 实例
err = client.PublishMessageWith(ctx, "default-producer", "test.exchange", "test.routing.key", []byte("Hello"))
```

### 4. 消费消息

```go
handler := func(ctx context.Context, msg amqp.Delivery) error {
    log.Printf("Received: %s", string(msg.Body))
    msg.Ack(false)
    return nil
}
err := client.Subscribe(ctx, "test.queue", handler)

// 指定 consumer 实例
err = client.SubscribeWith(ctx, "default-consumer", "test.queue", handler)
```

### 5. 健康与指标

```go
if client.IsProducerReady("default-producer") { /* ... */ }
if client.IsConsumerReady("default-consumer") { /* ... */ }
metrics := client.GetMetrics()
```

## 交换机类型

- **direct**：按 routing key 精确匹配  
- **fanout**：广播到所有绑定队列  
- **topic**：按 pattern 匹配  
- **headers**：按消息头匹配  

在 `producers` 中通过 `exchange_type` 配置即可。

## 相关链接

- 仓库：[go-lynx/lynx-rabbitmq](https://github.com/go-lynx/lynx-rabbitmq)
- [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
