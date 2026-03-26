---
id: apollo
title: Apollo Plugin
---

# Apollo Plugin

The Apollo plugin brings Apollo configuration-center capability into Lynx. It fits systems that want configuration loading, namespace merging, and config-change watching to live inside one startup and runtime model.

## What it is mainly for

- loading application configuration from Apollo
- supporting multi-namespace merge behavior
- watching configuration changes and exposing them to the runtime

## Basic configuration

```yaml
lynx:
  apollo:
    app_id: "your-app-id"
    cluster: "default"
    namespace: "application"
    meta_server: "http://localhost:8080"
    token: "your-apollo-token"
    enable_cache: true
    service_config:
      namespace: "application"
      additional_namespaces:
        - "shared-config"
        - "feature-flags"
      merge_strategy: "override"
```

## Usage

Apollo more often participates as a configuration source during startup than as a client your business code constantly manipulates directly.

That means the critical questions are:

- is the config-center entry correct
- is the namespace merge strategy sane
- which capabilities are actually safe to update dynamically

If business code truly needs direct config reads, use the plugin API exposed for that purpose.

## Practical guidance

- separate startup-critical config from large mutable business config
- keep clear boundaries between shared namespaces and service-private namespaces
- be cautious with hot updates; not every capability should change dynamically

## Related pages

- Repo: [go-lynx/lynx-apollo](https://github.com/go-lynx/lynx-apollo)
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
