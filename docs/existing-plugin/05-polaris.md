---
id: polaris
title: Polaris Service Governance
---

# Polaris Service Governance

The Polaris module is a control-plane plugin that combines service registration, discovery, config access, watch capabilities, and governance features inside one Lynx runtime.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-polaris` |
| Config prefix | `lynx.polaris` |
| Runtime plugin name | `polaris.control.plane` |
| Public APIs | `GetPolarisPlugin()`, `GetPolaris()`, `GetServiceInstances()`, `GetConfig(...)`, `WatchService(...)`, `WatchConfig(...)`, `CheckRateLimit(...)`, `GetMetrics()` |

## What The Implementation Provides

From the code, Polaris supports:

- service registration and discovery
- config loading and config-source integration
- service watchers and config watchers
- rate-limit checks
- load-balancing and routing related helpers
- retry, circuit breaker, metrics, and health checking

This is broader than a simple registry adapter.

## Configuration

```yaml
lynx:
  polaris:
    namespace: svc-namespace
    token: token
    weight: 100
    ttl: 5
    timeout: 5s
    enable_service_watch: true
    enable_config_watch: true
    enable_rate_limit: true
```

The plugin also expects the official Polaris SDK-side configuration file, usually referenced by `config_path`, for connector-level settings.

## What The Official Template Uses

The official template does not enable Polaris in `bootstrap.local.yaml`. It keeps local startup smaller there and moves Polaris into `configs/bootstrap.yaml`:

```yaml
lynx:
  application:
    name: user-service
    version: v1.0.0

  polaris:
    config_path: "configs/polaris.yaml"
    namespace: demo
    token: "..."
    weight: 100
    ttl: 10
    timeout: 5s
```

This is why Polaris often feels "different" from HTTP or Redis in the template. It is a control-plane plugin, so the official scaffold treats it as a governance-oriented layer rather than the smallest local runtime needed to boot the service.

## How To Consume It

```go
plugin, err := polaris.GetPolarisPlugin()
instances, err := polaris.GetServiceInstances("user-service")
content, err := polaris.GetConfig("application.yaml", "DEFAULT_GROUP")
allowed, err := polaris.CheckRateLimit("user-service", labels)
```

## Related Pages

- [Nacos](/docs/existing-plugin/nacos)
- [Etcd](/docs/existing-plugin/etcd)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
