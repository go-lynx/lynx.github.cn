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

## Integration Notes

- The plugin is registered via package `init()`, so importing `github.com/go-lynx/lynx-http` is what makes it discoverable.
- If you also use Swagger, that plugin reads the HTTP address when `api_server` is not set.
- If you use TLS centrally, align this page with the [TLS Manager](/docs/existing-plugin/tls-manager) page rather than duplicating certificate logic in application code.

## Related Pages

- [gRPC](/docs/existing-plugin/grpc)
- [TLS Manager](/docs/existing-plugin/tls-manager)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
