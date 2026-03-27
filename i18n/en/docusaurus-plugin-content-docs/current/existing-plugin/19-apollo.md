---
id: apollo
title: Apollo Plugin
---

# Apollo Plugin

Apollo is implemented as a configuration-center plugin, not just a one-off HTTP client wrapper.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-apollo` |
| Config prefix | `lynx.apollo` |
| Runtime plugin name | `apollo.config.center` |
| Public APIs | `GetConfigSources()`, `GetConfigValue(namespace, key)`, `GetApolloConfig()`, `GetNamespace()`, `GetMetrics()` |

## What The Code Supports

The plugin loads Apollo config into the Lynx runtime and includes:

- primary namespace plus additional namespaces
- merge strategy and priority
- optional local cache
- config notifications
- retry and circuit-breaker logic
- health checks and metrics
- watcher helpers for config changes

This is why the important integration question is usually "how does Apollo feed runtime config" rather than "how do I call Apollo by hand".

## Configuration

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

## What The Official Template Uses

The official template does not enable Apollo by default. The current scaffold uses Polaris as its control-plane example instead.

That distinction matters:

- Apollo is a valid config-center plugin in the Lynx ecosystem
- but `lynx-layout` currently demonstrates governance startup with `lynx.polaris`, not `lynx.apollo`
- this page should therefore be read as "how to swap in or add Apollo-backed config loading", not "what the official template already configured"

## How To Consume It

Typical runtime lookup:

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("apollo.config.center")
apolloPlugin := plugin.(*apollo.PlugApollo)

value, err := apolloPlugin.GetConfigValue("application", "feature.flag")
sources, err := apolloPlugin.GetConfigSources()
```

## Practical Notes

- Use `GetConfigSources()` when Apollo should feed the application's config loading pipeline.
- Use `GetConfigValue()` for targeted reads, not as a replacement for a coherent config model.
- Namespace design is a real architecture decision because merge priority affects runtime behavior.

## Related Pages

- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
- [Etcd](/docs/existing-plugin/etcd)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
