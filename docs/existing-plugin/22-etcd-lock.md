---
id: etcd-lock
title: Etcd Lock Plugin
---

# Etcd Lock Plugin

`github.com/go-lynx/lynx-etcd-lock` is Lynx's etcd-backed distributed lock layer. It is a runtime plugin, but it does **not** ship an independent configuration schema or standalone `example_config.yml`.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-etcd-lock` |
| Runtime plugin name | `etcd.distributed.lock` |
| Plugin metadata config prefix | `lynx.etcd-lock` |
| Required upstream runtime resource | `etcd.config.center` |
| Public APIs | `SetCallback`, `Lock`, `LockWithOptions`, `LockWithRetry`, `NewLockFromClient`, `GetStats()`, `Shutdown()` |

## Configuration Boundary

- There is no dedicated `lynx-etcd-lock` YAML tree in the repository templates.
- There is no standalone `conf` schema or `conf/example_config.yml` for lock-specific YAML.
- Startup depends on the shared etcd plugin publishing the `etcd.config.center` runtime resource.
- If the upstream etcd plugin is missing or does not expose a live client, initialization fails with errors such as `etcd config center plugin not found` or `etcd client is nil`.
- Lock behavior is configured in code through `LockOptions`, `RetryStrategy`, and `RenewalConfig`, not through YAML.

## Effective YAML: inherited from `lynx.etcd`

Because the lock plugin reuses the upstream etcd client, the only YAML that matters is the upstream [Etcd](/docs/existing-plugin/etcd) configuration.

### Inherited `lynx.etcd` fields

| Field | Effect on Etcd Lock | Default / interaction | Common misunderstanding |
| --- | --- | --- | --- |
| `endpoints` | Decides which etcd cluster the lock plugin talks to. | Required by the upstream client. | Thinking lock acquisition works without any upstream etcd endpoints. |
| `timeout` | Affects shared client operation timeout. | Defaults to `10s` in upstream plugin. | Treating it as lock lease TTL. |
| `dial_timeout` | Affects how long the shared client waits to connect. | Defaults to `5s`. | Forgetting that slow connections can fail before any lock call runs. |
| `namespace` | Namespaces config reads for the upstream etcd plugin, but does not rename lock keys. | Defaults to `lynx/config`. | Assuming it changes the lock storage key prefix. |
| `username` / `password` | Authenticate the shared etcd client. | Optional. | Forgetting them on an authenticated cluster. |
| `enable_tls` | Enables TLS for the shared etcd client. | Pair with cert/key/CA paths as needed. | Expecting secure lock traffic while leaving TLS off. |
| `cert_file` / `key_file` / `ca_file` | Provide TLS material for the shared client. | Used only when cluster TLS mode requires them. | Assuming the lock plugin has its own separate TLS settings. |
| `enable_cache` | Upstream etcd config-cache toggle. | Real upstream gate. | Thinking it changes lock semantics. It does not; it only affects config-center behavior. |
| `enable_metrics` | Upstream etcd metrics toggle. | Real upstream gate. | Thinking it is a dedicated lock metrics switch. |
| `enable_retry` / `max_retry_times` / `retry_interval` | Control the upstream etcd plugin retry manager. | Real upstream gates/defaults. | Confusing upstream client retries with lock acquisition retry policy. |
| `shutdown_timeout` | Affects upstream client cleanup window. | Fallback `10s` upstream. | Assuming it is the same as lock renewal or operation timeout. |
| `enable_register` / `enable_discovery` | Control upstream registry/discovery behavior only. | Default `false`. | Believing these flags are required for locking. They are not. |
| `registry_namespace` / `ttl` | Control upstream service registration only. | Upstream defaults `lynx/services` and `30s`. | Assuming they define lock key namespace or lock lease duration. |
| `service_config.prefix` / `additional_prefixes` | Control upstream config-source loading only. | Fallback to upstream namespace and declaration order. | Assuming they influence distributed lock storage paths. |
| `enable_graceful_shutdown` / `enable_logging` / `log_level` / `service_config.priority` / `service_config.merge_strategy` | Compatibility-only upstream schema fields. | Accepted by upstream schema but not active plugin-local toggles. | Expecting them to be lock-specific controls. |

## No standalone YAML schema

The effective repository shape is:

