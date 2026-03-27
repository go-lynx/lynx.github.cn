---
id: sentinel
title: Sentinel Plugin
---

# Sentinel Plugin

`lynx-sentinel` brings flow control, circuit breaking, system protection, and built-in metrics into Lynx. The implementation is much richer than the old introductory doc: besides loading static rules, it exposes convenience APIs for guarded execution, dynamic rule updates, middleware/interceptor creation, and dashboard access.

## Runtime facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-sentinel` |
| Config prefix | `lynx.sentinel` |
| Runtime plugin name | `sentinel.flow_control` |
| Main getters | `GetSentinel()`, `GetMetrics()`, `GetDashboardURL()` |

## What the implementation actually provides

- loads flow rules, circuit breaker rules, system rules, metrics, and dashboard configuration from `lynx.sentinel`
- exposes convenience APIs such as `Entry`, `EntryWithContext`, `Execute`, `ExecuteWithContext`, and `CheckFlow`
- supports runtime rule management through `AddFlowRule`, `RemoveFlowRule`, `AddCircuitBreakerRule`, `RemoveCircuitBreakerRule`, and `ReloadRules`
- exposes monitoring helpers including `GetMetrics`, `GetResourceStats`, `GetAllResourceStats`, and `GetCircuitBreakerState`
- can create framework-facing guards through `CreateHTTPMiddleware()` and `CreateGRPCInterceptor()`

## Configuration

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

## What The Official Template Uses

The official template does not enable Sentinel by default.

That matches the role of the plugin:

- Sentinel is a runtime protection layer, not a minimum boot dependency
- you normally add it after HTTP or gRPC resources and route names are stable
- this page therefore needs to be read as "how to add guarded traffic control to a running service", not "what every new Lynx project starts with"

## Usage

```go
import sentinel "github.com/go-lynx/lynx-sentinel"

func guarded() error {
    return sentinel.Execute("create-user", func() error {
        return doBusiness()
    })
}
```

HTTP middleware and gRPC interceptor are also first-class APIs:

```go
middleware, err := sentinel.CreateHTTPMiddleware(func(req interface{}) string {
    return req.(*http.Request).URL.Path
})

interceptor, err := sentinel.CreateGRPCInterceptor()
```

## Practical guidance

- define stable resource names first, otherwise rule tuning becomes noise
- use dynamic rule APIs only if your team has clear ownership over protection policy changes
- if you enable the dashboard, treat it as an operational endpoint rather than a public feature

## Related pages

- Repo: [go-lynx/lynx-sentinel](https://github.com/go-lynx/lynx-sentinel)
- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
