---
id: rabbitmq
title: RabbitMQ Plugin
slug: existing-plugin/rabbitmq
---

# RabbitMQ Plugin

The Go-Lynx RabbitMQ plugin integrates RabbitMQ message broker with support for multiple producer/consumer instances, health checks, metrics, retries, and graceful shutdown.

## Features

- **Multi-instance** — Multiple producers and consumers
- **Health & metrics** — Built-in health checks and Prometheus metrics
- **Retry** — Configurable retries and backoff
- **Connection & channel pool** — Efficient connection and channel management
- **Exchanges & queues** — Exchange/queue declaration and binding

## Configuration

Add a `lynx.rabbitmq` (or your project’s config key) section:

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

Producer fields: `enabled`, `exchange`, `exchange_type` (direct/fanout/topic/headers), `routing_key`, `max_retries`, `retry_backoff`, `publish_timeout`.  
Consumer fields: `enabled`, `queue`, `exchange`, `routing_key`, `max_concurrency`, `prefetch_count`, `auto_ack`.

## How to use

### 1. Add dependency

```bash
go get github.com/go-lynx/lynx-rabbitmq
```

### 2. Get client from plugin manager

```go
import (
    "context"
    "github.com/go-lynx/lynx/plugin/rabbitmq"
    amqp "github.com/rabbitmq/amqp091-go"
)

client := pluginManager.GetPlugin("rabbitmq").(rabbitmq.ClientInterface)
```

### 3. Publish

```go
err := client.PublishMessage(ctx, "test.exchange", "test.routing.key", []byte("Hello RabbitMQ"))
err = client.PublishMessageWith(ctx, "default-producer", "test.exchange", "test.routing.key", []byte("Hello"))
```

### 4. Consume

```go
handler := func(ctx context.Context, msg amqp.Delivery) error {
    log.Printf("Received: %s", string(msg.Body))
    msg.Ack(false)
    return nil
}
err := client.Subscribe(ctx, "test.queue", handler)
err = client.SubscribeWith(ctx, "default-consumer", "test.queue", handler)
```

### 5. Health & metrics

```go
if client.IsProducerReady("default-producer") { /* ... */ }
if client.IsConsumerReady("default-consumer") { /* ... */ }
metrics := client.GetMetrics()
```

## Exchange types

- **direct** — Match by routing key  
- **fanout** — Broadcast to all bound queues  
- **topic** — Match by pattern  
- **headers** — Match by headers  

Set `exchange_type` in `producers` as needed.

## See also

- Repo: [go-lynx/lynx-rabbitmq](https://github.com/go-lynx/lynx-rabbitmq)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
