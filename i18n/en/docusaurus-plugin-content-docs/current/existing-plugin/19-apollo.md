---
id: apollo
title: Apollo Plugin
slug: existing-plugin/apollo
---

# Apollo Plugin

The Go-Lynx Apollo plugin integrates Apollo configuration center with dynamic config loading, multiple namespaces, local cache, config change watching, health checks, metrics, and circuit breaking.

## Features

- **Config management** — Load and merge config from Apollo
- **Multi-namespace** — Multiple namespaces
- **Config watch** — Real-time config change notifications
- **Local cache** — Optional cache to reduce network calls
- **Health & metrics** — Health checks and Prometheus metrics
- **Circuit breaker & retry** — Configurable retry and circuit breaker

## Configuration

Add `lynx.apollo` in `config.yaml`:

```yaml
lynx:
  apollo:
    app_id: "your-app-id"
    cluster: "default"
    namespace: "application"
    meta_server: "http://localhost:8080"
    token: "your-apollo-token"
    timeout: "10s"
    enable_notification: true
    notification_timeout: "30s"
    enable_cache: true
    cache_dir: "/tmp/apollo-cache"
    enable_metrics: true
    enable_retry: true
    max_retry_times: 3
    retry_interval: "1s"
    enable_circuit_breaker: true
    circuit_breaker_threshold: 0.5
    enable_graceful_shutdown: true
    shutdown_timeout: "30s"
    service_config:
      namespace: "application"
      additional_namespaces:
        - "shared-config"
        - "feature-flags"
      priority: 0
      merge_strategy: "override"
```

## How to use

### 1. Add dependency

```bash
go get github.com/go-lynx/lynx-apollo
```

### 2. Get Apollo plugin from plugin manager

```go
import (
    "github.com/go-lynx/lynx/app"
    "github.com/go-lynx/lynx/plugin/apollo"
)

plugin := app.Lynx().GetPluginManager().GetPlugin("apollo.config.center")
if plugin != nil {
    apolloPlugin := plugin.(*apollo.PlugApollo)
}
```

### 3. Get config value

```go
value, err := apolloPlugin.GetConfigValue("application", "config.key")
if err != nil {
    log.Errorf("get config failed: %v", err)
}
```

### 4. Watch config changes

```go
watcher, err := apolloPlugin.WatchConfig("application")
if err != nil {
    log.Errorf("watch config failed: %v", err)
    return
}
watcher.SetOnConfigChanged(func(namespace, key, value string) {
    log.Infof("Config changed - Namespace: %s, Key: %s, Value: %s", namespace, key, value)
})
watcher.SetOnError(func(err error) {
    log.Errorf("watch error: %v", err)
})
watcher.Start()
defer watcher.Stop()
```

When `service_config.additional_namespaces` is set, the framework loads and merges those namespaces as multiple config sources.

## See also

- Repo: [go-lynx/lynx-apollo](https://github.com/go-lynx/lynx-apollo)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
