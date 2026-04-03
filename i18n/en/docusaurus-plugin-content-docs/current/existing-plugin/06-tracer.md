---
id: tracer
title: Tracer Plugin
---

# Tracer Plugin

`lynx-tracer/conf/example_config.yml` is still a legacy reference file. The current runtime does **not** scan that top-level shape directly. It scans only `lynx.tracer`.

That means the first job of this page is mapping every example key to the runtime key that actually works.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-tracer` |
| Config prefix | `lynx.tracer` |
| Runtime plugin name | `tracer.server` |
| Main effect | Registers the global OpenTelemetry `TracerProvider` and propagators |

## Before You Configure It

- The runtime scans `lynx.tracer.enable`, not top-level `enabled`.
- The runtime scans `lynx.tracer.addr`, not top-level `address`.
- The runtime scans `lynx.tracer.config.protocol`, not top-level `protocol`.
- If `addr` is exactly `"None"`, the plugin still initializes a tracer provider and propagators, but it creates no exporter.
- The legacy top-level `ratio` defaults to `1.0` when unset because the code normalizes `0` to full sampling. If you want no sampling, use `config.sampler.type: ALWAYS_OFF`.
- When `config.batch.enabled: true` and queue / batch size are omitted, the plugin falls back to OpenTelemetry SDK defaults of `2048` queue size and `512` max batch size.
- `event_attribute_count_limit` and `link_attribute_count_limit` exist in proto for compatibility, but the current implementation ignores them.
- `production_example`, `development_example`, and `high_performance_example` in the template file are reference blocks only. They are not additional runtime config roots.

## Legacy Template To Runtime Mapping

| Legacy example key | Runtime key that actually works | What it does | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `enabled` | `lynx.tracer.enable` | Turns the tracer plugin on or off. | `false` means the plugin exits before creating a provider. | Keeping the old top-level key and wondering why tracing never starts. |
| `address` | `lynx.tracer.addr` | Sets the OTLP collector endpoint as `host:port`. | Required when `enable: true`; use `"None"` for propagation-only mode. | Using `address` instead of `addr`, or including `http://` in the value. |
| `protocol` | `lynx.tracer.config.protocol` | Chooses OTLP gRPC or OTLP HTTP. | Unspecified defaults to gRPC behavior. | Writing the old top-level key and expecting the exporter mode to change. |
| `connection.*` | `lynx.tracer.config.connection.*` | Tunes exporter connection lifetime and reconnect behavior. | Used only by the gRPC exporter path. | Expecting it to affect OTLP HTTP. |
| `load_balancing.*` | `lynx.tracer.config.load_balancing.*` | Sets the gRPC exporter load-balancing policy. | Used only by the gRPC exporter path. | Tuning it while the exporter is running in HTTP mode. |
| `batch.*` | `lynx.tracer.config.batch.*` | Controls the batch span processor. | Only when `batch.enabled: true`; otherwise the plugin uses a sync exporter. | Using the legacy names without nesting them under `config`. |
| `retry.*` | `lynx.tracer.config.retry.*` | Configures gRPC exporter retries. | Used only by the gRPC exporter path. | Expecting retry settings to affect OTLP HTTP. |
| `sampler.*` | `lynx.tracer.config.sampler.*` | Chooses the sampling strategy. | Takes precedence over the legacy top-level `ratio`. | Mixing both and forgetting the nested sampler wins. |
| `propagators` | `lynx.tracer.config.propagators` | Chooses incoming / outgoing trace-context formats. | Empty means default W3C Trace Context + W3C Baggage. | Using stale enum strings such as `W3C_TRACECONTEXT` instead of `W3C_TRACE_CONTEXT`. |
| `resource.*` | `lynx.tracer.config.resource.*` | Sets `service.name` and extra resource attributes. | Version and namespace are auto-filled from the app / control plane; only `service_name` and `attributes` are configurable here. | Trying to set `service_version` or `service_namespace` in the old shape. |
| `limits.*` | `lynx.tracer.config.limits.*` | Overrides span limits. | Only four fields are applied today: attribute count, attribute value length, event count, link count. | Using the old `max_*` field names and expecting them to map automatically. |
| `http_path` | `lynx.tracer.config.http_path` | Sets the OTLP HTTP URL path. | Only used when protocol is OTLP HTTP; default exporter path is `/v1/traces`. | Setting it for gRPC and expecting any change. |
| `tls.*` | `lynx.tracer.config.tls.*` plus `lynx.tracer.config.insecure` | Configures TLS or mTLS for the exporter. | There is no runtime `tls.enabled`; plaintext is controlled by `config.insecure: true`. | Keeping `tls.enabled: false` and assuming it disables TLS in the current config model. |
| `compression` | `lynx.tracer.config.compression` | Enables OTLP compression. | Valid values are `COMPRESSION_NONE` and `COMPRESSION_GZIP`. | Setting it at the old top level and seeing no exporter change. |

