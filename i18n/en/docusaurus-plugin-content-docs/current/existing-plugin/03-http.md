---
id: http
title: HTTP Service
---

# HTTP Service

The HTTP plugin is the runtime-owned HTTP server for Lynx, not a thin helper around router registration.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-http` |
| Config prefix | `lynx.http` |
| Runtime plugin name | `http.server` |
| Public getter | `http.GetHttpServer()` |

## What The Implementation Actually Provides

The plugin constructs and owns a Kratos HTTP server, then attaches operational behavior around it:

- config loading and validation
- network and listen address setup
- optional TLS integration
- metrics collection
- rate limiting and request concurrency controls
- circuit-breaker support
- graceful shutdown handling

Your application still owns route and handler registration, but the server lifecycle belongs to Lynx.

## Minimal Configuration

```yaml
lynx:
  http:
    network: tcp
    addr: ":8080"
    timeout: 10s
    tls_enable: false
```

The code sets defaults when fields are omitted, but `lynx.http` is still the single source of truth for server behavior.

## Real Configuration Shape In Code

The actual protobuf config for `lynx.http` is broader than the minimal example above. Besides the top-level transport fields, the plugin also reads nested sections such as:

- `monitoring`
- `security`
- `performance`
- `middleware`
- `graceful_shutdown`
- `circuit_breaker`

A more implementation-shaped skeleton looks like this:

```yaml
lynx:
  http:
    network: tcp
    addr: ":8080"
    tls_enable: false
    tls_auth_type: 0
    timeout: 30s
    monitoring:
      enable_metrics: true
      metrics_path: /metrics
      health_path: /health
    security:
      max_request_size: 10485760
      rate_limit:
        enabled: true
        rate_per_second: 100
        burst_limit: 200
    performance:
      max_connections: 1000
      max_concurrent_requests: 500
      read_timeout: 30s
      write_timeout: 30s
      idle_timeout: 60s
      read_header_timeout: 20s
    middleware:
      enable_tracing: true
      enable_logging: true
      enable_recovery: true
      enable_validation: true
      enable_rate_limit: true
      enable_metrics: true
    graceful_shutdown:
      shutdown_timeout: 30s
      wait_for_ongoing_requests: true
    circuit_breaker:
      enabled: true
```

So if you previously read this page as "HTTP only has `network`, `addr`, `timeout`, and `tls_enable`", that was too shallow compared with the actual plugin config model.

## What The Official Template Uses

`lynx-layout/configs/bootstrap.local.yaml` currently uses HTTP like this:

```yaml
lynx:
  http:
    network: tcp
    addr: 127.0.0.1:8000
    timeout: 5s
```

That is the concrete shape a new project actually starts with today. So if you are reading this page while comparing it to the template, the template is not using a different plugin. It is using this same `lynx.http` plugin with a narrower local-dev config.

## Template-To-Plugin Alignment

The practical gap to keep in mind is this:

- the official template only sets `network`, `addr`, and `timeout`
- the plugin implementation also supports TLS, monitoring, security, performance, middleware, graceful shutdown, and circuit breaker controls

Use this quick mapping when comparing `lynx-layout` with the plugin code:

| Area | Template default | Plugin implementation |
| --- | --- | --- |
| Listener | `network`, `addr` | same fields |
| Request timeout | `timeout` | same field |
| TLS | omitted locally | `tls_enable`, `tls_auth_type` |
| Monitoring | omitted locally | `monitoring.*` |
| Security | omitted locally | `security.*`, including `rate_limit` |
| Performance | omitted locally | `performance.*` |
| Middleware toggles | omitted locally | `middleware.*` |
| Graceful shutdown | omitted locally | `graceful_shutdown.*` |
| Circuit breaker | omitted locally | `circuit_breaker.*` |

So the right reading is not "the doc and template disagree about what HTTP is". The right reading is "the template starts with the transport minimum, while the plugin exposes a wider operational config surface".

## How To Consume It

```go
import (
    lynxhttp "github.com/go-lynx/lynx-http"
    kratoshttp "github.com/go-kratos/kratos/v2/transport/http"
)

func NewHTTPServer(login *service.LoginService) (*kratoshttp.Server, error) {
    srv, err := lynxhttp.GetHttpServer()
    if err != nil {
        return nil, err
    }
    v1.RegisterLoginHTTPServer(srv, login)
    return srv, nil
}
```

The important point is that you retrieve the runtime-owned server. You do not create a second HTTP server beside Lynx.

This is also exactly what `lynx-layout/internal/server/http.go` does with `lynx-http.GetHttpServer()`.

## Integration Notes

- The plugin is registered via package `init()`, so importing `github.com/go-lynx/lynx-http` is what makes it discoverable.
- If you also use Swagger, that plugin reads the HTTP address when `api_server` is not set.
- If you use TLS centrally, align this page with the [TLS Manager](/docs/existing-plugin/tls-manager) page rather than duplicating certificate logic in application code.

## Related Pages

- [gRPC](/docs/existing-plugin/grpc)
- [TLS Manager](/docs/existing-plugin/tls-manager)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
