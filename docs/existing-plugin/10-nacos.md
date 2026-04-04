---
id: nacos
title: Nacos Plugin
---

# Nacos Plugin

Nacos is a control-plane plugin for service registration, discovery, and remote configuration. One runtime can enable any subset of those three capabilities, but the YAML fields have different effects depending on which client is actually initialized.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-nacos` |
| Config prefix | `lynx.nacos` |
| Runtime plugin name | `nacos.control.plane` |
| Public APIs | plugin-manager lookup plus `GetConfig(dataId, group)`, `GetConfigSources()`, `GetNamespace()`, `NewServiceRegistry()`, `NewServiceDiscovery()` |

## Configuration Source

| File | Scope | What it changes |
| --- | --- | --- |
| `lynx-nacos/conf/example_config.yml` | Lynx runtime and Nacos SDK client setup | Server addresses, namespace/auth, registration/discovery/config toggles, health-check settings, config-source list, and SDK directories |

## Runtime Notes That Matter

- `server_addresses` or `endpoint` is required. If both are empty, validation fails.
- If `enable_register`, `enable_discovery`, and `enable_config` are all `false`, no Nacos client is initialized and startup fails with `no Nacos client initialized`.
- If both `namespace_id` and `namespace` are empty, runtime falls back to `public`.
- `server_addresses` is normalized: `http://` and `https://` prefixes are stripped and host:port entries are split per comma.
- `endpoint` is supported as an alternative, but direct `server_addresses` is usually clearer; the SDK still gets compatibility server config entries even when endpoint discovery is used.
- `service_config.service_name` affects the main config `dataId` (`<service_name>.yaml`). Service registration and discovery still use the runtime service instance name provided by the application, not this field alone.
- `enable_config` is the gate for config client initialization and `WatchConfig()`. `enable_register` and `enable_discovery` are the gates for naming client initialization.
- `additional_configs[*].format` falls back to file extension and then to `yaml` if omitted.

## Field Guide

