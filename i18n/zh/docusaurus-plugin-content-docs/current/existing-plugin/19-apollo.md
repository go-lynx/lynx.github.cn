---
id: apollo
title: Apollo 插件
---

# Apollo 插件

Apollo 在 Lynx 里是一个配置中心插件，而不是简单的 HTTP Client 包装层。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-apollo` |
| 配置前缀 | `lynx.apollo` |
| Runtime 插件名 | `apollo.config.center` |
| 公开 API | `GetConfigSources()`、`GetConfigValue(namespace, key)`、`GetApolloConfig()`、`GetNamespace()`、`GetMetrics()` |

## 代码支持的能力

插件会把 Apollo 配置接入 Lynx runtime，并支持：

- 主命名空间和附加命名空间
- merge strategy 与 priority
- 可选本地缓存
- 配置变更通知
- retry 和 circuit breaker
- 健康检查与指标
- 配置变更 watcher 辅助能力

所以真正重要的问题通常不是“怎么手调 Apollo”，而是“Apollo 怎样进入 runtime 配置模型”。

## 配置

```yaml
lynx:
  apollo:
    app_id: "demo-app"
    cluster: "default"
    namespace: "application"
    meta_server: "http://apollo-config:8080"
    enable_cache: true
    enable_notification: true
    service_config:
      namespace: "application"
      additional_namespaces:
        - "shared"
      merge_strategy: "override"
```

## 如何使用

典型 runtime 访问方式：

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("apollo.config.center")
apolloPlugin := plugin.(*apollo.PlugApollo)

value, err := apolloPlugin.GetConfigValue("application", "feature.flag")
sources, err := apolloPlugin.GetConfigSources()
```

## 实际注意点

- 当 Apollo 需要参与应用配置加载链路时，用 `GetConfigSources()`。
- 当你只想按需读取单个配置项时，用 `GetConfigValue()`。
- 命名空间划分是真正的架构设计问题，因为 merge priority 会直接影响 runtime 行为。

## 相关页面

- [引导配置](/docs/getting-started/bootstrap-config)
- [Etcd](/docs/existing-plugin/etcd)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
