---
id: pulsar
title: Pulsar Plugin
---

# Pulsar Plugin

The Pulsar plugin brings Apache Pulsar production, consumption, and subscription capability into Lynx. It fits systems that need multiple subscription models, multi-tenant support, or more complex messaging semantics.

## What it is for

- managing Pulsar client connectivity in one place
- configuring multiple producers and consumers
- supporting subscription modes, batching, and security settings

## Basic configuration

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

## Basic usage

```go
import (
    "github.com/go-lynx/lynx/plugin/pulsar"
)

pulsarClient := pulsar.GetPulsarClient()
```

Once you have the client, keep topic, subscription, and handler organization in your application code.

## Practical guidance

- define topic and subscription boundaries before deciding plugin instance layout
- choose batching, compression, and subscription modes based on throughput, latency, and delivery semantics
- if you rely on multi-tenant or richer schema rules, keep those constraints explicit in business contracts rather than only in config

## Related pages

- Repo: [go-lynx/lynx-pulsar](https://github.com/go-lynx/lynx-pulsar)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
