---
id: pulsar
title: Pulsar Plugin
---

# Pulsar Plugin

This page explains the YAML fields from `lynx-pulsar/conf/example_config.yml`. The example already matches the runtime prefix and lives under `lynx.pulsar`.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-pulsar` |
| Config prefix | `lynx.pulsar` |
| Runtime plugin name | `pulsar.client` |
| Public APIs | `GetPulsarClient()`, `GetPulsarClientByName()` |

`GetPulsarClientByName()` exists, but the current implementation still returns the main runtime client rather than a fully separate plugin instance per name.

## YAML Walkthrough

### Top-level `lynx.pulsar`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `service_url` | Pulsar service endpoint. | Always. The client cannot boot without a reachable broker URL. | The constructor default is `pulsar://localhost:6650`; keep it explicit in service config. | Mixing `pulsar://` and `pulsar+ssl://` with the wrong TLS posture. |
| `auth` | Authentication block. | When the cluster requires token, OAuth2, or TLS auth. | Only the child block that matches `auth.type` is meaningful. | Filling multiple auth blocks and forgetting which one is actually active. |
| `tls` | TLS transport block. | TLS-enabled broker connections. | Independent from `auth.tls_auth`: transport TLS protects the connection, `tls_auth` supplies client credentials. | Enabling transport TLS but forgetting the trust bundle or hostname policy. |
| `connection` | Connection and pooling settings. | Long-lived service runtimes. | Only a subset is currently mapped into `pulsar.ClientOptions`; see row details below. | Assuming every example knob is already wired into the current client bootstrap path. |
| `producers` | Named producer definitions. | When the service publishes to Pulsar topics. | Each enabled producer is created during startup. | Leaving sample producers enabled for topics the service does not own. |
| `consumers` | Named consumer definitions. | When the service consumes from Pulsar topics. | Each enabled consumer is created during startup. | Treating the example consumer list as safe defaults instead of explicit runtime contracts. |
| `retry` | Shared retry-manager settings. | Runtime retry helpers and operational policy. | The repo creates and registers a retry manager from this block. | Assuming it automatically rewrites every producer and consumer behavior without verifying the actual call path. |
| `monitoring` | Metrics and health-check settings. | Runtime observability. | Health-check start behavior is controlled here; not every metric/export switch is fully wired yet. | Expecting exporter behavior to change only by renaming the namespace in YAML. |

### `lynx.pulsar.auth`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `auth.type` | Auth mode selector: empty, `token`, `oauth2`, `tls`. | Always when auth is required. | Empty means no auth. It decides which child block matters. | Setting a token or OAuth2 block but leaving `type` empty. |
| `auth.token` | Token value for token auth. | Only when `auth.type: "token"`. | Ignored for other auth modes. | Leaving a placeholder token in config and debugging auth failures at the broker. |
| `auth.oauth2.issuer_url` | OAuth2 issuer endpoint. | Only when `auth.type: "oauth2"`. | Passed into Pulsar OAuth2 auth params. | Using an application login issuer instead of the Pulsar-facing issuer endpoint. |
| `auth.oauth2.client_id` | OAuth2 client ID. | Only when `auth.type: "oauth2"`. | Required for OAuth2 auth to work. | Rotating the secret but forgetting the client ID also changed. |
| `auth.oauth2.client_secret` | OAuth2 client secret. | Only when `auth.type: "oauth2"`. | Treat it as a secret source, not a committed value. | Checking it into Git or storing it next to non-secret config. |
| `auth.oauth2.audience` | OAuth2 audience string. | Only when `auth.type: "oauth2"`. | Must match what the identity provider expects for Pulsar. | Reusing an HTTP API audience for a Pulsar broker audience. |
| `auth.oauth2.scope` | OAuth2 scope string. | Only when `auth.type: "oauth2"` and the provider expects scopes. | Optional depending on the provider. | Adding scopes the broker-side identity integration never grants. |
| `auth.tls_auth.cert_file` | Client certificate path for TLS auth. | Only when `auth.type: "tls"`. | Used for Pulsar authentication, not generic trust. | Confusing it with `tls.trust_certs_file`. |
| `auth.tls_auth.key_file` | Client private key for TLS auth. | Only when `auth.type: "tls"`. | Must match the configured client certificate. | Mounting the wrong key pair. |
| `auth.tls_auth.ca_file` | CA file for TLS auth setup. | Only when `auth.type: "tls"`. | Keep it aligned with the broker trust chain. | Using a client cert chain file where a CA bundle is expected. |

