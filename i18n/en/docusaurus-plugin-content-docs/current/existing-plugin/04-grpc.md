---
id: grpc
title: gRPC Service
---

# gRPC Service

This page is based on these templates:

- `lynx-grpc/conf/example_config.yml`
- `lynx-grpc/conf/example_client_config.yml`
- `lynx-grpc/conf/example_complete_config.yml`
- `lynx-grpc/conf/example_polaris_config.yml`

It then cross-checks the templates against the current runtime code.

## Runtime Facts

| Capability | Go module | Config prefix | Runtime plugin name |
| --- | --- | --- | --- |
| gRPC server | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.service` | `grpc.service` |
| gRPC client | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.client` | `grpc.client` |

## Before You Configure It

- `lynx.grpc.service` and `lynx.grpc.client` are independent. You can run only the server, only the client, or both.
- The server runtime does not keep the protobuf defaults for stream and message sizes. If you omit them, startup applies safe runtime defaults of `1000` concurrent streams and `10 MiB` max recv/send message size.
- `lynx.grpc.service` also accepts extra YAML-only keys from the same prefix, such as `graceful_shutdown_timeout`, `rate_limit`, `max_inflight_unary`, and `circuit_breaker`.
- `subscribe_services` is the preferred client config. `services` remains only for backward compatibility.
- In the current client code, `tracing_enabled` is honored, but `metrics_enabled`, `logging_enabled`, `health_check_enabled`, `health_check_interval`, `max_message_size`, `compression_enabled`, and `compression_type` are defined in proto/examples without a matching runtime effect yet.
- In `subscribe_services[*]`, `tls_enable` and `tls_auth_type` do not inherit global client TLS defaults cleanly. Leaving them unset on the item means `false` / `0`, not "inherit".

## `lynx.grpc.service`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `network` | Chooses the listener transport. | Always. | Default `tcp`. | Setting `unix` but still using a TCP address. |
| `addr` | Sets the listen address. | Always. | Default `:9090`. | Binding loopback and expecting cross-host traffic. |
| `tls_enable` | Enables TLS on the gRPC server. | Only when certificate material is available. | Default `false`; pair it with a working [TLS Manager](/docs/existing-plugin/tls-manager) configuration. | Turning it on before the certificate provider is ready. |
| `tls_auth_type` | Chooses client-certificate behavior. | Only when `tls_enable: true`. | Default `0`; values `0..4`. | Setting mTLS auth here while leaving TLS off. |
| `timeout` | Sets the Kratos gRPC request timeout. | Always. | Default `10s`. | Expecting long-running RPCs to succeed without raising this timeout. |
| `max_concurrent_streams` | Caps HTTP/2 concurrent streams per connection. | At server startup. | If omitted or `0`, runtime still applies a safe default of `1000`. | Reading proto comments and assuming `0` means unlimited in practice. |
| `max_recv_msg_size` | Caps inbound message size in bytes. | At server startup. | If omitted or `0`, runtime applies `10 MiB`. | Expecting the upstream gRPC library default of about `4 MiB`. |
| `max_send_msg_size` | Caps outbound message size in bytes. | At server startup. | If omitted or `0`, runtime applies `10 MiB`. | Leaving it small on streaming or large-response APIs. |

## Extra `lynx.grpc.service` YAML Keys

`example_config.yml` also documents keys that are not in `service.proto`, but the runtime still scans them from the same `lynx.grpc.service` prefix through `ServerOptions`.

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `graceful_shutdown_timeout` | Sets how long cleanup waits for the server to stop. | During shutdown. | Default `30s`. | Confusing it with request timeout. |
| `enable_tracing` | Enables the gRPC tracing interceptor. | During startup. | Default `true`. | Turning it off and still expecting server spans. |
| `enable_request_logging` | Enables unary and stream request logging. | During startup. | Default `true`. | Disabling it and still looking for trace-id rich request logs. |
| `enable_metrics` | Enables unary and stream metrics interceptors. | During startup. | Default `true`. | Turning it off and then expecting server-side gRPC metrics to continue. |
| `rate_limit.enabled` | Enables the in-process server rate limiter. | During startup. | Default `false`; nothing happens unless you turn it on. | Assuming the commented example means the limiter is already active. |
| `rate_limit.rate_per_second` | Sets steady-state unary RPC throughput. | Only when `rate_limit.enabled: true`. | No extra default beyond the zero-value guard. | Setting it while `enabled` stays `false`. |
| `rate_limit.burst` | Sets burst capacity for the server limiter. | Only when `rate_limit.enabled: true`. | If `<= 0`, runtime falls back to `rate_per_second + 1`. | Leaving it at `0` and misreading the effective burst. |
| `max_inflight_unary` | Caps concurrent unary RPC execution. | Only when `> 0`. | Default `0` means unlimited. | Expecting it to affect streaming RPCs. |
| `circuit_breaker.enabled` | Enables the server-side circuit breaker. | During startup. | Default `false`. | Assuming the breaker is active because the HTTP plugin enables one by default. |
| `circuit_breaker.failure_threshold` | Failure count before the breaker opens. | Only when the breaker is enabled. | Default `5` when omitted or invalid. | Treating it as a percentage instead of a count. |
| `circuit_breaker.recovery_timeout` | Time before the breaker tries half-open. | Only when enabled. | Default `30s`. | Confusing it with per-request timeout. |
| `circuit_breaker.success_threshold` | Successful probes needed to close the breaker again. | Only when enabled. | Default `3`. | Leaving it too high and keeping the breaker half-open too long. |
| `circuit_breaker.timeout` | Timeout used while executing protected requests. | Only when enabled. | Default `10s`. | Assuming it replaces `lynx.grpc.service.timeout`; it is separate. |
| `circuit_breaker.max_concurrent_requests` | Caps concurrent requests while the breaker is involved. | Only when enabled. | Default `10`. | Setting it lower than normal load and creating artificial throttling. |

