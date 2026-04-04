---
id: sentinel
title: Sentinel 插件
---

# Sentinel 插件

`lynx-sentinel` 会把流控、熔断、系统保护、进程内指标和轻量 dashboard 接入 Lynx。当前运行时真正消费的是下面这份平铺版 `conf/sentinel.yaml`；旧文档里那些 `log.output`、`metrics.export`、`data_source.nacos`、`data_source.apollo` 一类的嵌套字段，并不对应当前启动代码。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-sentinel` |
| 配置前缀 | `lynx.sentinel` |
| Runtime 插件名 | `sentinel.flow_control` |
| 主要 Getter | `GetSentinel()`、`GetMetrics()`、`GetDashboardURL()` |

## 当前 YAML 真正做什么

- runtime 会把 `lynx.sentinel` 扫描到当前的 `SentinelConfig`，然后在插件加载后直接初始化 Sentinel core。
- 今天真正会被启动逻辑消费的字段只有 `app_name`、`log_dir`、`log_level`、`flow_rules`、`circuit_breaker_rules`、`system_rules`、`metrics`、`dashboard`。
- 顶层兼容字段 `enabled`，以及 `data_source`、`warm_up`、`advanced` 这几个块，目前只会被解析，不会驱动启动逻辑或动态规则装载。
- 如果 `flow_rules` 为空，插件会自动注入一条 `default` 资源、阈值 `100` 的默认流控规则；如果 `circuit_breaker_rules` 为空，会自动注入一条 `default` 资源的默认错误比例熔断规则；`system_rules` 为空时则不会注入任何系统保护规则。

## YAML 模板

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

规则相关的数字字段用的是 Sentinel 的整数枚举值，不是旧文档里的字符串枚举。像 `"direct"`、`"error_ratio"` 这种写法，放到当前 YAML 里并不匹配现有结构体。

## 字段说明

### 基础运行字段

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `app_name` | 指定 Sentinel 应用名。 | 始终生效。 | 默认先取当前 Lynx 应用名，取不到时回退到 `lynx-app`。dashboard 和规则归属都依赖这个名字。 | 留空后假设每个环境都还能自动得到稳定服务名。 |
| `log_dir` | 指定 Sentinel 日志目录。 | 始终生效。 | 默认 `./logs/sentinel`。它影响的是 Sentinel 自己的日志目录，不是整个应用的统一日志路由。 | 指向只读目录或不存在的挂载点，结果本地 Sentinel 日志没有落下来。 |
| `log_level` | 为 Sentinel 预留的日志级别兼容字段。 | 启动时会读取，但当前实现不会做插件级别的日志过滤。 | 默认 `info`。当前插件会把 Sentinel logger 重置成 console logger，实际仍然主要受全局日志行为影响。 | 以为单改这里就能让 Sentinel 变成 `debug` 或 `error` 输出。 |

### 流控规则字段

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `flow_rules[].resource` | 指定被保护的资源名。 | 每条流控规则都会使用。 | 如果整个 `flow_rules` 列表为空，插件会自动注入一条 `default` 资源规则。资源名是否稳定，比阈值本身更先决定这套配置有没有价值。 | 直接拿动态 URL、临时方法名做资源标识，导致每次发布都像是新资源。 |
| `flow_rules[].token_calculate_strategy` | 指定 Sentinel 的 token 计算策略枚举。 | 每条流控规则都会使用。 | 当前字段是 sentinel-golang 的整数枚举。只有在选择预热类策略时，`warm_up_period_sec` 才有配套意义。 | 从旧文档抄 `"direct"` 这类字符串到整数枚举字段里。 |
| `flow_rules[].control_behavior` | 指定超过阈值后的行为枚举。 | 每条流控规则都会使用。 | 也是 sentinel-golang 的整数枚举。只有排队 / 节流类行为才会真正使用 `max_queueing_time_ms`。 | 仍然按字符串理解，或者开了排队却没评估上游能否接受额外时延。 |
| `flow_rules[].threshold` | 指定规则阈值。 | 每条流控规则都会使用。 | 插件会把这个值原样传给 Sentinel。若完全不配规则，自动注入的默认阈值是 `100`。 | 没先确认资源语义和策略语义，就照搬别的服务的阈值。 |
| `flow_rules[].stat_interval_in_ms` | 指定流控统计窗口。 | 每条流控规则都会使用。 | 会原样透传。自动注入的默认规则使用 `1000ms`。 | 留成 `0` 却以为插件会帮你把所有规则统一归一到 `1000ms`。 |
| `flow_rules[].warm_up_period_sec` | 为预热类策略指定预热时长。 | 只有 `token_calculate_strategy` 选择预热模式时才有意义。 | 在 direct / reject 这类模式下会被忽略。`0` 表示这里没有额外指定预热周期。 | 在直接限流模式下填写它，并期待真的出现预热行为。 |
| `flow_rules[].max_queueing_time_ms` | 指定排队类行为允许的最长等待时间。 | 只有 `control_behavior` 是排队 / 节流模式时才有意义。 | 在 reject 类行为下会被忽略。`0` 表示这里没有给排队增加额外预算。 | 仍然使用 reject 行为，却以为这个字段会让请求排队。 |

### 熔断规则字段

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `circuit_breaker_rules[].resource` | 指定被熔断保护的资源名。 | 每条熔断规则都会使用。 | 如果整个列表为空，插件会自动注入一条 `default` 资源的默认熔断规则。 | 用一次性的临时标签做资源名，导致指标和熔断状态没有可维护性。 |
| `circuit_breaker_rules[].strategy` | 指定熔断策略枚举。 | 每条熔断规则都会使用。 | 模板里的 `1` 对应 `ErrorRatio`。旧文档里的 `"error_ratio"` 这类字符串并不适配当前 int 字段。 | 从旧文档复制字符串策略名。 |
| `circuit_breaker_rules[].threshold` | 指定当前策略下的熔断阈值。 | 每条熔断规则都会使用。 | 含义随策略变化。自动注入的默认熔断阈值是 `0.5`。 | 换了策略却没重新理解阈值语义。 |
| `circuit_breaker_rules[].retry_timeout_ms` | 指定熔断打开后多久再尝试恢复。 | 每条熔断规则都会使用。 | 自动注入的默认值是 `5000ms`。 | 下游本来就恢复慢，却保留极短的重试探测间隔。 |
| `circuit_breaker_rules[].min_request_amount` | 指定最小样本数。 | 每条熔断规则都会使用。 | 自动注入的默认值是 `10`。流量很低时，样本太小会非常噪声。 | 设成 `1`，结果把偶发单次错误都当成可用性崩溃。 |
| `circuit_breaker_rules[].stat_interval_ms` | 指定熔断统计窗口。 | 每条熔断规则都会使用。 | 自动注入的默认值是 `1000ms`。窗口越长越平滑，但也越迟钝。 | 为了“更稳”盲目拉长窗口，结果恢复与告警都显得迟缓。 |

### 系统保护字段

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `system_rules[].metric_type` | 选择系统保护要观察的指标枚举。 | 每条系统规则都会使用。 | 默认不会自动注入任何系统规则；空列表就表示不启用系统保护规则。 | 仍然按字符串理解这个枚举，而不是用 Sentinel 的数字值。 |
| `system_rules[].trigger_count` | 指定该指标的触发阈值。 | 每条系统规则都会使用。 | 会原样传入 Sentinel system rule。应该基于真实机器指标与压测数据来定。 | 直接套别的服务阈值，不看本服务的 CPU、并发和入口流量形态。 |
| `system_rules[].strategy` | 为系统规则保留的策略字段。 | 当前会被解析，但 `loadSystemRules()` 并不会真正消费它。 | 目前真正传给 Sentinel 的只有 `metric_type` 和 `trigger_count`。 | 以为把它填了就已经启用了某种 BBR 风格行为。 |

### 指标与 dashboard 字段

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `metrics.enabled` | 控制是否启动进程内指标采集器。 | 只有为 `true` 时。 | 默认 `false`。`GetMetrics()` 与 dashboard 数据都依赖这个采集器。 | 关着它却去调用指标 API，或以为 dashboard 还能看到完整数据。 |
| `metrics.interval` | 指定指标采集周期，使用 Go duration 语法。 | 只有 `metrics.enabled: true` 时。 | 为空时默认 `30s`；写成非法 duration 时也会静默回退到 `30s`，不会阻止启动。 | 写成 `30` 而不是 `"30s"`，结果以为自己得到了 30 秒采样周期。 |
| `dashboard.enabled` | 控制是否启动轻量 HTTP dashboard。 | 只有为 `true` 时。 | 默认 `false`。它更适合作为内部运维入口，而不是对外页面。 | 在共享环境直接打开，却没考虑谁能访问这个端口。 |
| `dashboard.port` | 指定 dashboard 监听端口。 | 只有 `dashboard.enabled: true` 时。 | 为 `0` 时默认补成 `8719`；非零时必须在 `1024-65535` 之间。 | 和业务主端口冲突，或者误用了 `1024` 以下的特权端口。 |

### 兼容保留但当前未接线的字段

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enabled` | 为 protobuf / schema 保留的兼容字段。 | 当前不会被用来短路启动流程。 | 模板里特意把它注释掉，因为当前 runtime 会忽略它。 | 明明写了 `enabled: false`，却还以为插件一定不会初始化。 |
| `data_source.type` | 为未来动态规则源保留的选择字段。 | 当前启动逻辑完全不会消费。 | 只会被解析，不会因为你填了 type 就自动启用 file / Nacos / Apollo 规则源。 | 以为只要把 type 和 file path 写上，规则就会自动从外部加载。 |
| `data_source.file.flow_rules_path` | 为外部流控规则文件保留的路径。 | 当前启动逻辑完全不会消费。 | 只会被解析；真正加载的仍然是主 YAML 里的 `flow_rules`。 | 指向 JSON 文件后，以为已经实现热加载。 |
| `data_source.file.circuit_breaker_rules_path` | 为外部熔断规则文件保留的路径。 | 当前启动逻辑完全不会消费。 | 只会被解析。 | 误以为磁盘上的熔断规则已经生效。 |
| `data_source.file.system_rules_path` | 为外部系统规则文件保留的路径。 | 当前启动逻辑完全不会消费。 | 只会被解析。 | 因为路径存在，就以为系统保护规则已经被装载。 |
| `warm_up.enabled` | 为全局预热开关保留的字段。 | 当前启动逻辑完全不会消费。 | 只会被解析。真正能影响预热的仍然是具体流控规则里的 `warm_up_period_sec`。 | 以为这是一个全局冷启动限流开关。 |
| `warm_up.duration` | 为全局预热时长保留的字段。 | 当前启动逻辑完全不会消费。 | 只会被解析。 | 填了它却发现启动和流控行为都没有变化。 |
| `advanced.stat_interval_ms` | 为高级全局统计窗口保留的字段。 | 当前启动逻辑完全不会消费。 | 只会被解析。真正的窗口仍然由各条规则自己决定。 | 把它当成覆盖所有规则窗口的全局开关。 |
| `advanced.metric_log_flush_interval_sec` | 为高级指标刷新间隔保留的字段。 | 当前启动逻辑完全不会消费。 | 只会被解析。进程内指标采集频率仍然受 `metrics.interval` 控制。 | 以为改它就能改变 metrics flush 行为。 |

