---
id: sentinel
title: Sentinel Plugin
---

# Sentinel Plugin

The Sentinel plugin brings flow control, circuit breaking, and system protection into Lynx. It fits services that already have clear resource boundaries and want protection rules to live inside one runtime configuration path.

## What it is mainly for

- rate limiting
- circuit breaking and degradation
- system-load protection
- unified rule and metrics integration

## Basic configuration

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
        enabled: true
    circuit_breaker_rules:
      - resource: "/api/orders"
        strategy: "error_ratio"
        threshold: 0.5
        enabled: true
```

## How to read these rules

- `resource` is the business boundary you actually want to protect
- `flow_rules` are for rate limiting
- `circuit_breaker_rules` are for degradation based on error ratio, slow calls, and similar signals

If resource boundaries are poorly defined, even complex rules will not protect the system effectively.

## Practical guidance

- define resource boundaries before tuning thresholds
- do not treat Sentinel as a patch for poor capacity design; it protects, but it does not replace architecture work
- rule changes should be coordinated with business owners, or you may end up with correct protection logic but confusing product behavior

## Related pages

- Repo: [go-lynx/lynx-sentinel](https://github.com/go-lynx/lynx-sentinel)
- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
