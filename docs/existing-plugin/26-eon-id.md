---
id: eon-id
title: Eon ID Distributed ID Generator
---

# Eon ID Distributed ID Generator

`lynx-eon-id` generates Snowflake-style 64-bit IDs inside Lynx. Its most important operational choice is whether worker IDs are assigned manually or registered through a shared Redis plugin.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-eon-id` |
| Config prefix | `lynx.eon-id` |
| Runtime plugin name | `eon-id` |
| Public APIs | `GetEonIdPlugin()`, `GetEonIdGenerator()`, `GenerateID()`, `GenerateIDWithMetadata()`, `ParseID()`, `GetGenerator()`, `CheckHealth()` |

If you need direct plugin-manager lookup, the runtime name is `eon-id`:

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("eon-id")
```

## Dependency Model

- `auto_register_worker_id: true` is the switch that makes Redis a runtime dependency.
- In Lynx runtime mode, the plugin first tries the configured shared resource name and then falls back between `redis.client` and the legacy `redis` alias.
- If Redis lookup fails, startup logs a warning and silently disables auto-registration instead of crashing. From that point on, worker-ID uniqueness is your responsibility again.
- If `auto_register_worker_id: false`, there is no Lynx-side Redis dependency, but every running instance must keep a unique manual `worker_id`.

## YAML Template

```yaml
lynx:
  eon-id:
    datacenter_id: 1
    # worker_id: 1
    auto_register_worker_id: true
    redis_key_prefix: "lynx:eon-id:"
    worker_id_ttl: "30s"
    heartbeat_interval: "10s"
    enable_clock_drift_protection: true
    max_clock_drift: "5s"
    clock_check_interval: "1s"
    clock_drift_action: "wait"
    enable_sequence_cache: true
    sequence_cache_size: 1000
    enable_metrics: true
    redis_plugin_name: "redis"
    redis_db: 0
    custom_epoch: 1609459200000
    worker_id_bits: 5
    sequence_bits: 12
```

The sample comments in `example_config.yml` still imply a wider worker-ID range than the current runtime defaults. In today's Lynx runtime, omitting `worker_id_bits` falls back to `5`, so the default effective worker-ID range is `0-31`, not `0-1023`.

## Field Reference

### Identity and Redis-backed worker allocation

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `datacenter_id` | Encodes the datacenter portion of the generated ID. | Always. | The example uses `1`, but in normal runtime scanning an omitted value stays `0`. It must stay within `0-31` because the runtime keeps a fixed `5` datacenter bits. | Reusing the same datacenter ID across multiple real datacenters and assuming worker IDs alone will save uniqueness. |
| `worker_id` | Supplies a manual worker ID or a preferred specific worker ID. | Always present in config; behavior changes with `auto_register_worker_id`. | If auto-registration is off, the generator uses this value directly. If auto-registration is on and `worker_id > 0`, startup first tries to reserve that exact ID, then falls back to automatic assignment if the reservation fails. Omitted means `0`. | Turning off auto-registration on multiple replicas while leaving every instance at the same default worker ID. |
| `auto_register_worker_id` | Chooses between Redis-backed worker allocation and manual worker IDs. | Always. | The example uses `true`, but an omitted bool in the normal runtime path stays `false`. When it is `true`, Redis lookup becomes a runtime dependency; if lookup fails, the plugin logs a warning and flips back to manual mode. | Assuming the sample's `true` value is an implicit default and then discovering auto-registration never activated. |
| `redis_key_prefix` | Names the Redis key namespace used for worker registration. | Only when `auto_register_worker_id: true`. | Empty input is normalized to `lynx:eon-id:` and missing trailing `:` / `_` is auto-fixed. Reusing the same prefix across environments can make unrelated deployments contend for the same worker IDs. | Sharing one prefix across dev, staging, and production. |
| `worker_id_ttl` | Sets the TTL of the Redis worker-registration record. | Only when `auto_register_worker_id: true`. | If omitted, runtime uses `30s`. In practical deployments it should stay greater than `heartbeat_interval`, and the validator helper recommends at least `3x` heartbeat. | Setting it too short and causing frequent worker expiry or leadership churn. |
| `heartbeat_interval` | Sets how often the worker-registration heartbeat refreshes Redis. | Only when `auto_register_worker_id: true`. | If omitted, runtime uses `10s`. It should stay below `worker_id_ttl`; too-small values increase Redis churn. | Setting it equal to or above the TTL and then wondering why worker registration becomes unstable. |
| `redis_plugin_name` | Picks the preferred shared Redis resource name. | Only when `auto_register_worker_id: true`. | This is a Lynx plugin resource name, not a DSN. If empty, runtime prefers `redis` and still tries `redis.client` / legacy fallback paths. | Putting a Redis address such as `127.0.0.1:6379` here instead of a plugin name. |
| `redis_db` | Records the intended Redis DB number. | Parsed always, but current Lynx runtime does not switch DB on the shared client with this field. | Preserved in config and validation helpers, but the runtime path reuses the already-started Redis client as-is. | Expecting this field alone to move worker registration to another logical DB in a shared client. |