### `lynx.pulsar.tls`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `tls.enable` | Enables TLS transport. | TLS-enabled broker URLs. | Defaults to `false`. Usually paired with `pulsar+ssl://...`. | Turning it on while still using a plaintext broker URL. |
| `tls.allow_insecure_connection` | Allows insecure TLS verification. | Only for tightly controlled local or temporary test environments. | Defaults to `false`. Weakens verification. | Leaving it enabled after certificate rollout is complete. |
| `tls.trust_certs_file` | Trust bundle path for broker cert verification. | Needed when broker CAs are not in the system trust store. | Optional for public or already-trusted CA chains. | Pointing it at the client cert instead of the CA file. |
| `tls.verify_hostname` | Enables hostname verification. | TLS-enabled connections. | Defaults to `true`. Works with the broker URL host name. | Setting it `false` to hide a real certificate naming problem. |

### `lynx.pulsar.connection`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `connection.connection_timeout` | Connection timeout. | Client bootstrap and reconnect paths. | Defaults to `30s` in the repo constructor and is passed into `pulsar.ClientOptions`. | Shrinking it below normal broker handshake latency. |
| `connection.operation_timeout` | Operation timeout. | Client operations handled by the Pulsar client. | Defaults to `30s` and is passed into `pulsar.ClientOptions`. | Treating it as a handler timeout for application business logic. |
| `connection.keep_alive_interval` | Keep-alive interval. | Long-lived connections. | Defaults to `30s` and is passed into `pulsar.ClientOptions`. | Driving it too low and creating unnecessary background traffic. |
| `connection.max_connections_per_host` | Max pooled connections per broker host. | High-throughput or multi-topic workloads. | Defaults to `1` and is passed into `pulsar.ClientOptions`. | Increasing it without checking broker and client memory impact. |
| `connection.connection_max_lifetime` | Intended max lifetime for one connection. | Connection rotation policy. | The example uses `0s` for no limit. The current `buildClientOptions` path does not wire this field. | Expecting connection rotation to begin immediately after editing YAML. |
| `connection.enable_connection_pooling` | Intended connection-pooling switch. | Throughput and connection management policy. | Defaults to `true` in the repo constructor. The current `buildClientOptions` path does not directly consume this flag. | Turning it off in YAML and assuming the client bootstrap no longer pools connections today. |

