---
id: pulsar
title: Pulsar Plugin
slug: existing-plugin/pulsar
---

# Pulsar Plugin

The Go-Lynx Apache Pulsar plugin provides producer/consumer support, subscription types, schema, multi-tenancy, batching, compression, health checks, and metrics.

## Features

- **Produce/consume** — Full producer and consumer API
- **Subscription types** — Exclusive, Shared, Failover, Key-Shared
- **Topic & schema** — Topic management and Schema Registry
- **Security** — Token, OAuth2, TLS
- **Performance** — Batching, compression (LZ4/Zlib/Zstd/Snappy), connection pool
- **Reliability** — Retries, dead letter queue

## Configuration

Add `lynx.pulsar` in `config.yaml`:

```yaml
lynx:
  pulsar:
    service_url: "pulsar://localhost:6650"

    producers:
      - name: "default-producer"
        enabled: true
        topic: "default-topic"

    consumers:
      - name: "default-consumer"
        enabled: true
        topics:
          - "default-topic"
        subscription_name: "default-subscription"
```

## How to use

### 1. Add dependency

```bash
go get github.com/go-lynx/lynx-pulsar
```

### 2. Get client

```go
import (
    "context"
    "github.com/go-lynx/lynx/plugin/pulsar"
)

pulsarClient := pulsar.GetPulsarClient()
```

### 3. Produce

```go
err := pulsarClient.Produce(ctx, "my-topic", []byte("key"), []byte("value"))
err = pulsarClient.ProduceWithProperties(ctx, "my-topic", []byte("key"), []byte("value"), map[string]string{"source": "lynx"})
err = pulsarClient.ProduceAsync(ctx, "my-topic", []byte("key"), []byte("value"), func(id pulsar.MessageID, msg *pulsar.ProducerMessage, err error) { /* callback */ })
```

### 4. Consume

```go
err := pulsarClient.Subscribe(ctx, []string{"my-topic"}, func(ctx context.Context, msg pulsar.Message) error {
    fmt.Printf("Received: %s\n", string(msg.Payload()))
    return nil
})
err = pulsarClient.SubscribeWithRegex(ctx, "tenant-.*/namespace-.*/topic-.*", messageHandler)
```

### 5. Health & metrics

```go
err := pulsarClient.CheckHealth()
metrics := pulsarClient.GetMetrics()
producer := pulsarClient.GetProducer("default-producer")
consumer := pulsarClient.GetConsumer("default-consumer")
```

## See also

- Repo: [go-lynx/lynx-pulsar](https://github.com/go-lynx/lynx-pulsar)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
