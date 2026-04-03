---
id: rocketmq
title: RocketMQ Plugin
---

# RocketMQ Plugin

This page explains the YAML fields from `lynx-rocketmq/conf/example_config.yml`. The runtime prefix is `rocketmq`, so the example shape can be dropped directly into a Lynx bootstrap file.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-rocketmq` |
| Config prefix | `rocketmq` |
| Runtime plugin name | `rocketmq` |
| Public API shape | plugin-manager lookup to `rocketmq` and `rocketmq.ClientInterface` methods |

## YAML Walkthrough

### Top-level `rocketmq`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `name_server` | RocketMQ NameServer address list. | Always. Startup validation fails when it is empty. | No safe default. Health checks probe these addresses directly. | Pointing at broker ports instead of NameServer ports. |
| `access_key` | ACL access key. | Only for ACL-enabled clusters. | It is used only when `secret_key` is also set. | Setting only one half of the credential pair. |
| `secret_key` | ACL secret key. | Only for ACL-enabled clusters. | It is used only when `access_key` is also set. | Leaving the example placeholder in source control. |
| `dial_timeout` | Intended dial timeout knob. | Connection-SLA planning and troubleshooting. | Defaults to `3s` when omitted, but the current client creation path does not pass it into the RocketMQ SDK or NameServer probe. | Tuning it and expecting startup latency to change immediately. |
| `request_timeout` | Intended request timeout knob. | Request-SLA planning and troubleshooting. | Defaults to `30s` when omitted, but the current client creation path does not pass it into the RocketMQ SDK. | Treating it as the active send timeout while `send_timeout` still controls producer sends. |
| `producers` | Named producer definitions. | When the service sends RocketMQ messages. | Enabled producers are created during startup; the first enabled one becomes the default producer for name-less sends. | Keeping example producers enabled when the service only needs one routing identity. |
| `consumers` | Named consumer definitions. | When the service subscribes to topics. | Enabled consumers are created during startup; the first enabled one becomes the default consumer. | Assuming config topics alone start message consumption before code calls `SubscribeWith`. |

### `rocketmq.producers[]`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `name` | Logical producer name used by application code. | Every named send path. | Keep it stable because `SendMessageWith` references it directly. | Renaming it in YAML without updating callers. |
| `enabled` | Enables or disables one producer instance. | When the service should be able to send with that profile. | Disabled entries are ignored. | Copying the example batch and high-priority producers into a service that never uses them. |
| `group_name` | RocketMQ producer group. | Every producer instance. | Defaults to `lynx-producer-group` when omitted. | Reusing one group name across unrelated services without an ops convention. |
| `max_retries` | Retry count requested for the producer profile. | Send paths under transient broker errors. | Defaults to `3`. The repo also has a shared retry handler; validate final send semantics with your actual call path. | Raising it without checking duplicate business side effects. |
| `retry_backoff` | Intended delay between retries. | Send retry tuning. | Defaults to `100ms` when omitted. | Setting it extremely low and amplifying broker outages with hot-loop retries. |
| `send_timeout` | Per-message send timeout. | Every producer send. | Defaults to `3s` when omitted and is passed into producer creation. | Leaving a tiny timeout on large payloads or slow cross-region clusters. |
| `enable_trace` | Intended producer trace switch. | When you want RocketMQ trace overhead for diagnostics. | Present in the template, but the current producer creation path does not wire it into SDK options. | Turning it on in YAML and assuming trace is already emitted. |
| `topics` | Topic allow-list and review hint for the producer. | Useful for producer ownership and config review. | Topics are validated, but actual send calls still pass the topic explicitly. | Updating the YAML list and forgetting to update code. |

### `rocketmq.consumers[]`

| Field | What it controls | When it matters | Default / interaction | Common misconfig |
| --- | --- | --- | --- | --- |
| `name` | Logical consumer name used by application code. | Every named subscribe path. | Keep it stable because `SubscribeWith` uses it directly. | Renaming it in YAML while handlers still select the old name. |
| `enabled` | Enables or disables one consumer instance. | When the service should be able to subscribe with that profile. | Disabled entries are ignored. | Expecting disabled template consumers to remain selectable. |
| `group_name` | RocketMQ consumer group. | Every consumer instance. | Defaults to `lynx-consumer-group` when omitted. | Mixing unrelated workloads into one group and then misreading load-sharing behavior. |
| `consume_model` | Delivery model: `CLUSTERING` or `BROADCASTING`. | Consumer boot and scaling design. | The current consumer creation path maps it into the SDK consumer model. | Expecting `BROADCASTING` semantics while reusing a clustering mental model for capacity planning. |
| `consume_order` | Handling order: `CONCURRENTLY` or `ORDERLY`. | Handler semantics and partitioning design. | The current consumer creation path maps it into the SDK order flag. | Enabling ordered consumption while still writing non-order-safe handlers. |
| `max_concurrency` | Maximum consume goroutine count. | Every active consumer. | Defaults to `1` when omitted and is passed into the SDK. | Raising it without checking ordering and downstream idempotency. |
| `pull_batch_size` | Number of messages pulled per batch. | Throughput tuning. | Defaults to `32` when omitted and is passed into the SDK. | Increasing it until one poll overwhelms handler memory or latency budgets. |
| `pull_interval` | Delay between pull cycles. | Throughput and broker-pressure tuning. | Defaults to `100ms` when omitted and is passed into the SDK. | Setting it too low and turning idle consumers into tight polling loops. |
| `enable_trace` | Intended consumer trace switch. | Diagnostics. | Present in the template, but the current consumer creation path does not wire it into SDK options. | Assuming trace is active just because the YAML says so. |
| `topics` | Topic list the consumer is expected to own. | Subscription review and handler design. | Topics are validated in config, but application code still passes topics again to `SubscribeWith`. | Updating one list and forgetting the other. |

## Source Template

- `lynx-rocketmq/conf/example_config.yml`

## How To Consume It

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("rocketmq")
client := plugin.(rocketmq.ClientInterface)
```

After resolving the plugin, use the named producer and consumer methods exposed by `rocketmq.ClientInterface`.

## Related Pages

- [RabbitMQ](/docs/existing-plugin/rabbitmq)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