### `lynx.nacos`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `server_addresses` | Direct Nacos server list, comma-separated. | Prefer this for explicit server connectivity. | Required unless `endpoint` is set. | Leaving protocol prefixes or spaces and assuming the SDK will preserve them verbatim. |
| `namespace_id` | Nacos namespace ID. | When your platform gives you a concrete namespace ID. | If both namespace fields are empty, runtime falls back to `public`. | Setting both `namespace_id` and `namespace` to unrelated values. |
| `namespace` | Human-readable namespace name or fallback namespace identifier. | When you use namespace names instead of raw IDs. | Runtime exposes it as the visible namespace and may also reuse it as namespace ID for SDK compatibility. | Assuming it is purely cosmetic while the client actually uses it for isolation. |
| `username` | Username/password auth credential. | When Nacos auth uses basic credentials. | Optional. | Setting only username and forgetting password, leaving auth half-configured. |
| `password` | Password auth credential. | When Nacos auth uses basic credentials. | Optional. | Committing real credentials into example-derived configs. |
| `access_key` | Access-key style credential. | When your Nacos deployment uses AK/SK auth instead of username/password. | Optional; only used together with `secret_key`. | Setting it alongside username/password and not knowing which pair is effective. |
| `secret_key` | Secret-key style credential. | When AK/SK auth is used. | Optional; paired with `access_key`. | Setting only one side of the pair. |
| `weight` | Default instance weight used by the Nacos registrar. | When registered instances need non-uniform traffic share. | Defaults to `1.0`. | Using `0` and expecting it to mean "leave untouched"; runtime rewrites it to default `1.0`. |
| `metadata` | Default metadata copied onto registered instances. | When version, env, region, or rollout labels should be published. | Optional map. | Storing secrets here or forgetting consistent label names across services. |
| `enable_register` | Enables service registration. | When this service should publish itself into Nacos naming. | Creates naming client together with discovery if either is enabled. | Enabling it without exposing a correct service endpoint from the app. |
| `enable_discovery` | Enables service discovery. | When this service resolves upstream instances from Nacos naming. | Creates naming client together with registration if either is enabled. | Turning it on while still using another registry in business code. |
| `enable_config` | Enables Nacos config-center usage. | When app config or config watch should come from Nacos. | Required for config client init, `GetConfigSources()`, and `WatchConfig()`. | Expecting config APIs to work while this flag is `false`. |
| `timeout` | Client timeout in seconds. | Always; especially for remote Nacos clusters. | Defaults to `5` seconds. | Supplying millisecond thinking; the field is seconds. |
| `log_level` | Nacos SDK log level. | When diagnosing client behavior. | Defaults to `info`; supported values are `debug`, `info`, `warn`, `error`. | Using an unsupported custom level string. |
| `log_dir` | SDK log directory. | When SDK logs should go to a predictable writable path. | Defaults to `./logs/nacos`. | Pointing it at a read-only container path. |
| `cache_dir` | SDK cache directory. | When Nacos SDK local cache should persist in a known path. | Defaults to `./cache/nacos`. | Sharing one cache dir across unrelated apps or environments. |
| `notify_timeout` | Notification timeout in milliseconds. | When config watch latency or notification windows need tuning. | Defaults to `3000`. | Treating it as seconds and making it far too large. |
| `service_config` | Registration-related behavior plus main config naming hint. | When register/discovery or main config naming should be explicit. | Optional nested object. | Assuming every field inside it changes both config and registry behavior equally. |
| `additional_configs` | Extra config-center sources to load. | When one service needs several Nacos config files merged in. | Optional list; each item may infer its own format. | Adding files that do not exist and expecting startup to fail hard; current loader warns and continues. |
| `context_path` | Server context path used in server config. | When your Nacos server is not rooted at `/nacos`. | Defaults to `/nacos`. | Forgetting a custom reverse-proxy base path. |
| `endpoint` | Alternate endpoint-style server discovery entry. | When your platform exposes Nacos through endpoint discovery instead of static addresses. | Alternative to `server_addresses`. | Setting it but also keeping stale `server_addresses` that point elsewhere. |
| `region_id` | Region hint passed to the SDK. | When cloud deployment or endpoint discovery needs region scoping. | Optional. | Filling a region value that does not match the Nacos environment. |

### `lynx.nacos.service_config`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `service_name` | Names the main config `dataId` as `<service_name>.yaml`; also documents the intended business service name. | When the main Nacos config file should follow a stable service-specific name. | If empty, main config falls back to `<app-name>.yaml`. Registration still uses the service instance name emitted by the app. | Assuming this field alone renames what the registrar publishes into Nacos naming. |
| `group` | Default group for main config and registry/discovery grouping. | When environments or teams split resources by group. | Defaults to `DEFAULT_GROUP`. | Leaving it empty while the config file actually lives in another group. |
| `cluster` | Cluster label used by registry/discovery. | When instance selection should stay inside a Nacos cluster. | Defaults to `DEFAULT`. | Setting a cluster that your instances are never registered into. |
| `health_check` | Enables Nacos-side health-check config on service registration. | When service registration should publish health-check policy. | Only validated when registration is enabled. | Enabling it without filling HTTP-specific fields for HTTP checks. |
| `health_check_interval` | Health-check interval in seconds. | When health checks are enabled. | Defaults to `5`. | Treating it as milliseconds. |
| `health_check_timeout` | Health-check timeout in seconds. | When health checks are enabled. | Defaults to `3`. | Setting timeout longer than interval. |
| `health_check_type` | Health-check mode. | When health checks are enabled. | Defaults to `tcp`; supported values are `none`, `tcp`, `http`, `mysql`. | Choosing `http` without a URL. |
| `health_check_url` | HTTP health-check target URL. | Only when `health_check_type` is `http`. | Required for HTTP mode. | Leaving it empty and expecting validator to allow HTTP health checks. |

### `lynx.nacos.additional_configs[*]`