## `lynx.tracer`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `enable` | Enables the tracer plugin. | Always. | `false` means no provider, exporter, or propagator override. | Turning on `lynx-http` or `lynx-grpc` tracing middleware and forgetting to enable the tracer plugin itself. |
| `addr` | OTLP collector endpoint. | Only when `enable: true`. | Required unless you intentionally use `"None"`; empty values fail validation when enabled. | Supplying a URL with scheme instead of `host:port`. |
| `ratio` | Legacy fallback sampling ratio. | Used only when `config.sampler` is absent or unspecified. | `0` is normalized to `1.0`; use `ALWAYS_OFF` to truly disable sampling. | Setting `ratio: 0` and expecting no traces. |
| `config` | Nested exporter / sampler / propagator config. | Optional but preferred. | When present, it overrides the old flat shape. | Mixing old and new keys and assuming the flat example stays authoritative. |

## `lynx.tracer.config`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `protocol` | Chooses `OTLP_GRPC` or `OTLP_HTTP`. | When building the exporter. | Unspecified falls back to gRPC behavior. | Using `PROTOCOL_OTLP_GRPC`; the current enum names are `OTLP_GRPC` / `OTLP_HTTP`. |
| `insecure` | Forces plaintext transport. | When building the exporter. | `false` means TLS rules are used if needed. | Forgetting to set this for local plaintext collectors and then debugging TLS failures. |
| `tls` | Supplies CA and optional client certs for TLS/mTLS. | When `insecure: false`. | Optional; only `ca_file`, `cert_file`, `key_file`, `insecure_skip_verify` exist. | Keeping the old `tls.enabled` flag and expecting it to matter. |
| `headers` | Adds custom exporter headers. | When building the exporter. | Optional map. | Putting auth headers in the old top-level shape. |
| `compression` | Enables exporter compression. | When building the exporter. | `COMPRESSION_NONE` by default. | Setting an unsupported string such as `gzip` instead of the enum name. |
| `timeout` | Sets export timeout. | When building the exporter. | Optional duration. | Confusing it with connect timeout; that lives under `config.connection.connect_timeout`. |
| `retry` | Configures exporter retries. | Only for OTLP gRPC. | Optional; HTTP exporter ignores it. | Expecting HTTP exporter retry behavior from this block. |
| `connection` | Configures connection lifecycle. | Only for OTLP gRPC. | Optional; absent blocks use sensible defaults such as a `5s` reconnection period. | Setting connection ages in HTTP mode. |
| `load_balancing` | Configures gRPC service config and node selection policy. | Only for OTLP gRPC. | Optional; supported policies are `pick_first`, `round_robin`, `least_conn`. | Using an unsupported policy and failing validation. |
| `batch` | Configures the batch span processor. | Only when `batch.enabled: true`. | If disabled or absent, the plugin uses a sync exporter path. | Copying `batch_timeout` from the legacy example instead of `scheduled_delay`. |
| `sampler` | Chooses the sampling strategy. | Always when present. | Takes precedence over top-level `ratio`. | Setting `ratio` at both levels and assuming the outer value wins. |
| `propagators` | Chooses context propagation formats. | Always when present. | Empty falls back to W3C Trace Context + W3C Baggage. | Using stale enum names from older docs. |
| `resource` | Sets `service.name` and custom attributes. | Always when present. | Auto-injects service instance ID, current app version, and control-plane namespace as separate resource attributes. | Expecting `service_version` or `service_namespace` to be configurable here. |
| `limits` | Overrides span limits. | Always when present. | Only supported fields are applied. | Filling compatibility-only fields and expecting runtime changes. |
| `http_path` | Overrides the OTLP HTTP request path. | Only for OTLP HTTP. | Default exporter path is `/v1/traces`. | Setting it while still using `OTLP_GRPC`. |

