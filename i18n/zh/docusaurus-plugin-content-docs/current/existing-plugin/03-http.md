---
id: http
title: HTTP 服务
---

# HTTP 服务

本页以 `lynx-http/conf/example_config.yml` 为准，再逐项对照当前运行时代码。

最重要的现实差异有几点：

- 运行时实际读取的是 `lynx.http`
- `timeout` 在代码里的默认值是 `10s`，不是示例和 proto 注释里常写的 `30s`
- `monitoring.enable_metrics` 决定是否注册 `/metrics` 路由，`middleware.enable_metrics` 决定是否挂载指标中间件，两者不是一回事
- `security.cors`、`security.security_headers`、`performance.connection_pool`、`graceful_shutdown.wait_for_ongoing_requests`、`graceful_shutdown.max_wait_time`、`middleware.custom_middleware` 目前在模板里有，但 HTTP 运行时并没有真正消费
- `security.max_request_size` 会被读取和校验，但当前 HTTP 服务端没有真正按这个值拦请求体

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-http` |
| 配置前缀 | `lynx.http` |
| Runtime 插件名 | `http.server` |
| 公开 API | `http.GetHttpServer()` |

## `lynx.http`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `network` | 选择监听类型。 | 一直生效。 | 默认 `tcp`；支持 `tcp`、`tcp4`、`tcp6`、`unix`、`unixpacket`。 | 用了 `unix`，却仍然填写 TCP 风格地址。 |
| `addr` | 设置监听地址。 | 一直生效。 | 默认 `:8080`。 | 只绑 `127.0.0.1`，却期待外部 Pod 或主机能访问。 |
| `timeout` | 设置 Kratos HTTP 请求超时。 | 一直生效。 | 代码默认 `10s`。 | 只看模板注释，以为默认还是 `30s`。 |
| `tls_enable` | 打开 HTTPS。 | 证书提供者可用时。 | 默认 `false`；通常要配合 [TLS Manager](/docs/existing-plugin/tls-manager)。 | 开了它，却没有任何证书来源。 |
| `tls_auth_type` | 选择客户端证书策略。 | 仅 `tls_enable: true` 时。 | 默认 `0`；只在 TLS 打开时有意义。 | 想做 mTLS，却忘了开 `tls_enable`。 |
| `monitoring` | 指标和健康检查配置块。 | 有配置时。 | 缺失时会补运行时默认值。 | 以为它能完全替代 `middleware` 的指标 / 日志开关。 |
| `security` | 请求大小、限流、CORS、安全头配置块。 | 有配置时。 | 当前只有进程内限流真正生效。 | 模板里有就默认它全部都已经接线。 |
| `performance` | 并发、缓冲区、超时调优块。 | 有配置时。 | 缺失时会补默认值。 | 把 `max_connections` 当成原始 TCP 连接数上限。 |
| `middleware` | HTTP 内建中间件开关。 | 有配置时。 | 缺失时各开关默认全开。 | 关了 `enable_logging`，却还在调 `monitoring.enable_request_logging`。 |
| `graceful_shutdown` | 停机配置。 | 清理阶段。 | 当前只有 `shutdown_timeout` 真正被使用。 | 设置了 `wait_for_ongoing_requests` 后期待停机逻辑变化。 |
| `circuit_breaker` | 服务端 HTTP 熔断配置。 | 每次请求处理。 | 整个块缺失时，运行时会自动创建一个默认开启的熔断器。 | 以为“不写配置块”就代表“没有熔断器”。 |

## `lynx.http.monitoring`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enable_metrics` | 决定是否注册 `/metrics` 路由。 | 启动时。 | 默认 `true`；它不等于“停止收集指标”。 | 设成 `false` 后还以为指标中间件也会停掉。 |
| `metrics_path` | 设置指标路由。 | 仅 `enable_metrics: true`。 | 默认 `/metrics`。 | 跟 `health_path` 配成同一路径。 |
| `health_path` | 设置健康检查路由。 | 一直注册。 | 默认 `/health`。 | 改了路径，却忘了同步探针地址。 |
| `enable_request_logging` | 普通请求 / 响应日志开关。 | 仅 `middleware.enable_logging: true`。 | 默认 `true`。 | 关了日志中间件却还想通过这里开日志。 |
| `enable_error_logging` | 错误请求日志开关。 | 仅 `middleware.enable_logging: true`。 | 默认 `true`。 | 关掉它后还期待结构化错误日志。 |
| `enable_route_metrics` | 是否按路由拆分指标。 | 仅指标中间件开启时。 | 默认 `true`。 | 关掉后还按 route 维度查图表。 |
| `enable_connection_metrics` | 是否暴露连接 / 池占用类指标。 | 仅指标中间件开启时。 | 默认 `true`。 | 误以为它会创建真实连接池。 |
| `enable_queue_metrics` | 是否暴露排队类指标。 | 仅 `middleware.enable_rate_limit: true`。 | 默认 `true`。 | 限流中间件关了还想看到排队指标。 |
| `enable_error_type_metrics` | 是否保留错误类型标签。 | 仅指标中间件开启时。 | 默认 `true`。 | 关了以后还想按 `panic`、`rate_limit_exceeded` 等标签看图。 |