### `lynx.pulsar.producers[]`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `producers[].name` | Logical producer name. | Every runtime producer lookup. | Keep it stable because code and dashboards use it directly. | Renaming it without updating producer selection logic. |
| `producers[].enabled` | Enables or disables one producer definition. | Startup behavior. | Disabled entries are ignored. | Leaving sample producers enabled for topics no service owns. |
| `producers[].topic` | Target topic for that producer. | Every publish path. | One producer definition targets one topic. | Treating one producer definition as a wildcard publisher for many topics. |
| `producers[].options.producer_name` | Broker-visible producer name override. | Diagnostics and broker-side visibility. | Optional. Used when the current startup path creates the producer. | Expecting it to replace the logical Lynx producer name everywhere. |
| `producers[].options.send_timeout` | Per-message send timeout. | Every producer send. | Defaults to `30s` in the repo constructor and is applied when the option is set. | Leaving a tiny timeout on large payloads or cross-region traffic. |
| `producers[].options.max_pending_messages` | Max in-memory pending messages. | Backpressure and memory planning. | Defaults to `1000` in the repo constructor and is applied when the value is positive. | Raising it without increasing memory budgets. |
| `producers[].options.max_pending_messages_across_partitions` | Intended cross-partition pending cap. | Partitioned-topic backpressure planning. | Present in the template, but the current producer creation path does not wire it. | Assuming it already protects memory under partition fan-out. |
| `producers[].options.block_if_queue_full` | Intended block-vs-fail switch when the producer queue is full. | Backpressure policy. | Present in the template, but the current producer creation path does not wire it. | Expecting callers to block just because YAML says so. |
| `producers[].options.batching_enabled` | Enables batching for that producer. | Throughput-oriented workloads. | Defaults to `true` in the repo constructor. When `false`, the batching child fields stop mattering. | Disabling batching and then still tuning batching delay or batch size. |
| `producers[].options.batching_max_publish_delay` | Max batching delay. | Only when `batching_enabled: true`. | Defaults to `10ms` in the repo constructor and is applied when set. | Making it large on low-latency paths. |
| `producers[].options.batching_max_messages` | Max messages per batch. | Only when `batching_enabled: true`. | Defaults to `1000` in the repo constructor and is applied in the current startup path. | Growing it without checking downstream consumer burst handling. |
| `producers[].options.batching_max_size` | Max bytes per batch. | Only when `batching_enabled: true`. | Applied in the current startup path when batching is enabled. | Forgetting broker-side max message limits and creating oversize batches. |
| `producers[].options.compression_type` | Intended compression algorithm. | Broker bandwidth and storage tuning. | The example allows `none`, `lz4`, `zlib`, `zstd`, `snappy`, but the current producer creation path does not wire it. | Expecting compressed publish traffic after only editing YAML. |
| `producers[].options.hashing_scheme` | Intended partition hashing strategy. | Partition routing semantics. | Present in the template, but the current producer creation path does not wire it. | Believing key-based partition routing changed without validating runtime behavior. |
| `producers[].options.message_routing_mode` | Intended partition routing mode. | Partition distribution policy. | Present in the template, but the current producer creation path does not wire it. | Assuming single-partition routing is active because the YAML says so. |
| `producers[].options.enable_chunking` | Enables large-message chunking. | Large payload scenarios. | Defaults to `false`. When `true`, `chunk_max_size` becomes meaningful and is applied. | Enabling it without verifying consumers and brokers allow chunked payloads. |
| `producers[].options.chunk_max_size` | Maximum chunk size. | Only when `enable_chunking: true`. | Applied by the current producer creation path when chunking is enabled. | Setting it above broker or network limits. |

