---
id: etcd
title: Etcd Plugin
slug: existing-plugin/etcd
---

# Etcd Plugin

Go-Lynx 的 Etcd 插件将 etcd 作为配置中心与服务注册发现后端，支持配置监听、多前缀、本地缓存、TLS、健康检查与指标。

## 功能概览

- **配置中心**：实现 ControlPlane 接口，作为 Lynx 配置源
- **服务注册与发现**：基于 etcd 的注册与发现、租约续期
- **配置监听**：配置变更自动更新
- **多配置源**：多 prefix、本地缓存
- **安全与可靠性**：TLS、重试、熔断、优雅关闭

## 配置说明

在 `config.yaml` 中增加 `lynx.etcd`：

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

- `enable_register` / `enable_discovery`：开启时提供基于 etcd 的注册与发现。
- `registry_namespace`：服务注册的 etcd 路径前缀。
- `service_config`：配置中心多前缀与合并策略。

## 如何使用

### 1. 引入依赖

```bash
go get github.com/go-lynx/lynx-etcd
```

### 2. 注册插件

在应用启动时导入插件，Lynx 会将其作为配置中心（及可选的服务注册发现）加载：

```go
import _ "github.com/go-lynx/lynx-etcd"
```

配置加载、服务注册与发现由框架按配置自动完成；业务代码通过 Lynx 的服务发现接口获取下游实例，无需直接操作 etcd 客户端。

### 3. 服务注册与发现

当 `enable_register` 和 `enable_discovery` 为 `true` 时：

- **注册**：服务启动后自动注册到 etcd，并维持租约续期。
- **发现**：通过框架的服务发现接口查询实例列表，etcd 通过 Watch 提供实时更新。
- **下线**：进程退出或租约过期后自动从 etcd 移除。

具体调用方式以 Lynx 当前版本的服务发现 API 为准（如 gRPC/HTTP 的 Resolver、或统一的 Discovery 接口）。

## 相关链接

- 仓库：[go-lynx/lynx-etcd](https://github.com/go-lynx/lynx-etcd)
- [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
