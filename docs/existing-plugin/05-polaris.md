---
id: polaris
title: Polaris Service Governance
---

# Polaris Service Governance

The Polaris plugin brings service registration, discovery, and governance into Lynx. It is usually not just one isolated config block. It enters the runtime together with service startup, instance registration, traffic governance, and control-plane-facing behavior.

If your service platform already relies on Polaris for registry or governance, this plugin is the standard Lynx integration path into that control plane.

## What it is mainly for

- service instance registration and discovery
- governance features such as routing, rate limiting, and circuit breaking
- connecting service metadata to the runtime startup flow

## Basic configuration

```yaml
lynx:
  polaris:
    namespace: svc-namespace
    token: token
    weight: 100
    ttl: 5
    timeout: 5s
```

Besides `lynx.polaris`, you usually also need the official Polaris configuration file such as `polaris.yaml`, which describes server addresses and SDK-side behavior.

## Relationship with official Polaris config

Lynx config explains how the application plugs Polaris into the runtime. `polaris.yaml` handles official SDK connectivity and behavior details.

For example:

```yaml
global:
  serverConnector:
    protocol: grpc
    addresses:
      - 127.0.0.1:8091
config:
  configConnector:
    addresses:
      - 127.0.0.1:8093
```

For the full field set and deployment model, follow the Polaris documentation:

- [Polaris official docs](https://polarismesh.cn/docs)

## Typical scenarios

- your service needs to register into Polaris
- downstream addressing depends on Polaris discovery
- you want routing, canary, rate limiting, or circuit breaking to stay in one framework path

## Related pages

- [Nacos](/docs/existing-plugin/nacos)
- [Etcd](/docs/existing-plugin/etcd)
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