### `lynx.pulsar.consumers[]`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `consumers[].name` | Logical consumer name. | Runtime consumer lookup and metrics. | Keep it stable because handlers and ops tooling refer to it directly. | Renaming it without updating code or alerts. |
| `consumers[].enabled` | Enables or disables one consumer definition. | Startup behavior. | Disabled entries are ignored. | Leaving example consumers enabled for topics the service should not touch. |
| `consumers[].topics` | Topic list for that consumer. | Every startup-created Pulsar subscription. | Applied directly in `pulsar.ConsumerOptions`. | Mixing tenants or namespaces accidentally because a copied topic list was not trimmed. |
| `consumers[].subscription_name` | Subscription name. | Every consumer. | Applied directly in `pulsar.ConsumerOptions`. | Reusing a subscription name across unrelated applications and unintentionally sharing cursor state. |
| `consumers[].options.consumer_name` | Broker-visible consumer name override. | Diagnostics and broker-side visibility. | Optional. Applied when set. | Expecting it to replace the logical Lynx consumer key everywhere. |
| `consumers[].options.subscription_type` | Subscription type. | Consumer fan-out semantics. | The repo constructor default is `exclusive`; invalid strings fall back to exclusive in the current parser. | Writing `shared` or `failover` in the wrong case and assuming the parser will keep it. |
| `consumers[].options.subscription_initial_position` | Initial cursor position. | First start of a new subscription. | The repo constructor default is `latest`; invalid strings fall back to `latest`. | Switching it to `earliest` on a long-retained topic without planning replay volume. |
| `consumers[].options.subscription_mode` | Intended durable vs non-durable mode. | Cursor retention design. | Present in the template, but the current consumer creation path does not wire it. | Assuming non-durable behavior is active after changing only YAML. |
| `consumers[].options.receiver_queue_size` | Local receive buffer size. | Throughput and memory tuning. | Applied when the value is positive. | Raising it too far and turning backpressure into memory pressure. |
| `consumers[].options.max_total_receiver_queue_size_across_partitions` | Intended cross-partition receive cap. | Partitioned-topic buffer planning. | Present in the template, but the current consumer creation path does not wire it. | Assuming it already caps total buffered messages. |
| `consumers[].options.consumer_name_prefix` | Intended prefix for generated consumer names. | Dynamic consumer naming strategies. | Present in the template, but the current consumer creation path does not wire it. | Expecting broker-side names to inherit the prefix automatically today. |
| `consumers[].options.read_compacted` | Intended compacted-topic read mode. | Compacted-topic semantics. | Present in the template, but the current consumer creation path does not wire it. | Turning it on for a non-compacted topic and expecting any effect. |
| `consumers[].options.enable_retry_on_message_failure` | Intended retry-on-failure switch. | Failure-handling policy. | Present in the template, but the current consumer creation path does not wire it. | Assuming failed messages already enter a retry flow because YAML says `true`. |
| `consumers[].options.retry_enable` | Intended consumer retry switch. | Failure-handling policy. | Present in the template, but the current consumer creation path does not wire it. | Enabling it without validating the actual consumer retry implementation. |
| `consumers[].options.ack_timeout` | Intended ack timeout. | Timeout-based redelivery policy. | Present in the template, but the current consumer creation path does not wire it. | Expecting timeout redelivery behavior after only editing YAML. |
| `consumers[].options.negative_ack_delay` | Delay before negative-ack redelivery. | Failure recovery tuning. | The repo constructor default is `1m`, and the current consumer creation path applies it when set. | Setting it too low and hammering a still-unhealthy downstream dependency. |
| `consumers[].options.priority_level` | Intended consumer priority. | Priority-based broker scheduling. | Present in the template, but the current consumer creation path does not wire it. | Assuming broker priority changed without runtime validation. |
| `consumers[].options.crypto_failure_action` | Intended action on crypto failures. | Encrypted-topic failure handling. | Present in the template, but the current consumer creation path does not wire it. | Thinking `discard` or `consume` is active when the code still uses the default path. |
| `consumers[].options.properties` | Extra consumer properties. | Ownership, tracing, and diagnostics metadata. | Applied directly in the current consumer creation path when set. | Packing secrets into metadata properties. |
| `consumers[].options.dead_letter_policy.max_redeliver_count` | Intended max redeliveries before DLQ. | DLQ policy design. | Present in the template, but the current consumer creation path does not wire the dead-letter policy block. | Expecting DLQ rollover to happen automatically today. |
| `consumers[].options.dead_letter_policy.dead_letter_topic` | Intended DLQ topic. | DLQ policy design. | Present in the template, but the current consumer creation path does not wire the dead-letter policy block. | Creating the topic name in YAML and assuming the subscription flow already uses it. |
| `consumers[].options.dead_letter_policy.initial_subscription_name` | Intended initial subscription on the DLQ topic. | DLQ ownership design. | Present in the template, but the current consumer creation path does not wire the dead-letter policy block. | Assuming DLQ subscription ownership is already provisioned. |