## `lynx.grpc.client`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `default_timeout` | Default timeout for outbound RPCs. | Used whenever a service item does not override `timeout`. | Default `10s`. | Forgetting it also controls the startup readiness check for `required: true` services. |
| `default_keep_alive` | Keepalive interval for client connections. | Applied when building connections. | Default `30s`. | Setting it too low and creating noisy reconnect churn. |
| `max_retries` | Default retry count for retryable unary RPC failures. | Used by the client retry interceptor. | Default `3`; `0` or less disables explicit retry at the item level, then falls back to the global value. | Setting a high number and forgetting retries still multiply latency. |
| `retry_backoff` | Base delay for retry backoff. | Used by the retry interceptor. | Default `1s`. | Setting a huge value and making short outages look like hangs. |
| `max_connections` | Maximum connections per service inside the pool. | Used when pooling is enabled or when creating pooled connections. | Default `10`. | Confusing it with the total number of services tracked; that is `pool_size`. |
| `tls_enable` | Enables TLS for fallback global client connections. | Used in `createConnection()` and legacy paths. | Default `false`. | Enabling it globally and assuming every `subscribe_services` item inherits it. |
| `tls_auth_type` | Default TLS auth mode for fallback global client connections. | Used with global TLS paths. | Default `0`. | Assuming it matters when TLS is disabled. |
| `connection_pooling` | Enables the multi-connection pool. | During client initialization. | Default `false`. | Turning it on but leaving `pool_size` or `max_connections` tuned for the wrong dimension. |
| `pool_size` | Sets the maximum number of service entries tracked by the pool. | Only when `connection_pooling: true`. | If `<= 0`, runtime falls back to `10`. | Reading it as "connections per service". |
| `idle_timeout` | Evicts idle pooled connections. | Only when `connection_pooling: true`. | If missing or `<= 0`, runtime falls back to `5m`. | Setting it under one minute and causing frequent reconnects. |
| `health_check_enabled` | Intended client health-check switch. | Parsed during startup. | Defined in proto/examples, but not used by current client code. | Expecting automatic gRPC health probing to start. |
| `health_check_interval` | Intended client health-check cadence. | Parsed during startup. | Defined in proto/examples, but not used today. | Tuning it and seeing no runtime change. |
| `metrics_enabled` | Intended client metrics toggle. | Parsed during startup. | Defined in proto/examples, but the current client always attaches metrics interceptors. | Setting it `false` and assuming metrics stop. |
| `tracing_enabled` | Enables trace-context injection into outbound metadata. | When building client interceptors. | Default `false`. | Forgetting this when `lynx-tracer` is enabled and expecting end-to-end traces. |
| `logging_enabled` | Intended client logging toggle. | Parsed during startup. | Defined in proto/examples, but the current client always attaches logging interceptors. | Setting it `false` and expecting the client to go quiet. |
| `max_message_size` | Intended client message-size override. | Parsed during startup. | Defined in proto/examples, but not applied in current dial options. | Treating it as an active protection limit. |
| `compression_enabled` | Intended compression switch. | Parsed during startup. | Defined in proto/examples, but not applied today. | Expecting gzip to appear on the wire automatically. |
| `compression_type` | Intended compression algorithm selector. | Parsed during startup. | Defined in proto/examples, but not applied today. | Setting `gzip` and blaming the server when traffic is still uncompressed. |
| `subscribe_services` | Preferred per-service connection and discovery config. | Used by `GetConnection(serviceName)` first. | Empty by default. | Keeping new services in the deprecated `services` list only. |
| `services` | Deprecated legacy static services list. | Used only when `subscribe_services` has no matching entry. | Still supported, but startup warns about it. | Adding discovery-first services here and expecting modern behavior. |

