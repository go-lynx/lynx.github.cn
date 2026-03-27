---
id: nacos
title: Nacos Plugin
---

# Nacos Plugin

The Nacos module is implemented as a control-plane plugin that can provide naming, discovery, and config-center behavior inside one runtime.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-nacos` |
| Config prefix | `lynx.nacos` |
| Runtime plugin name | `nacos.control.plane` |
| Public API shape | plugin-manager lookup plus methods such as `GetConfig(...)`, `GetConfigSources()`, `GetNamespace()` |

## What The Implementation Provides

The code supports:

- optional naming client
- optional config client
- service registration and discovery
- config loading from `dataId` and `group`
- config watchers
- retry, metrics, and circuit breaker helpers

That is why Nacos belongs in the control-plane category, not in a narrow "config only" or "registry only" category.

## Configuration

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

## How To Consume It

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("nacos.control.plane")
nacosPlugin := plugin.(*nacos.PlugNacos)

sources, err := nacosPlugin.GetConfigSources()
source, err := nacosPlugin.GetConfig("app.yaml", "DEFAULT_GROUP")
```

The old import examples using `github.com/go-lynx/lynx/plugin/nacos` are outdated for the current repository layout.

## Related Pages

- [Apollo](/docs/existing-plugin/apollo)
- [Etcd](/docs/existing-plugin/etcd)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