### `lynx.pulsar.retry`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `retry.enable` | Enables the shared retry manager. | Retry helper behavior. | The repo constructor default is `true`; keep it explicit in service config. | Setting it `false` but still assuming retry helper metrics or behavior remain active. |
| `retry.max_attempts` | Max retry attempts. | Shared retry policy. | The repo constructor default is `3`. | Raising it without bounding worst-case latency. |
| `retry.initial_delay` | First retry delay. | Shared retry policy. | The repo constructor default is `100ms`. | Setting it below the time needed for a transient dependency to recover. |
| `retry.max_delay` | Upper bound for retry delay. | Shared retry policy. | The repo constructor default is `30s`. | Forgetting to cap exponential backoff and then waiting too long under incident conditions. |
| `retry.retry_delay_multiplier` | Exponential backoff multiplier. | Shared retry policy. | The repo constructor default is `2.0`. | Combining a high multiplier with a high max attempts count and creating extreme tail latency. |
| `retry.jitter_factor` | Randomness added to retry delay. | Shared retry policy. | The repo constructor default is `0.1`. | Setting it to `0` and creating synchronized retry spikes across replicas. |

### `lynx.pulsar.monitoring`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `monitoring.enable_metrics` | Intended metrics enable switch. | Metrics/export policy. | The repo constructor default is `true`, but the current plugin still creates its metrics struct regardless of this flag. | Turning it off in YAML and assuming no metrics are being tracked anywhere in-process. |
| `monitoring.metrics_namespace` | Intended metrics namespace prefix. | Dashboard and alert naming. | The repo constructor default is `lynx_pulsar`, but the current repo does not wire it into a dedicated exporter path. | Renaming it in YAML and expecting existing dashboards to discover the new namespace automatically. |
| `monitoring.enable_health_check` | Enables the background health checker. | Startup and ongoing health checks. | The repo constructor default is `true`. The checker only starts when this field is true. | Turning it off and then expecting plugin-level liveness checks to keep updating. |
| `monitoring.health_check_interval` | Health-check interval. | When `enable_health_check: true`. | The repo constructor default is `30s`, and it seeds the health checker interval. | Making it too small and turning a lightweight check into noisy background work. |
| `monitoring.enable_tracing` | Intended tracing switch. | Tracing/export policy. | Present in the template, but the current plugin startup path does not wire tracing from this flag. | Assuming broker tracing is active after changing only this YAML row. |

## Complete YAML Example

