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

## 代码里的真实配置骨架

`lynx.http` 的 protobuf 配置实际比上面的最小示例宽得多。除了顶层传输字段，插件还会读取这些嵌套配置段：

- `monitoring`
- `security`
- `performance`
- `middleware`
- `graceful_shutdown`
- `circuit_breaker`

更接近实现的配置骨架大致是：

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

所以如果之前把这页理解成“HTTP 只有 `network`、`addr`、`timeout`、`tls_enable` 这几个字段”，那和真实插件配置模型相比还是太浅了。

## 官方模板实际怎么配

`lynx-layout/configs/bootstrap.local.yaml` 当前对 HTTP 的配置是：

```yaml
lynx:
  http:
    network: tcp
    addr: 127.0.0.1:8000
    timeout: 5s
```

这就是新项目今天真正起步时会看到的具体形状。所以如果你在对照模板读这页，不是模板用了别的插件，而是模板在用同一个 `lynx.http` 插件，只是本地开发配置更窄一些。

## 模板与插件实现如何对应

这里最容易产生误解的地方是：

- 官方模板默认只写了 `network`、`addr`、`timeout`
- 但插件实现本身还支持 TLS、监控、安全、性能、中间件、优雅停机、熔断等配置

对照 `lynx-layout` 和插件代码时，可以先按这张表理解：

| 配置域 | 模板默认情况 | 插件实现情况 |
| --- | --- | --- |
| 监听地址 | `network`、`addr` | 同名字段 |
| 请求超时 | `timeout` | 同名字段 |
| TLS | 本地模板未展开 | `tls_enable`、`tls_auth_type` |
| 监控 | 本地模板未展开 | `monitoring.*` |
| 安全 | 本地模板未展开 | `security.*`，含 `rate_limit` |
| 性能 | 本地模板未展开 | `performance.*` |
| 中间件开关 | 本地模板未展开 | `middleware.*` |
| 优雅停机 | 本地模板未展开 | `graceful_shutdown.*` |
| 熔断 | 本地模板未展开 | `circuit_breaker.*` |

所以更准确的理解不是“文档和模板在说两个 HTTP 插件”，而是“模板只给出最小传输层配置，插件实现暴露的是更完整的运行时配置面”。

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

`lynx-layout/internal/server/http.go` 里实际也是这样通过 `lynx-http.GetHttpServer()` 拿 server 的。

## 接入说明

- 插件通过包级 `init()` 完成注册，因此导入 `github.com/go-lynx/lynx-http` 才会被发现。
- 如果同时使用 Swagger，且未显式设置 `api_server`，Swagger 插件会读取 HTTP 地址。
- 如果 TLS 由框架统一管理，应配合 [TLS Manager](/docs/existing-plugin/tls-manager) 理解，而不是在业务里重复拼证书逻辑。

## 相关页面

- [gRPC](/docs/existing-plugin/grpc)
- [TLS Manager](/docs/existing-plugin/tls-manager)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
