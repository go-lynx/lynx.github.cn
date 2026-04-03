---
id: grpc
title: gRPC 服务
---

# gRPC 服务

本页覆盖以下模板，并逐项对照当前运行时代码：

- `lynx-grpc/conf/example_config.yml`
- `lynx-grpc/conf/example_client_config.yml`
- `lynx-grpc/conf/example_complete_config.yml`
- `lynx-grpc/conf/example_polaris_config.yml`

## Runtime 事实

| 能力 | Go module | 配置前缀 | Runtime 插件名 |
| --- | --- | --- | --- |
| gRPC 服务端 | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.service` | `grpc.service` |
| gRPC 客户端 | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.client` | `grpc.client` |

## 配置前先知道

- `lynx.grpc.service` 和 `lynx.grpc.client` 是两套独立能力，可以只开服务端、只开客户端，或同时启用。
- 服务端如果省略 stream / message size，不会回到 protobuf 注释里的“零值语义”，而是启动时补上更安全的运行时默认值：`1000` 个并发 stream、`10 MiB` 的收发消息上限。
- `lynx.grpc.service` 还会从同一前缀读取一些仅 YAML 暴露的扩展键，例如 `graceful_shutdown_timeout`、`rate_limit`、`max_inflight_unary`、`circuit_breaker`。
- 客户端优先使用 `subscribe_services`；`services` 只是兼容历史配置。
- `example_client_config.yml` 末尾还给出了一段顶层 `subscriptions.grpc[*]` 示例。真实 bootstrap 配置里，它属于 `lynx.subscriptions.grpc[*]`，而不是 `lynx.grpc.client`。
- 当前客户端代码真正生效的开关里，`tracing_enabled` 是 live 的，但 `metrics_enabled`、`logging_enabled`、`health_check_enabled`、`health_check_interval`、`max_message_size`、`compression_enabled`、`compression_type` 目前还只有模板 / proto 面定义，没有对应运行时效果。
- `subscribe_services[*]` 里的 `tls_enable` 和 `tls_auth_type` 现在不会可靠继承客户端全局 TLS 默认值；你不写，就会落成 `false` / `0`。

## `lynx.grpc.service`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `network` | 选择监听传输类型。 | 一直生效。 | 默认 `tcp`。 | 选了 `unix` 却仍填写 TCP 地址。 |
| `addr` | 设置监听地址。 | 一直生效。 | 默认 `:9090`。 | 只绑回环地址却期待跨主机访问。 |
| `tls_enable` | 打开 gRPC 服务端 TLS。 | 只有证书来源已就绪时。 | 默认 `false`；通常要配合可工作的 [TLS Manager](/docs/existing-plugin/tls-manager)。 | 证书还没准备好就先开 TLS。 |
| `tls_auth_type` | 选择客户端证书校验策略。 | 仅 `tls_enable: true`。 | 默认 `0`；合法值 `0..4`。 | TLS 没开，却配置了 mTLS 策略。 |
| `timeout` | 设置 Kratos gRPC 请求超时。 | 一直生效。 | 默认 `10s`。 | 有长耗时 RPC 却没同步调大。 |
| `max_concurrent_streams` | 限制每个连接的 HTTP/2 并发 stream 数。 | 服务端启动时。 | 省略或写 `0` 时，运行时仍会补成安全默认值 `1000`。 | 只看 proto 注释，以为 `0` 在实际运行里等于不限流。 |
| `max_recv_msg_size` | 限制入站消息大小，单位字节。 | 服务端启动时。 | 省略或写 `0` 时，运行时补成 `10 MiB`。 | 仍按上游 gRPC 默认约 `4 MiB` 去理解。 |
| `max_send_msg_size` | 限制出站消息大小，单位字节。 | 服务端启动时。 | 省略或写 `0` 时，运行时补成 `10 MiB`。 | 大响应 / 流式场景没同步调大。 |

## 额外的 `lynx.grpc.service` YAML 键

