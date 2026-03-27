---
id: rabbitmq
title: RabbitMQ Plugin
---

# RabbitMQ Plugin

The RabbitMQ plugin is a runtime-managed messaging client with named producer and consumer channels.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-rabbitmq` |
| Config prefix | `rabbitmq` |
| Runtime plugin name | `rabbitmq` |
| Public API shape | plugin-manager lookup to `rabbitmq` and `rabbitmq.ClientInterface` methods |

## What The Implementation Supports

From the code, the plugin provides:

- one managed AMQP connection
- named producer channels
- named consumer channels
- exchange and queue declaration during startup
- health checker and connection manager
- retry handling

This is more specific than "publish and subscribe are available".

## Configuration

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

## What The Official Template Uses

The official template does not enable RabbitMQ by default.

That is intentional:

- the scaffold does not assume AMQP infrastructure for every service
- RabbitMQ should be added only when the service actually has queue or exchange semantics to own
- this page is therefore an integration page for a later messaging decision, not a description of the default template runtime

Note that the current plugin prefix is `rabbitmq`, not `lynx.rabbitmq`.

## How To Consume It

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("rabbitmq")
client := plugin.(rabbitmq.ClientInterface)
```

Then use the named producer or consumer APIs exposed by the client interface.

## Related Pages

- [RocketMQ](/docs/existing-plugin/rocketmq)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
