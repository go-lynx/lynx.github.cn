---
id: redis
title: Redis Plugin
---

# Redis Plugin

The Redis plugin is the runtime-owned Redis client used by Lynx services and by higher-level packages such as Redis Lock. This page is intentionally scoped to the keys that appear in `lynx-redis/conf/example_config.yml`, because that file is still present in the repo even though parts of it are now legacy.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-redis` |
| Config prefix | `lynx.redis` |
| Runtime plugin name | `redis.client` |
| Stable API across topologies | `GetUniversalRedis()` |
| Standalone-only convenience API | `GetRedis()` |

## What The Example File Actually Represents

- `lynx-redis/conf/example_config.yml` is a legacy single-node sample.
- The current runtime schema is defined by `conf/redis.proto`, which uses `addrs` instead of `addr` and does not include some old toggle keys from the example file.
- Metrics hooks, startup ping, readiness checks, and shared-resource registration are part of the current runtime behavior regardless of the old `enable_metrics` / `enable_health_check` sample keys.

## Example Template Field Guide

| Field | What it controls in the example file | Enable when | Current default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `addr` | Legacy single Redis address. | Only when reading old samples and migrating them. | This key is no longer in `conf/redis.proto`. Current configs must use `addrs: ["host:port"]`. | Copying `addr` into a new config and then wondering why runtime validation says `addrs` is missing. |
| `password` | Redis AUTH password. | When the Redis server requires authentication. | Default empty. In ACL deployments, the current schema may also need `username`, which this old example file cannot express. | Assuming password alone covers ACL setups that also require a username. |
| `db` | Logical Redis database number. | Mainly standalone or sentinel deployments. | Default `0`. Redis Cluster only supports database `0`. | Reusing a standalone example in cluster mode with `db > 0`. |
| `pool_size` | Legacy pool-size key from the old sample. | Only when translating the old sample to the current schema. | This key is not part of the current protobuf schema. The modern equivalent is usually `max_active_conns`, plus optional `max_idle_conns`. | Setting `pool_size` today and expecting the current runtime to resize the pool. |
| `min_idle_conns` | Minimum idle connections to keep in the pool. | When you want some connections ready before traffic spikes. | The current startup path applies its own defaults when omitted; it should be sized with the modern active/idle pool keys, not with legacy `pool_size`. | Setting it higher than the real active pool limit you intended to use after migration. |
| `max_retries` | Redis command retry count. | When you want retry-on-transient-failure behavior. | The current startup path defaults to `3` and also treats `0` as "use the default", not as "disable retries". | Setting `0` and expecting true no-retry behavior. |
| `enable_metrics` | Legacy on/off flag from the old sample. | Only when auditing older configs. | This key is not part of the current protobuf schema. The current plugin always installs its command and pool metrics hooks. | Toggling it and expecting metrics collection to turn off. |
| `enable_health_check` | Legacy on/off flag from the old sample. | Only when auditing older configs. | This key is not part of the current protobuf schema. Startup ping and readiness checks already run in the current implementation. | Toggling it and expecting startup connectivity checks to disappear. |

## How To Migrate The Legacy Sample

For a modern single-node config, translate the old sample to the current schema instead of copying it verbatim:

```yaml
lynx:
  redis:
    addrs:
      - "localhost:6379"
    password: ""
    db: 0
    min_idle_conns: 5
    max_active_conns: 10
    max_retries: 3
```

The current schema also supports `network`, `username`, `client_name`, connection lifecycle fields, TLS, and Sentinel / Cluster topologies through `conf/redis.proto`; those newer fields simply are not represented in the old `example_config.yml`.

## Usage Guidance

- Prefer `GetUniversalRedis()` unless the service is permanently single-node.
- `GetRedis()` only returns a concrete `*redis.Client` in standalone mode.
- Higher-level packages such as [Redis Lock](/docs/existing-plugin/redis-lock) should reuse the runtime-owned client instead of creating a second pool.

## Related Pages

- [Redis Lock](/docs/existing-plugin/redis-lock)
- [Layout](/docs/existing-plugin/layout)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