```yaml
lynx:
  etcd:
    endpoints:
      - 127.0.0.1:2379
    timeout: 10s
    dial_timeout: 5s
    namespace: lynx/config
    enable_tls: false
    cert_file: ""
    key_file: ""
    ca_file: ""
    enable_cache: true
    enable_metrics: true
    enable_retry: true
    max_retry_times: 3
    retry_interval: 1s
    shutdown_timeout: 10s
    enable_register: false
    enable_discovery: false
    registry_namespace: lynx/services
    ttl: 30s
    service_config:
      prefix: lynx/config
      additional_prefixes:
        - lynx/config/app

  # There is no standalone lynx.etcd-lock schema in the repository.
  # Lock behavior is configured in code via LockOptions.
```

## Code-level lock options

### `LockOptions`

| Field | Role | Use when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `Expiration` | Lease TTL for one lock acquisition. | Always; every lock must have a positive expiration. | Default `30s`; validation requires `> 0`. | Passing `0` and expecting the lock to live forever. |
| `RetryStrategy` | Retry policy for acquisition conflicts. | When callers should retry after contention. | Default `MaxRetries: 3`, `RetryDelay: 100ms`. | Confusing lock retry policy with upstream etcd client retry policy. |
| `RenewalEnabled` | Enables background lease renewal after the lock is acquired. | When critical sections may outlive one lease TTL. | Default `true`. | Leaving it off for long-running business sections and then seeing the lock expire mid-flight. |
| `RenewalThreshold` | Fraction of remaining TTL at which renewal starts. | When auto-renew is enabled and you need explicit renewal timing. | Default `0.3`; validation range `0..1`. | Using values above `1` or below `0`. |
| `WorkerPoolSize` | Renewal worker pool capacity. | When many locks may auto-renew concurrently. | Default `50`; must be `>= 0`. | Setting a negative size or assuming `0` means "disable renewal". |
| `RenewalConfig` | Detailed renewal retry/polling config. | When renewal pressure or backoff needs tuning. | Uses `DefaultRenewalConfig` below. | Changing top-level retry strategy and expecting renewal retry behavior to match automatically. |
| `OperationTimeout` | Per-operation timeout for acquire/release. | When each lock call should have a stricter bound than the caller context. | Default `600ms`; `0` means no separate operation timeout. | Treating it as the same thing as `Expiration`. |

### `RenewalConfig`

| Field | Role | Default | Common misconfig |
| --- | --- | --- | --- |
| `MaxRetries` | Renewal retry attempts. | `4` | Setting too low and making renewal brittle under brief etcd jitter. |
| `BaseDelay` | Renewal backoff base delay. | `100ms` | Setting too high and starting retries too slowly. |
| `MaxDelay` | Renewal backoff cap. | `800ms` | Forgetting that large caps can consume too much remaining lease time. |
| `CheckInterval` | Renewal polling cadence. | `300ms` | Making it longer than your safe renewal window. |
| `OperationTimeout` | Per-renewal operation timeout. | `600ms` | Assuming it changes the lock lease TTL. |

### Lock key rules

| Rule | Meaning |
| --- | --- |
| Business key must not be empty | `ValidateKey` rejects empty strings. |
| Business key length must be `<= 255` | Longer keys are rejected before lock creation. |
| Actual etcd storage key is `lynx/lock/<business-key>` | This prefix is built in code and is not currently configurable through YAML. |

## Usage Examples

```go
options := etcdlock.DefaultLockOptions
options.Expiration = 30 * time.Second
options.RetryStrategy = etcdlock.RetryStrategy{
    MaxRetries: 3,
    RetryDelay: 100 * time.Millisecond,
}
options.RenewalEnabled = true

err := etcdlock.LockWithOptions(ctx, "order:123", options, func() error {
    return doBusiness()
})
```

```go
lock, err := etcdlock.NewLockFromClient(ctx, "inventory:sku-1", etcdlock.DefaultLockOptions)
if err != nil {
    return err
}
if err := lock.Acquire(ctx); err != nil {
    return err
}
defer lock.Release(ctx)
```

## Common Misconfigurations

- Adding a `lynx.etcd-lock` YAML block and expecting the repository to validate it. There is no standalone schema.
- Loading `lynx-etcd-lock` before the upstream etcd plugin is available.
- Thinking upstream `registry_namespace` or `ttl` controls lock key layout or lock expiration. Lock expiration is code-level `LockOptions.Expiration`.
- Passing invalid business keys: empty strings or values longer than `255`.
- Mixing up upstream etcd client retry settings with lock acquisition retry settings.

## Related Pages

- [Etcd](/docs/existing-plugin/etcd)
- [Redis Lock](/docs/existing-plugin/redis-lock)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
