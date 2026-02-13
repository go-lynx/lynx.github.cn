---
id: rocketmq
title: RocketMQ Plugin
slug: existing-plugin/rocketmq
---

# RocketMQ Plugin

The Go-Lynx RocketMQ plugin integrates Apache RocketMQ with multi-instance producers/consumers, health checks, metrics, retries, and clustering/broadcasting consumption.

## Features

- **Multi-instance** — Multiple producers and consumers
- **Health & metrics** — Connection and send/receive health, Prometheus metrics
- **Retry & timeout** — Configurable retries, backoff, and send timeout
- **Consume mode** — CLUSTERING or BROADCASTING
- **Order** — CONCURRENTLY or ORDERLY

## Configuration

Add `lynx.rocketmq` (or your project’s `rocketmq`) section:

```yaml
lynx:
  rocketmq:
    name_server:
      - "127.0.0.1:9876"
    access_key: "your-access-key"
    secret_key: "your-secret-key"
    dial_timeout: "3s"
    request_timeout: "30s"

    producers:
      - name: "default-producer"
        enabled: true
        group_name: "lynx-producer-group"
        max_retries: 3
        retry_backoff: "100ms"
        send_timeout: "3s"
        enable_trace: false

    consumers:
      - name: "default-consumer"
        enabled: true
        group_name: "lynx-consumer-group"
        consume_model: "CLUSTERING"
        consume_order: "CONCURRENTLY"
        max_concurrency: 1
        pull_batch_size: 32
        pull_interval: "100ms"
        topics:
          - "test-topic"
        enable_trace: false
```

`consume_model`: `CLUSTERING` (load balance) or `BROADCASTING`.  
`consume_order`: `CONCURRENTLY` or `ORDERLY`.

## How to use

### 1. Add dependency

```bash
go get github.com/go-lynx/lynx-rocketmq
```

### 2. Get client from plugin manager

```go
import (
    "context"
    "github.com/go-lynx/lynx/plugin/rocketmq"
)

client := pluginManager.GetPlugin("rocketmq").(rocketmq.ClientInterface)
```

### 3. Send

```go
err := client.SendMessage(ctx, "test-topic", []byte("Hello RocketMQ"))
err = client.SendMessageWith(ctx, "default-producer", "test-topic", []byte("Hello"))
```

### 4. Consume

```go
import "github.com/apache/rocketmq-client-go/v2/primitive"

handler := func(ctx context.Context, msg *primitive.MessageExt) error {
    log.Printf("Received: %s", string(msg.Body))
    return nil
}
err := client.Subscribe(ctx, []string{"test-topic"}, handler)
err = client.SubscribeWith(ctx, "default-consumer", []string{"topic-a", "topic-b"}, handler)
```

### 5. Health & metrics

```go
if client.IsProducerReady("default-producer") { /* ... */ }
if client.IsConsumerReady("default-consumer") { /* ... */ }
metrics := client.GetMetrics()
```

## Notes

- For multiple topics, ensure config and code pass the same topic list; the plugin subscribes per topic.
- Transactional messages require application-level or custom plugin support.

## See also

- Repo: [go-lynx/lynx-rocketmq](https://github.com/go-lynx/lynx-rocketmq)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
