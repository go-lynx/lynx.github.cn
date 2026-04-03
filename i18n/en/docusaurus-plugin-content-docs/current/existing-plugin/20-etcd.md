---
id: etcd
title: Etcd Plugin
---

# Etcd Plugin

Etcd can serve two roles in Lynx: configuration center and service registry/discovery backend. It is also the required upstream client for [Etcd Lock](/docs/existing-plugin/etcd-lock).

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-etcd` |
| Config prefix | `lynx.etcd` |
| Runtime plugin name | `etcd.config.center` |
| Public APIs | `GetClient()`, `GetEtcdConfig()`, `GetNamespace()`, `GetConfigSources()`, `GetConfigValue(prefix, key)`, `NewEtcdRegistrar(...)`, `NewEtcdDiscovery(...)` |

## Configuration Source

| File | Scope | What it changes |
| --- | --- | --- |
| `lynx-etcd/conf/example_config.yml` | Lynx runtime and etcd client setup | Endpoints, TLS/auth, cache/metrics/retry, config prefix loading, optional registry/discovery, and a few compatibility-only schema fields |

## Runtime Notes That Matter

- `endpoints` is required and every item must be non-empty.
- If `namespace` is omitted it defaults to `lynx/config`; `timeout` defaults to `10s`; `dial_timeout` defaults to `5s`.
- `enable_register` and `enable_discovery` default to `false`. `NewServiceRegistry()` and `NewServiceDiscovery()` return `nil` unless the matching flag is enabled.
- `registry_namespace` defaults to `lynx/services` when registry/discovery is used. `ttl` falls back to `30s` for service registration if omitted or non-positive.
- `enable_metrics` and `enable_retry` are real runtime gates. Retry manager fallback defaults (`3` retries, `1s` interval) are only applied when `enable_retry` is `true`.
- `service_config.prefix` falls back to top-level `namespace`.
- `service_config.additional_prefixes` is effective and loaded in declaration order.
- `enable_graceful_shutdown`, `enable_logging`, `log_level`, `service_config.priority`, and `service_config.merge_strategy` are accepted for schema compatibility, but the current plugin does not treat them as active behavioral switches.

## Field Guide

### `lynx.etcd`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `endpoints` | etcd cluster endpoints. | Always. | Required; template shows a list of host:port values. | Leaving the list empty or including blank items. |
| `timeout` | General etcd operation timeout. | Always; tune for network distance. | Defaults to `10s`; validation range `100ms..60s`. | Setting it below `100ms` or treating it as a registry TTL. |
| `dial_timeout` | Connection establishment timeout. | When etcd servers are remote or slow to connect. | Defaults to `5s`; validation range `100ms..30s`. | Copying `timeout` blindly and making connection setup too short. |
| `namespace` | Default prefix namespace for config keys. | When config should live under a non-default etcd prefix. | Defaults to `lynx/config`; `service_config.prefix` falls back to it. | Mixing config prefixes between services without realizing reads are prefix-based. |
| `username` | Username auth credential. | When etcd auth is enabled. | Optional. | Setting only username and forgetting password. |
| `password` | Password auth credential. | When etcd auth is enabled. | Optional. | Putting real secrets into repo-derived example configs. |
| `enable_tls` | Enables TLS for etcd client connections. | When the etcd cluster requires TLS. | Boolean gate for TLS file handling. | Setting it to `true` but leaving certificate paths invalid or empty. |
| `cert_file` | Client certificate path. | When mutual TLS is required. | Optional unless the cluster requires client cert auth. | Providing a cert without the matching key. |
| `key_file` | Client key path. | When mutual TLS is required. | Optional unless the cluster requires client cert auth. | Providing a key that does not match `cert_file`. |
| `ca_file` | CA certificate path. | When etcd uses a custom CA. | Optional. | Assuming system trust is enough for a private CA cluster. |
| `enable_cache` | Enables local config cache behavior. | When config reads should benefit from local caching. | Real runtime gate. | Turning it on without planning cache freshness expectations. |
| `enable_metrics` | Enables plugin metrics collection. | When operators need etcd plugin metrics. | Real runtime gate. | Expecting metrics with the flag left off. |
| `enable_retry` | Enables retry manager creation. | When transient etcd failures should be retried. | Real runtime gate; if on and values are omitted, runtime falls back to `3` retries and `1s` interval. | Assuming retry defaults exist even while `enable_retry` is `false`. |
| `max_retry_times` | Max retry attempts. | When retries are enabled. | Valid range `0..10`. | Using negative values or very large counts. |
| `retry_interval` | Delay between retries. | When retries are enabled. | Validation range `100ms..10s`; fallback `1s` if retry manager is enabled and interval is omitted. | Treating it as seconds when sub-second backoff is intended. |
| `shutdown_timeout` | Cleanup timeout during stop. | When etcd cleanup quality matters. | Fallback `10s` if omitted; validation range `1s..60s`. | Setting it too low for leases and watch cleanup. |
| `enable_register` | Enables service registration into etcd. | When this service should publish itself into etcd-based discovery. | Defaults to `false`. | Expecting a registrar while the flag is still off. |
| `enable_discovery` | Enables service discovery from etcd. | When this service resolves upstream instances from etcd. | Defaults to `false`. | Expecting discovery watches while the flag is off. |
| `registry_namespace` | Prefix namespace for service registration keys. | When registry records should live under a custom etcd prefix. | Defaults to `lynx/services` when registry/discovery is used. | Reusing the config namespace by mistake and mixing config data with service records. |
| `ttl` | Lease TTL for registered service instances. | When registration is enabled. | Defaults to `30s` if omitted or non-positive during registrar creation. | Setting `0` and assuming registration is disabled; it only falls back to default TTL. |
| `service_config` | Remote config prefix loading strategy. | When one service reads config from one or more etcd prefixes. | Optional nested object. | Adding extra prefixes without deciding load order. |

### `lynx.etcd.service_config`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `prefix` | Main prefix for config loading. | When runtime config should come from a prefix other than top-level `namespace`. | Falls back to top-level `namespace`. | Leaving it empty and assuming a different prefix will be used. |
| `additional_prefixes` | Extra prefixes merged after the main prefix. | When shared and app-specific config live under different etcd key trees. | Loaded in declaration order. | Expecting automatic deduplication or conflict sorting. |

### Compatibility-only schema fields

These fields appear as comments in the example file because the schema still accepts them, but the current plugin does not treat them as active runtime switches:

| Field | What to know |
| --- | --- |
| `enable_graceful_shutdown` | Cleanup still happens; `shutdown_timeout` is the operative field. |
| `enable_logging` | Accepted for compatibility, but not used as a plugin-local logging gate. |
| `log_level` | Accepted for compatibility, but not used as an active plugin-local switch. |
| `service_config.priority` | Retained in schema, but the plugin does not reorder sources by this value. |
| `service_config.merge_strategy` | Retained in schema, but the plugin does not implement a plugin-local custom merge algorithm from this value. |

## Complete YAML Template

```yaml
lynx:
  etcd:
    endpoints:
      - 127.0.0.1:2379
    timeout: 10s
    dial_timeout: 5s
    namespace: lynx/config
    username: ""
    password: ""
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
    # enable_graceful_shutdown: true
    # enable_logging: true
    # log_level: info
    # service_config.priority: 0
    # service_config.merge_strategy: override