## `lynx.http.security`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `max_request_size` | 预期中的请求体大小上限。 | 启动时会读入。 | 默认 `10485760`（10 MiB），但当前 HTTP 运行时并不会据此拦截请求体。 | 以为超大请求会自动被拒绝。 |
| `cors` | 预期中的 CORS 配置块。 | 启动时能读到。 | 目前只是模板 / proto 面存在，运行时未应用。 | 配了它就期待浏览器跨域行为变化。 |
| `rate_limit` | 进程内 HTTP 限流配置。 | 限流中间件开启时。 | 默认 `100` req/s、burst `200`；`enabled: false` 会把本地 limiter 关掉。 | 关了本地 limiter，却忘了控制面可能还会注入额外限流。 |
| `security_headers` | 预期中的安全响应头配置块。 | 启动时能读到。 | 目前只是模板 / proto 面存在，运行时未应用。 | 以为打开后就会自动加 CSP、X-Frame-Options。 |

### `lynx.http.security.cors`

这些键目前对 HTTP 插件本身来说还是说明性字段。

| 字段 | 作用 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- |
| `enabled` | 预期中的 CORS 开关。 | 默认 `false`；当前运行时不应用。 | 打开它后还期待自动回 CORS 头。 |
| `allowed_origins` | 预期中的来源白名单。 | 示例默认 `["*"]`；当前不应用。 | 以为它会真实限制浏览器来源。 |
| `allowed_methods` | 预期中的方法白名单。 | 示例默认 `GET, POST, PUT, DELETE, OPTIONS`；当前不应用。 | 把它当成真正的服务端方法 ACL。 |
| `allowed_headers` | 预期中的请求头白名单。 | 示例默认 `["*"]`；当前不应用。 | 以为它会影响后端 Header 解析。 |
| `exposed_headers` | 预期中的浏览器可见响应头。 | 示例默认空；当前不应用。 | 期待前端代码突然能读到新响应头。 |
| `allow_credentials` | 预期中的带凭证跨域开关。 | 示例默认 `false`；当前不应用。 | 把它当成 Cookie / Auth 策略本身。 |
| `max_age` | 预期中的预检缓存时长。 | 示例默认 `86400`；当前不应用。 | 调它却没有任何跨域中间件在工作。 |

### `lynx.http.security.rate_limit`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enabled` | 打开或关闭进程内限流器。 | 仅内建限流中间件中。 | 默认 `true`；`false` 会把本地 limiter 置空。 | 以为它能一并关掉控制面注入的限流。 |
| `rate_per_second` | 稳态每秒限流值。 | 仅 `enabled: true`。 | 默认 `100`；超过 `10000` 会校验失败。 | 填 `0` 想表示不限流，结果回退到默认值。 |
| `burst_limit` | 突发容量。 | 仅 `enabled: true`。 | 默认 `200`。 | 设太低导致短时间突发全被打掉。 |

