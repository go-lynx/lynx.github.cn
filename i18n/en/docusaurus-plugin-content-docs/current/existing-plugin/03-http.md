---
id: http
title: HTTP Service
---

# HTTP Service

This page documents the fields shown in `lynx-http/conf/example_config.yml`, then cross-checks them against the current runtime code.

The important distinction is that the example file, the protobuf comments, and the running plugin are not perfectly identical:

- the runtime reads `lynx.http`
- omitted `timeout` falls back to `10s` in code, not `30s`
- `monitoring.enable_metrics` controls whether `/metrics` is exposed, while `middleware.enable_metrics` controls whether the middleware records request metrics
- `security.cors`, `security.security_headers`, `performance.connection_pool`, `graceful_shutdown.wait_for_ongoing_requests`, `graceful_shutdown.max_wait_time`, and `middleware.custom_middleware` are present in the example/proto surface but are not applied by the current HTTP runtime
- `security.max_request_size` is stored and validated, but the current server code does not enforce a request-body cap from that field

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-http` |
| Config prefix | `lynx.http` |
| Runtime plugin name | `http.server` |
| Public API | `http.GetHttpServer()` |

## `lynx.http`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `network` | Chooses the listener type. | Always. | Default `tcp`; valid values include `tcp`, `tcp4`, `tcp6`, `unix`, `unixpacket`. | Setting `unix` but still providing a TCP-style `host:port`. |
| `addr` | Sets the bind address. | Always. | Default `:8080`. | Binding `127.0.0.1:8080` and then expecting traffic from other pods or hosts. |
| `timeout` | Sets the Kratos HTTP request timeout. | Always. | Runtime default `10s`; this differs from the older `30s` comments. | Trusting the example comment and forgetting the code default is shorter. |
| `tls_enable` | Enables HTTPS on the server. | Only when certificate material is available from the Lynx certificate provider. | Default `false`; must be paired with a working [TLS Manager](/docs/existing-plugin/tls-manager) setup for managed certs. | Turning it on without loading any certs first. |
| `tls_auth_type` | Chooses client-certificate behavior. | Only when `tls_enable: true`. | Values `0..4`; ignored when TLS is off. | Setting mTLS auth here while leaving `tls_enable: false`. |
| `monitoring` | Holds metrics and health-endpoint settings. | Always when present. | Missing block gets runtime defaults. | Expecting it to disable middleware metrics entirely; it mostly controls exposure and metric detail. |
| `security` | Holds request-size, rate-limit, CORS, and security-header settings. | Always when present. | Only the in-process rate limiter is actively enforced today. | Assuming the entire block is live because it exists in the example file. |
| `performance` | Holds concurrency, buffer, and timeout tuning. | Always when present. | Missing block gets runtime defaults. | Reading `max_connections` as a literal socket-count cap; current code uses it as an in-flight request gate. |
| `middleware` | Enables or disables built-in middleware. | Always when present. | Missing block defaults every built-in toggle to `true`. | Disabling `middleware.enable_logging` and then wondering why `monitoring.enable_request_logging` has no visible effect. |
| `graceful_shutdown` | Controls stop behavior. | Used during cleanup. | Only `shutdown_timeout` is active today. | Setting `wait_for_ongoing_requests` or `max_wait_time` and expecting extra drain behavior. |
| `circuit_breaker` | Controls the server-side HTTP circuit breaker. | Used on every request. | If the entire block is absent, runtime creates a default enabled breaker. | Setting `failure_threshold: 0` to "disable" rate checks; `0` is treated as the default `0.5`. |

## `lynx.http.monitoring`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `enable_metrics` | Decides whether the `/metrics` route is registered. | During startup. | Default `true`; request metrics can still be recorded by middleware even if this is `false`. | Turning this off and expecting metrics collection itself to stop. |
| `metrics_path` | Sets the metrics route path. | Only when `enable_metrics: true`. | Default `/metrics`. | Reusing the same path as `health_path`. |
| `health_path` | Sets the health-check route path. | Always. | Default `/health`; the handler is always registered. | Forgetting that changing it also changes what probes must call. |
| `enable_request_logging` | Enables normal request/response logs. | Only when `middleware.enable_logging: true`. | Default `true`. | Setting it `true` while disabling the logging middleware. |
| `enable_error_logging` | Enables error-focused request logs. | Only when `middleware.enable_logging: true`. | Default `true`. | Turning it off and still expecting structured error response logs. |
| `enable_route_metrics` | Emits per-route counters and histograms. | Only when metrics middleware is active. | Default `true`. | Disabling it and expecting per-route charts to keep working. |
| `enable_connection_metrics` | Emits active-connection and pool-usage gauges. | Only when metrics middleware is active. | Default `true`. | Expecting it to create or tune any real connection pool. |
| `enable_queue_metrics` | Emits request-queue metrics around the rate-limit middleware. | Only when `middleware.enable_rate_limit: true`. | Default `true`. | Turning it on while the rate-limit middleware is off. |
| `enable_error_type_metrics` | Preserves detailed error labels instead of collapsing them. | Only when metrics middleware is active. | Default `true`. | Disabling it and then looking for `panic`, `rate_limit_exceeded`, or similar labels. |

## `lynx.http.security`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `max_request_size` | Intended request-body size limit in bytes. | Parsed during startup. | Default `10485760` (10 MiB), but the current HTTP runtime does not enforce it. | Assuming oversized requests will be rejected automatically. |
| `cors` | Intended CORS policy block. | Parsed during startup. | Present in proto/example only; current runtime does not apply CORS from this block. | Filling it and expecting browser preflight headers to change. |
| `rate_limit` | Configures the in-process HTTP rate limiter. | Used when the rate-limit middleware runs. | Defaults to `100` req/s and burst `200`; `enabled: false` removes the in-process limiter. | Disabling this block but forgetting the control plane may still inject its own HTTP rate-limit middleware. |
| `security_headers` | Intended response security-header block. | Parsed during startup. | Present in proto/example only; current runtime does not emit headers from this block. | Assuming `enabled: true` will add CSP / X-Frame-Options automatically. |

### `lynx.http.security.cors`

These keys are currently documentation-only in the HTTP plugin itself.

| Field | What it is for | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- |
| `enabled` | Intended CORS toggle. | Default `false`; not applied by current runtime. | Turning it on and expecting CORS headers without custom middleware or a gateway. |
| `allowed_origins` | Intended allow-list for origins. | Example default `["*"]`; not applied today. | Publishing a restrictive list and assuming browsers will honor it automatically. |
| `allowed_methods` | Intended allowed methods list. | Example default `GET, POST, PUT, DELETE, OPTIONS`; not applied today. | Treating it as an active method ACL. |
| `allowed_headers` | Intended allow-list for request headers. | Example default `["*"]`; not applied today. | Assuming it controls backend header parsing. |
| `exposed_headers` | Intended browser-visible response headers. | Example default empty; not applied today. | Expecting frontend code to suddenly see extra headers. |
| `allow_credentials` | Intended credentialed CORS switch. | Example default `false`; not applied today. | Using it as a replacement for actual auth / cookie policy. |
| `max_age` | Intended preflight cache TTL in seconds. | Example default `86400`; not applied today. | Tuning it without any active CORS middleware. |

### `lynx.http.security.rate_limit`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `enabled` | Turns the in-process limiter on or off. | Only in the built-in rate-limit middleware. | Default `true`; `false` sets the local limiter to `nil`. | Forgetting that control-plane rate limits can still be appended separately. |
| `rate_per_second` | Steady-state rate limit. | Only when `enabled: true`. | Default `100`; values above `10000` fail validation. | Setting it to `0` and expecting "unlimited"; `0` falls back to the default. |
| `burst_limit` | Burst capacity above the steady rate. | Only when `enabled: true`. | Default `200`. | Setting it lower than expected and causing short traffic spikes to fail. |

### `lynx.http.security.security_headers`

These keys are currently documentation-only in the HTTP plugin itself.

| Field | What it is for | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- |
| `enabled` | Intended switch for security response headers. | Default `false`; not applied today. | Enabling it and expecting response headers to change. |
| `content_security_policy` | Intended CSP header value. | Example default `default-src 'self'`; not applied today. | Treating it as a runtime-enforced CSP. |
| `x_frame_options` | Intended clickjacking header value. | Example default `DENY`; not applied today. | Assuming iframe protection is active because this value exists in YAML. |
| `x_content_type_options` | Intended MIME-sniffing header value. | Example default `nosniff`; not applied today. | Expecting it to show up without a reverse proxy or custom middleware. |
| `x_xss_protection` | Intended legacy XSS protection header. | Example default `1; mode=block`; not applied today. | Using it as your only browser-side XSS strategy. |

## `lynx.http.performance`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `max_connections` | Caps one semaphore used for in-flight request admission. | During request handling. | Default `1000`; despite the name, this is not a raw socket count. | Using it as if it counted keep-alive TCP connections. |
| `max_concurrent_requests` | Caps a second semaphore for in-flight requests. | During request handling. | Default `500`; the lower effective cap between this and `max_connections` wins first. | Setting conflicting values and then debugging the wrong limiter. |
| `read_buffer_size` | Sets TCP read buffer size on accepted TCP connections. | Only on TCP listeners. | Default `4096`. | Expecting it to affect Unix sockets or request-body limits. |
| `write_buffer_size` | Sets TCP write buffer size on accepted TCP connections. | Only on TCP listeners. | Default `4096`. | Treating it as an HTTP response-size limit. |
| `connection_pool` | Intended keep-alive / pool tuning block. | Parsed during startup. | Present in proto/example, but current server code does not consume this nested block. | Expecting `max_idle_conns` or `keep_alive_duration` to change server behavior. |
| `read_timeout` | Sets `net/http.Server.ReadTimeout`. | Startup, if provided. | No code-level fallback beyond the zero value; proto/example describe `30s`. | Assuming the commented example default is applied even when you omit the field. |
| `write_timeout` | Sets `net/http.Server.WriteTimeout`. | Startup, if provided. | No code-level fallback beyond the zero value; proto/example describe `30s`. | Forgetting to set it while expecting slow clients to be cut off. |
| `idle_timeout` | Sets `net/http.Server.IdleTimeout`. | Startup, if provided. | Falls back to the runtime default `60s` when unset. | Setting a very short value and breaking keep-alive reuse. |
| `read_header_timeout` | Sets `net/http.Server.ReadHeaderTimeout`. | Startup, if provided. | Falls back to the runtime default `20s` when unset. | Leaving it too large and exposing the server to slow header attacks. |

### `lynx.http.performance.connection_pool`

These keys are currently documentation-only in the HTTP server plugin.

| Field | What it is for | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- |
| `max_idle_conns` | Intended idle keep-alive cap. | Example default `100`; not consumed by the current server runtime. | Expecting this server-side block to behave like `http.Transport`. |
| `max_idle_conns_per_host` | Intended per-host idle cap. | Example default `10`; not consumed today. | Treating server config as outbound client transport config. |
| `max_conns_per_host` | Intended per-host hard cap. | Example default `100`; not consumed today. | Using it to control inbound concurrency. |
| `keep_alive_duration` | Intended keep-alive reuse duration. | Example default `30s`; not consumed today. | Tuning it and seeing no runtime effect. |

## `lynx.http.middleware`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `enable_tracing` | Enables the tracing middleware. | During middleware chain construction. | Default `true`. | Turning it off and still expecting span IDs in HTTP response headers. |
| `enable_logging` | Enables request/response logging middleware. | During middleware chain construction. | Default `true`; monitoring log toggles only matter if this is on. | Disabling it and then tuning `monitoring.enable_request_logging`. |
| `enable_recovery` | Enables panic recovery. | During middleware chain construction. | Default `true`. | Disabling it in production and letting panics tear down requests. |
| `enable_validation` | Enables protobuf request validation. | During middleware chain construction. | Default `true`. | Turning it off and then expecting proto validation errors to keep happening. |
| `enable_rate_limit` | Enables the in-process rate-limit middleware. | During middleware chain construction. | Default `true`; also gates queue metrics. | Setting `security.rate_limit.enabled: true` but disabling this middleware. |
| `enable_metrics` | Enables metrics middleware or the combined trace/log/metrics pack. | During middleware chain construction. | Default `true`; does not by itself expose `/metrics`. | Setting only this flag and forgetting `monitoring.enable_metrics` for scraping. |
| `custom_middleware` | Placeholder map for app-defined middleware wiring. | Parsed during startup. | Present in proto/example only; current runtime does not interpret it. | Putting feature flags here and expecting Lynx to auto-register custom middleware. |

## `lynx.http.graceful_shutdown`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `shutdown_timeout` | Sets the cleanup timeout used when stopping the HTTP server. | During cleanup. | Runtime default `30s`. | Forgetting to increase it for long-running uploads or streaming responses. |
| `wait_for_ongoing_requests` | Intended "wait for inflight requests" switch. | Parsed during startup. | Present in proto/example, but not consumed by the current cleanup logic. | Expecting this boolean alone to change shutdown behavior. |
| `max_wait_time` | Intended hard cap for inflight drain time. | Parsed during startup. | Present in proto/example, but not consumed today. | Setting it and expecting an extra drain window beyond `shutdown_timeout`. |

## `lynx.http.circuit_breaker`

| Field | What it does | When it is used | Default / interaction | Common misconfiguration |
| --- | --- | --- | --- | --- |
| `enabled` | Enables or disables the HTTP circuit breaker. | During request handling. | If the whole block is absent, runtime creates a default enabled breaker. | Assuming "omitted block" means "no breaker". |
| `max_failures` | Failure-count threshold before the breaker can open. | During request handling. | Default `5`. | Setting it too low and opening the breaker during small burst errors. |
| `timeout` | How long the breaker stays open before moving to half-open. | During request handling. | Default `60s`. | Confusing it with the HTTP request timeout. |
| `max_requests` | Probe-request count allowed while half-open. | During request handling. | Default `10`. | Leaving it too high and flooding a recovering dependency path. |
| `failure_threshold` | Failure-rate threshold in the closed state. | During request handling. | Default `0.5`; explicit `0` also becomes `0.5` in the breaker constructor. | Setting `0` to mean "disable the rate check". |

## Complete YAML Example

```yaml
lynx:
  http:
    network: "tcp" # listener type; default tcp
    addr: ":8080" # bind address; default :8080
    timeout: "30s" # example template value; runtime default is 10s when omitted

    tls_enable: false # turn on only after lynx.tls has loaded certificates
    tls_auth_type: 0 # 0..4; ignored while tls_enable=false

    monitoring:
      enable_metrics: true # controls whether /metrics is exposed
      metrics_path: "/metrics" # metrics endpoint path
      health_path: "/health" # health endpoint path
      enable_request_logging: true # request logs require middleware.enable_logging=true
      enable_error_logging: true # error logs also require middleware.enable_logging=true
      enable_route_metrics: true # per-route metrics labels
      enable_connection_metrics: true # connection / pool gauges
      enable_queue_metrics: true # queue metrics; useful only with rate-limit middleware
      enable_error_type_metrics: true # keeps detailed error labels

    security:
      max_request_size: 10485760 # template value 10 MiB; current runtime stores but does not enforce it
      cors:
        enabled: false # template field; current HTTP runtime does not emit CORS headers from here
        allowed_origins: ["*"] # template allow-list
        allowed_methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] # template method list
        allowed_headers: ["*"] # template header list
        exposed_headers: [] # template exposed headers
        allow_credentials: false # template credentials flag
        max_age: 86400 # template preflight cache seconds
      rate_limit:
        enabled: true # live in-process limiter switch
        rate_per_second: 100 # steady-state rate limit
        burst_limit: 200 # burst allowance
      security_headers:
        enabled: false # template field; current HTTP runtime does not emit these headers
        content_security_policy: "default-src 'self'" # template CSP value
        x_frame_options: "DENY" # template X-Frame-Options value
        x_content_type_options: "nosniff" # template X-Content-Type-Options value
        x_xss_protection: "1; mode=block" # template X-XSS-Protection value

    performance:
      max_connections: 1000 # live in-flight admission semaphore, not raw socket count
      max_concurrent_requests: 500 # second in-flight request cap
      read_buffer_size: 4096 # TCP read buffer size
      write_buffer_size: 4096 # TCP write buffer size
      connection_pool:
        max_idle_conns: 100 # template-only today; server runtime does not consume this block
        max_idle_conns_per_host: 10 # template-only today
        max_conns_per_host: 100 # template-only today
        keep_alive_duration: "30s" # template-only today
      read_timeout: "30s" # sets net/http.Server.ReadTimeout only when present
      write_timeout: "30s" # sets net/http.Server.WriteTimeout only when present
      idle_timeout: "60s" # runtime default is 60s when omitted
      read_header_timeout: "20s" # runtime default is 20s when omitted

    middleware:
      enable_tracing: true # tracing middleware switch
      enable_logging: true # request logging middleware switch
      enable_recovery: true # panic recovery middleware switch
      enable_validation: true # protobuf validation middleware switch
      enable_rate_limit: true # must stay true for local rate limiting to run
      enable_metrics: true # must stay true for request metrics middleware
      custom_middleware: {} # placeholder map; current runtime does not interpret it

    graceful_shutdown:
      shutdown_timeout: "30s" # live cleanup timeout
      wait_for_ongoing_requests: true # template field; current cleanup logic does not consume it
      max_wait_time: "60s" # template field; current cleanup logic does not consume it

    circuit_breaker:
      enabled: true # omitting the whole block still creates a default-enabled breaker
      max_failures: 5 # failure-count threshold
      timeout: "60s" # open-state timeout
      max_requests: 10 # half-open probe limit
      failure_threshold: 0.5 # closed-state failure-rate threshold
```

## Minimum Viable YAML Example

```yaml
lynx:
  http:
    addr: ":8080" # enough to start a plain HTTP listener; network defaults to tcp
```

Add `lynx.tls` and set `tls_enable: true` only when you actually want HTTPS.

## Practical Rules

- If you want HTTPS, configure both the TLS plugin and `lynx.http.tls_enable: true`.
- If you want scraping, keep both `monitoring.enable_metrics: true` and `middleware.enable_metrics: true`.
- If you want local HTTP rate limiting, keep both `security.rate_limit.enabled: true` and `middleware.enable_rate_limit: true`.
- Treat `cors`, `security_headers`, `connection_pool`, `custom_middleware`, and the extra graceful-shutdown switches as template placeholders until the runtime starts consuming them.
