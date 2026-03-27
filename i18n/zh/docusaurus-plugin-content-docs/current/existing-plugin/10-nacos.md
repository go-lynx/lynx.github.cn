---
id: nacos
title: Nacos 插件
---

# Nacos 插件

Nacos 模块在当前实现里是一个 control-plane 插件，可以在同一套 runtime 里同时提供 naming、discovery 和 config-center 能力。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-nacos` |
| 配置前缀 | `lynx.nacos` |
| Runtime 插件名 | `nacos.control.plane` |
| 公开 API 形态 | 通过 plugin-manager 获取插件对象，再调用 `GetConfig(...)`、`GetConfigSources()`、`GetNamespace()` 等方法 |

## 实现提供的能力

代码里支持：

- 可选 naming client
- 可选 config client
- 服务注册与发现
- 基于 `dataId` 和 `group` 的配置加载
- 配置 watcher
- retry、metrics、circuit breaker 辅助能力

所以它更适合被归类为 control plane，而不是狭义的“只做配置”或“只做注册中心”。

## 配置

```yaml
lynx:
  nacos:
    server_addresses: "127.0.0.1:8848"
    namespace: "public"
    enable_register: true
    enable_discovery: true
    enable_config: true
    service_config:
      service_name: "my-service"
      group: "DEFAULT_GROUP"
      cluster: "DEFAULT"
```

## 如何使用

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("nacos.control.plane")
nacosPlugin := plugin.(*nacos.PlugNacos)

sources, err := nacosPlugin.GetConfigSources()
source, err := nacosPlugin.GetConfig("app.yaml", "DEFAULT_GROUP")
```

旧文档里使用 `github.com/go-lynx/lynx/plugin/nacos` 的导入方式，已经不符合当前仓库结构。

## 相关页面

- [Apollo](/docs/existing-plugin/apollo)
- [Etcd](/docs/existing-plugin/etcd)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