### `lynx.http.security.security_headers`

这些键目前对 HTTP 插件本身来说还是说明性字段。

| 字段 | 作用 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- |
| `enabled` | 预期中的安全头总开关。 | 默认 `false`；当前不应用。 | 打开后还期待响应头变化。 |
| `content_security_policy` | 预期中的 CSP 值。 | 示例默认 `default-src 'self'`；当前不应用。 | 把它当成实际生效的浏览器策略。 |
| `x_frame_options` | 预期中的防 iframe 头。 | 示例默认 `DENY`；当前不应用。 | 误以为点击劫持保护已经打开。 |
| `x_content_type_options` | 预期中的 MIME 嗅探保护头。 | 示例默认 `nosniff`；当前不应用。 | 误以为浏览器已经收到这个头。 |
| `x_xss_protection` | 预期中的旧版浏览器 XSS 头。 | 示例默认 `1; mode=block`；当前不应用。 | 把它当成 XSS 主防线。 |

## `lynx.http.performance`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `max_connections` | 控制一个“请求准入信号量”。 | 请求处理中。 | 默认 `1000`；名字像连接数，但当前实现更接近“并发处理中请求数”限制。 | 把它当成 keep-alive TCP 连接上限。 |
| `max_concurrent_requests` | 控制第二个“请求准入信号量”。 | 请求处理中。 | 默认 `500`；它和 `max_connections` 谁更紧，谁先起作用。 | 两个值配冲突后，不知道到底哪个在限流。 |
| `read_buffer_size` | 设置 TCP 连接读缓冲区。 | 仅 TCP 监听。 | 默认 `4096`。 | 把它当成请求体大小上限。 |
| `write_buffer_size` | 设置 TCP 连接写缓冲区。 | 仅 TCP 监听。 | 默认 `4096`。 | 把它当成响应大小限制。 |
| `connection_pool` | 预期中的 keep-alive / 池调优块。 | 启动时会读到。 | 当前服务端代码并不消费这个嵌套块。 | 以为 `max_idle_conns` 能调整运行时行为。 |
| `read_timeout` | 设置 `net/http.Server.ReadTimeout`。 | 启动时。 | 只有显式配置才会写入；代码没有再补 `30s` 默认值。 | 只看模板注释，以为省略也会自动有 `30s`。 |
| `write_timeout` | 设置 `net/http.Server.WriteTimeout`。 | 启动时。 | 同上。 | 省略它，却期待慢客户端自动被切断。 |
| `idle_timeout` | 设置 `net/http.Server.IdleTimeout`。 | 启动时。 | 未配置时回退到运行时默认 `60s`。 | 配得过短导致 keep-alive 复用很差。 |
| `read_header_timeout` | 设置 `net/http.Server.ReadHeaderTimeout`。 | 启动时。 | 未配置时回退到运行时默认 `20s`。 | 留太大，暴露 slow header 风险。 |

### `lynx.http.performance.connection_pool`

这些键目前对 HTTP 服务端来说没有运行时效果。

| 字段 | 作用 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- |
| `max_idle_conns` | 预期中的空闲 keep-alive 总量。 | 示例默认 `100`；当前未消费。 | 以为它像 `http.Transport` 那样真实生效。 |
| `max_idle_conns_per_host` | 预期中的每主机空闲连接数。 | 示例默认 `10`；当前未消费。 | 把服务端配置当成出站客户端池配置。 |
| `max_conns_per_host` | 预期中的每主机硬上限。 | 示例默认 `100`；当前未消费。 | 想用它控制入站并发。 |
| `keep_alive_duration` | 预期中的 keep-alive 复用时长。 | 示例默认 `30s`；当前未消费。 | 调了半天却看不到任何变化。 |

