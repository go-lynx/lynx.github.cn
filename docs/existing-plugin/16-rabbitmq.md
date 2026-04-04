---
id: rabbitmq
title: RabbitMQ Plugin
---

# RabbitMQ Plugin

This page explains the YAML fields from `lynx-rabbitmq/conf/example_config.yml`. The runtime prefix is `rabbitmq`, so the example can be copied into a Lynx bootstrap file without adding a `lynx.` parent block.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-rabbitmq` |
| Config prefix | `rabbitmq` |
| Runtime plugin name | `rabbitmq` |
| Public API shape | plugin-manager lookup to `rabbitmq` and `rabbitmq.ClientInterface` methods |

## YAML Walkthrough

### Top-level `rabbitmq`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `urls` | RabbitMQ server URL list. | Always. Startup fails if it cannot connect. | The current startup path dials the first URL in the list. | Assuming multiple URLs already mean active client-side failover or round-robin. |
| `username` | Username fallback for broker auth. | Useful when you do not want credentials embedded in the URL string. | Example value is `guest`. In practice the URL usually remains the decisive source. | Setting different credentials in `urls` and `username`/`password` and forgetting which one ops actually rotates. |
| `password` | Password fallback for broker auth. | Same scope as `username`. | Example value is `guest`. Treat it as a secret in real deployments. | Leaving the local guest password in non-local environments. |
| `virtual_host` | RabbitMQ virtual host. | Every connection. | Defaults to `/`. The connection config passes this to AMQP connect. | Using the right broker credentials but the wrong vhost and reading the failure as a network issue. |
| `dial_timeout` | Intended dial timeout knob for broker connections. | Connection troubleshooting and connection-SLA planning. | The template shows `3s`, but the current startup path does not pass this field into `amqp.DialConfig`. | Tuning it and expecting connection attempts to shorten immediately in the current implementation. |
| `heartbeat` | AMQP heartbeat interval. | Long-lived connections. | Defaults to `30s` in the repo defaults. | Setting it too low for noisy networks and creating false disconnect churn. |
| `channel_pool_size` | Intended shared channel-pool size. | Throughput planning. | Example value is `10`. The current client still initializes its goroutine pool with a fixed `10`. | Changing it and expecting publish or consume concurrency to change by itself. |
| `producers` | Named producer definitions. | When the service publishes to exchanges. | Each enabled producer declares its exchange during startup. | Leaving all example producers enabled and accidentally booting more topology than the service needs. |
| `consumers` | Named consumer definitions. | When the service consumes queues. | Each enabled consumer declares its queue during startup. | Assuming the template also binds queues to exchanges automatically. |

### `rabbitmq.producers[]`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `name` | Logical producer name used by application code. | Every named publish path. | Keep it stable because `PublishMessageWith` references it directly. | Renaming it in config without updating callers or dashboards. |
| `enabled` | Enables or disables one producer definition. | When the service should publish through that exchange profile. | Disabled entries are ignored. | Carrying enabled sample producers into production by copy-paste. |
| `exchange` | Exchange name the producer targets. | Startup and publish paths. | The startup path declares the exchange when the field is non-empty. | Leaving it empty and assuming the default exchange flow matches your routing design. |
| `exchange_type` | Exchange type: `direct`, `fanout`, `topic`, `headers`. | Exchange declaration and routing design. | The example shows all four patterns. | Using `fanout` or `headers` while still expecting routing-key semantics. |
| `routing_key` | Publish routing key. | Every publish call except pure `fanout` or header-routed flows. | Keep it aligned with consumer bindings. | Reusing topic-style wildcards against a `direct` exchange. |
| `max_retries` | Intended publish retry count. | Message send error handling. | Example values vary by producer. The repo retry helper currently reads producer retry settings as generic publish guidance, not exchange declaration settings. | Raising it on non-idempotent business publishes without reviewing duplicate side effects. |
| `retry_backoff` | Intended delay between publish retries. | Message send error handling. | Example values range from `100ms` to `200ms`. | Setting it extremely low and producing retry storms during broker trouble. |
| `publish_timeout` | Intended timeout budget for publish calls. | Message send paths. | Example values range from `3s` to `5s`. It does not change exchange declaration at startup. | Tuning it to solve topology declaration failures instead of publish latency. |
| `exchange_durable` | Whether the exchange survives broker restarts. | Exchange lifecycle planning. | Example value is `true`. The startup path passes this into `ExchangeDeclare`. | Setting it `false` for business exchanges that should persist across broker restarts. |
| `exchange_auto_delete` | Whether the exchange should auto-delete when unused. | Temporary exchange designs. | The template exposes it, but the current startup declaration path still uses `false`. | Assuming changing the YAML value already changes broker-side exchange deletion behavior today. |
| `message_persistent` | Whether published messages should be marked persistent. | Publish durability decisions. | Useful only on the actual publish path; it does not affect exchange declaration. | Expecting it to keep messages safe while publishing into non-durable topology. |

### `rabbitmq.consumers[]`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `name` | Logical consumer name used by application code. | Every named subscribe path. | Keep it stable because `SubscribeWith` uses it directly. | Renaming it in YAML while the handler still selects the old name. |
| `enabled` | Enables or disables one consumer definition. | When the service should be allowed to consume with that instance. | Disabled entries are ignored. | Assuming a disabled sample consumer can still be selected later. |
| `queue` | Queue name to declare and consume. | Startup and consume paths. | The startup path calls `QueueDeclare` when the field is non-empty. | Forgetting that queue existence alone does not bind it to an exchange. |
| `exchange` | Intended exchange bound to the queue. | Queue topology planning. | Keep it aligned with producer exchange names. The current startup path does not auto-bind the queue. | Believing this YAML row alone creates the binding. |
| `routing_key` | Intended binding routing key. | Queue binding design. | Keep it aligned with producer publish keys. The current startup path does not call `QueueBind`. | Tweaking it while no actual binding step exists yet. |
| `consumer_tag` | Broker-facing consumer tag. | Helpful for debugging live consumers. | Only meaningful when a real consume loop starts. | Treating it as a queue name or expecting it to create uniqueness guarantees. |
| `max_concurrency` | Intended message-handler parallelism. | Consume worker design. | Keep it aligned with downstream safety and ordering needs. The current startup path does not enforce it during queue declaration. | Raising it while still assuming per-message ordering. |
| `prefetch_count` | AMQP QoS prefetch value. | Every active consumer channel. | Defaults to `1`; the startup path applies it with `Qos`. | Setting a very high prefetch on slow handlers and starving other consumers. |
| `queue_durable` | Whether the queue survives broker restarts. | Queue lifecycle planning. | Example value is `true`. The startup path passes it into `QueueDeclare`. | Setting it `false` for service-owned business queues. |
| `queue_auto_delete` | Whether the queue auto-deletes when unused. | Temporary queue designs. | The template exposes it, but the current startup declaration path still uses `false`. | Expecting the YAML switch to delete queues automatically today. |
| `queue_exclusive` | Whether the queue is exclusive to one connection. | Single-consumer, private queue designs. | The template exposes it, but the current startup declaration path still uses `false`. | Assuming it already prevents other consumers from attaching. |
| `auto_ack` | Whether messages are acknowledged automatically. | Actual consume logic. | Usually keep it `false` for at-least-once handling. It does not affect queue declaration. | Turning it on while the handler still expects manual failure-driven redelivery. |

## Complete YAML Example

```yaml
rabbitmq:
  urls:
    - amqp://guest:guest@localhost:5672/ # Current startup path dials the first URL in the list
    - amqp://guest:guest@localhost:5673/ # Optional secondary broker URL for failover planning

  username: guest # Fallback username when the URL does not carry credentials
  password: guest # Fallback password; move to secret management outside local development
  virtual_host: / # Broker virtual host; defaults to /
  dial_timeout: 3s # Intended connection timeout knob in config
  heartbeat: 30s # Heartbeat interval for the AMQP connection
  channel_pool_size: 10 # Intended shared channel pool size

  producers:
    - name: default-producer # Application-facing producer name
      enabled: true # Disabled entries are ignored
      exchange: lynx.exchange # Exchange to declare and publish to
      exchange_type: direct # direct | fanout | topic | headers
      routing_key: lynx.routing.key # Ignored by pure fanout exchanges
      max_retries: 3 # Intended publish retry count
      retry_backoff: 100ms # Intended retry backoff between publish attempts
      publish_timeout: 3s # Intended publish timeout
      exchange_durable: true # Keep true for business exchanges
      exchange_auto_delete: false # Auto-delete only for temporary exchanges
      message_persistent: true # Persistent message delivery hint

  consumers:
    - name: default-consumer # Application-facing consumer name
      enabled: true # Disabled entries are ignored
      queue: lynx.queue # Queue to declare and consume
      exchange: lynx.exchange # Expected exchange bound to the queue
      routing_key: lynx.routing.key # Expected binding key
      consumer_tag: lynx.consumer # Broker-facing consumer tag
      max_concurrency: 4 # Intended message-handler concurrency
      prefetch_count: 10 # QoS prefetch count applied at startup
      queue_durable: true # Keep true for service-owned business queues
      queue_auto_delete: false # Auto-delete only for temporary queues
      queue_exclusive: false # Exclusive queues cannot be shared
      auto_ack: false # false preserves at-least-once handling semantics
```

## Minimum Viable YAML Example

```yaml
rabbitmq:
  urls:
    - amqp://guest:guest@localhost:5672/
  producers:
    - name: default-producer
      enabled: true
      exchange: lynx.exchange
      exchange_type: direct
```

## Source Template

- `lynx-rabbitmq/conf/example_config.yml`

## How To Consume It

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("rabbitmq")
client := plugin.(rabbitmq.ClientInterface)
```

Use the named producer and consumer APIs exposed by `rabbitmq.ClientInterface` after resolving the plugin from the runtime.

## Related Pages

- [RocketMQ](/docs/existing-plugin/rocketmq)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
