---
id: kafka
title: Kafka Plugin
---

# Kafka Plugin

The Kafka plugin brings Kafka production and consumption into the Lynx runtime. It fits systems that need one place to manage broker connectivity, producer/consumer instances, and security or retry behavior.

## What it is for

- managing Kafka broker connections
- configuring multiple producers and consumers
- centralizing SASL, TLS, batching, and retry behavior

## Basic configuration

```yaml
lynx:
  kafka:
    brokers:
      - "localhost:9092"
      - "localhost:9093"
    client_id: "lynx-kafka-client"
    group_id: "lynx-consumer-group"
    producers:
      - name: "default-producer"
        enabled: true
        topic: "default-topic"
    consumers:
      - name: "default-consumer"
        enabled: true
        topics:
          - "default-topic"
        group_id: "lynx-consumer-group"
```

## Usage

Kafka is usually best treated as a runtime capability during startup and assembly. What business code should really care about is:

- which topics belong to which workflows
- which consumer groups represent which delivery semantics
- how retries, ordering, and idempotency are designed

The concrete client instances are then provided by the plugin layer.

## Practical guidance

- design topic and consumer-group boundaries explicitly
- choose batching, compression, and retry settings around throughput and latency goals
- do not hide the message contract only in config; keep it explicit in application code as well

## Related pages

- Repo: [go-lynx/lynx-kafka](https://github.com/go-lynx/lynx-kafka)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