## `lynx.http.middleware`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enable_tracing` | 打开 tracing 中间件。 | 中间件链构建时。 | 默认 `true`。 | 关掉它后还期待响应头带 Trace-Id / Span-Id。 |
| `enable_logging` | 打开请求 / 响应日志中间件。 | 中间件链构建时。 | 默认 `true`；`monitoring` 下的日志开关只有它开着才有意义。 | 关了它，却继续调 `monitoring.enable_request_logging`。 |
| `enable_recovery` | 打开 panic recovery。 | 中间件链构建时。 | 默认 `true`。 | 在线上关掉它。 |
| `enable_validation` | 打开 protobuf 请求校验。 | 中间件链构建时。 | 默认 `true`。 | 关掉后还期待 proto 校验报错继续出现。 |
| `enable_rate_limit` | 打开限流中间件。 | 中间件链构建时。 | 默认 `true`；也决定排队指标是否有来源。 | `security.rate_limit.enabled: true` 但这里关了。 |
| `enable_metrics` | 打开指标中间件或 trace/log/metrics 组合中间件。 | 中间件链构建时。 | 默认 `true`；它本身不负责暴露 `/metrics`。 | 只开它，不开 `monitoring.enable_metrics` 就想让 Prometheus 抓到。 |
| `custom_middleware` | 预留给自定义中间件接线的 map。 | 启动时能读到。 | 当前运行时不解释它。 | 往这里放开关后期待 Lynx 自动注册自定义中间件。 |

## `lynx.http.graceful_shutdown`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `shutdown_timeout` | 设置 HTTP 服务停机超时。 | 清理阶段。 | 默认 `30s`。 | 长请求很多却没调大。 |
| `wait_for_ongoing_requests` | 预期中的“等待在途请求”开关。 | 启动时会读到。 | 当前清理逻辑并不消费它。 | 设了它就以为停机会自动等待在途请求。 |
| `max_wait_time` | 预期中的在途请求等待上限。 | 启动时会读到。 | 当前清理逻辑并不消费它。 | 设了它就以为能额外延长 drain 时间。 |

## `lynx.http.circuit_breaker`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enabled` | 打开或关闭 HTTP 熔断器。 | 请求处理中。 | 整个块缺失时，运行时会创建一个默认开启的熔断器。 | 以为不写配置就等于完全关闭。 |
| `max_failures` | 熔断打开前允许的失败次数。 | 请求处理中。 | 默认 `5`。 | 设太低导致小抖动就打开熔断。 |
| `timeout` | 熔断器保持 open 的时长。 | 请求处理中。 | 默认 `60s`。 | 把它当成 HTTP 请求超时。 |
| `max_requests` | half-open 状态允许的探测请求数。 | 请求处理中。 | 默认 `10`。 | 设太高导致恢复探测阶段流量过多。 |
| `failure_threshold` | closed 状态下的失败率阈值。 | 请求处理中。 | 默认 `0.5`；显式写 `0` 也会被当成默认 `0.5`。 | 把 `0` 当成“关闭失败率门槛”。 |

## 完整 YAML 示例