```yaml
lynx:
  pulsar:
    service_url: "pulsar://localhost:6650" # Required broker URL; use pulsar+ssl://... for TLS endpoints

    # Authentication: leave type empty for local clusters without auth
    auth:
      type: "token" # "" | token | oauth2 | tls
      token: "your-token" # Used only when type is token

      oauth2:
        issuer_url: "https://issuer.example.com" # OAuth2 issuer endpoint
        client_id: "pulsar-client" # OAuth2 client ID
        client_secret: "pulsar-secret" # OAuth2 client secret
        audience: "pulsar://cluster" # Audience expected by the identity provider
        scope: "openid profile email" # Optional scopes for OAuth2 auth

      tls_auth:
        cert_file: "/etc/pulsar/client.crt" # Client certificate for TLS authentication
        key_file: "/etc/pulsar/client.key" # Client private key for TLS authentication
        ca_file: "/etc/pulsar/ca.crt" # CA bundle for TLS authentication

    # Transport TLS: independent from auth.tls_auth
    tls:
      enable: true # Enable TLS transport to the broker
      allow_insecure_connection: false # Keep false outside controlled local debugging
      trust_certs_file: "/etc/pulsar/trust-certs.pem" # Custom trust bundle for broker certificates
      verify_hostname: true # Keep true unless you are debugging certificate naming

    # Connection settings
    connection:
      connection_timeout: 30s # Active client connection timeout
      operation_timeout: 30s # Active client operation timeout
      keep_alive_interval: 30s # Active keep-alive interval
      max_connections_per_host: 1 # Active max pooled connections per broker
      connection_max_lifetime: 0s # 0s means no forced connection rotation
      enable_connection_pooling: true # Intended connection-pooling switch in config

    # Named producers
    producers:
      - name: "default-producer" # Application-facing producer name
        enabled: true # Disabled entries are ignored
        topic: "default-topic" # One producer definition maps to one topic
        options:
          producer_name: "lynx-default-producer" # Broker-visible producer name override
          send_timeout: 30s # Active send timeout
          max_pending_messages: 1000 # Active in-memory pending message limit
          max_pending_messages_across_partitions: 50000 # Intended cross-partition pending cap
          block_if_queue_full: false # Intended block-vs-fail policy when the queue is full
          batching_enabled: true # Batch for throughput; false favors lower latency
          batching_max_publish_delay: 10ms # Max wait before flushing a partial batch
          batching_max_messages: 1000 # Max messages per batch
          batching_max_size: 131072 # Max batch bytes; 128 KiB in this example
          compression_type: "none" # none | lz4 | zlib | zstd | snappy
          hashing_scheme: "java_string_hash" # Partition hashing scheme
          message_routing_mode: "round_robin" # round_robin | single_partition | custom_partition
          enable_chunking: false # Enable only for large payload scenarios
          chunk_max_size: 1048576 # Max chunk size when chunking is enabled

    # Named consumers
    consumers:
      - name: "default-consumer" # Application-facing consumer name
        enabled: true # Disabled entries are ignored
        topics:
          - "default-topic" # Topics to subscribe to
        subscription_name: "default-subscription" # Subscription cursor name
        options:
          consumer_name: "lynx-default-consumer" # Broker-visible consumer name override
          subscription_type: "exclusive" # exclusive | shared | failover | key_shared
          subscription_initial_position: "latest" # latest | earliest
          subscription_mode: "durable" # durable | non_durable
          receiver_queue_size: 1000 # Active local receive buffer size
          max_total_receiver_queue_size_across_partitions: 50000 # Intended cross-partition receive cap
          consumer_name_prefix: "lynx-consumer" # Intended prefix for generated consumer names
          read_compacted: false # Intended compacted-topic read mode
          enable_retry_on_message_failure: true # Intended message-failure retry switch
          retry_enable: true # Intended consumer retry switch
          ack_timeout: 0s # 0s means no ack-timeout-driven redelivery
          negative_ack_delay: 1m # Active delay before negative-ack redelivery
          priority_level: 0 # Intended broker-side consumer priority
          crypto_failure_action: "fail" # fail | discard | consume
          properties:
            application: "lynx-framework" # Free-form metadata for ownership and diagnostics
            version: "2.0.0"
          dead_letter_policy:
            max_redeliver_count: 3 # Intended max redeliveries before DLQ
            dead_letter_topic: "dlq-topic" # Intended dead-letter topic name
            initial_subscription_name: "dlq-subscription" # Intended initial DLQ subscription name

    # Shared retry manager
    retry:
      enable: true # Enable the shared retry manager
      max_attempts: 3 # Max retry attempts
      initial_delay: 100ms # First retry delay
      max_delay: 30s # Upper bound for retry backoff
      retry_delay_multiplier: 2.0 # Exponential backoff multiplier
      jitter_factor: 0.1 # Randomness to avoid synchronized retries

    # Monitoring and health checks
    monitoring:
      enable_metrics: true # Intended metrics switch
      metrics_namespace: "lynx_pulsar" # Intended metrics namespace prefix
      enable_health_check: true # Start the background health checker
      health_check_interval: 30s # Health-check interval
      enable_tracing: false # Intended tracing switch
```

## Minimum Viable YAML Example

```yaml
lynx:
  pulsar:
    service_url: "pulsar://localhost:6650"
    producers:
      - name: "default-producer"
        enabled: true
        topic: "default-topic"
```

## Source Template

- `lynx-pulsar/conf/example_config.yml`

## How To Consume It

```go
import pulsarplug "github.com/go-lynx/lynx-pulsar"

client, err := pulsarplug.GetPulsarClient()
```

Use the runtime-owned client and its producer or consumer helpers instead of treating each named producer as a separate plugin instance.

## Related Pages

- [Kafka](/docs/existing-plugin/kafka)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
