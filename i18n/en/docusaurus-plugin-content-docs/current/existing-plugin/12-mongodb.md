---
id: mongodb
title: MongoDB Plugin
---

# MongoDB Plugin

`lynx-mongodb` is the runtime-owned MongoDB client for Lynx. This page documents the fields that appear in `lynx-mongodb/conf/example_config.yml`, including when each key matters, how defaults behave, and where users commonly misread the template.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-mongodb` |
| Config prefix | `lynx.mongodb` |
| Runtime plugin name | `mongodb.client` |
| Public getters | `GetMongoDB()`, `GetMongoDBDatabase()`, `GetMongoDBCollection(name)`, `GetMetricsGatherer()`, `GetMongoDBPlugin()` |

## Template Field Guide

| Field | What it controls | Enable when | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `uri` | Base MongoDB connection URI. | Always. | Default `"mongodb://localhost:27017"`. Replica-set, sharded, or SRV options still live inside this URI. | Splitting one deployment's connection settings between URI parameters and separate YAML keys until ownership becomes unclear. |
| `database` | Default database returned by `GetMongoDBDatabase()`. | Always. | Default `"test"`. All `GetMongoDBCollection(name)` calls resolve from this database. | Forgetting to change the sample value and then creating collections in the wrong database. |
| `username` | MongoDB auth username. | Only for credential-based auth outside the URI. | Default empty. The plugin only applies auth when both `username` and `password` are non-empty. | Setting `username` alone and assuming auth was enabled. |
| `password` | MongoDB auth password. | Only for credential-based auth outside the URI. | Default empty. Ignored unless `username` is also set. | Populating a password but leaving `username` empty. |
| `auth_source` | Authentication database. | Only with `username` and `password`. | Default empty. Passed through with the credential block when auth is enabled. | Setting `auth_source` without actually enabling username/password auth. |
| `max_pool_size` | Maximum MongoDB driver pool size. | Usually always. | Default `100`. | Setting it too low for service concurrency and then blaming MongoDB for pool starvation. |
| `min_pool_size` | Minimum MongoDB driver pool size. | When you want some warm idle capacity. | Default `5`. | Raising it for low-traffic services and paying for unused connections all day. |
| `connect_timeout` | Initial connection timeout. | Usually always. | Default `"30s"`. Affects startup and reconnect attempts. | Making it too small for cold starts or cross-zone connections. |
| `server_selection_timeout` | Time budget for selecting a MongoDB server. | Especially important for replica sets and sharded clusters. | Default `"30s"`. | Setting it too low during failover-prone or multi-node deployments. |
| `socket_timeout` | Socket read/write timeout. | Usually always. | Default `"30s"`. | Leaving it shorter than legitimate long-running MongoDB operations. |
| `heartbeat_interval` | Driver heartbeat interval. | Usually leave the default. | Default `"10s"`. Lower values notice topology changes faster but create more background traffic. | Tuning it down aggressively without checking cluster overhead. |
| `enable_metrics` | Turns on plugin-local Prometheus metrics. | When you will expose the plugin gatherer in `/metrics`. | Default `false`. | Enabling it but never merging `GetMetricsGatherer()` into the application's metrics endpoint. |
| `enable_health_check` | Turns on background health checks. | When you want periodic runtime health visibility. | Default `false`. Startup connection testing still happens either way. | Setting it to `false` and assuming startup ping is disabled. |
| `health_check_interval` | Background health-check interval. | Only when `enable_health_check: true`. | Default `"30s"`. | Tweaking it without enabling health checks and expecting any effect. |
| `enable_tls` | Enables TLS file handling for the client options. | When the deployment requires TLS and you are using file-based TLS material. | Default `false`. The implementation only builds a TLS config from the provided files; `enable_tls: true` with all TLS file paths empty does not inject a custom TLS config by itself. | Setting `enable_tls: true` but providing neither TLS files nor URI-level TLS options. |
| `tls_cert_file` | Client certificate path. | Only for mTLS-style setups with `enable_tls: true`. | Default empty. | Filling the path while leaving `enable_tls` off. |
| `tls_key_file` | Client private key path. | Only for mTLS-style setups with `enable_tls: true`. | Default empty. | Setting a cert without its matching key. |
| `tls_ca_file` | Custom CA certificate path. | When the cluster CA is not already trusted by the host. | Default empty. | Assuming a private CA will be trusted automatically. |
| `enable_compression` | Enables MongoDB compressor negotiation. | When network savings matter and the cluster supports it. | Default `false`. The plugin enables `zlib` and `snappy`. | Setting `compression_level` alone and expecting compression to turn on. |
| `compression_level` | Stored compression-level hint. | Only as metadata for now. | Default `0`. The current implementation stores it but does not apply it to driver options. | Tuning this field and expecting a runtime change today. |
| `enable_retry_writes` | Enables retryable writes. | When the cluster topology supports retryable writes. | Default `false`. | Enabling it against deployments that do not support retryable writes. |
| `enable_read_concern` | Applies read concern to the client. | When you need explicit read-consistency semantics. | Default `false`. | Setting `read_concern_level` and forgetting the enable flag. |
| `read_concern_level` | Read concern level. | Only when `enable_read_concern: true`. | Default `"local"`. Unknown values fall back to `local` in the current implementation. | Typos that silently degrade to `local`. |
| `enable_write_concern` | Applies write concern to the client. | When durability semantics matter. | Default `false`. | Setting `write_concern_w` / `write_concern_timeout` and forgetting this switch. |
| `write_concern_w` | Write concern acknowledgement level. | Only when `enable_write_concern: true`. | Default `1`. | Raising it without checking replica topology and latency impact. |
| `write_concern_timeout` | Write concern timeout. | Only when `enable_write_concern: true`. | Default `"5s"`. | Setting a timeout shorter than normal replica acknowledgement latency. |

## Complete YAML Example

This example expands every field that appears in `lynx-mongodb/conf/example_config.yml`.

```yaml
lynx:
  mongodb:
    uri: "mongodb://localhost:27017" # Base MongoDB connection URI.
    database: "orders" # Default database returned by GetMongoDBDatabase().
    username: "admin" # Credential username when you do not keep auth in the URI.
    password: "change_me" # Credential password paired with username.
    auth_source: "admin" # Authentication database for username/password auth.
    max_pool_size: 100 # Maximum MongoDB driver pool size.
    min_pool_size: 5 # Minimum warm idle connections kept by the driver.
    connect_timeout: "30s" # Initial connection timeout.
    server_selection_timeout: "30s" # Server-selection timeout for replica sets or sharded clusters.
    socket_timeout: "30s" # Socket read/write timeout.
    heartbeat_interval: "10s" # Driver heartbeat interval.
    enable_metrics: true # Export plugin-local Prometheus metrics when you expose the gatherer.
    enable_health_check: true # Run background health checks after startup.
    health_check_interval: "30s" # Interval for background health checks.
    enable_tls: false # Switch on TLS file handling when cert/key/CA files are provided.
    tls_cert_file: "" # Optional client certificate path for mTLS.
    tls_key_file: "" # Optional client private-key path for mTLS.
    tls_ca_file: "" # Optional CA bundle path.
    enable_compression: true # Enable zlib/snappy compressor negotiation.
    compression_level: 6 # Stored compression-level hint; current runtime does not apply it to driver options.
    enable_retry_writes: true # Enable retryable writes when topology supports them.
    enable_read_concern: true # Apply read concern to the client.
    read_concern_level: "local" # Read concern level used when enable_read_concern is true.
    enable_write_concern: true # Apply write concern to the client.
    write_concern_w: 1 # Write concern acknowledgement level.
    write_concern_timeout: "5s" # Write concern timeout.
```

## Minimum Viable YAML Example

The runtime can boot from defaults alone, so the smallest runnable block is an empty `lynx.mongodb` object.

```yaml
lynx:
  mongodb: {} # Defaults to mongodb://localhost:27017 and database "test" for local development.
```

## Practical Notes

- `GetMongoDBCollection(name)` resolves from the default `database`; collection creation, indexes, and document schema still belong to application code.
- Metrics and background health checks are independent toggles: one controls observability export, the other controls periodic runtime probing.
- If you prefer URI-native auth or TLS options, keep them in one place instead of mixing equivalent settings between the URI and top-level YAML.

## Related Pages

- [Database Plugin](/docs/existing-plugin/db)
- [Layout](/docs/existing-plugin/layout)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