### Clock drift and runtime protection

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `enable_clock_drift_protection` | Enables backward-clock protection inside the generator. | Always, on each ID generation path. | The example uses `true`, but an omitted bool in the normal runtime path stays `false`. | Assuming protection is on just because the sample file shows it enabled. |
| `max_clock_drift` | Caps how much backward clock movement is tolerated. | Only when clock-drift protection is enabled. | If omitted, runtime uses `5s`. The generator validator rejects values below `100ms` or above `1h`. | Setting it so low that minor clock corrections start causing unnecessary waits or errors. |
| `clock_check_interval` | Reserved interval field for clock-drift checking. | Parsed, but the current Lynx runtime does not run a separate periodic checker from this field. | Kept in config for schema parity and helper validation, but current generation logic checks drift inline on ID generation. | Expecting a background clock-monitor loop to appear just because this field is set. |
| `clock_drift_action` | Chooses how the generator reacts to backward clock movement. | Only when drift is detected. | Empty input falls back to `wait`. Valid values are `wait`, `error`, and `ignore`. | Choosing `ignore` without accepting the monotonicity and observability tradeoffs. |

### Throughput, metrics, and bit layout

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `enable_sequence_cache` | Enables cached sequence allocation for higher throughput. | Always, inside the generator. | The example uses `true`, but an omitted bool in the normal runtime path stays `false`. It interacts directly with `sequence_cache_size` and `sequence_bits`. | Assuming cache is enabled by default because the sample file turns it on. |
| `sequence_cache_size` | Sets the cache size for sequence allocation. | Only when `enable_sequence_cache: true`. | If `0`, runtime backfills `1000`. It must stay below or equal to `2^sequence_bits`. | Keeping the default `sequence_bits: 12` but setting a cache size above `4096`. |
| `enable_metrics` | Controls whether generator metrics are allocated. | Always. | The example uses `true`, but an omitted bool in the normal runtime path stays `false`. When disabled, metrics-oriented APIs and health details are much thinner. | Expecting metrics to exist in every environment without explicitly enabling them. |
| `custom_epoch` | Replaces the default epoch timestamp in milliseconds. | Always. | If `0`, runtime backfills `1609459200000` (`2021-01-01 00:00:00 UTC`). The generator validator rejects future epochs, very old epochs, and layouts that leave too little future timestamp space. | Picking a custom epoch for cosmetic reasons and accidentally shortening the usable ID lifetime. |
| `worker_id_bits` | Sets how many bits are reserved for worker IDs. | Always. | If `0`, runtime backfills `5`. This field interacts with fixed `5` datacenter bits and `sequence_bits`; the total cannot exceed `22`. | Copying an old `10`-bit worker assumption without reducing `sequence_bits`. |
| `sequence_bits` | Sets how many bits are reserved for the per-millisecond sequence. | Always. | If `0`, runtime backfills `12`. Raising `worker_id_bits` requires lowering `sequence_bits`, because fixed datacenter bits plus worker bits plus sequence bits must stay within `22`. | Setting `worker_id_bits: 10` and leaving `sequence_bits: 12`, which makes the generator fail validation. |

## Complete YAML Example

```yaml
lynx:
  eon-id:
    datacenter_id: 1 # logical datacenter ID; must stay within 0-31
    worker_id: 7 # preferred manual worker ID or the first choice before auto-registration fallback
    auto_register_worker_id: true # when true, Redis becomes a runtime dependency
    redis_key_prefix: "prod:lynx:eon-id:" # normalized to end with ":" or "_" if you forget the suffix
    worker_id_ttl: "30s" # defaults to 30s; should stay above heartbeat_interval
    heartbeat_interval: "10s" # defaults to 10s; should stay below worker_id_ttl
    enable_clock_drift_protection: true # guards against backward clock movement
    max_clock_drift: "5s" # defaults to 5s when omitted
    clock_check_interval: "1s" # parsed today; current runtime does not start a separate checker from it
    clock_drift_action: "wait" # valid values: wait, error, ignore
    enable_sequence_cache: true # enables cached sequence allocation for higher throughput
    sequence_cache_size: 1000 # defaults to 1000; must fit within 2^sequence_bits
    enable_metrics: true # allocates generator metrics
    redis_plugin_name: "redis" # shared Redis resource name, not a Redis DSN
    redis_db: 0 # preserved in config; current runtime does not switch DB on the shared client
    custom_epoch: 1609459200000 # default epoch = 2021-01-01 00:00:00 UTC when 0
    worker_id_bits: 5 # current runtime fallback when omitted
    sequence_bits: 12 # current runtime fallback when omitted
```

The current runtime does not expose standalone `enabled` or `node_id` keys under `lynx.eon-id`. The smallest runnable YAML therefore uses the actual manual worker-allocation fields below.

## Minimum Viable YAML Example

```yaml
lynx:
  eon-id:
    datacenter_id: 0 # explicit single-datacenter deployment
    worker_id: 1 # explicit manual worker ID while auto-registration stays off
```

## How To Consume It

```go
import eonid "github.com/go-lynx/lynx-eon-id"

id, err := eonid.GenerateID()
id, metadata, err := eonid.GenerateIDWithMetadata()
parsed, err := eonid.ParseID(id)
plugin, err := eonid.GetEonIdPlugin()
```

## Practical Notes

- Use manual `worker_id` only when you can guarantee uniqueness yourself. For most multi-instance deployments, Redis-backed auto-registration is safer.
- If worker registration becomes unhealthy, the plugin refuses to keep generating IDs. That fail-closed behavior is intentional and reduces duplicate-ID risk.
- `redis_db` and `clock_check_interval` currently look richer than they behave in runtime. Keep them documented, but do not assume they already implement DB switching or background drift polling.

## Related Pages

- [Redis](/docs/existing-plugin/redis)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
- [Layout](/docs/existing-plugin/layout)
