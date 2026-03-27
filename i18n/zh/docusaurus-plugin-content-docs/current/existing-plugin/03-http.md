---
id: http
title: HTTP 服务
---

# HTTP 服务

HTTP 插件是 Lynx 持有的 runtime 级 HTTP 服务端，不是一个单纯帮你注册路由的轻量 helper。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-http` |
| 配置前缀 | `lynx.http` |
| Runtime 插件名 | `http.server` |
| 公开 Getter | `http.GetHttpServer()` |

## 实现里真正提供了什么

插件会构建并持有一个 Kratos HTTP Server，同时把一整套运维行为包进来：

- 配置加载与校验
- 网络类型和监听地址初始化
- 可选 TLS 集成
- 指标采集
- 限流与并发控制
- 熔断支持
- 优雅停机

业务应用仍然负责注册路由和 handler，但服务端生命周期归 Lynx runtime 管。

## 最小配置

```yaml
lynx:
  http:
    network: tcp
    addr: ":8080"
    timeout: 10s
    tls_enable: false
```

代码里会对缺省字段补默认值，但 `lynx.http` 依然是服务端行为的唯一配置入口。

## 如何使用

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

重点是获取 runtime 已经持有的 server，而不是在 Lynx 旁边再起一个新的 HTTP server。

## 接入说明

- 插件通过包级 `init()` 完成注册，因此导入 `github.com/go-lynx/lynx-http` 才会被发现。
- 如果同时使用 Swagger，且未显式设置 `api_server`，Swagger 插件会读取 HTTP 地址。
- 如果 TLS 由框架统一管理，应配合 [TLS Manager](/docs/existing-plugin/tls-manager) 理解，而不是在业务里重复拼证书逻辑。

## 相关页面

- [gRPC](/docs/existing-plugin/grpc)
- [TLS Manager](/docs/existing-plugin/tls-manager)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