## `lynx.tracer.config.connection`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `max_conn_idle_time` | Closes exporter connections that stay idle too long. | Only for OTLP gRPC. | Optional. | Setting it longer than `max_conn_age` and failing validation. |
| `max_conn_age` | Caps total connection lifetime. | Only for OTLP gRPC. | Optional. | Making it shorter than `max_conn_idle_time`. |
| `max_conn_age_grace` | Adds grace time before hard close. | Only for OTLP gRPC. | Optional. | Expecting it to delay export timeouts. |
| `connect_timeout` | Limits exporter dial time. | Only for OTLP gRPC. | Optional. | Confusing it with the per-export `config.timeout`. |
| `reconnection_period` | Sets the minimum time between reconnect attempts. | Only for OTLP gRPC. | Defaults to `5s` when the whole block is absent. | Leaving it too short and spamming reconnects during outages. |

## `lynx.tracer.config.load_balancing`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `policy` | Chooses the gRPC balancing policy. | Only for OTLP gRPC. | Supported values: `pick_first`, `round_robin`, `least_conn`. | Using `random` because other plugins support it. |
| `health_check` | Enables health-check hints in the gRPC service config. | Only for OTLP gRPC. | Optional. | Expecting it to do anything in OTLP HTTP mode. |

## `lynx.tracer.config.batch`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `enabled` | Enables the batch span processor. | Always. | `false` means sync export. | Setting queue sizes while leaving batching disabled. |
| `max_queue_size` | Caps queued spans before export. | Only when batching is enabled. | Defaults to `2048` if omitted. | Using the old `max_queue_size` without the `config.batch` nesting. |
| `scheduled_delay` | Delay between batch flushes. | Only when batching is enabled. | Optional. | Copying `batch_timeout` from the old example file; the runtime field is `scheduled_delay`. |
| `export_timeout` | Caps one batch export attempt. | Only when batching is enabled. | Optional. | Confusing it with the global exporter timeout. |
| `max_batch_size` | Caps spans per batch. | Only when batching is enabled. | Defaults to `512` if omitted. | Setting it larger than `max_queue_size`, which fails validation. |

## `lynx.tracer.config.retry`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `enabled` | Enables exporter retries. | Only for OTLP gRPC. | Optional. | Expecting HTTP retries from this block. |
| `max_attempts` | Caps retry attempts. | Only when retry is enabled. | Must be at least `1`. | Setting `0` and expecting "use default retry". |
| `initial_interval` | Sets the first backoff interval. | Only when retry is enabled. | Optional. | Making it larger than `max_interval`. |
| `max_interval` | Caps the retry backoff interval. | Only when retry is enabled. | Optional. | Assuming the legacy `multiplier` key still exists; it does not. |

