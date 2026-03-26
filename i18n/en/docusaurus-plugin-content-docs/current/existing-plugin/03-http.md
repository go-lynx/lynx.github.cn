---
id: http
title: HTTP Service
---

# HTTP Service

The HTTP plugin brings an HTTP server into the Lynx startup flow. You provide listen configuration, the plugin initializes the server, and your application registers business services onto that server.

Its purpose is not to replace your routing design. Its purpose is to make **listen lifecycle, startup behavior, and configuration-driven initialization** follow one consistent path.

## Basic configuration

```yaml
lynx:
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
```

The common fields are:

- `addr`: listen address
- `timeout`: request timeout
- `tls`: whether TLS is enabled

Once configured, the HTTP plugin is assembled during application startup.

## How to register business handlers

```go
import (
    bh "github.com/go-lynx/lynx/plugin/http"
)

func NewHTTPServer(
    login *service.LoginService,
    register *service.RegisterService,
    account *service.AccountService,
) *http.Server {
    h := bh.GetServer()
    loginV1.RegisterLoginHTTPServer(h, login)
    registerV1.RegisterRegisterHTTPServer(h, register)
    accountV1.RegisterAccountHTTPServer(h, account)
    return h
}
```

The key object here is `bh.GetServer()`. It returns the `*http.Server` already owned by the Lynx runtime, and you only need to register your HTTP services onto it.

## Integration steps

1. add the plugin module `github.com/go-lynx/lynx/plugin/http`
2. add `lynx.http` configuration
3. anonymous-import the plugin in `main`
4. register routes in the server layer through `GetServer()`

## Related pages

- [gRPC](/docs/existing-plugin/grpc)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