## 完整 YAML 示例

```yaml
lynx:
  sentinel:
    app_name: "order-service" # 为空时先回退到当前 Lynx 应用名，再回退到 lynx-app
    log_dir: "./logs/sentinel" # 默认 ./logs/sentinel
    log_level: "info" # 兼容字段；当前 runtime 仍然主要跟随全局 logger
    flow_rules:
      - resource: "http:create-user" # 业务代码或中间件里使用的资源名
        token_calculate_strategy: 0 # flow.Direct
        control_behavior: 0 # flow.Reject
        threshold: 200 # 当前资源的限流阈值
        stat_interval_in_ms: 1000 # 流控统计窗口
        warm_up_period_sec: 0 # 只有预热类策略才会使用
        max_queueing_time_ms: 0 # 只有排队/节流行为才会使用
    circuit_breaker_rules:
      - resource: "http:create-user" # 熔断保护的资源名
        strategy: 1 # circuitbreaker.ErrorRatio
        threshold: 0.5 # 当前熔断策略的触发阈值
        retry_timeout_ms: 5000 # 熔断打开后多久再探测恢复
        min_request_amount: 20 # 熔断评估开始前的最小样本量
        stat_interval_ms: 1000 # 熔断统计窗口
    system_rules:
      - metric_type: 0 # system.Load
        trigger_count: 2.0 # 所选系统指标的触发阈值
        strategy: 0 # 当前会被解析，但 loader 还不会真正消费
    metrics:
      enabled: true # 启动进程内指标采集器
      interval: "30s" # 留空或非法时都会回退到 30s
    dashboard:
      enabled: false # 设为 true 时才会暴露轻量 dashboard
      port: 8719 # 为 0 时默认回退到 8719
    data_source:
      type: "" # 兼容保留字段；当前还不会真的接外部规则源
      file:
        flow_rules_path: "" # 预留给外部流控规则文件的路径
        circuit_breaker_rules_path: "" # 预留给外部熔断规则文件的路径
        system_rules_path: "" # 预留给外部系统规则文件的路径
    warm_up:
      enabled: false # 兼容保留字段；预热仍然按单条 flow rule 配置
      duration: "" # 兼容保留字段；当前 runtime 会忽略
    advanced:
      stat_interval_ms: 0 # 兼容保留字段；今天没有全局覆盖效果
      metric_log_flush_interval_sec: 0 # 兼容保留字段；metrics 仍然走 metrics.interval
    enabled: true # 兼容保留字段；当前 runtime 会忽略这个总开关
```

当前 runtime 即使给出空的 `lynx.sentinel` 块也能启动，因为它会回填 `app_name`、`log_dir`、`log_level`，并自动注入一条默认流控规则和一条默认熔断规则。

## 最小可用 YAML 示例

```yaml
lynx:
  sentinel: {} # runtime 会自动补齐 app_name/log_dir/log_level 和默认 flow + breaker 规则
```

## 如何使用

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

## 实际注意点

- 只有在资源命名稳定后再接 Sentinel，否则所有阈值讨论都会退化成“资源到底该怎么命名”的噪声。
- 当前 YAML 里的规则行为和策略字段都是整数枚举。如果你从旧文档复制了字符串值，先改这个问题。
- `data_source`、`warm_up`、`advanced` 目前从 runtime 视角看都还是“可保留但未接线”的占位字段，可以为未来方案预留，但今天不会自动激活外部规则装载。

## 相关页面

- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
