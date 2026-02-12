---
id: grpc
title: Grpc Client
slug: existing-plugin/grpc
---

# Grpc Client

Go-Lynx provides a gRPC protocol client plugin, which allows you to initialize a gRPC client without worrying about writing the client creation code. You just need to provide the corresponding configuration file.

## Client Configuration

To specify the gRPC client in the configuration file, the content should be as follows:

```yaml
lynx:
  grpc:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
```

The `lynx.grpc` section contains the gRPC client configuration. The underlying module used is `kratos.grpc`.

After the configuration is complete, the application will load the gRPC client according to the plugin order when it starts.

```go
import (
  bg "github.com/go-lynx/lynx/plugin/grpc"
)

func NewGRPCServer(
login *service.LoginService,
register *service.RegisterService,
account *service.AccountService) *grpc.Server {
  g := bg.GetServer()
  loginV1.RegisterLoginServer(g, login)
  registerV1.RegisterRegisterServer(g, register)
  accountV1.RegisterAccountServer(g, account)
  return g
}
```

After successfully initializing the gRPC client, you need to manually register the corresponding service modules to the gRPC client to facilitate route matching and call your functions.