---
id: polaris
title: Polaris 服务治理
---

# Polaris 服务治理

Polaris 模块在 Lynx 里是一个 control-plane 插件，把服务注册、服务发现、配置访问、watch 能力和治理能力集中到同一个 runtime 里。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-polaris` |
| 配置前缀 | `lynx.polaris` |
| Runtime 插件名 | `polaris.control.plane` |
| 公开 API | `GetPolarisPlugin()`、`GetPolaris()`、`GetServiceInstances()`、`GetConfig(...)`、`WatchService(...)`、`WatchConfig(...)`、`CheckRateLimit(...)`、`GetMetrics()` |

## 实现提供了什么

从代码看，Polaris 支持：

- 服务注册与发现
- 配置加载与 config source 集成
- 服务 watcher 和配置 watcher
- 限流检查
- 负载均衡和路由相关辅助能力
- retry、circuit breaker、metrics、health check

它远不只是一个简单的注册中心适配器。

## 配置

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

除此之外，插件通常还需要官方 Polaris SDK 侧配置文件，一般通过 `config_path` 指定连接器级别行为。

## 如何使用

```go
plugin, err := polaris.GetPolarisPlugin()
instances, err := polaris.GetServiceInstances("user-service")
content, err := polaris.GetConfig("application.yaml", "DEFAULT_GROUP")
allowed, err := polaris.CheckRateLimit("user-service", labels)
```

## 相关页面

- [Nacos](/docs/existing-plugin/nacos)
- [Etcd](/docs/existing-plugin/etcd)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