| Field | Role | Set / enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `data_id` | Remote config identifier. | Always for every extra config source. | Required in practice. | Forgetting file suffixes or using a data ID that does not exist remotely. |
| `group` | Group for that config source. | When the extra config is stored outside `DEFAULT_GROUP`. | Defaults to `DEFAULT_GROUP`. | Copying the main config group when the shared config lives elsewhere. |
| `format` | Config format presented to Kratos config loader. | When the data ID extension is ambiguous or missing. | If omitted, runtime infers from file extension; falls back to `yaml`. | Setting `json` while the remote content is actually YAML. |

## Complete YAML Example

```yaml
lynx:
  nacos:
    server_addresses: 127.0.0.1:8848 # Required unless endpoint is used instead
    namespace_id: "" # Optional namespace ID; takes precedence over namespace when set
    namespace: public # Namespace name fallback; runtime default is public
    username: "" # Optional username for auth-enabled deployments
    password: "" # Optional password paired with username
    access_key: "" # Optional cloud-style access key
    secret_key: "" # Optional cloud-style secret paired with access_key
    weight: 1.0 # Instance weight for registration
    metadata:
      version: v1.0.0 # Example release metadata
      env: production # Example environment label
    enable_register: true # Enable naming client registration
    enable_discovery: true # Enable naming client discovery
    enable_config: true # Enable config-center client
    timeout: 5 # Client timeout in seconds; runtime default is 5
    log_level: info # Supported values: debug, info, warn, error
    log_dir: ./logs/nacos # SDK log directory
    cache_dir: ./cache/nacos # SDK cache directory
    notify_timeout: 3000 # Config notification timeout in milliseconds
    service_config:
      service_name: my-service # Registration-side service name hint
      group: DEFAULT_GROUP # Default Nacos group
      cluster: DEFAULT # Default Nacos cluster label
      health_check: true # Enable health-check metadata on registration
      health_check_interval: 5 # Health-check interval in seconds
      health_check_timeout: 3 # Health-check timeout in seconds
      health_check_type: tcp # Supported values: none, tcp, http, mysql
      health_check_url: "" # Required only when health_check_type is http
    additional_configs:
      - data_id: database-config.yaml # Extra remote config source
        group: DEFAULT_GROUP # Group for this config source
        format: yaml # Loader format for the fetched content
      - data_id: feature-flags.json # Second extra remote config source
        group: DEFAULT_GROUP # Group for this config source
        format: json # Loader format for the fetched content
    context_path: /nacos # Nacos server context path
    endpoint: "" # Optional server endpoint alternative to server_addresses
    region_id: "" # Optional region hint for cloud deployments
```

## Minimum Viable YAML Example

At least one capability switch must be enabled, otherwise the plugin starts without creating any Nacos client.

```yaml
lynx:
  nacos:
    server_addresses: 127.0.0.1:8848 # Required server address when endpoint is not used
    enable_config: true # Smallest useful switch that creates a config client
```

## Common Misconfigurations

- All three feature flags stay `false`, so the plugin starts with no Nacos client.
- `service_config.service_name` is treated as the registry service name, while the actual registrar still uses the runtime service instance name.
- `health_check_type: http` is configured without `health_check_url`.
- `notify_timeout` is supplied in seconds by mistake even though the field is milliseconds.
- `endpoint` and `server_addresses` point to different clusters, leading to confusing runtime behavior.

## Runtime Usage

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("nacos.control.plane")
nacosPlugin := plugin.(*nacos.PlugNacos)

sources, err := nacosPlugin.GetConfigSources()
source, err := nacosPlugin.GetConfig("application.yaml", "DEFAULT_GROUP")
registrar := nacosPlugin.NewServiceRegistry()
discovery := nacosPlugin.NewServiceDiscovery()
```

Choose Nacos when your organization already standardizes on Nacos naming or config center. If you only need config-center behavior, [Apollo](/docs/existing-plugin/apollo) or [Etcd](/docs/existing-plugin/etcd) is usually narrower.

## Related Pages

- [Polaris](/docs/existing-plugin/polaris)
- [Apollo](/docs/existing-plugin/apollo)
- [Etcd](/docs/existing-plugin/etcd)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
