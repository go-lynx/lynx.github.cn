---
id: sentinel
title: Sentinel 插件
slug: existing-plugin/sentinel
---

# Sentinel 插件

Sentinel 插件为 Lynx 提供**流量控制**、**熔断降级**与**系统保护**能力，避免服务过载与故障扩散。

## 功能

- **流控**：按 QPS、并发等限流。
- **熔断**：异常时自动熔断并恢复。
- **系统保护**：基于系统负载、CPU 等的系统级规则。
- **监控**：实时指标。
- **控制台**：可选 Web 控制台管理规则与查看监控。

## 配置

在 `lynx.sentinel` 下配置：

```yaml
lynx:
  sentinel:
    enabled: true
    app_name: "my-app"
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

## 使用

插件加载后，Sentinel 会对配置的资源应用流控与熔断规则。通过插件提供的 API 或中间件标记资源，并与 HTTP/gRPC 处理链集成。

## 安装

```bash
go get github.com/go-lynx/lynx-sentinel
```

具体模块路径以该插件仓库为准。
