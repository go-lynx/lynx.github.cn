---
id: redis-lock
title: Redis Lock Plugin
---

# Redis Lock Plugin

`lynx-redis-lock` is a Redis-backed locking library that sits on top of the runtime client from `lynx-redis`. It is not an independently configured runtime plugin, and this repo does not ship a separate `conf/example_config.yml` for it.

## Boundary And Ownership

| Concern | Owner |
| --- | --- |
| Redis addresses, auth, DB selection, TLS, Sentinel / Cluster topology | `lynx.redis` in the upstream Redis plugin |
| Redis client lifecycle and shared-resource registration | `lynx-redis` runtime plugin |
| Lock TTL, retry policy, renewal, fencing-token behavior | Application code via `LockOptions` / retry structs |
| Runtime plugin name / config prefix for Redis Lock itself | None |

## What This Means In Practice

- Do **not** add a `lynx.redis-lock` or `lynx.redis.lock` YAML block. The current repository does not load one.
- Redis Lock reuses the upstream client exposed by `lynx-redis`; it should not create a second Redis pool beside the runtime-managed client.
- Any YAML you write for lock-backed services still belongs to [Redis](/docs/existing-plugin/redis). That is where connection endpoints, passwords, topology mode, and transport settings are owned.
- Lock acquisition behavior is configured in code, not in `example_config.yml`. That includes lease duration, retry/backoff, renewal, and callback-style business execution.

## Dependency Notes

- The lock library depends on `github.com/go-lynx/lynx-redis`.
- Standalone Redis, Redis Cluster, and Redis Sentinel are all supported only through whatever `lynx.redis` has already configured correctly.
- If older snippets show a lock-specific YAML subtree, treat those snippets as historical examples rather than the current source of truth for this repo.

## Public Surface

Common APIs include `Lock`, `LockWithToken`, `LockWithRetry`, `LockWithOptions`, `NewLock`, `UnlockByValue`, `GetStats()`, and `Shutdown()`.

## Complete YAML Example

Redis Lock has no standalone `conf/example_config.yml`. A "complete" setup still means configuring the upstream Redis runtime client that the lock library reuses.

```yaml
# Redis Lock has no standalone YAML prefix.
# Configure the upstream Redis runtime client that lynx-redis-lock reuses.
lynx:
  redis:
    addrs:
      - "localhost:6379" # Shared Redis endpoint for all Redis consumers, including locks.
    password: "" # Shared Redis AUTH password, if the server requires one.
    db: 0 # Shared logical Redis database.
    min_idle_conns: 5 # Shared idle-connection floor for lock traffic and any other Redis consumers.
    max_active_conns: 20 # Shared active-connection cap for the runtime-owned client.
    max_retries: 3 # Shared Redis command retry count.
```

## Minimum Viable YAML Example

There is still no `lynx.redis-lock` subtree. The minimum runtime YAML only creates the upstream Redis client; lock-specific values such as `key` and `ttl` stay in code.

```yaml
# No lynx.redis-lock YAML prefix exists.
# Minimum viable runtime YAML only creates the upstream Redis client:
lynx:
  redis:
    addrs:
      - "localhost:6379"

# Lock parameters are passed from code, not from YAML:
# key: "jobs:reconcile"
# ttl: "30s"
# retry_interval: "250ms"
# max_retries: 5
```

## Related Pages

- [Redis](/docs/existing-plugin/redis)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
