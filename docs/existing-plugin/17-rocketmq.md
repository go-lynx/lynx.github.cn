---
id: rocketmq
title: RocketMQ Plugin
---

# RocketMQ Plugin

The RocketMQ plugin is a runtime-managed client with named producer and consumer instances.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-rocketmq` |
| Config prefix | `rocketmq` |
| Runtime plugin name | `rocketmq` |
| Public API shape | plugin-manager lookup to `rocketmq` and `rocketmq.ClientInterface` methods |

## What The Implementation Supports

The code supports:

- multiple named producers
- multiple named consumers
- named default producer and consumer selection
- connection managers per producer and consumer side
- retry handling
- metrics and health checking
- clustering or broadcasting consumption models
- ordered or concurrent consume modes

## Configuration

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

## What The Official Template Uses

The official template does not enable RocketMQ by default.

That follows the same pattern as the other MQ plugins:

- the scaffold avoids choosing one broker family for every new service
- RocketMQ is something you layer in once the service has a concrete eventing or ordered-consumption requirement
- this page therefore describes a supported messaging plugin, not a template default

Like RabbitMQ, the current prefix is `rocketmq`, not `lynx.rocketmq`.

## How To Consume It

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("rocketmq")
client := plugin.(rocketmq.ClientInterface)
```

After that, use the named producer and consumer APIs that the client interface already exposes.

## Related Pages

- [RabbitMQ](/docs/existing-plugin/rabbitmq)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