`example_config.yml` 里还有一些不在 `service.proto` 内，但运行时仍通过 `ServerOptions` 从 `lynx.grpc.service` 前缀读取的键。

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `graceful_shutdown_timeout` | 设置服务端停机等待时间。 | 停机阶段。 | 默认 `30s`。 | 把它和请求超时混为一谈。 |
| `enable_tracing` | 打开 gRPC tracing 拦截器。 | 启动时。 | 默认 `true`。 | 关掉它后还期待服务端继续产出 gRPC span。 |
| `enable_request_logging` | 打开 unary / stream 请求日志。 | 启动时。 | 默认 `true`。 | 关掉它后还在找带 trace-id 的请求日志。 |
| `enable_metrics` | 打开 unary / stream 指标拦截器。 | 启动时。 | 默认 `true`。 | 关掉后还期待服务端 gRPC 指标继续出现。 |
| `rate_limit.enabled` | 打开进程内服务端限流器。 | 启动时。 | 默认 `false`；不显式开启就不会生效。 | 误以为示例里有这个块就已经启用。 |
| `rate_limit.rate_per_second` | 设置稳态 unary RPC 吞吐。 | 仅 `rate_limit.enabled: true`。 | 除零值保护外没有额外默认值。 | 只填了速率，却没把 `enabled` 打开。 |
| `rate_limit.burst` | 设置限流突发容量。 | 仅 `rate_limit.enabled: true`。 | `<= 0` 时回退到 `rate_per_second + 1`。 | 留 `0` 却误判实际 burst。 |
| `max_inflight_unary` | 限制并发执行中的 unary RPC 数。 | 仅值 `> 0`。 | 默认 `0` 表示不限制。 | 以为它也能限制 streaming RPC。 |
| `circuit_breaker.enabled` | 打开服务端熔断器。 | 启动时。 | 默认 `false`。 | 误以为和 HTTP 插件一样默认就开。 |
| `circuit_breaker.failure_threshold` | 熔断打开前的失败次数门槛。 | 仅熔断启用时。 | 省略或非法时默认 `5`。 | 把它当成失败率而不是失败次数。 |
| `circuit_breaker.recovery_timeout` | 熔断从 open 进入 half-open 前的等待时长。 | 仅熔断启用时。 | 默认 `30s`。 | 把它当成单次请求超时。 |
| `circuit_breaker.success_threshold` | 熔断恢复关闭前需要的成功探测次数。 | 仅熔断启用时。 | 默认 `3`。 | 设太高导致 half-open 持续过久。 |
| `circuit_breaker.timeout` | 熔断保护请求时使用的超时。 | 仅熔断启用时。 | 默认 `10s`。 | 误以为它会替代 `lynx.grpc.service.timeout`。 |
| `circuit_breaker.max_concurrent_requests` | 熔断参与时允许的并发请求数。 | 仅熔断启用时。 | 默认 `10`。 | 配得低于常规流量，制造出额外节流。 |

## `lynx.grpc.client`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `default_timeout` | 出站 RPC 的默认超时。 | 服务项没覆写 `timeout` 时。 | 默认 `10s`。 | 忘了它也影响 `required: true` 服务的启动探活等待。 |
| `default_keep_alive` | 客户端连接 keepalive 周期。 | 建连时。 | 默认 `30s`。 | 设太小导致重连抖动频繁。 |
| `max_retries` | 可重试 unary RPC 的默认重试次数。 | 重试拦截器中。 | 默认 `3`；服务项里 `0` 或更小会回退到这个全局值。 | 配得很高，却忘了重试会放大时延。 |
| `retry_backoff` | 重试退避基础间隔。 | 重试拦截器中。 | 默认 `1s`。 | 配得太大，让短暂故障看起来像卡死。 |
| `max_connections` | 每个服务在连接池里的最大连接数。 | 开启连接池或创建池化连接时。 | 默认 `10`。 | 把它理解成“最多跟踪多少个服务”。 |
| `tls_enable` | 全局兜底客户端连接是否启用 TLS。 | `createConnection()` 和历史路径里。 | 默认 `false`。 | 全局打开后，以为 `subscribe_services[*]` 会自动继承。 |
| `tls_auth_type` | 全局兜底客户端 TLS 认证模式。 | 全局 TLS 路径中。 | 默认 `0`。 | TLS 没开还期待它起作用。 |
| `connection_pooling` | 是否启用多连接池。 | 客户端初始化时。 | 默认 `false`。 | 打开后却把 `pool_size` 和 `max_connections` 按错误维度去调。 |
| `pool_size` | 连接池最多跟踪多少个服务项。 | 仅 `connection_pooling: true`。 | `<= 0` 时回退到 `10`。 | 把它当成“每个服务保留多少连接”。 |
| `idle_timeout` | 池化连接空闲淘汰时间。 | 仅 `connection_pooling: true`。 | 缺失或 `<= 0` 时回退到 `5m`。 | 配到一分钟以下导致频繁重连。 |
| `health_check_enabled` | 预期中的客户端健康检查开关。 | 启动时会解析。 | 目前模板 / proto 有，代码未使用。 | 以为打开后就会自动做 gRPC health probe。 |
| `health_check_interval` | 预期中的客户端健康检查频率。 | 启动时会解析。 | 当前未使用。 | 调了它却看不到任何运行时变化。 |
| `metrics_enabled` | 预期中的客户端指标开关。 | 启动时会解析。 | 当前客户端无论此值如何都会挂指标拦截器。 | 设成 `false` 后还惊讶指标没停。 |
| `tracing_enabled` | 是否向出站 metadata 注入 trace 上下文。 | 构建客户端拦截器时。 | 默认 `false`。 | 启用了 `lynx-tracer` 却忘了这里，结果链路不串。 |
| `logging_enabled` | 预期中的客户端日志开关。 | 启动时会解析。 | 当前客户端无论此值如何都会挂日志拦截器。 | 设成 `false` 后还期待客户端静默。 |
| `max_message_size` | 预期中的客户端消息大小覆盖。 | 启动时会解析。 | 当前 dial 选项未使用。 | 把它当成真实生效的保护上限。 |
| `compression_enabled` | 预期中的压缩开关。 | 启动时会解析。 | 当前未接线。 | 以为打开后链路会自动启用 gzip。 |
| `compression_type` | 预期中的压缩算法。 | 启动时会解析。 | 当前未接线。 | 配成 `gzip` 后发现线上仍是明文未压缩流量。 |
| `subscribe_services` | 推荐使用的按服务配置 / 发现配置列表。 | `GetConnection(serviceName)` 优先走这里。 | 默认空。 | 新服务仍只写进已废弃的 `services`。 |
| `services` | 已废弃的旧静态服务列表。 | 只有 `subscribe_services` 没命中时才兜底。 | 仍兼容，但启动会告警。 | 把 discovery-first 的新服务继续写在这里。 |

