---
id: sentinel
title: Sentinel Plugin
---

# Sentinel Plugin

`lynx-sentinel` adds flow control, circuit breaking, system protection, in-process metrics, and a lightweight dashboard to Lynx. The current runtime consumes the flattened `conf/sentinel.yaml` shape shown below; older nested examples with `log.output`, `metrics.export`, `data_source.nacos`, or `data_source.apollo` do not match the code that currently boots.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-sentinel` |
| Config prefix | `lynx.sentinel` |
| Runtime plugin name | `sentinel.flow_control` |
| Main getters | `GetSentinel()`, `GetMetrics()`, `GetDashboardURL()` |

## What The Current YAML Really Does

- Runtime scans `lynx.sentinel` into the current `SentinelConfig` struct and always initializes Sentinel core once the plugin is loaded.
- The fields that are actually consumed today are `app_name`, `log_dir`, `log_level`, `flow_rules`, `circuit_breaker_rules`, `system_rules`, `metrics`, and `dashboard`.
- The top-level `enabled` compatibility field, plus the `data_source`, `warm_up`, and `advanced` blocks, are parsed but not wired into startup or rule loading yet.
- If you leave `flow_rules` empty, the plugin injects a default `default` resource rule with threshold `100`. If you leave `circuit_breaker_rules` empty, it injects a default error-ratio breaker for `default`. `system_rules` stay empty unless you configure them explicitly.

## YAML Template

```yaml
lynx:
  sentinel:
    app_name: "lynx-app"
    log_dir: "./logs/sentinel"
    log_level: "info"
    flow_rules:
      - resource: "default"
        token_calculate_strategy: 0
        control_behavior: 0
        threshold: 100
        stat_interval_in_ms: 1000
        warm_up_period_sec: 0
        max_queueing_time_ms: 0
    circuit_breaker_rules:
      - resource: "default"
        strategy: 1
        threshold: 0.5
        retry_timeout_ms: 5000
        min_request_amount: 10
        stat_interval_ms: 1000
    system_rules:
      - metric_type: 0
        trigger_count: 2.0
        strategy: 0
    metrics:
      enabled: true
      interval: "30s"
    dashboard:
      enabled: false
      port: 8719
    data_source:
      type: ""
      file:
        flow_rules_path: ""
        circuit_breaker_rules_path: ""
        system_rules_path: ""
    warm_up:
      enabled: false
      duration: ""
    advanced:
      stat_interval_ms: 0
      metric_log_flush_interval_sec: 0
    # enabled: true
