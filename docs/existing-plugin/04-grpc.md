---
id: grpc
title: gRPC Service
---

# gRPC Service

The `lynx-grpc` repository contains both a gRPC server plugin and a gRPC client plugin. Earlier docs often described only the server side, which is incomplete.

## Runtime Facts

| Capability | Go module | Config prefix | Runtime plugin name | Public API |
|------|------|------|------|------|
| gRPC server | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.service` | `grpc.service` | `grpc.GetGrpcServer(nil)` |
| gRPC client | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.client` | `grpc.client` | `grpc.GetGrpcClientPlugin(nil)`, `grpc.GetGrpcClientConnection(...)` |

## Server-Side Behavior

The service plugin builds and owns the Kratos gRPC server. From the implementation, the server path includes:

- config validation and defaulting
- optional TLS and certificate-provider integration
- health service registration and readiness polling
- recovery, tracing, and validation middleware
- optional rate limiting
- optional max in-flight unary control
- optional server-side circuit breaker

Your service code should register protobuf services onto the managed server instead of creating another one.

## Server Configuration

```yaml
lynx:
  grpc:
    service:
      network: tcp
      addr: ":9090"
      timeout: 10s
      tls_enable: false
```

## Real Server Configuration Shape In Code

The real protobuf config for `lynx.grpc.service` is intentionally narrow but still richer than the old doc shape. In addition to transport basics, it also supports:

- `max_concurrent_streams`
- `max_recv_msg_size`
- `max_send_msg_size`

A more implementation-shaped skeleton is:

```yaml
lynx:
  grpc:
    service:
      network: tcp
      addr: ":9090"
      tls_enable: false
      tls_auth_type: 0
      timeout: 10s
      max_concurrent_streams: 1024
      max_recv_msg_size: 4194304
      max_send_msg_size: 4194304
```

So the current server plugin config is not just "host, port, and timeout".

## What The Official Template Uses

`lynx-layout/configs/bootstrap.local.yaml` currently configures the server side like this:

```yaml
lynx:
  grpc:
    service:
      network: tcp
      addr: 127.0.0.1:9000
      timeout: 5s
```

This is the most important template-to-doc alignment point on this page: the official project template does not use a flat `lynx.grpc`. It uses `lynx.grpc.service`, which matches the actual server plugin implementation.

## Template-To-Plugin Alignment

When people compare this page with `lynx-layout`, they are usually looking at two different layers:

- the template only starts the server half: `lynx.grpc.service`
- the module implementation actually exposes two runtime plugins: `grpc.service` and `grpc.client`

Use this quick mapping:

| Area | Template default | Plugin implementation |
| --- | --- | --- |
| Server listener | `lynx.grpc.service.network`, `addr` | same fields |
| Server timeout | `lynx.grpc.service.timeout` | same field |
| Server TLS | omitted locally | `tls_enable`, `tls_auth_type` |
| Server stream / message limits | omitted locally | `max_concurrent_streams`, `max_recv_msg_size`, `max_send_msg_size` |
| Client plugin | not enabled by default | `lynx.grpc.client` exists and is fully supported |
| Client transport controls | not enabled by default | timeouts, retries, pooling, health checks, metrics, tracing, logging |
| Client service subscription | not enabled by default | `subscribe_services[*]` and legacy `services` |

So the real mismatch was not "template config is wrong". It was that the old doc did not clearly separate server-default usage from the broader server+client module surface.

## Server Registration

```go
import (
    lynxgrpc "github.com/go-lynx/lynx-grpc"
    grpcgo "github.com/go-kratos/kratos/v2/transport/grpc"
)

func NewGRPCServer(login *service.LoginService) (*grpcgo.Server, error) {
    srv, err := lynxgrpc.GetGrpcServer(nil)
    if err != nil {
        return nil, err
    }
    v1.RegisterLoginServer(srv, login)
    return srv, nil
}
```

That is also the real shape used in `lynx-layout/internal/server/grpc.go`.

## Client-Side Behavior

The same module also registers `grpc.client`. That plugin manages outbound connections and supports:

- static service endpoints and subscribed services
- retries and timeouts
- optional TLS
- connection pooling
- health checks
- metrics and tracing toggles
- per-service load-balancing strategy

If you only read this page as "how to expose a server", you miss half of the module.

## Client Configuration

```yaml
lynx:
  grpc:
    client:
      default_timeout: 10s
      connection_pooling: true
      pool_size: 8
      subscribe_services:
        - name: user-service
          required: true
```

## Real Client Configuration Shape In Code

The client-side protobuf config is much broader than the short example above. The plugin reads top-level client settings plus per-service subscription settings.

Top-level fields include:

- `default_timeout`
- `default_keep_alive`
- `max_retries`
- `retry_backoff`
- `max_connections`
- `tls_enable`
- `tls_auth_type`
- `connection_pooling`
- `pool_size`
- `idle_timeout`
- `health_check_enabled`
- `health_check_interval`
- `metrics_enabled`
- `tracing_enabled`
- `logging_enabled`
- `max_message_size`
- `compression_enabled`
- `compression_type`
- `subscribe_services`
- deprecated legacy `services`

Per-item `subscribe_services` fields include:

- `name`
- `endpoint`
- `timeout`
- `tls_enable`
- `tls_auth_type`
- `max_retries`
- `required`
- `metadata`
- `load_balancer`
- `circuit_breaker_enabled`
- `circuit_breaker_threshold`

A more implementation-shaped skeleton is:

```yaml
lynx:
  grpc:
    client:
      default_timeout: 10s
      default_keep_alive: 30s
      max_retries: 3
      retry_backoff: 1s
      max_connections: 100
      tls_enable: false
      connection_pooling: true
      pool_size: 8
      idle_timeout: 60s
      health_check_enabled: true
      health_check_interval: 30s
      metrics_enabled: true
      tracing_enabled: true
      logging_enabled: true
      max_message_size: 4194304
      compression_enabled: false
      subscribe_services:
        - name: user-service
          required: true
          load_balancer: round_robin
          circuit_breaker_enabled: true
```

So if the old doc made the client plugin look like "just subscribe to services", that was significantly below the real config surface.

The template does not enable the client plugin by default. It starts with the gRPC server path only, then you add `lynx.grpc.client` when the service actually needs outbound gRPC subscriptions or client connections.

## Related Pages

- [HTTP](/docs/existing-plugin/http)
- [TLS Manager](/docs/existing-plugin/tls-manager)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