```yaml
lynx:
  http:
    network: "tcp" # 监听类型；默认 tcp
    addr: ":8080" # 监听地址；默认 :8080
    timeout: "30s" # 模板示例值；省略时运行时代码默认 10s

    tls_enable: false # 只有 lynx.tls 已加载证书后才应打开
    tls_auth_type: 0 # 0..4；tls_enable=false 时不会生效

    monitoring:
      enable_metrics: true # 控制是否暴露 /metrics
      metrics_path: "/metrics" # 指标路径
      health_path: "/health" # 健康检查路径
      enable_request_logging: true # 请求日志仍依赖 middleware.enable_logging=true
      enable_error_logging: true # 错误日志同样依赖 logging 中间件
      enable_route_metrics: true # 按路由拆分指标
      enable_connection_metrics: true # 连接 / 池占用类指标
      enable_queue_metrics: true # 排队指标；限流中间件开着才有意义
      enable_error_type_metrics: true # 保留细粒度错误标签

    security:
      max_request_size: 10485760 # 模板值 10 MiB；当前运行时会存储但不会真实拦截请求体
      cors:
        enabled: false # 模板字段；当前 HTTP 运行时不会据此返回 CORS 头
        allowed_origins: ["*"] # 模板来源白名单
        allowed_methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] # 模板方法列表
        allowed_headers: ["*"] # 模板请求头列表
        exposed_headers: [] # 模板暴露响应头列表
        allow_credentials: false # 模板跨域凭证开关
        max_age: 86400 # 模板预检缓存秒数
      rate_limit:
        enabled: true # live 的进程内限流开关
        rate_per_second: 100 # 稳态限流值
        burst_limit: 200 # 突发容量
      security_headers:
        enabled: false # 模板字段；当前 HTTP 运行时不会自动下发这些头
        content_security_policy: "default-src 'self'" # 模板 CSP 值
        x_frame_options: "DENY" # 模板 X-Frame-Options 值
        x_content_type_options: "nosniff" # 模板 X-Content-Type-Options 值
        x_xss_protection: "1; mode=block" # 模板 X-XSS-Protection 值

    performance:
      max_connections: 1000 # live 的请求准入信号量，不是原始 socket 数
      max_concurrent_requests: 500 # 第二个并发请求上限
      read_buffer_size: 4096 # TCP 读缓冲区大小
      write_buffer_size: 4096 # TCP 写缓冲区大小
      connection_pool:
        max_idle_conns: 100 # 当前只是模板字段；服务端运行时不消费
        max_idle_conns_per_host: 10 # 当前只是模板字段
        max_conns_per_host: 100 # 当前只是模板字段
        keep_alive_duration: "30s" # 当前只是模板字段
      read_timeout: "30s" # 显式填写时才会写入 net/http.Server.ReadTimeout
      write_timeout: "30s" # 显式填写时才会写入 net/http.Server.WriteTimeout
      idle_timeout: "60s" # 省略时运行时默认 60s
      read_header_timeout: "20s" # 省略时运行时默认 20s

    middleware:
      enable_tracing: true # tracing 中间件开关
      enable_logging: true # 请求日志中间件开关
      enable_recovery: true # panic recovery 中间件开关
      enable_validation: true # protobuf 校验中间件开关
      enable_rate_limit: true # 本地限流中间件要生效必须保留 true
      enable_metrics: true # 请求指标中间件开关
      custom_middleware: {} # 占位 map；当前运行时不会解释它

    graceful_shutdown:
      shutdown_timeout: "30s" # live 的停机超时
      wait_for_ongoing_requests: true # 模板字段；当前清理逻辑不会消费
      max_wait_time: "60s" # 模板字段；当前清理逻辑不会消费

    circuit_breaker:
      enabled: true # 整块省略时运行时仍会创建默认开启的熔断器
      max_failures: 5 # 失败次数门槛
      timeout: "60s" # open 状态持续时间
      max_requests: 10 # half-open 探测请求上限
      failure_threshold: 0.5 # closed 状态下的失败率门槛
```

## 最小可用 YAML 示例

```yaml
lynx:
  http:
    addr: ":8080" # 足够启动一个纯 HTTP 监听；network 默认 tcp
```

只有当你真的要启用 HTTPS 时，才再补 `lynx.tls` 并把 `tls_enable` 打开。

## 实用规则

- 想要 HTTPS，要同时配好 TLS 插件和 `lynx.http.tls_enable: true`。
- 想让 Prometheus 抓到指标，要同时保留 `monitoring.enable_metrics: true` 和 `middleware.enable_metrics: true`。
- 想启用本地 HTTP 限流，要同时保留 `security.rate_limit.enabled: true` 和 `middleware.enable_rate_limit: true`。
- `cors`、`security_headers`、`connection_pool`、`custom_middleware`、优雅停机额外开关这些目前更像模板占位，不要把它们当成已经真实接线的能力。
