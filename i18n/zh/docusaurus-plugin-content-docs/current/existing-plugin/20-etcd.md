---
id: etcd
title: Etcd 插件
---

# Etcd 插件

Etcd 模块既是配置中心插件，也是注册与发现后端。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-etcd` |
| 配置前缀 | `lynx.etcd` |
| Runtime 插件名 | `etcd.config.center` |
| 公开 API | `GetClient()`、`GetEtcdConfig()`、`GetNamespace()`、`GetConfigSources()`、`GetConfigValue(prefix, key)` |

## 实现提供的能力

代码里支持：

- 从 Etcd 前缀加载配置
- 多个配置前缀及 merge strategy
- 可选本地缓存
- retry、优雅停机、指标、健康检查
- 可选服务注册
- 可选服务发现与 watcher

因此它绝不只是“从 Etcd 读几个 key”。

## 配置

```yaml
lynx:
  etcd:
    endpoints:
      - "127.0.0.1:2379"
    namespace: "lynx/config"
    enable_register: true
    enable_discovery: true
    registry_namespace: "lynx/services"
    ttl: 30s
    service_config:
      prefix: "lynx/config"
      additional_prefixes:
        - "lynx/config/shared"
      merge_strategy: "override"
```

## 官方模板实际怎么用

官方模板默认并不会启用 Etcd。当前脚手架拿 Polaris 作为控制面的示例。

这一点很重要，因为 Etcd 在 Lynx 里有两层角色：

- 配置中心 / 服务注册发现基础设施
- 更高层能力的运行时依赖，比如 [Etcd Lock](/docs/existing-plugin/etcd-lock)

所以这页应该被理解成“当你的环境需要 Etcd 时，如何把它接进 runtime”，而不是模板默认已经接好的能力。

## 如何使用

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("etcd.config.center")
etcdPlugin := plugin.(*etcd.PlugEtcd)

client := etcdPlugin.GetClient()
sources, err := etcdPlugin.GetConfigSources()
value, err := etcdPlugin.GetConfigValue("lynx/config", "my.key")
```

如果需要服务注册和发现，这个模块还提供了 `NewEtcdRegistrar`、`NewEtcdDiscovery` 之类的实现。

## 实际注意点

- `namespace` 和 `service_config.prefix` 影响配置读取边界，`registry_namespace` 影响服务实例注册路径。
- 开启 register 或 discovery 后，它就不再只是配置中心，而是控制面基础设施的一部分。
- [Etcd Lock](/docs/existing-plugin/etcd-lock) 依赖这个插件暴露出来的 runtime 资源。

## 相关页面

- [Apollo](/docs/existing-plugin/apollo)
- [Etcd Lock](/docs/existing-plugin/etcd-lock)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
