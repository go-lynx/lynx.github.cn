---
id: kafka
title: Kafka Plugin
---

# Kafka Plugin

This page explains the YAML fields from `lynx-kafka/conf/example_config.yml`. The repository example uses a standalone `kafka:` block; when you merge it into a Lynx bootstrap file, the same fields live under `lynx.kafka`.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-kafka` |
| Config prefix | `lynx.kafka` |
| Runtime plugin name | `kafka.client` |
| Main API shape | plugin instance methods such as `ProduceWith`, `ProduceBatchWith`, `SubscribeWith` |

## YAML Walkthrough

### Top-level `kafka`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `brokers` | Seed broker address list shared by all producer and consumer instances. | Always. Startup validation fails when it is empty. | No safe default. Every runtime client reuses this list. | Pointing TLS or SASL traffic at a PLAINTEXT listener, or keeping only one stale broker address. |
| `tls` | TLS and mTLS settings for broker connections. | Only when the broker exposes TLS listeners. | Child fields are ignored unless `tls.enabled: true`. | Turning it on for plaintext brokers, or setting only `cert_file` without `key_file`. |
| `sasl` | SASL authentication settings. | Only when the Kafka cluster requires SASL. | Child fields are ignored unless `sasl.enabled: true`. SASL can be combined with TLS. | Filling `username` and `password` but leaving `enabled: false`, or choosing a mechanism the cluster does not support. |
| `dial_timeout` | Dial timeout for producer and consumer network bootstrapping. | Startup and reconnect paths. | Defaults to `10s` when omitted. | Lowering it too far in cross-AZ or cross-region environments and treating timeout noise as broker instability. |
| `producers` | Named producer definitions. | When the service publishes messages. | The first enabled producer becomes the implicit default producer for name-less calls. | Expecting disabled items to reserve names or health status at runtime. |
| `consumers` | Named consumer definitions. | When the service subscribes to topics. | Consumers are initialized lazily on `SubscribeWith`; they are not all created at boot. | Assuming config alone starts message consumption before application code subscribes. |

### `kafka.tls`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `tls.enabled` | Turns broker TLS on or off. | Required for TLS or mTLS clusters. | Defaults to `false`. When `false`, the rest of `tls.*` is ignored. | Enabling it against non-TLS ports. |
| `tls.ca_file` | Custom CA bundle path. | Needed when broker certs are not trusted by the host OS. | Optional for public CA chains. | Pointing at the client cert instead of the CA bundle. |
| `tls.cert_file` | Client certificate for mTLS. | Only for broker-side client cert authentication. | Optional for server-only TLS. Must be paired with `tls.key_file`. | Setting it alone and expecting mTLS to work. |
| `tls.key_file` | Client private key for mTLS. | Only for broker-side client cert authentication. | Optional for server-only TLS. Must be paired with `tls.cert_file`. | Mounting the wrong key or forgetting the matching cert. |
| `tls.insecure_skip_verify` | Skips broker certificate verification. | Only for tightly controlled local test clusters. | Defaults to `false`. It weakens both security review and hostname validation. | Leaving it on in shared or production environments. |
| `tls.server_name` | Explicit SNI and hostname verification name. | Only when the broker certificate SAN/CN does not match the address in `brokers`. | Empty by default. Used together with `tls.enabled: true`. | Setting it to a broker ID or IP that is not actually present in the certificate. |

### `kafka.sasl`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `sasl.enabled` | Turns SASL auth on or off. | Required only for SASL-enabled clusters. | Defaults to `false`. When `false`, the rest of `sasl.*` is ignored. | Supplying credentials without enabling the block. |
| `sasl.mechanism` | SASL mechanism name. | When `sasl.enabled: true`. | Accepted values are `PLAIN`, `SCRAM-SHA-256`, `SCRAM-SHA-512`. | Picking `PLAIN` for a cluster that requires SCRAM, or using the right mechanism with the wrong port/security mode. |
| `sasl.username` | SASL username. | When `sasl.enabled: true`. | No default. Startup validation requires it once SASL is enabled. | Forgetting to inject the secret in non-local environments. |
| `sasl.password` | SASL password. | When `sasl.enabled: true`. | No default. Startup validation requires it once SASL is enabled. | Hard-coding it in the repo instead of secret management. |

### `kafka.producers[]`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `name` | Logical producer name used by application code. | Always for named publish calls. | Keep it stable because `ProduceWith` references it directly. | Renaming it in YAML without updating callers. |
| `enabled` | Enables or disables one producer instance. | When you want the instance to be available. | Disabled entries are ignored. | Leaving a template example enabled and accidentally creating an unused producer. |
| `required_acks` | Kafka ack policy. | Every publish path. | Allowed values are `-1`, `1`, `0`. The example sets `1`; keep it explicit because omitting an integer field can still collapse to `0` (`no ack`). | Forgetting to set it and accidentally turning a business topic into fire-and-forget semantics. |
| `batch_size` | Maximum messages buffered before a batch flush. | Throughput-sensitive producers. | Defaults to `1000` when omitted. Works together with `batch_timeout`. | Increasing it for low-latency traffic and then blaming Kafka for added tail latency. |
| `batch_timeout` | Maximum wait time before sending a partial batch. | Throughput-sensitive producers. | Defaults to `1s` when omitted. `batch_size: 1` or `batch_timeout: 0s` effectively disables async batching. | Keeping a long timeout on a latency-critical producer. |
| `compression` | Producer compression algorithm. | When publish bandwidth or broker storage matters. | Defaults to `snappy`. Valid values are `none`, `gzip`, `snappy`, `lz4`, `zstd`. | Choosing an algorithm unsupported by the broker/client toolchain or assuming compression is free for tiny messages. |
| `topics` | Topic allow-list and review hint for this producer. | Useful when one service owns multiple producers with distinct routing intent. | The publish call still passes the topic explicitly; keep the code path and config list aligned. | Assuming this list alone reroutes application publishes. |

### `kafka.consumers[]`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `name` | Logical consumer instance name. | Always for `SubscribeWith`. | Keep it stable because code and metrics reference it directly. | Renaming it in config while handlers still subscribe with the old name. |
| `enabled` | Enables or disables one consumer definition. | When the service should be allowed to subscribe with that instance. | Disabled entries are ignored. | Assuming a disabled consumer can still be selected by code. |
| `group_id` | Kafka consumer group ID. | Required for enabled consumers. | No default. Startup validation fails when it is empty. | Reusing the same group for unrelated workloads and then wondering why partitions move unexpectedly. |
| `auto_commit` | Whether offsets are committed automatically. | Every consumer path. | Defaults to `true`. When `false`, your handler must own commit timing. | Leaving it `true` for handlers that should commit only after downstream success. |
| `auto_commit_interval` | Interval for automatic offset commits. | Only when `auto_commit: true`. | Defaults to `5s` when omitted. | Tuning it while `auto_commit` is already `false`. |
| `start_offset` | Initial offset selection for new group state. | When the group has no stored offsets yet. | Defaults to `latest`. Valid values are `latest` and `earliest`. | Switching it to `earliest` in production and unexpectedly replaying retained history. |
| `max_concurrency` | Maximum handler concurrency for that consumer instance. | Every active consumer group. | Defaults to `10`. Must stay greater than `0`. | Cranking it up without checking downstream idempotency or partition-order requirements. |
| `rebalance_timeout` | Time budget for group rebalance work. | During consumer assignment and scale events. | Defaults to `30s` when omitted. | Setting it below the actual startup or assignment cost of the consumer. |
| `topics` | Intended topic set for the consumer definition. | Useful as configuration documentation and review guardrails. | Application code still passes topics again to `SubscribeWith`, so the two lists must stay aligned. | Updating YAML topics and forgetting to update the subscribe call. |

## Source Template

- `lynx-kafka/conf/example_config.yml`

## How To Consume It

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("kafka.client")
kafkaClient := plugin.(*kafka.Client)

err := kafkaClient.ProduceWith(ctx, "default", "orders", key, value)
err = kafkaClient.SubscribeWith(ctx, "group_a", []string{"topic_a"}, handler)
```

## Related Pages

- [Pulsar](/docs/existing-plugin/pulsar)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
