---
id: sentinel
title: Sentinel 插件
---

# Sentinel 插件

`lynx-sentinel` 把流量控制、熔断降级、系统保护和内建监控接入 Lynx。当前实现比旧文档里那种“只会加载几条规则”的描述丰富得多，除了静态配置外，还暴露了受保护执行、动态规则更新、HTTP / gRPC 中间件封装，以及 dashboard 访问能力。

## 运行时事实

| 项目 | 值 |
| --- | --- |
| Go 模块 | `github.com/go-lynx/lynx-sentinel` |
| 配置前缀 | `lynx.sentinel` |
| runtime 插件名 | `sentinel.flow_control` |
| 主要 Getter | `GetSentinel()`、`GetMetrics()`、`GetDashboardURL()` |

## 实现里实际提供了什么

- 从 `lynx.sentinel` 加载 flow rules、circuit breaker rules、system rules、metrics、dashboard 配置
- 提供 `Entry`、`EntryWithContext`、`Execute`、`ExecuteWithContext`、`CheckFlow` 等便捷 API
- 支持运行时动态规则管理，包括 `AddFlowRule`、`RemoveFlowRule`、`AddCircuitBreakerRule`、`RemoveCircuitBreakerRule`、`ReloadRules`
- 暴露 `GetMetrics`、`GetResourceStats`、`GetAllResourceStats`、`GetCircuitBreakerState` 等监控能力
- 可以直接生成 `CreateHTTPMiddleware()` 和 `CreateGRPCInterceptor()` 供接入层使用

## 配置示例

```yaml
lynx:
  sentinel:
    enabled: true
    app_name: "user-service"
    log_level: "info"
    log_dir: "./logs/sentinel"
    flow_rules:
      - resource: "/api/users"
        threshold: 100
        token_calculate_strategy: "direct"
        control_behavior: "reject"
        enabled: true
    circuit_breaker_rules:
      - resource: "/api/orders"
        strategy: "error_ratio"
        threshold: 0.5
        min_request_amount: 10
        retry_timeout_ms: 5000
        enabled: true
    system_rules:
      - metric_type: "load"
        threshold: 2.0
        strategy: "bbr"
        enabled: true
    metrics:
      enabled: true
      interval: "1s"
    dashboard:
      enabled: true
      port: 8719
```

## 官方模板实际怎么用

官方模板默认并不会启用 Sentinel。

这与插件角色本身是一致的：

- Sentinel 是运行时保护层，不是最小启动依赖
- 通常要等 HTTP 或 gRPC 的资源名、路由面稳定以后再接
- 所以这页更应该被理解成“如何给一个已经跑起来的服务补流控和保护”，而不是“每个新项目默认就会带什么”

## 使用方式

```go
import sentinel "github.com/go-lynx/lynx-sentinel"

func guarded() error {
    return sentinel.Execute("create-user", func() error {
        return doBusiness()
    })
}
```

HTTP 中间件和 gRPC interceptor 也是直接可用的公开能力：

```go
middleware, err := sentinel.CreateHTTPMiddleware(func(req interface{}) string {
    return req.(*http.Request).URL.Path
})

interceptor, err := sentinel.CreateGRPCInterceptor()
```

## 实践建议

- 先把 resource 命名边界定清楚，再去调阈值，否则规则只会越来越乱
- 动态规则 API 适合有明确策略治理责任人的团队，不适合谁都能改
- 如果开启 dashboard，要把它当成运维面板，而不是对外功能页面

## 相关页面

- 仓库: [go-lynx/lynx-sentinel](https://github.com/go-lynx/lynx-sentinel)
- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
