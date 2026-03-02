---
id: tracer
title: Tracer Plugin
slug: existing-plugin/tracer
---

# Tracer Plugin

Go-Lynx provides a tracing plugin for scheduling between microservices to facilitate error troubleshooting, performance analysis, and log auditing, built on the OpenTelemetry standard.

## Basic Configuration

Add the following to your configuration file to enable tracing:

```yaml
lynx:
  tracer:
    enable: true
    addr: "127.0.0.1:4317"
    ratio: 1
```

| Option | Description |
|--------|-------------|
| `enable` | Whether to enable tracing (true/false) |
| `addr` | OTLP collector address in `host:port` format. gRPC typically uses 4317, HTTP uses 4318 |
| `ratio` | Sampling rate, range 0-1. 1 means full sampling. Use 1 for testing, reduce (e.g. 0.1) for production |

After configuration, start the service and view collected traces on the tracer server's Web-UI. No additional code is required.

## Advanced Configuration (v2)

v2 supports modular configuration for protocol, TLS, retry, batch processing, sampling, etc.:

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

### Special address value `None`

When `addr` is set to `"None"` (case-sensitive), the plugin initializes trace context propagation (traceparent, baggage, etc.) but **does not export** traces to any collector. Useful when you need trace context for log correlation without running a collector (e.g., local development or when collector is unavailable).

### Disable sampling

To fully disable sampling, use `config.sampler.type: ALWAYS_OFF` instead of `ratio: 0` (unset `ratio` is normalized to 1.0).

## More

For full configuration options and examples, see [lynx-tracer README](https://github.com/go-lynx/lynx-tracer).
