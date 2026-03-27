---
id: etcd
title: Etcd Plugin
---

# Etcd Plugin

The Etcd module is both a config-center plugin and a service registry or discovery backend.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-etcd` |
| Config prefix | `lynx.etcd` |
| Runtime plugin name | `etcd.config.center` |
| Public APIs | `GetClient()`, `GetEtcdConfig()`, `GetNamespace()`, `GetConfigSources()`, `GetConfigValue(prefix, key)` |

## What The Implementation Provides

The code supports:

- config loading from an Etcd prefix
- multiple config prefixes with merge strategy
- optional local cache
- retry, graceful shutdown, metrics, and health checks
- optional service registration
- optional service discovery and watchers

So this plugin is broader than "read a few keys from Etcd".

## Configuration

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

## How To Consume It

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("etcd.config.center")
etcdPlugin := plugin.(*etcd.PlugEtcd)

client := etcdPlugin.GetClient()
sources, err := etcdPlugin.GetConfigSources()
value, err := etcdPlugin.GetConfigValue("lynx/config", "my.key")
```

For service registration and discovery, the module also exposes registrar and discovery implementations such as `NewEtcdRegistrar` and `NewEtcdDiscovery`.

## Practical Notes

- `namespace` and `service_config.prefix` affect configuration lookup, while `registry_namespace` affects service instance paths.
- Enabling register or discovery changes this plugin from pure config-center usage into control-plane infrastructure.
- [Etcd Lock](/docs/existing-plugin/etcd-lock) depends on this plugin's runtime resource.

## Related Pages

- [Apollo](/docs/existing-plugin/apollo)
- [Etcd Lock](/docs/existing-plugin/etcd-lock)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
