---
id: polaris
title: Polaris Service Governance
---

# Polaris Service Governance

Polaris is Lynx's broadest control-plane plugin. In this repository it is driven by two different YAML files:

- `lynx-polaris/conf/example_config.yml` controls the Lynx plugin itself under `lynx.polaris`.
- `lynx-polaris/conf/polaris.yaml` is the Polaris SDK-side transport and config-center file referenced by `config_path`.

The example file also includes `lynx.service_info`, which is not owned by the plugin but is commonly paired with Polaris registration.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-polaris` |
| Config prefix | `lynx.polaris` |
| Runtime plugin name | `polaris.control.plane` |
| Public APIs | `GetPolarisPlugin()`, `GetPolaris()`, `GetServiceInstances()`, `GetConfig(fileName, group)`, `WatchService(serviceName)`, `WatchConfig(fileName, group)`, `CheckRateLimit(serviceName, labels)`, `GetMetrics()` |

## Configuration Sources

| File | Scope | What it changes |
| --- | --- | --- |
| `lynx-polaris/conf/example_config.yml` | Lynx runtime | Namespace, retry, circuit-breaker, watch, rate-limit, graceful shutdown, config loading, and service registration companion data |
| `lynx-polaris/conf/polaris.yaml` | Polaris SDK | gRPC connector addresses, config-center addresses, and optional SDK-side metrics reporting |

## Runtime Notes That Matter

- `namespace` is required by the validator, must stay within `64` characters, and may only contain letters, digits, `_`, and `-`.
- `weight` must stay within `1..1000`; `ttl` must stay within `5..300` seconds.
- `timeout` must stay within `1s..60s` and must be lower than `ttl`, otherwise validation fails.
- `config_path` is optional, but if it points to a missing file the plugin logs a warning and falls back to default Polaris SDK configuration.
- `service_config.additional_configs` is sorted by `priority` in ascending order, so larger priorities override later at merge time.
- `service_config.namespace` and `additional_configs[*].namespace` exist in the schema, but the current config-source call path still reads through the plugin namespace. Keep them aligned with top-level `namespace` instead of treating them as independent routing controls.
- `enable_metrics`, `enable_retry`, and `enable_circuit_breaker` are schema flags, but the current init path still creates helper components with fallback defaults. Treat those booleans as intent flags, not strict hard-off switches.

## Field Guide

### `lynx.polaris`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `namespace` | Main Polaris namespace for service lookup, registration, and config reads. | Always; this is the primary tenancy boundary. | Defaults to `default` if omitted, but validation still requires a non-empty valid name by the time init finishes. | Leaving it empty in custom config, or mixing environments in one namespace. |
| `token` | Access token for Polaris APIs. | When your Polaris control plane requires authentication. | Optional, but if set it must be at least `8` characters and at most `1024`. | Setting a short placeholder token and assuming local validation will ignore it. |
| `weight` | Instance weight used by Polaris-side load balancing. | When the service should receive more or less traffic than peers. | Defaults to `100`; validator range is `1..1000`. | Using `0` to mean "unset"; runtime rewrites it to default `100`. |
| `ttl` | Service lease / heartbeat lifetime in seconds. | When using service registration and health expiration. | Defaults to `30`; validator range is `5..300`. | Setting a very low TTL and forgetting to keep `timeout` smaller. |
| `timeout` | Timeout for Polaris operations. | Always; especially important across slow control-plane links. | Defaults to `10s`; validator range is `1s..60s`; must be `< ttl`. | Making it equal to or greater than `ttl`, which breaks registration expectations. |
| `config_path` | Path to the SDK-side Polaris YAML file. | When you need explicit server connector, metrics reporter, or config-center endpoints. | Optional; if the file exists the plugin sets `POLARIS_CONFIG_PATH` and initializes the SDK from it. | Pointing at `lynx-polaris/polaris.yaml`; in this repo the file is `lynx-polaris/conf/polaris.yaml`. |
| `enable_health_check` | Declares whether Polaris health-check behavior should be enabled. | When you want Polaris-driven health probing around registration. | Schema flag; keep it aligned with `health_check_interval` and your deployment policy. | Turning it on without a reachable control plane and assuming local probes are enough. |
| `health_check_interval` | Health-check interval. | When health checks are enabled and the service should be polled at a predictable cadence. | Template uses `30s`; defaults helper value to `30s`. | Setting an interval shorter than the environment can sustain, causing noisy checks. |
| `enable_metrics` | Declares plugin metrics intent. | When you consume plugin telemetry. | Present in schema; current init still creates metrics helpers. | Assuming `false` guarantees zero metrics-related setup. |
| `enable_retry` | Declares retry behavior intent for plugin-side operations. | When transient Polaris failures should be retried. | Current retry manager still falls back to `3` retries with `1s` interval if values are unset. | Enabling retries without bounding retry count or interval expectations. |
| `max_retry_times` | Maximum retry attempts. | When retries are enabled and you need explicit retry depth. | Valid range `0..10`; current helper falls back to `3` when `<= 0`. | Using negative values or assuming `0` means "disable retries completely". |
| `retry_interval` | Delay between retries. | When retries are enabled. | Defaults to `1s` in helper fallback. | Leaving it inconsistent with the application's own higher-level retry policy. |
| `enable_circuit_breaker` | Declares circuit-breaker intent. | When you want plugin-side failure isolation for Polaris calls. | Current init still creates a breaker with threshold fallback `0.5`. | Assuming `false` fully removes breaker behavior in current runtime. |
| `circuit_breaker_threshold` | Error-rate threshold for tripping the breaker. | When circuit breaking is expected. | Defaults to `0.5`; schema range is effectively `0.1..0.9` in defaults and validation practice. | Setting `0` or `1`, which causes validation or ineffective behavior. |
| `enable_service_watch` | Enables service-instance watch intent. | When business code calls `WatchService()` or needs live discovery updates. | Only useful with discovery-oriented Polaris usage. | Enabling it without any consumer, then paying watch complexity for nothing. |
| `enable_config_watch` | Enables config watch intent. | When business code calls `WatchConfig()` or expects config change callbacks. | Works together with remote config usage and `service_config`. | Turning it on without actually loading config from Polaris. |
| `load_balancer_type` | Chooses Polaris-side discovery load-balancing strategy. | When service discovery is active and governance rules depend on a specific strategy. | Supported values in defaults are `weighted_random`, `ring_hash`, `maglev`, `l5cst`. | Setting a strategy name unsupported by your Polaris deployment or forgetting that it only matters for discovery traffic. |
| `enable_route_rule` | Enables Polaris route-rule intent. | When the environment actually maintains route rules in Polaris. | Governance-only field; pair it with discovery flows. | Turning it on in a cluster that has no route rules and expecting visible behavior. |
| `enable_rate_limit` | Enables rate-limit checks. | When code calls `CheckRateLimit()` or gateways rely on Polaris quotas. | Pair with `rate_limit_type` and server-side rate-limit rules. | Enabling it without provisioning rate-limit rules, leading to confusing "no effect". |
| `rate_limit_type` | Selects rate-limit mode. | When rate limiting is enabled. | Supported values are `local` and `global`. | Setting it while `enable_rate_limit` stays off, or choosing a mode unsupported by the server-side policy. |
| `enable_graceful_shutdown` | Declares graceful deregistration intent. | When services should deregister cleanly during stop. | Cleanup timeout is still driven by `shutdown_timeout`. | Assuming the flag alone is enough while leaving timeout too low for cleanup. |
| `shutdown_timeout` | Maximum cleanup time during stop. | Always when graceful stop matters. | Defaults to `30s`; cleanup clamps it to the supported `5s..300s` window. | Setting an unrealistically short timeout and expecting deregistration plus watcher shutdown to finish. |
| `enable_logging` | Declares verbose plugin logging intent. | When diagnosing control-plane behavior. | Schema field; actual log verbosity also depends on global runtime logging. | Assuming this overrides the application's logging backend by itself. |
| `log_level` | Desired plugin log level string. | When detailed plugin logs are required. | Supported values in defaults are `debug`, `info`, `warn`, `error`. | Setting a custom value that the rest of the runtime does not recognize. |
| `service_config` | Multi-config loading settings for Polaris config center. | When Lynx should bootstrap config from Polaris instead of a single hard-coded file. | Optional nested object. | Enabling config watch but never defining the main config source behavior. |

### `lynx.polaris.service_config`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `group` | Main Polaris config group. | When your config center groups config by business domain or environment. | Falls back to current app name; if app name is unavailable, runtime falls back again to `DEFAULT_GROUP`. | Leaving group blank while the remote file actually lives in a non-default group. |
| `filename` | Main remote config filename. | When the primary Polaris config is not `<app-name>.yaml`. | Defaults to `<app-name>.yaml`. | Forgetting the suffix and creating `application` instead of `application.yaml`. |
| `namespace` | Declared namespace for config loading. | When you want the docs and config to stay explicit about config tenancy. | Falls back to top-level `namespace`; keep it aligned with top-level namespace in current runtime. | Assuming it independently reroutes config reads away from the plugin namespace. |
| `additional_configs` | Additional files merged into runtime config. | When one service consumes shared plus app-specific config files. | Loaded after the main file, ordered by ascending `priority`. | Using it without deciding which file should win field conflicts. |

### `lynx.polaris.service_config.additional_configs[*]`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `group` | Group for an extra Polaris config file. | When the extra file lives outside the main group. | No automatic rewrite beyond your provided value. | Copying the main group by habit when the shared file belongs elsewhere. |
| `filename` | Extra remote config filename. | Always for each additional file entry. | Required in practice. | Leaving it blank; the plugin cannot fetch an anonymous config file. |
| `namespace` | Declared namespace for that extra file. | When you need the entry to be explicit for operators. | Falls back to `service_config.namespace`, then top-level `namespace`. | Treating it as a separate live namespace override without matching top-level namespace. |
| `priority` | Merge ordering hint. | When several config files may write the same keys. | Default `0`; lower values load first, higher values override later. | Assuming larger priority loads earlier. |
| `merge_strategy` | Merge conflict strategy metadata. | When operators need to know how conflicts are supposed to be resolved. | Current docs and runtime intent use `override`, `merge`, `append`; missing value behaves as `override` in logging/merge intent. | Writing custom strategy names that the rest of the config merge stack does not understand. |

### Companion `lynx.service_info`

The example template also includes a root-level `lynx.service_info` block. It belongs to Lynx application registration, not to the Polaris plugin schema itself, but it must stay coherent with Polaris registration behavior.

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `service_name` | Published service name. | When the service should register into Polaris discovery. | Should match the service name expected by callers and route rules. | Using a different name than the one downstream clients query. |
| `namespace` | Service-info namespace. | When service metadata should stay explicit. | Keep it aligned with `lynx.polaris.namespace`. | Mixing namespaces between `service_info` and `lynx.polaris`. |
| `host` | Advertised host or IP. | When the runtime cannot infer the correct reachable address. | No plugin-side default is documented here. | Publishing `127.0.0.1` from a container or remote host. |
| `port` | Advertised service port. | When the service registers itself for discovery. | Must match the actual listening port. | Registering one port while the service listens on another. |
| `weight` | Registration weight companion value. | When the registration payload should mirror plugin weight. | Keep it aligned with `lynx.polaris.weight`. | Tuning one weight and forgetting the other copy in the example. |
| `ttl` | Registration TTL companion value. | When registration payload should mirror plugin TTL. | Keep it aligned with `lynx.polaris.ttl`. | Diverging from top-level TTL and creating operator confusion. |
| `metadata` | Free-form metadata attached to the instance. | When discovery, routing, or observability consumers need labels such as version or region. | Optional map. | Treating metadata as secret storage or forgetting to keep label names consistent across services. |

### `lynx-polaris/conf/polaris.yaml`

| YAML path | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `global.serverConnector.protocol` | SDK transport protocol for talking to Polaris server. | When your Polaris deployment expects a specific connector protocol. | Template uses `grpc`. | Switching protocol without matching server support. |
| `global.serverConnector.addresses` | Polaris server addresses used by the SDK connector. | Always when `config_path` is used for explicit server connectivity. | Template uses `127.0.0.1:8091`. | Pointing at config-center addresses instead of service-governance addresses. |
| `global.statReporter.enable` | Enables SDK-side stats reporting. | When Polaris SDK metrics should be exported. | Template enables it. | Turning it on without configuring a reachable reporter backend. |
| `global.statReporter.chain` | Reporter pipeline list. | When you want one or more stat reporters active. | Template uses `prometheus`. | Listing a reporter plugin that is not configured under `plugin`. |
| `global.statReporter.plugin.prometheus.type` | Reporter mode for the Prometheus reporter. | When Prometheus reporting is enabled. | Template uses `push`. | Assuming it is pull-based while still providing a push address. |
| `global.statReporter.plugin.prometheus.address` | Prometheus push destination. | When reporter type requires a target address. | Template uses `127.0.0.1:9091`. | Leaving a local placeholder in production and silently pushing nowhere useful. |
| `global.statReporter.plugin.prometheus.interval` | Push interval for the reporter. | When SDK stats reporting is enabled. | Template uses `10s`. | Setting it too low and creating unnecessary reporting pressure. |
| `config.configConnector.addresses` | Polaris config-center addresses for remote config APIs. | When the plugin should load config from Polaris. | Template uses `127.0.0.1:8093`. | Reusing the service connector address when config center is exposed on a different port. |

## Complete YAML Templates

```yaml
lynx:
  polaris:
    namespace: default
    token: your-polaris-token
    weight: 100
    ttl: 30
    timeout: 10s
    config_path: ./conf/polaris.yaml
    enable_health_check: true
    health_check_interval: 30s
    enable_metrics: true
    enable_retry: true
    max_retry_times: 3
    retry_interval: 1s
    enable_circuit_breaker: true
    circuit_breaker_threshold: 0.5
    enable_service_watch: true
    enable_config_watch: true
    load_balancer_type: weighted_random
    enable_route_rule: true
    enable_rate_limit: true
    rate_limit_type: local
    enable_graceful_shutdown: true
    shutdown_timeout: 30s
    enable_logging: true
    log_level: info
    service_config:
      group: DEFAULT_GROUP
      filename: application.yaml
      namespace: default
      additional_configs:
        - group: SHARED_GROUP
          filename: shared-config.yaml
          namespace: default
          priority: 10
          merge_strategy: override

  service_info:
    service_name: my-service
    namespace: default
    host: 127.0.0.1
    port: 8080
    weight: 100
    ttl: 30
    metadata:
      version: "1.0.0"
      environment: production
      region: us-west-1