## `lynx.tracer.config.sampler`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `type` | Chooses `ALWAYS_ON`, `ALWAYS_OFF`, `TRACEID_RATIO`, or `PARENT_BASED_TRACEID_RATIO`. | Always when the sampler block exists. | `SAMPLER_UNSPECIFIED` falls back to the legacy top-level `ratio`. | Leaving the block present but type unspecified and then debugging the wrong sampler. |
| `ratio` | Sampling ratio for the ratio-based sampler types. | Only for `TRACEID_RATIO` and `PARENT_BASED_TRACEID_RATIO`. | Valid range `0.0..1.0`; invalid values fall back to the top-level `ratio`. | Setting it outside the valid range and not noticing the fallback. |

## `lynx.tracer.config.resource`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `service_name` | Overrides OpenTelemetry `service.name`. | Always when present. | Falls back to the current Lynx app name, then `unknown-service`. | Trying to use the old `service_version` / `service_namespace` keys instead. |
| `attributes` | Adds custom resource attributes. | Always when present. | Empty values are skipped. | Putting service name or namespace here when dedicated fields already exist. |

## `lynx.tracer.config.limits`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `attribute_count_limit` | Caps span attribute count. | Always when present. | Optional; absent means SDK default. | Using legacy `max_attributes_per_span`. |
| `attribute_value_length_limit` | Caps one attribute value length. | Always when present. | Optional. | Using legacy `max_attribute_value_length`. |
| `event_count_limit` | Caps events per span. | Always when present. | Optional. | Using legacy `max_events_per_span`. |
| `event_attribute_count_limit` | Compatibility placeholder. | Parsed, but ignored by current implementation. | No runtime effect today. | Expecting it to trim event attributes. |
| `link_count_limit` | Caps links per span. | Always when present. | Optional. | Using legacy `max_links_per_span`. |
| `link_attribute_count_limit` | Compatibility placeholder. | Parsed, but ignored today. | No runtime effect. | Assuming it is enforced because it exists in proto. |

## `lynx.tracer.config.tls`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `ca_file` | Supplies the CA used to verify the collector. | Only when `config.insecure: false`. | Optional, but commonly needed for custom PKI. | Keeping it at the old top-level `tls.ca_file`. |
| `cert_file` | Supplies the client certificate for mTLS. | Only when mTLS is required. | Optional. | Providing a client cert without the matching key. |
| `key_file` | Supplies the client private key for mTLS. | Only when `cert_file` is set. | Optional. | Pointing it at the wrong key or a missing file. |
| `insecure_skip_verify` | Skips peer verification. | Only when TLS is in use. | Test-only; not recommended for production. | Using it as the normal fix for certificate problems. |

## Corrected YAML Skeleton

```yaml
lynx:
  tracer:
    enable: true
    addr: "otel-collector:4317" # use "None" for propagation-only mode
    ratio: 1.0
    config:
      protocol: OTLP_GRPC
      insecure: true
      tls:
        ca_file: "/etc/ssl/certs/otel-ca.pem"
        cert_file: "/etc/ssl/certs/otel-client.pem"
        key_file: "/etc/ssl/private/otel-client.key"
        insecure_skip_verify: false
      headers:
        Authorization: "Bearer ${OTEL_TOKEN}"
      compression: COMPRESSION_GZIP
      timeout: 10s
      retry:
        enabled: true
        max_attempts: 3
        initial_interval: 100ms
        max_interval: 5s
      connection:
        connect_timeout: 10s
        reconnection_period: 5s
      batch:
        enabled: true
        max_queue_size: 2048
        scheduled_delay: 200ms
        export_timeout: 30s
        max_batch_size: 512
      sampler:
        type: PARENT_BASED_TRACEID_RATIO
        ratio: 0.1
      propagators:
        - W3C_TRACE_CONTEXT
        - W3C_BAGGAGE
        - B3
      resource:
        service_name: "user-service"
        attributes:
          deployment.environment: "prod"
      limits:
        attribute_count_limit: 128
        attribute_value_length_limit: 2048
        event_count_limit: 128
        link_count_limit: 128
      http_path: /v1/traces
```

Use the legacy `example_config.yml` as a source of ideas, not as a copy-paste-ready runtime file.
