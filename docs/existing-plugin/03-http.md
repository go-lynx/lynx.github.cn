---
id: http
title: HTTP Service
---

# HTTP Service

The Go-Lynx HTTP plugin provides the **HTTP server** for your application. You configure the listening address, timeout, and TLS in YAML; the framework initializes the server at startup. You then register your HTTP handlers (e.g. Kratos HTTP services) with the server so that routes are bound to your business logic. The underlying implementation uses the Kratos HTTP module.

## Client Configuration

To specify an HTTP client, you need to configure it in the configuration file as follows:

```yaml
lynx:
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
```

The `lynx.http` section contains the HTTP server configuration (address, timeout, TLS, etc.). Once the configuration is complete, the application loads the HTTP plugin at startup according to the plugin order.

```go
import (
  bh "github.com/go-lynx/lynx/plugin/http"
)

func NewHTTPServer(
  login *service.LoginService,
  register *service.RegisterService,
  account *service.AccountService
) *http.Server {
  h := bh.GetServer()
  loginV1.RegisterLoginHTTPServer(h, login)
  registerV1.RegisterRegisterHTTPServer(h, register)
  accountV1.RegisterAccountHTTPServer(h, account)
  return h
}
```

After the HTTP plugin is loaded, use `bh.GetServer()` to obtain the server instance and register your HTTP service modules (e.g. `RegisterLoginHTTPServer`, `RegisterRegisterHTTPServer`) so that routes are matched to your handlers. See [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem) for other service and plugin docs.