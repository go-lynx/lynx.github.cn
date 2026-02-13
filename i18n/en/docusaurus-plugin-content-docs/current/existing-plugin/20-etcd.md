---
id: etcd
title: Etcd Plugin
slug: existing-plugin/etcd
---

# Etcd Plugin

The Go-Lynx Etcd plugin uses etcd as the configuration center and optional service registry/discovery backend, with config watching, multiple prefixes, local cache, TLS, health checks, and metrics.

## Features

- **Config center** — Implements ControlPlane; etcd as config source
- **Service registry & discovery** — Register and discover services with lease renewal
- **Config watch** — Automatic config updates
- **Multi-source** — Multiple prefixes and local cache
- **Security & reliability** — TLS, retry, circuit breaker, graceful shutdown

## Configuration

Add `lynx.etcd` in `config.yaml`:

```yaml
lynx:
  etcd:
    endpoints:
      - "127.0.0.1:2379"
    timeout: 10s
    dial_timeout: 5s
    namespace: "lynx/config"
    enable_tls: false
    enable_cache: true
    enable_metrics: true
    enable_retry: true
    max_retry_times: 3
    retry_interval: 1s
    enable_graceful_shutdown: true
    shutdown_timeout: 10s
    enable_register: true
    enable_discovery: true
    registry_namespace: "lynx/services"
    ttl: 30s
    service_config:
      prefix: "lynx/config"
      additional_prefixes:
        - "lynx/config/app"
      priority: 0
      merge_strategy: "override"
```

- `enable_register` / `enable_discovery` — When true, provides etcd-based registry and discovery.
- `registry_namespace` — Etcd path prefix for service registration.
- `service_config` — Config center prefixes and merge strategy.

## How to use

### 1. Add dependency

```bash
go get github.com/go-lynx/lynx-etcd
```

### 2. Register plugin

Import the plugin at startup; Lynx loads it as the config center (and optionally registry/discovery):

```go
import _ "github.com/go-lynx/lynx-etcd"
```

Config loading, registration, and discovery are handled by the framework; use Lynx’s discovery API to obtain downstream instances.

### 3. Registry & discovery

When `enable_register` and `enable_discovery` are true:

- **Register** — Services register to etcd at startup with lease renewal.
- **Discovery** — Use the framework’s discovery API; etcd Watch provides live updates.
- **Cleanup** — Instances are removed on process exit or lease expiry.

## See also

- Repo: [go-lynx/lynx-etcd](https://github.com/go-lynx/lynx-etcd)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
