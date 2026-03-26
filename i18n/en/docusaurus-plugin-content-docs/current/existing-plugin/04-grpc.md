---
id: grpc
title: gRPC Service
---

# gRPC Service

The gRPC plugin brings a gRPC server into the Lynx runtime. Like the HTTP plugin, you do not have to hand-build the server initialization path. You provide listen configuration and register your business services onto the managed server.

Older versions of the docs described this as a "gRPC client", which is misleading. This page is about **gRPC server integration**.

## Basic configuration

```yaml
lynx:
  grpc:
    addr: 0.0.0.0:9000
    timeout: 5s
    tls: true
```

Where:

- `addr`: gRPC listen address
- `timeout`: request timeout
- `tls`: whether certificate-related settings are enabled

Once configured, the plugin initializes the gRPC server during application startup.

## Service registration example

```go
import (
    bg "github.com/go-lynx/lynx/plugin/grpc"
)

func NewGRPCServer(
    login *service.LoginService,
    register *service.RegisterService,
    account *service.AccountService,
) *grpc.Server {
    g := bg.GetServer()
    loginV1.RegisterLoginServer(g, login)
    registerV1.RegisterRegisterServer(g, register)
    accountV1.RegisterAccountServer(g, account)
    return g
}
```

`bg.GetServer()` returns the `*grpc.Server` already owned by the Lynx lifecycle. You only need to attach the generated protobuf service registrations.

## Integration steps

1. add the plugin module `github.com/go-lynx/lynx/plugin/grpc`
2. add `lynx.grpc` configuration
3. anonymous-import the plugin in `main`
4. register gRPC services in the server layer through `GetServer()`

## Related pages

- [HTTP](/docs/existing-plugin/http)
- [TLS Manager](/docs/existing-plugin/tls-manager)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
