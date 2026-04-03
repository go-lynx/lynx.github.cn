---
id: apollo
title: Apollo Plugin
---

# Apollo Plugin

Apollo is Lynx's configuration-center plugin. It is the fit for teams that already manage config rollout through Apollo namespaces and clusters, and do not expect the same backend to provide service registration or discovery.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-apollo` |
| Config prefix | `lynx.apollo` |
| Runtime plugin name | `apollo.config.center` |
| Public APIs | `GetConfigSources()`, `GetConfigValue(namespace, key)`, `GetApolloConfig()`, `GetNamespace()`, `GetMetrics()` |

## Configuration Source

| File | Scope | What it changes |
| --- | --- | --- |
| `lynx-apollo/conf/example_config.yml` | Lynx runtime and Apollo HTTP client setup | App identity, meta server, notification/cache behavior, retry/circuit-breaker/logging schema fields, namespace merge rules |

## Runtime Notes That Matter

- `app_id` is required, must be at most `128` characters, and may only contain letters, digits, `_`, and `-`.
- `meta_server` is required and must be a valid URL. The current validator treats plain `http://` as a production-risk error, so use an HTTPS endpoint in real configs.
- `namespace` defaults to `application`; `cluster` defaults to `default`; `timeout` defaults to `10s`; `notification_timeout` defaults to `30s`; `cache_dir` defaults to `/tmp/apollo-cache`.
- `timeout` must stay lower than `notification_timeout`, otherwise validation fails.
- `service_config.additional_namespaces` is loaded in declaration order. `priority` and `merge_strategy` are schema-level merge hints; the plugin keeps insertion order and relies on the framework merge layer.
- `enable_cache` is real for config reads: cached values are served before going back to Apollo.
- `enable_metrics`, `enable_retry`, and `enable_circuit_breaker` are not strict hard-off switches in the current init path; helper components are still created with fallback defaults.
- `release_key` and `ip` exist in the schema, but the current runtime code path does not read them directly from config.

## Field Guide

### `lynx.apollo`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `app_id` | Apollo application ID. | Always. It is the identity Apollo uses to locate config. | Required and format-validated. | Using spaces, dots, or other unsupported characters. |
| `cluster` | Apollo cluster name. | When one Apollo app serves different clusters. | Defaults to `default`. | Leaving it on `default` while config is only released to another cluster. |
| `namespace` | Primary Apollo namespace. | When the main runtime config lives outside the default namespace. | Defaults to `application`. | Forgetting that Apollo namespaces are logical config documents, not service names. |
| `meta_server` | Apollo Meta Server URL used to discover config servers. | Always. | Required; validator expects a valid URL and flags plain HTTP as unsafe for production. | Reusing the README placeholder `http://localhost:8080` in a config that must pass validation. |
| `token` | Auth token for Apollo access. | When Apollo is protected by token auth. | Optional; must be `8..1024` characters if set. | Putting a short placeholder token in real config. |
| `timeout` | HTTP client timeout for Apollo calls. | Always; especially important across regions. | Defaults to `10s`; validation range is `1s..60s`; must stay below `notification_timeout`. | Increasing it above `notification_timeout`, which breaks validator assumptions. |
| `enable_notification` | Declares whether config change notification should be used. | When the app depends on change watch / long-poll behavior. | Pair it with `notification_timeout`. | Turning it on without thinking about long-poll timeout and rollout latency. |
| `notification_timeout` | Wait timeout for notification / watch behavior. | When config watch responsiveness matters. | Defaults to `30s`; validation range is `5s..300s`; must be greater than `timeout`. | Treating it as a retry backoff instead of a watch wait window. |
| `enable_cache` | Enables in-process config value cache. | When repeated reads should survive short Apollo hiccups or avoid repeated network trips. | Cache reads use `cache_dir`; validator requires a non-empty cache dir, and defaults already provide one. | Enabling cache but never planning cache invalidation expectations. |
| `cache_dir` | Local cache directory path. | When cache is enabled and you need a writable predictable location. | Defaults to `/tmp/apollo-cache`. | Using a read-only or ephemeral path without realizing cache persistence is lost. |
| `enable_metrics` | Declares metrics intent. | When operators care about Apollo plugin metrics. | Current init path still creates metrics helpers even if this is false. | Treating it as a guaranteed hard-off switch. |
| `enable_retry` | Declares retry intent. | When transient Apollo errors should be retried. | Current init path still creates a retry manager with fallback defaults. | Assuming `false` fully removes retry logic everywhere. |
| `max_retry_times` | Max retry attempts. | When retry behavior needs an explicit bound. | Expected range `0..10`; runtime helper fallback is `3`. | Supplying negative values or unbounded large counts. |
| `retry_interval` | Delay between retries. | When retry intent is enabled. | Validation range is `100ms..30s`; runtime helper fallback is `1s`. | Making it longer than the app's own end-to-end deadline. |
| `enable_circuit_breaker` | Declares circuit-breaker intent. | When Apollo outages should be isolated from callers. | Current init path still creates a breaker with threshold fallback `0.5`. | Treating `false` as a guarantee that no breaker exists. |
| `circuit_breaker_threshold` | Error-rate threshold for the breaker. | When breaker sensitivity needs tuning. | Valid range `0.1..0.9`; default `0.5`. | Using `0` or `1`, which fails validation or makes the breaker useless. |
| `enable_graceful_shutdown` | Declares graceful cleanup intent. | When Apollo watch or client cleanup should respect stop semantics. | Pair it with `shutdown_timeout`. | Setting it but leaving a shutdown window too short for cleanup. |
| `shutdown_timeout` | Cleanup timeout during stop. | When clean stop behavior matters. | Validation range is `5s..300s`; default `30s`. | Shrinking it too far and assuming long-poll cleanup will still finish. |
| `enable_logging` | Declares verbose logging intent. | When diagnosing Apollo client behavior. | Schema field; real output still depends on the app logging backend. | Expecting it to override global logging policy. |
| `log_level` | Desired plugin log level. | When detailed troubleshooting logs are needed. | Supported values are `debug`, `info`, `warn`, `error`. | Using a custom string outside the supported list. |
| `service_config` | Multi-namespace loading rules. | When one service should merge several Apollo namespaces into runtime config. | Optional nested object. | Loading several namespaces without deciding merge order or conflict handling. |
| `release_key` | Schema field for Apollo release tracking. | Only if your surrounding tooling expects to record a release marker. | Present in schema, but current runtime does not directly read it from config. | Assuming changing this field alone affects Apollo fetch requests. |
| `ip` | Schema field for client IP. | Only if you need to document intended client IP metadata. | Present in schema, but current HTTP client currently derives request IP as empty and does not consume this config field directly. | Setting it and expecting the current client to forward it. |

