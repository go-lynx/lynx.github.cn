---
id: tracer
title: Tracer Plugin
---

# Tracer Plugin

`lynx-tracer` integrates OpenTelemetry tracing into Lynx startup. The implementation is not just a thin exporter wrapper: it initializes the global tracer provider, configures propagators and sampling, and shuts everything down with the runtime lifecycle.

## Runtime facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-tracer` |
| Config prefix | `lynx.tracer` |
| Runtime plugin name | `tracer.server` |
| Main effect | Registers global OpenTelemetry tracer provider and propagators |

## What the implementation actually provides

- reads `lynx.tracer` at startup and validates address, sampler, and exporter settings
- configures OTLP gRPC or OTLP HTTP export, batching, retry, compression, TLS, and connection behavior
- builds OpenTelemetry resource attributes such as service name and custom attributes
- installs global propagators, so HTTP and gRPC layers can continue trace context across services
- flushes and shuts down the tracer provider during runtime cleanup

One practical detail matters: if `addr` is exactly `"None"`, the plugin still keeps context propagation but skips exporting spans to a collector.

## Configuration

```yaml
lynx:
  tracer:
    enable: true
    addr: "otel-collector:4317"
    ratio: 1
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
      propagators:
        - W3C_TRACE_CONTEXT
        - W3C_BAGGAGE
      resource:
        service_name: "user-service"
        attributes:
          deployment.environment: "prod"
```

Key points:

- `ratio` is the legacy top-level sampling field, and when unset it is normalized to full sampling
- if you need to disable sampling, use `config.sampler.type: ALWAYS_OFF`
- `config.protocol` selects OTLP gRPC or OTLP HTTP behavior
- `config.resource` controls service-level OpenTelemetry resource attributes

## Usage

Import the plugin so Lynx can register it:

```go
import _ "github.com/go-lynx/lynx-tracer"
```

## What The Official Template Uses

`lynx-layout` already imports tracer in `internal/data/data.go`:

```go
import _ "github.com/go-lynx/lynx-tracer"
```

But the template does not add a visible `lynx.tracer` block to `bootstrap.local.yaml` by default. In practice that means:

- the scaffold is already ready for tracing-aware middleware and context propagation
- exporting spans is still a conscious follow-up step
- this page describes the runtime behavior you enable once you add explicit tracer configuration

After startup, use the normal OpenTelemetry API. The plugin has already installed the global provider:

```go
import (
    "context"

    "go.opentelemetry.io/otel"
)

func Handle(ctx context.Context) {
    tracer := otel.Tracer("user-service")
    _, span := tracer.Start(ctx, "CreateUser")
    defer span.End()
}
```

## Practical guidance

- use `addr: "None"` only when you intentionally want propagation without exporting
- prefer `config.sampler` over only tuning the legacy `ratio`
- keep `service_name` and resource attributes stable across environments, otherwise traces become hard to compare

## Related pages

- Repo: [go-lynx/lynx-tracer](https://github.com/go-lynx/lynx-tracer)
- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