```

```yaml
global:
  serverConnector:
    protocol: grpc
    addresses:
      - 127.0.0.1:8091

  statReporter:
    enable: true
    chain:
      - prometheus
    plugin:
      prometheus:
        type: push
        address: 127.0.0.1:9091
        interval: 10s

config:
  configConnector:
    addresses:
      - 127.0.0.1:8093
```

## Common Misconfigurations

- `config_path` uses the wrong path. In this repository the SDK file is `lynx-polaris/conf/polaris.yaml`, not `lynx-polaris/polaris.yaml`.
- `timeout` is greater than or equal to `ttl`, which fails validation.
- `service_info.namespace`, `service_info.weight`, or `service_info.ttl` drift away from top-level `lynx.polaris` values.
- Operators set `service_config.namespace` or `additional_configs[*].namespace` to a different namespace and expect the current runtime to read from a separate control-plane namespace automatically.
- Governance fields such as `enable_rate_limit`, `enable_route_rule`, and `load_balancer_type` are enabled before actual Polaris governance rules exist.

## Runtime Usage

```go
plugin, err := polaris.GetPolarisPlugin()
instances, err := polaris.GetServiceInstances("user-service")
content, err := polaris.GetConfig("application.yaml", "DEFAULT_GROUP")
watcher, err := polaris.WatchConfig("application.yaml", "DEFAULT_GROUP")
allowed, err := polaris.CheckRateLimit("user-service", map[string]string{"region": "ap-northeast-1"})
```

Choose Polaris when registration, discovery, config center, and governance are intentionally owned by the same control plane. If you only need config-center behavior, [Apollo](/docs/existing-plugin/apollo) or [Etcd](/docs/existing-plugin/etcd) is usually a narrower fit.

## Related Pages

- [Nacos](/docs/existing-plugin/nacos)
- [Apollo](/docs/existing-plugin/apollo)
- [Etcd](/docs/existing-plugin/etcd)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