```

The numeric rule fields use Sentinel enum integers. Do not copy older string examples such as `"direct"` or `"error_ratio"` into this YAML unless the struct changes.

## Field Reference

### Base runtime fields

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `app_name` | Names the Sentinel application instance. | Always. | Defaults to the current Lynx app name, then to `lynx-app` if Lynx does not provide one. This name is what the dashboard and rule ownership are keyed against. | Leaving it blank and assuming every environment will still show a stable service name. |
| `log_dir` | Sets Sentinel's log directory. | Always. | Defaults to `./logs/sentinel`. It affects Sentinel's own log directory, not your whole application's log routing. | Pointing it at a read-only or non-existent mount and then wondering why local Sentinel logs are missing. |
| `log_level` | Compatibility field for desired Sentinel log level. | Parsed on startup, but current implementation does not apply per-plugin level filtering. | Defaults to `info`. The plugin currently resets Sentinel to a console logger and relies on global logger behavior, so this field is mostly documentary for now. | Expecting `debug` or `error` here to change runtime verbosity by itself. |

### Flow rule fields

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `flow_rules[].resource` | Names the protected resource. | For every flow rule entry. | If the whole `flow_rules` list is empty, the plugin injects one default rule for resource `default`. Stable resource naming matters more than exact threshold tuning at first. | Using unstable URL patterns or ad hoc method names, then discovering every deploy creates a different rule target. |
| `flow_rules[].token_calculate_strategy` | Selects the Sentinel token calculation strategy. | For every flow rule entry. | Stored as the integer enum used by sentinel-golang. Pair warm-up-specific values with `warm_up_period_sec`; direct mode ignores warm-up settings. | Copying `"direct"` from an older doc into an integer field. |
| `flow_rules[].control_behavior` | Selects what happens after the threshold is exceeded. | For every flow rule entry. | Stored as the integer enum used by sentinel-golang. Queue-related behavior only becomes meaningful with a non-zero `max_queueing_time_ms`. | Treating the field as a free-form string or enabling queueing without budgeting for added latency. |
| `flow_rules[].threshold` | Sets the rule threshold. | For every flow rule entry. | The plugin passes the number directly to Sentinel. If you configure no rules at all, the injected default threshold is `100`. | Setting a number without first confirming whether the resource is QPS-governed or warm-up/throttling-governed in your chosen strategy. |
| `flow_rules[].stat_interval_in_ms` | Sets the flow-statistics window. | For every flow rule entry. | Passed through directly. The injected default rule uses `1000ms`. | Leaving it at `0` while assuming the plugin will normalize every rule to `1000ms`. |
| `flow_rules[].warm_up_period_sec` | Sets warm-up duration for warm-up strategies. | Only when `token_calculate_strategy` is a warm-up mode. | Ignored by direct/reject style rules. `0` means no explicit warm-up period is applied. | Filling it in for direct mode and expecting any effect. |
| `flow_rules[].max_queueing_time_ms` | Caps request queueing time for throttling behavior. | Only when `control_behavior` is a queueing/throttling mode. | Ignored by reject-style rules. `0` means there is no extra queue budget configured here. | Setting a queue budget while still using reject behavior. |

### Circuit breaker rule fields

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `circuit_breaker_rules[].resource` | Names the resource guarded by the breaker. | For every breaker rule entry. | If the whole list is empty, the plugin injects one default breaker for resource `default`. | Using a one-off label that does not match the resource names used by your business code. |
| `circuit_breaker_rules[].strategy` | Selects the breaker strategy enum. | For every breaker rule entry. | The shipped template uses `1` (`ErrorRatio`). Older string values such as `"error_ratio"` do not match the current int field. | Copying string strategy names from older docs into this YAML. |
| `circuit_breaker_rules[].threshold` | Sets the trigger threshold for the chosen strategy. | For every breaker rule entry. | The meaning depends on the strategy. The injected default breaker uses `0.5`. | Reusing the same threshold after switching strategy without recalibrating semantics. |
| `circuit_breaker_rules[].retry_timeout_ms` | Sets how long the breaker stays open before probing again. | For every breaker rule entry. | The injected default breaker uses `5000ms`. | Leaving a short retry timeout against a downstream that needs a long recovery window. |
| `circuit_breaker_rules[].min_request_amount` | Sets the minimum sample size before evaluation begins. | For every breaker rule entry. | The injected default breaker uses `10`. Small values make low-traffic services noisy. | Setting it to `1` and then treating every single failure as a real breaker signal. |
| `circuit_breaker_rules[].stat_interval_ms` | Sets the breaker statistics window. | For every breaker rule entry. | The injected default breaker uses `1000ms`. Longer windows smooth spikes but react more slowly. | Extending the window without realizing recovery will also look slower. |

### System rule fields

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `system_rules[].metric_type` | Selects the system metric enum to guard on. | For every system rule entry. | No system rule is injected by default; an empty list means no system protection rule is loaded. | Treating it like a free-form string instead of the sentinel-golang numeric enum. |
| `system_rules[].trigger_count` | Sets the trigger threshold for the chosen metric. | For every system rule entry. | Passed directly into Sentinel system rules. Tune it with real host data, not guesswork. | Copying thresholds from another service with different CPU, concurrency, or inbound traffic shape. |
| `system_rules[].strategy` | Schema placeholder for strategy selection. | Parsed, but currently ignored by `loadSystemRules()`. | The current loader only forwards `metric_type` and `trigger_count`. | Assuming BBR-like behavior is enabled just because this field is present in YAML. |

### Metrics and dashboard fields

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `metrics.enabled` | Starts the in-process metrics collector. | Only when `true`. | Default `false`. The collector is what powers `GetMetrics()` and dashboard data. | Calling metrics APIs while leaving this disabled. |
| `metrics.interval` | Sets the metrics collection interval using Go duration syntax. | Only when `metrics.enabled: true`. | Blank defaults to `30s`. Invalid duration strings also fall back to `30s` instead of failing startup. | Writing `30` instead of `"30s"` and assuming you got a 30-second interval. |
| `dashboard.enabled` | Starts the lightweight HTTP dashboard server. | Only when `true`. | Default `false`. Treat it as an internal operational surface, not a public feature. | Enabling it in a shared environment without thinking about who can reach the port. |
| `dashboard.port` | Sets the dashboard listen port. | Only when `dashboard.enabled: true`. | Defaults to `8719` when `0`. Non-zero values must stay between `1024` and `65535`. | Reusing the main app port or choosing a privileged port below `1024`. |

### Compatibility-only and not-yet-wired fields

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `enabled` | Compatibility field kept in the protobuf/schema. | Currently not used to short-circuit startup. | The shipped template comments it out on purpose because the current runtime ignores it. | Setting `enabled: false` and expecting the plugin not to initialize. |
| `data_source.type` | Reserved selector for future dynamic rule sources. | Currently never consumed by startup. | Parsed only. No file, Nacos, or Apollo rule loader is wired from this field today. | Assuming that filling `file` paths or a source type enables automatic external rule loading. |
| `data_source.file.flow_rules_path` | Reserved path for external flow rule files. | Currently never consumed by startup. | Parsed only. Rules still come from `flow_rules` in the main YAML. | Pointing it at JSON files and expecting hot reload. |
| `data_source.file.circuit_breaker_rules_path` | Reserved path for external breaker rule files. | Currently never consumed by startup. | Parsed only. | Expecting breaker rules to load from disk automatically. |
| `data_source.file.system_rules_path` | Reserved path for external system rule files. | Currently never consumed by startup. | Parsed only. | Assuming system rule files are active because the path exists. |
| `warm_up.enabled` | Reserved top-level warm-up switch. | Currently never consumed by startup. | Parsed only. Flow-rule warm-up is still configured per rule with `warm_up_period_sec`. | Expecting this flag to apply a global warm-up profile. |
| `warm_up.duration` | Reserved warm-up duration string. | Currently never consumed by startup. | Parsed only. | Filling it in and expecting startup ramp control. |
| `advanced.stat_interval_ms` | Reserved advanced tuning field. | Currently never consumed by startup. | Parsed only. Rule windows still come from each individual rule. | Treating it as a global override for every rule window. |
| `advanced.metric_log_flush_interval_sec` | Reserved advanced flush interval field. | Currently never consumed by startup. | Parsed only. The in-process metrics collector uses `metrics.interval` instead. | Expecting it to change metrics flushing behavior. |

## Complete YAML Example

```yaml
lynx:
  sentinel:
    app_name: "order-service" # falls back to the Lynx app name, then to lynx-app
    log_dir: "./logs/sentinel" # defaults to ./logs/sentinel
    log_level: "info" # compatibility field; current runtime still follows the global logger
    flow_rules:
      - resource: "http:create-user" # protected resource name used by your code or middleware
        token_calculate_strategy: 0 # flow.Direct
        control_behavior: 0 # flow.Reject
        threshold: 200 # request threshold for this resource
        stat_interval_in_ms: 1000 # statistics window for flow control
        warm_up_period_sec: 0 # only used by warm-up strategies
        max_queueing_time_ms: 0 # only used by queueing/throttling behavior
    circuit_breaker_rules:
      - resource: "http:create-user" # breaker target resource
        strategy: 1 # circuitbreaker.ErrorRatio
        threshold: 0.5 # trigger threshold for the chosen breaker strategy
        retry_timeout_ms: 5000 # open-state duration before probing again
        min_request_amount: 20 # minimum sample size before breaker evaluation starts
        stat_interval_ms: 1000 # breaker statistics window
    system_rules:
      - metric_type: 0 # system.Load
        trigger_count: 2.0 # threshold for the chosen system metric
        strategy: 0 # parsed today; current loader does not act on it
    metrics:
      enabled: true # starts the in-process metrics collector
      interval: "30s" # defaults to 30s if blank or invalid
    dashboard:
      enabled: false # set true to expose the lightweight dashboard
      port: 8719 # defaults to 8719 when 0
    data_source:
      type: "" # compatibility-only; external rule sources are not wired today
      file:
        flow_rules_path: "" # reserved path for external flow rule files
        circuit_breaker_rules_path: "" # reserved path for external breaker rule files
        system_rules_path: "" # reserved path for external system rule files
    warm_up:
      enabled: false # compatibility-only; warm-up is still configured per flow rule
      duration: "" # compatibility-only; current runtime ignores this field
    advanced:
      stat_interval_ms: 0 # compatibility-only; no global override is applied today
      metric_log_flush_interval_sec: 0 # compatibility-only; metrics still use metrics.interval
    enabled: true # compatibility-only; current runtime ignores this switch
```

The current runtime can boot with an empty `lynx.sentinel` block because it backfills `app_name`, `log_dir`, `log_level`, one default flow rule, and one default circuit-breaker rule.

## Minimum Viable YAML Example

```yaml
lynx:
  sentinel: {} # runtime fills app_name/log_dir/log_level and injects default flow + breaker rules
```

## How To Consume It

```go
import sentinel "github.com/go-lynx/lynx-sentinel"

func guarded() error {
    return sentinel.Execute("create-user", func() error {
        return doBusiness()
    })
}
```

```go
middleware, err := sentinel.CreateHTTPMiddleware(func(req interface{}) string {
    return req.(*http.Request).URL.Path
})

interceptor, err := sentinel.CreateGRPCInterceptor()
```

## Practical Notes

- Add Sentinel only after resource naming is stable. Otherwise every threshold discussion turns into churn around resource names rather than protection policy.
- The current YAML uses integer enums for rule strategies and behaviors. If you copied string-valued examples from older docs, fix those first.
- `data_source`, `warm_up`, and `advanced` are currently documentation-only placeholders from the runtime's point of view. They are safe to keep for forward planning, but they do not activate external rule loading today.

## Related Pages

- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
