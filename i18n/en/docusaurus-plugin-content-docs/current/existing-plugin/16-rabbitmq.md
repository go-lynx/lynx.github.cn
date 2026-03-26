---
id: rabbitmq
title: RabbitMQ Plugin
---

# RabbitMQ Plugin

The RabbitMQ plugin brings message publishing and consumption into the Lynx runtime. It fits systems that need stable connection ownership, configurable producer/consumer instances, and one lifecycle path for messaging infrastructure.

## What it is for

- managing RabbitMQ connections and channels
- configuring multiple producer and consumer instances
- bringing publish, subscribe, and health behavior into the runtime

## Basic configuration

```yaml
lynx:
  rabbitmq:
    urls:
      - "amqp://guest:guest@localhost:5672/"
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
    consumers:
      - name: "default-consumer"
        enabled: true
        queue: "lynx.queue"
        exchange: "lynx.exchange"
        routing_key: "lynx.routing.key"
```

## Usage

The common pattern is to let the plugin assemble itself during startup, then obtain the client capability in application code to publish or subscribe.

```go
client := pluginManager.GetPlugin("rabbitmq").(rabbitmq.ClientInterface)
```

After that, publish with a named producer or register handlers with a named consumer as needed.

## Practical guidance

- treat Exchange, Queue, and Routing Key design as part of your business contract
- if you have many producers or consumers, split instance names by responsibility instead of forcing everything into one default instance
- retries, dead-letter handling, and idempotency still need application-level design; do not rely only on plugin defaults

## Related pages

- Repo: [go-lynx/lynx-rabbitmq](https://github.com/go-lynx/lynx-rabbitmq)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
