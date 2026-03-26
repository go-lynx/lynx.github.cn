---
id: tracer
title: Tracer Plugin
---

# Tracer Plugin

`lynx-tracer` brings distributed tracing into the Lynx runtime. It is built on OpenTelemetry, and its real value is that **trace exporting, context propagation, and sampling policy** become part of startup, instead of every service assembling its own tracing bootstrap code.

## Basic configuration

```yaml
lynx:
  tracer:
    enable: true
    addr: "127.0.0.1:4317"
    ratio: 1
```

| Option | Description |
|--------|-------------|
| `enable` | whether tracing is enabled |
| `addr` | OTLP collector address, usually in `host:port` form |
| `ratio` | sampling ratio, where `1` means full sampling |

## Advanced configuration

If you need finer control over protocol, batching, propagators, or sampling, use the extended config:

```yaml
lynx:
  tracer:
    enable: true
    addr: "otel-collector:4317"
    config:
      protocol: PROTOCOL_OTLP_GRPC
      insecure: true
      batch:
        enabled: true
        max_queue_size: 2048
        max_batch_size: 512
      sampler:
        type: PARENT_BASED_TRACEID_RATIO
        ratio: 0.1
      propagators: [W3C_TRACE_CONTEXT, W3C_BAGGAGE]
```

## Special behavior

- when `addr` is set to `"None"`, the plugin keeps trace context propagation but does not export to a collector
- if you want to fully disable sampling, prefer `config.sampler.type: ALWAYS_OFF`

## When to enable it

- when you need cross-service call chain visibility
- when you are investigating latency or failure hotspots
- when you want more stable correlation between logs, traces, and metrics

## More

- Repo: [lynx-tracer](https://github.com/go-lynx/lynx-tracer)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
