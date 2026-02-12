---
id: http
title: HTTP 服务
slug: existing-plugin/http
---

# HTTP 服务

Go-Lynx 的 HTTP 插件为应用提供 **HTTP 服务端**。在 YAML 中配置监听地址、超时与 TLS 后，框架会在启动时初始化服务端；你只需将 HTTP 处理逻辑（如 Kratos HTTP 服务）注册到该服务端上，即可完成路由与业务的绑定。底层实现基于 Kratos HTTP 模块。

## 服务端配置

在配置文件中增加 `lynx.http` 段，例如：

```yaml
lynx:
  http:
    addr: 0.0.0.0:8000
    timeout: 5s
    tls: true
```

`lynx.http` 为 HTTP 服务端配置（地址、超时、TLS 等）。配置完成后，应用启动时会按插件顺序加载 HTTP 插件。

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

插件加载后，通过 `bh.GetServer()` 获取服务端实例，将你的 HTTP 服务模块（如 `RegisterLoginHTTPServer`、`RegisterRegisterHTTPServer`）注册上去，即可完成路由与处理函数的绑定。其他服务与插件说明见 [插件生态](/zh/docs/existing-plugin/plugin-ecosystem)。