---
id: apollo
title: Apollo Plugin
slug: existing-plugin/apollo
---

# Apollo Plugin

Go-Lynx 的 Apollo 插件用于对接 Apollo 配置中心，支持动态配置拉取、多 Namespace、本地缓存、配置变更监听与健康检查、指标和熔断。

## 功能概览

- **配置管理**：从 Apollo 拉取并合并配置
- **多 Namespace**：支持多个命名空间
- **配置监听**：实时监听配置变更
- **本地缓存**：可选缓存减少网络请求
- **健康与指标**：健康检查与 Prometheus 指标
- **熔断与重试**：可配置重试与熔断

## 配置说明

在 `config.yaml` 中增加 `lynx.apollo`：

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

## 如何使用

### 1. 引入依赖

```bash
go get github.com/go-lynx/lynx-apollo
```

### 2. 从插件管理器获取 Apollo 插件

```go
import (
    "github.com/go-lynx/lynx/app"
    "github.com/go-lynx/lynx/plugin/apollo"
)

plugin := app.Lynx().GetPluginManager().GetPlugin("apollo.config.center")
if plugin != nil {
    apolloPlugin := plugin.(*apollo.PlugApollo)
    // 使用插件
}
```

### 3. 读取配置

```go
value, err := apolloPlugin.GetConfigValue("application", "config.key")
if err != nil {
    log.Errorf("get config failed: %v", err)
}
```

### 4. 监听配置变更

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

当配置了 `service_config.additional_namespaces` 时，框架会按多配置源方式加载并合并这些命名空间。

## 相关链接

- 仓库：[go-lynx/lynx-apollo](https://github.com/go-lynx/lynx-apollo)
- [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
