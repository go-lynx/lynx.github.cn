---
id: kafka
title: Kafka Plugin
---

# Kafka Plugin

The Kafka module is a runtime-managed client plugin with named producer and consumer instances. It is more than a single global producer.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-kafka` |
| Config prefix | `lynx.kafka` |
| Runtime plugin name | `kafka.client` |
| Main API shape | plugin instance methods such as `ProduceWith`, `ProduceBatchWith`, `SubscribeWith` |

## What The Code Supports

From the implementation, the plugin provides:

- multiple named producers
- multiple named consumers
- lazy consumer initialization on `SubscribeWith`
- per-producer retry handlers
- per-producer circuit breakers
- optional SASL and TLS
- batch processing for producers
- connection managers and health reporting

The first enabled producer becomes the default producer when you call methods that do not specify a producer name.

## Configuration Shape

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

Validation in code requires brokers, valid consumer group configuration, and valid SASL or TLS settings when those features are enabled.

## How To Consume It

You normally resolve the plugin through the runtime and then call its methods:

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("kafka.client")
kafkaClient := plugin.(*kafka.Client)

err := kafkaClient.ProduceWith(ctx, "order-producer", "orders", key, value)
err = kafkaClient.SubscribeWith(ctx, "order-consumer", []string{"orders"}, handler)
```

## Practical Notes

- Producer instances are started during plugin startup.
- Consumer instances are created when you subscribe, not all at boot time.
- `required_acks`, compression, retry, batching, and consumer offsets are operational settings that materially affect semantics, not just throughput.

## Related Pages

- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
- [Tracer](/docs/existing-plugin/tracer)