## `lynx.grpc.client.subscribe_services[*]`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `name` | Discovery name and lookup key for `GetConnection(name)`. | Always. | Required. | Duplicating the same service name twice; validation rejects duplicates. |
| `endpoint` | Static endpoint override. | Only when no discovery instance is available. | If discovery exists, current code ignores this field and uses discovery instead of a live fallback path. | Expecting it to act as a fallback while Polaris discovery is present. |
| `timeout` | Service-specific timeout override. | Used for request timeout and required-service readiness wait. | Falls back to `default_timeout`. | Leaving it too short on slow upstreams and failing startup when `required: true`. |
| `tls_enable` | Per-service TLS toggle. | Used whenever this subscribe item is selected. | Current code does not inherit the global client TLS toggle; omitted means `false`. | Enabling global TLS and forgetting to repeat it on each subscribed service. |
| `tls_auth_type` | Per-service TLS auth mode. | Only when `tls_enable: true` for the item. | Current code does not inherit the global auth mode cleanly; omitted means `0`. | Expecting global mTLS auth mode to carry over automatically. |
| `max_retries` | Service-specific retry override. | Used by the retry interceptor. | `0` falls back to the global retry count. | Setting it to `0` thinking that it means "no retries". |
| `required` | Fails startup when the upstream cannot be reached. | Only during startup readiness checks. | `false` by default. | Marking optional dependencies as required and blocking the whole service. |
| `metadata` | Additional metadata used by load-balancer filters and routing hints. | Only when the selected load balancer uses it. | Optional map. | Treating it as request metadata that is automatically sent on every RPC. |
| `load_balancer` | Chooses the service-selection strategy. | Only when discovery is available. | Current validator accepts `round_robin`, `random`, and `weighted_round_robin`. | Setting a strategy and then using only static endpoints with no discovery. |
| `circuit_breaker_enabled` | Enables the per-service client circuit breaker. | Only for that subscribed upstream. | Default `false`. | Assuming the global client has one breaker shared across all services. |
| `circuit_breaker_threshold` | Failure-count threshold for the per-service breaker. | Only when `circuit_breaker_enabled: true`. | Very high values trigger validator warnings. | Setting it so high that the breaker never trips meaningfully. |

## Deprecated `lynx.grpc.client.services[*]`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `name` | Legacy service key. | Always. | Required. | Reusing a modern discovery name here and forgetting to migrate to `subscribe_services`. |
| `endpoint` | Static upstream endpoint. | Always. | Required in the legacy list. | Leaving it empty and expecting discovery to fill it in. |
| `timeout` | Legacy per-service timeout. | When the legacy item is selected. | Falls back to the global client timeout when omitted. | Assuming it affects `subscribe_services`. |
| `tls_enable` | Legacy per-service TLS toggle. | When the legacy item is selected. | Default `false`. | Enabling TLS without a certificate provider in the app. |
| `tls_auth_type` | Legacy per-service TLS auth mode. | Only when legacy TLS is enabled. | Default `0`. | Expecting it to change anything while TLS is off. |
| `max_retries` | Legacy per-service retry count. | When the legacy item is selected. | Falls back to the global retry settings when `0`. | Using it as a modern discovery-service override. |

## `example_polaris_config.yml`: Discovery Prerequisites

The `lynx.polaris` block in `example_polaris_config.yml` is not owned by `lynx-grpc`; it belongs to the Polaris control-plane plugin. It still matters here because `grpc.client` changes behavior once discovery is available.

| Field | What it does for gRPC users | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- |
| `lynx.polaris.namespace` | Chooses the discovery namespace the client will resolve against. | Polaris defaults to `default` when omitted. | Looking up services in the wrong namespace and concluding gRPC discovery is broken. |
| `lynx.polaris.server_addresses` | Points the Polaris SDK at one or more discovery servers. | Required in practice for remote discovery. | Forgetting to expose the Polaris endpoint to the service network. |
| `lynx.polaris.enable_retry` | Enables Polaris-side retry behavior. | Helps discovery survive short control-plane failures. | Turning off gRPC retries but forgetting Polaris still has its own retry behavior. |
| `lynx.polaris.max_retry_times` | Caps Polaris retry attempts. | Polaris validates the range. | Setting it so high that discovery errors take too long to fail. |
| `lynx.polaris.retry_interval` | Spaces Polaris retries. | Works together with `max_retry_times`. | Using a huge interval and making service discovery look frozen. |
| `lynx.polaris.health_check_interval` | Controls Polaris-side health checks / refresh cadence. | Affects how quickly discovery state changes are observed. | Expecting it to replace per-RPC gRPC health checks on the client. |

## Practical Rules

- Turn on server TLS and client TLS separately; they are not coupled automatically.
- Repeat per-service TLS settings inside `subscribe_services[*]` if you need them today.
- Use `required: true` only for hard dependencies that must exist before startup can finish.
- Treat `metrics_enabled`, `logging_enabled`, `health_check_*`, `max_message_size`, and `compression_*` as forward-looking template fields until the client code starts consuming them.
