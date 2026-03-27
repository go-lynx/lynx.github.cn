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

## Related Pages

- [HTTP](/docs/existing-plugin/http)
- [TLS Manager](/docs/existing-plugin/tls-manager)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