## `lynx.grpc.client.subscribe_services[*]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `name` | 作为 discovery 服务名和 `GetConnection(name)` 的查找键。 | 一直生效。 | 必填。 | 同一个服务名写了两次，校验会直接拒绝。 |
| `endpoint` | 静态地址覆盖。 | 仅没有 discovery 实例时。 | 一旦 discovery 存在，当前代码会忽略它，不会做“在线 fallback”。 | 以为 Polaris 在场时它还能兜底。 |
| `timeout` | 单服务超时覆盖。 | 该服务被选中时。 | 回退到 `default_timeout`。 | 慢上游没调大，且 `required: true` 导致启动失败。 |
| `tls_enable` | 单服务 TLS 开关。 | 该订阅项被选中时。 | 当前不会继承全局值；不写就等于 `false`。 | 全局开了 TLS，却忘了在每个服务项上重复声明。 |
| `tls_auth_type` | 单服务 TLS 认证模式。 | 仅该服务项 `tls_enable: true`。 | 当前不会可靠继承全局值；不写就等于 `0`。 | 误以为全局 mTLS 策略会自动下沉。 |
| `max_retries` | 单服务重试次数覆盖。 | 重试拦截器中。 | `0` 会回退到全局重试次数。 | 把 `0` 误解成“完全不重试”。 |
| `required` | 启动时上游不可达就直接失败。 | 仅启动探活阶段。 | 默认 `false`。 | 把可选依赖标成必需，拖死整个服务启动。 |
| `metadata` | 负载均衡筛选和路由提示的附加元数据。 | 仅所选负载均衡器会用到时。 | 可选 map。 | 把它当成每次 RPC 自动发送的请求 metadata。 |
| `load_balancer` | 选择服务选址策略。 | 仅 discovery 可用时。 | 当前校验器接受 `round_robin`、`random`、`weighted_round_robin`。 | 静态 endpoint 场景下配置它，却期待真的生效。 |
| `circuit_breaker_enabled` | 是否打开该上游的客户端熔断。 | 仅此服务。 | 默认 `false`。 | 以为客户端有一个全局共享熔断器。 |
| `circuit_breaker_threshold` | 单服务熔断失败次数门槛。 | 仅 `circuit_breaker_enabled: true`。 | 过高会触发校验告警。 | 配得过高，导致熔断几乎永远不触发。 |

## 已废弃的 `lynx.grpc.client.services[*]`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `name` | 历史服务键。 | 一直生效。 | 必填。 | 继续复用现代 discovery 服务名，却没迁移到 `subscribe_services`。 |
| `endpoint` | 静态上游地址。 | 一直生效。 | 历史列表里必填。 | 留空后还期待 discovery 自动补齐。 |
| `timeout` | 历史单服务超时。 | 历史项被选中时。 | 省略时回退到全局客户端超时。 | 以为它能影响 `subscribe_services`。 |
| `tls_enable` | 历史单服务 TLS 开关。 | 历史项被选中时。 | 默认 `false`。 | 应用里没有证书提供者却打开了 TLS。 |
| `tls_auth_type` | 历史单服务 TLS 模式。 | 仅历史 TLS 打开时。 | 默认 `0`。 | TLS 关闭状态下还期待它改变行为。 |
| `max_retries` | 历史单服务重试次数。 | 历史项被选中时。 | `0` 时回退到全局配置。 | 把它当成现代 discovery 服务的覆盖项。 |