### `lynx.apollo.service_config`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `namespace` | Main namespace used by multi-config bootstrap. | When runtime config should come from a namespace other than top-level `namespace`. | Falls back to top-level `namespace`. | Leaving it empty while assuming the main config will come from another namespace. |
| `additional_namespaces` | Extra Apollo namespaces merged into runtime config. | When shared config, feature flags, or env overrides live in separate namespaces. | Loaded in declaration order after the main namespace. | Adding namespaces without planning conflict precedence. |
| `priority` | Merge priority hint. | When operators need to know intended precedence. | Default `0`; current plugin keeps insertion order and leaves actual conflict resolution to framework merge logic. | Assuming the plugin itself reorders namespaces by priority. |
| `merge_strategy` | Conflict merge hint. | When merge behavior should be explicit. | Supported values are `override`, `merge`, `append`. | Setting unsupported strategy names. |

## Complete YAML Template

```yaml
lynx:
  apollo:
    app_id: demo-app
    cluster: default
    namespace: application
    meta_server: https://apollo-config.example.com
    token: your-apollo-token
    timeout: 10s
    enable_notification: true
    notification_timeout: 30s
    enable_cache: true
    cache_dir: /tmp/apollo-cache
    enable_metrics: true
    enable_retry: true
    max_retry_times: 3
    retry_interval: 1s
    enable_circuit_breaker: true
    circuit_breaker_threshold: 0.5
    enable_graceful_shutdown: true
    shutdown_timeout: 30s
    enable_logging: true
    log_level: info
    service_config:
      namespace: application
      additional_namespaces:
        - shared-config
        - feature-flags
      priority: 0
      merge_strategy: override
    release_key: ""
    ip: ""
```

## Common Misconfigurations

- Reusing the example's placeholder-style `http://` Meta Server address in a config that must pass current validation.
- Setting `timeout` greater than or equal to `notification_timeout`.
- Assuming `enable_metrics`, `enable_retry`, or `enable_circuit_breaker` are hard runtime-off switches.
- Expecting `release_key` or `ip` changes to affect the current HTTP client path directly.
- Loading several namespaces without deciding which keys should win conflicts.

## Runtime Usage

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("apollo.config.center")
apolloPlugin := plugin.(*apollo.PlugApollo)

value, err := apolloPlugin.GetConfigValue("application", "feature.flag")
sources, err := apolloPlugin.GetConfigSources()
cfg := apolloPlugin.GetApolloConfig()
namespace := apolloPlugin.GetNamespace()
```

Use Apollo when remote config is the requirement and the environment already standardizes on Apollo release management. If you also need registry or discovery from the same backend, [Polaris](/docs/existing-plugin/polaris), [Nacos](/docs/existing-plugin/nacos), or [Etcd](/docs/existing-plugin/etcd) may be a better fit.

## Related Pages

- [Nacos](/docs/existing-plugin/nacos)
- [Polaris](/docs/existing-plugin/polaris)
- [Etcd](/docs/existing-plugin/etcd)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