```

## Common Misconfigurations

- Enabling `enable_tls` but forgetting that cert/key/CA files must match the cluster's TLS mode.
- Assuming `enable_graceful_shutdown`, `enable_logging`, or `log_level` are active runtime switches even though they are compatibility-only in the current plugin.
- Expecting registry or discovery objects while `enable_register` / `enable_discovery` stay `false`.
- Using the same prefix for config keys and service registry records.
- Assuming `service_config.priority` or `merge_strategy` changes source ordering; current plugin simply uses declaration order.

## Runtime Usage

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("etcd.config.center")
etcdPlugin := plugin.(*etcd.PlugEtcd)

client := etcdPlugin.GetClient()
cfg := etcdPlugin.GetEtcdConfig()
sources, err := etcdPlugin.GetConfigSources()
value, err := etcdPlugin.GetConfigValue("lynx/config", "feature.flag")
registrar := etcdPlugin.NewServiceRegistry()
discovery := etcdPlugin.NewServiceDiscovery()
```

Use Etcd when one cluster should back both config prefixes and optional registry/discovery. If you only need a config center without registry concerns, [Apollo](/docs/existing-plugin/apollo) may be simpler.

## Related Pages

- [Apollo](/docs/existing-plugin/apollo)
- [Etcd Lock](/docs/existing-plugin/etcd-lock)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
