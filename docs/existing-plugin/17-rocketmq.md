---
id: rocketmq
title: RocketMQ Plugin
---

# RocketMQ Plugin

The RocketMQ plugin brings RocketMQ producers and consumers into Lynx. It fits systems that need named producer/consumer instances, configurable consumption modes, and one runtime lifecycle for messaging infrastructure.

## What it is for

- configuring multiple RocketMQ producers and consumers
- switching between clustering and broadcasting consumption models
- bringing send, subscribe, health, and retry behavior into the runtime

## Basic configuration

```yaml
lynx:
  rocketmq:
    name_server:
      - "127.0.0.1:9876"
    producers:
      - name: "default-producer"
        enabled: true
        group_name: "lynx-producer-group"
    consumers:
      - name: "default-consumer"
        enabled: true
        group_name: "lynx-consumer-group"
        consume_model: "CLUSTERING"
        consume_order: "CONCURRENTLY"
        topics:
          - "test-topic"
```

## Usage

```go
client := pluginManager.GetPlugin("rocketmq").(rocketmq.ClientInterface)
```

Once you obtain the client capability, you can send with a named producer or attach subscription handlers to a named consumer.

## Practical guidance

- keep consumer-group responsibility boundaries explicit
- choose `CLUSTERING` or `BROADCASTING` based on real consumption semantics rather than mixing them casually
- ordered and concurrent consumption trade throughput for consistency differently, so that choice belongs to the business case

## Related pages

- Repo: [go-lynx/lynx-rocketmq](https://github.com/go-lynx/lynx-rocketmq)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
