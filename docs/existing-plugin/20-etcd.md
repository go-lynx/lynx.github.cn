---
id: etcd
title: Etcd Plugin
---

# Etcd Plugin

The Etcd plugin can use Etcd as a Lynx configuration source, and it can also use Etcd as a registry/discovery backend. It fits systems that want direct control over config prefixes, registration paths, and lease behavior.

## What it is mainly for

- bringing Etcd into the startup path as a configuration center
- providing Etcd-based service registration and discovery
- watching configuration or instance changes through watch semantics

## Basic configuration

```yaml
lynx:
  etcd:
    endpoints:
      - "127.0.0.1:2379"
    timeout: 10s
    dial_timeout: 5s
    namespace: "lynx/config"
    enable_register: true
    enable_discovery: true
    registry_namespace: "lynx/services"
    ttl: 30s
    service_config:
      prefix: "lynx/config"
      additional_prefixes:
        - "lynx/config/app"
      merge_strategy: "override"
```

## How to read this kind of config

- `namespace` / `prefix`: the boundary for configuration lookup
- `registry_namespace`: the path prefix for service instance registration
- `ttl`: lease-related timing for registration
- `additional_prefixes`: merge entry points for multiple config sources

## Typical scenarios

- you want direct control over config hierarchy and registration paths
- you need a more explicit watch and lease model
- your infrastructure stack already uses Etcd broadly

## Practical guidance

- stabilize prefix design early, because migration later is expensive
- registration paths and service naming should be designed together with governance strategy
- if all you need is a mature control plane, direct Etcd integration may not always be the best first choice

## Related pages

- Repo: [go-lynx/lynx-etcd](https://github.com/go-lynx/lynx-etcd)
- [Nacos](/docs/existing-plugin/nacos)
- [Polaris](/docs/existing-plugin/polaris)