## `example_client_config.yml` 里的顶层 `lynx.subscriptions.grpc[*]`

`example_client_config.yml` 结尾还有第二段示例块：`subscriptions.grpc[*]`。这组键不属于 `lynx.grpc.client`，而是属于 Lynx bootstrap 订阅配置；真实运行时路径应写成 `lynx.subscriptions.grpc[*]`。

这组键由 `lynx/subscribe` 里的 core subscription loader 消费，适合描述“启动阶段要建立并复用的 gRPC 订阅连接”。它和 `lynx.grpc.client.subscribe_services[*]` 是两套不同的配置面，不应混写成同一语义。

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `service` | 指定 discovery 中的上游服务名，同时也作为订阅连接的 key。 | 一直生效。 | 必填；开启 TLS 时，它还会被用作证书校验里的 `ServerName`。 | 把这里写成 `host:port`，而不是服务发现注册名。 |
| `tls` | 为该订阅连接打开 TLS。 | 仅 `lynx.subscriptions.grpc[*]` 订阅路径。 | 默认 `false`；为 `true` 时，core loader 会先开 TLS，再按 `ca_name` / `ca_group` 取 CA，或回退到应用默认 Root CA provider。 | 开了 TLS，却没有任何 CA 来源或默认 Root CA。 |
| `required` | 把该订阅标记为启动期硬依赖。 | 启动建连阶段。 | 默认 `false`；失败时不再只是告警跳过，而是直接返回错误。 | 把可选上游标成必需，导致服务起不来。 |
| `ca_name` | 指定该订阅 TLS 路径使用的根 CA 配置名 / 载荷名。 | 仅 `tls: true` 且需要从配置 / 控制面拉取 CA 时。 | 留空表示改用应用默认 Root CA provider。 | `tls` 没开就填它，或应用路径里没有 config provider 却硬填。 |
| `ca_group` | 指定该 CA 配置所在的分组。 | 仅 `tls: true` 且 `ca_name` 已设置。 | 在 core loader 里，留空会回退到 `ca_name`。 | 分组填错，结果拉到了错误的 CA。 |

## `example_polaris_config.yml`：服务发现前提

`example_polaris_config.yml` 里的 `lynx.polaris` 配置不属于 `lynx-grpc` 本身，而是 Polaris 控制面插件的配置。但它依然会改变 gRPC 客户端行为，因为 discovery 一旦可用，`grpc.client` 的选址逻辑就会切换。

| 字段 | 对 gRPC 使用者的作用 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- |
| `lynx.polaris.namespace` | 选择客户端实际去解析的服务发现命名空间。 | 省略时 Polaris 默认 `default`。 | 命名空间写错，最后误判成 gRPC discovery 失效。 |
| `lynx.polaris.server_addresses` | 指向一个或多个 Polaris 服务发现端点。 | 远程发现实践里基本必填。 | 服务网络里根本连不到 Polaris。 |
| `lynx.polaris.enable_retry` | 打开 Polaris 侧重试。 | 有助于发现端短暂故障恢复。 | 关掉 gRPC 重试后，忘了 Polaris 还有自己的重试语义。 |
| `lynx.polaris.max_retry_times` | 限制 Polaris 重试次数。 | Polaris 自身会校验范围。 | 设太大，让发现失败耗时过长。 |
| `lynx.polaris.retry_interval` | Polaris 重试间隔。 | 和 `max_retry_times` 配合使用。 | 间隔配太大，让服务发现看上去像“卡住”。 |
| `lynx.polaris.health_check_interval` | 控制 Polaris 侧健康检查 / 刷新频率。 | 会影响发现状态变化被感知的速度。 | 误以为它能替代客户端自己的每次 RPC 健康检查。 |

## 实用规则

- 服务端 TLS 和客户端 TLS 要分开配，它们不会自动联动。
- 现在如果某个上游需要 TLS，请在 `subscribe_services[*]` 里把相关 TLS 字段重复写清楚。
- `required: true` 只留给那些“启动没它就没法继续”的硬依赖。
- `metrics_enabled`、`logging_enabled`、`health_check_*`、`max_message_size`、`compression_*` 目前更应该视为前瞻模板字段，而不是已经生效的客户端开关。
