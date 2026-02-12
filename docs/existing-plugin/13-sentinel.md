---
id: sentinel
title: Sentinel Plugin
---

# Sentinel Plugin

The Sentinel plugin provides **traffic control**, **circuit breaking**, and **system protection** for the Lynx framework, so you can protect services from overload and failures.

## Features

- **Flow control**: QPS and concurrency limiting.
- **Circuit breaking**: Open circuit on errors and recover automatically.
- **System protection**: Load and CPU-based system rules.
- **Monitoring**: Real-time metrics.
- **Dashboard**: Web console for rules and monitoring (optional).

## Configuration

Configure under `lynx.sentinel`:

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

## Usage

After the plugin is loaded, Sentinel will apply flow and circuit breaker rules to the configured resources. Use the plugin’s API or middleware to mark resources and integrate with HTTP/gRPC handlers.

## Installation

```bash
go get github.com/go-lynx/lynx-sentinel
```

Use the exact module path from the plugin’s repository.
