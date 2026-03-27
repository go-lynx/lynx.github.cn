---
id: pulsar
title: Pulsar Plugin
---

# Pulsar Plugin

The Pulsar plugin is a runtime-managed Pulsar client with named producer and consumer resources.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-pulsar` |
| Config prefix | `lynx.pulsar` |
| Runtime plugin name | `pulsar.client` |
| Public APIs | `GetPulsarClient()`, `GetPulsarClientByName()` |

## What The Implementation Supports

The current plugin includes:

- one managed Pulsar client
- multiple configured producers
- multiple configured consumers
- auth and TLS settings
- connection manager
- retry manager
- health checks and metrics

The `GetPulsarClientByName()` API exists, but the current implementation still returns the main client rather than truly separate runtime plugin instances.

## Configuration

```yaml
lynx:
  pulsar:
    service_url: "pulsar://localhost:6650"
    producers:
      - name: "order-producer"
        enabled: true
        topic: "orders"
    consumers:
      - name: "order-consumer"
        enabled: true
        topics:
          - "orders"
        subscription_name: "order-subscription"
```

## What The Official Template Uses

The official template does not enable Pulsar by default.

That is deliberate:

- the scaffold starts from transport and storage primitives first
- Pulsar is an additional messaging layer you add when the service really needs topic-based async processing
- this page should therefore be read as an opt-in integration reference, not a default project shape

## How To Consume It

```go
import pulsarplug "github.com/go-lynx/lynx-pulsar"

client, err := pulsarplug.GetPulsarClient()
```

After retrieving the plugin object, use its producer, consumer, config, and stats methods rather than expecting the old `github.com/go-lynx/lynx/plugin/pulsar` package layout.

## Related Pages

- [Kafka](/docs/existing-plugin/kafka)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
