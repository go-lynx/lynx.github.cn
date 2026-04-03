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

## Related Pages

- [Redis](/docs/existing-plugin/redis)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
