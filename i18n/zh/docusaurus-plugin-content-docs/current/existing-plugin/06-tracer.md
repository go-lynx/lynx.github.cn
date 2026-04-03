---
id: tracer
title: Tracer 插件
---

# Tracer 插件

`lynx-tracer/conf/example_config.yml` 仍然是一个历史参考模板，但当前运行时并不会直接扫描那个顶层结构。真正会生效的前缀只有 `lynx.tracer`。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go 模块 | `github.com/go-lynx/lynx-tracer` |
| 配置前缀 | `lynx.tracer` |
| runtime 插件名 | `tracer.server` |
| 主要作用 | 注册全局 OpenTelemetry `TracerProvider` 和传播器 |

## 配置前先记住几点

- 运行时读取的是 `lynx.tracer.enable`，不是顶层 `enabled`。
- 运行时读取的是 `lynx.tracer.addr`，不是顶层 `address`。
- 运行时读取的是 `lynx.tracer.config.protocol`，不是顶层 `protocol`。
- 当 `addr` 精确等于 `"None"` 时，插件仍会初始化 TracerProvider 和 propagator，但不会创建 exporter。
- 旧的顶层 `ratio` 没配时会因为代码把 `0` 归一成 `1.0`，最终变成全量采样。如果你真的想不采样，请用 `config.sampler.type: ALWAYS_OFF`。
- 当 `config.batch.enabled: true` 且未显式填写队列 / batch 大小时，插件会回退到 OpenTelemetry SDK 默认值：队列 `2048`、单批 `512`。
- `event_attribute_count_limit` 和 `link_attribute_count_limit` 为兼容字段，但当前实现不会真正应用。
- 模板里的 `production_example`、`development_example`、`high_performance_example` 只是参考块，不是额外的运行时配置根。

## 历史模板键到运行时键的映射

| 历史模板键 | 真正生效的运行时键 | 作用 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enabled` | `lynx.tracer.enable` | 打开或关闭 tracer 插件。 | `false` 时插件会在创建 provider 前直接退出。 | 继续写旧顶层键，结果 tracing 根本没启动。 |
| `address` | `lynx.tracer.addr` | 设置 OTLP collector 地址，格式是 `host:port`。 | `enable: true` 时必填；想只保留传播可写 `"None"`。 | 继续写 `address` 或把 `http://` 带进值里。 |
| `protocol` | `lynx.tracer.config.protocol` | 选择 OTLP gRPC 或 OTLP HTTP。 | 未指定时按 gRPC 路径处理。 | 还写旧顶层键，结果 exporter 模式没有变化。 |
| `connection.*` | `lynx.tracer.config.connection.*` | 调整 exporter 连接生命周期和重连行为。 | 仅 gRPC exporter 使用。 | 以为它也能影响 OTLP HTTP。 |
| `load_balancing.*` | `lynx.tracer.config.load_balancing.*` | 设置 gRPC exporter 负载均衡策略。 | 仅 gRPC exporter 使用。 | 明明 exporter 走的是 HTTP，却还在调它。 |
| `batch.*` | `lynx.tracer.config.batch.*` | 控制 batch span processor。 | 仅 `batch.enabled: true` 时。 | 还沿用旧平铺字段名，却没放到 `config` 下。 |
| `retry.*` | `lynx.tracer.config.retry.*` | 配置 gRPC exporter 重试。 | 仅 gRPC exporter 使用。 | 以为 OTLP HTTP 会读取这段。 |
| `sampler.*` | `lynx.tracer.config.sampler.*` | 选择采样策略。 | 优先级高于旧顶层 `ratio`。 | 两边都配了，却忘了嵌套 sampler 才是优先项。 |
| `propagators` | `lynx.tracer.config.propagators` | 选择入站 / 出站 trace 上下文格式。 | 留空时默认 W3C Trace Context + W3C Baggage。 | 继续用 `W3C_TRACECONTEXT` 这类过时枚举名。 |
| `resource.*` | `lynx.tracer.config.resource.*` | 设置 `service.name` 和附加 resource 属性。 | 版本号、命名空间等会由应用 / 控制面自动补充。 | 继续写 `service_version`、`service_namespace` 这类旧键。 |
| `limits.*` | `lynx.tracer.config.limits.*` | 覆盖 span 限制。 | 当前只有 4 个字段真正生效：属性数、属性值长度、event 数、link 数。 | 还写旧的 `max_*` 字段名，期待自动映射。 |
| `http_path` | `lynx.tracer.config.http_path` | 设置 OTLP HTTP 请求路径。 | 仅 OTLP HTTP 使用；默认 `/v1/traces`。 | 在 gRPC 模式下配置它，还期待生效。 |
| `tls.*` | `lynx.tracer.config.tls.*` 与 `lynx.tracer.config.insecure` | 配置 TLS / mTLS。 | 当前没有 `tls.enabled`；是否明文由 `config.insecure: true` 控制。 | 继续保留 `tls.enabled: false`，以为这样就关闭 TLS。 |
| `compression` | `lynx.tracer.config.compression` | 开启 exporter 压缩。 | 合法值只有 `COMPRESSION_NONE` 和 `COMPRESSION_GZIP`。 | 还把它写在旧顶层。 |

## `lynx.tracer`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enable` | 打开 tracer 插件。 | 一直生效。 | `false` 时不会创建 provider、exporter，也不会覆盖 propagator。 | 开了 `lynx-http` / `lynx-grpc` tracing 中间件，却忘了真正打开 tracer 插件。 |
| `addr` | OTLP collector 地址。 | 仅 `enable: true`。 | 除非刻意用 `"None"`，否则启用时必填；空值会校验失败。 | 写成带 scheme 的 URL，而不是 `host:port`。 |
| `ratio` | 历史兼容采样率。 | 仅在 `config.sampler` 缺失或未指定时。 | `0` 会被归一成 `1.0`；真正想禁采样请用 `ALWAYS_OFF`。 | 设成 `0` 还以为不会采样。 |
| `config` | 嵌套的 exporter / sampler / propagator 配置。 | 建议使用。 | 一旦存在，优先覆盖旧平铺写法。 | 新旧两套键混用，还把旧模板当权威。 |

## `lynx.tracer.config`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `protocol` | 选择 `OTLP_GRPC` 或 `OTLP_HTTP`。 | 构建 exporter 时。 | 未指定时按 gRPC 处理。 | 写成 `PROTOCOL_OTLP_GRPC` 之类旧枚举名。 |
| `insecure` | 强制使用明文传输。 | 构建 exporter 时。 | 默认 `false`；否则走 TLS 规则。 | 本地 collector 是明文的，却忘了开它。 |
| `tls` | 提供 CA 和可选客户端证书，用于 TLS / mTLS。 | `insecure: false` 时。 | 可选；当前只有 `ca_file`、`cert_file`、`key_file`、`insecure_skip_verify` 这几个键。 | 继续保留旧的 `tls.enabled` 标志。 |
| `headers` | 追加 exporter 自定义请求头。 | 构建 exporter 时。 | 可选 map。 | 把鉴权头写在旧顶层结构。 |
| `compression` | 启用 exporter 压缩。 | 构建 exporter 时。 | 默认 `COMPRESSION_NONE`。 | 写成普通字符串 `gzip`，而不是枚举名。 |
| `timeout` | 设置导出超时。 | 构建 exporter 时。 | 可选 Duration。 | 和 `config.connection.connect_timeout` 混淆。 |
| `retry` | 配置 exporter 重试。 | 仅 OTLP gRPC。 | 可选；HTTP exporter 不读取。 | 期待 HTTP exporter 走这段重试策略。 |
| `connection` | 配置连接生命周期。 | 仅 OTLP gRPC。 | 可选；整块缺失时会用诸如 `5s` 重连间隔等默认值。 | HTTP 模式下还在调连接寿命。 |
| `load_balancing` | 配置 gRPC service config 和节点选择策略。 | 仅 OTLP gRPC。 | 可选；支持 `pick_first`、`round_robin`、`least_conn`。 | 配了不支持的策略导致校验失败。 |
| `batch` | 配置 batch span processor。 | 仅 `batch.enabled: true`。 | 关闭或缺失时走同步导出。 | 还沿用旧模板里的 `batch_timeout` 名称，而不是 `scheduled_delay`。 |
| `sampler` | 选择采样策略。 | 存在时始终优先。 | 优先级高于顶层 `ratio`。 | 内外两层都写采样率，却误以为外层会覆盖。 |
| `propagators` | 选择上下文传播格式。 | 存在时。 | 留空回退到 W3C Trace Context + W3C Baggage。 | 继续使用老文档里的过时枚举名。 |
| `resource` | 设置 `service.name` 和自定义属性。 | 存在时。 | 运行时还会自动补 service instance ID、应用版本、控制面命名空间等属性。 | 期待 `service_version`、`service_namespace` 也能从这里配置。 |
| `limits` | 覆盖 span 限制。 | 存在时。 | 只有已支持字段会真正应用。 | 把兼容占位字段填满，却期待运行时变化。 |
| `http_path` | 覆盖 OTLP HTTP 请求路径。 | 仅 OTLP HTTP。 | 默认 `/v1/traces`。 | 仍在 `OTLP_GRPC` 模式下设置它。 |

## `lynx.tracer.config.connection`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `max_conn_idle_time` | 关闭空闲过久的 exporter 连接。 | 仅 OTLP gRPC。 | 可选。 | 配得比 `max_conn_age` 还长，触发校验问题。 |
| `max_conn_age` | 限制连接总寿命。 | 仅 OTLP gRPC。 | 可选。 | 比 `max_conn_idle_time` 还短。 |
| `max_conn_age_grace` | 硬关闭前再给一段宽限时间。 | 仅 OTLP gRPC。 | 可选。 | 以为它会延长导出超时。 |
| `connect_timeout` | 限制 exporter 建连时间。 | 仅 OTLP gRPC。 | 可选。 | 跟 `config.timeout` 混淆。 |
| `reconnection_period` | 设置最小重连间隔。 | 仅 OTLP gRPC。 | 整块缺失时默认 `5s`。 | 留得太短，故障期疯狂重连。 |

## `lynx.tracer.config.load_balancing`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `policy` | 选择 gRPC 负载均衡策略。 | 仅 OTLP gRPC。 | 支持 `pick_first`、`round_robin`、`least_conn`。 | 因为其他插件支持 `random`，就以为 tracer 这里也能用。 |
| `health_check` | 在 gRPC service config 中附带健康检查提示。 | 仅 OTLP gRPC。 | 可选。 | 以为 OTLP HTTP 也会读取它。 |

## `lynx.tracer.config.batch`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enabled` | 打开 batch span processor。 | 一直生效。 | `false` 时走同步导出。 | 配了一堆队列参数，却忘了打开它。 |
| `max_queue_size` | 限制待导出的 span 队列大小。 | 仅 batching 开启时。 | 省略时默认 `2048`。 | 继续用旧写法，却没放到 `config.batch` 下。 |
| `scheduled_delay` | 两次批量 flush 之间的等待时间。 | 仅 batching 开启时。 | 可选。 | 从旧模板复制 `batch_timeout`。 |
| `export_timeout` | 限制单次 batch 导出时间。 | 仅 batching 开启时。 | 可选。 | 和全局 exporter timeout 混淆。 |
| `max_batch_size` | 限制单批最多包含多少 span。 | 仅 batching 开启时。 | 省略时默认 `512`。 | 配得比 `max_queue_size` 还大，触发校验失败。 |

## `lynx.tracer.config.retry`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enabled` | 打开 exporter 重试。 | 仅 OTLP gRPC。 | 可选。 | 以为 HTTP exporter 也会重试。 |
| `max_attempts` | 限制重试次数。 | 仅重试启用时。 | 最小值 `1`。 | 写成 `0` 还想表示“用默认重试”。 |
| `initial_interval` | 首次退避间隔。 | 仅重试启用时。 | 可选。 | 设得比 `max_interval` 还大。 |
| `max_interval` | 退避最大间隔。 | 仅重试启用时。 | 可选。 | 还以为旧模板里的 `multiplier` 依然存在。 |

## `lynx.tracer.config.sampler`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `type` | 选择 `ALWAYS_ON`、`ALWAYS_OFF`、`TRACEID_RATIO`、`PARENT_BASED_TRACEID_RATIO`。 | sampler 块存在时。 | `SAMPLER_UNSPECIFIED` 会回退到顶层 `ratio`。 | 块虽然存在，但 `type` 没写，最后排查错了采样器。 |
| `ratio` | 比例采样场景的采样率。 | 仅 `TRACEID_RATIO` 和 `PARENT_BASED_TRACEID_RATIO`。 | 合法范围 `0.0..1.0`；非法值会回退到顶层 `ratio`。 | 写出范围却没注意到已经回退。 |

## `lynx.tracer.config.resource`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `service_name` | 覆盖 OpenTelemetry 的 `service.name`。 | 存在时。 | 默认回退到当前 Lynx 应用名，再退到 `unknown-service`。 | 继续使用 `service_version` / `service_namespace` 这类旧键。 |
| `attributes` | 追加自定义 resource 属性。 | 存在时。 | 空值会被跳过。 | 把 service name、namespace 这类已有专属字段又塞进这里。 |

## `lynx.tracer.config.limits`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `attribute_count_limit` | 限制 span 属性数量。 | 存在时。 | 可选；缺失就走 SDK 默认。 | 继续用旧键 `max_attributes_per_span`。 |
| `attribute_value_length_limit` | 限制单个属性值长度。 | 存在时。 | 可选。 | 继续用旧键 `max_attribute_value_length`。 |
| `event_count_limit` | 限制每个 span 的 event 数。 | 存在时。 | 可选。 | 继续用旧键 `max_events_per_span`。 |
| `event_attribute_count_limit` | 兼容占位字段。 | 能被解析，但当前实现忽略。 | 目前没有运行时效果。 | 以为它会真的裁剪 event attribute。 |
| `link_count_limit` | 限制每个 span 的 link 数。 | 存在时。 | 可选。 | 继续用旧键 `max_links_per_span`。 |
| `link_attribute_count_limit` | 兼容占位字段。 | 能被解析，但当前实现忽略。 | 目前没有运行时效果。 | 因为 proto 里有它，就误以为已被强制执行。 |

## `lynx.tracer.config.tls`

| 字段 | 作用 | 何时生效 | 默认值 / 交互关系 | 常见误配 |
| --- | --- | --- | --- | --- |
| `ca_file` | 指定用于校验 collector 的 CA。 | 仅 `config.insecure: false`。 | 可选，但自定义 PKI 场景常见。 | 仍写在旧的顶层 `tls.ca_file`。 |
| `cert_file` | 指定 mTLS 客户端证书。 | 仅 collector 要求 mTLS 时。 | 可选。 | 配了证书却没配对应私钥。 |
| `key_file` | 指定 mTLS 客户端私钥。 | 仅 `cert_file` 已设置。 | 可选。 | 指向错误的 key 或缺失文件。 |
| `insecure_skip_verify` | 跳过对端证书校验。 | 仅 TLS 在用时。 | 只建议测试环境使用。 | 把它当成证书问题的常规修复手段。 |

## 修正后的 YAML 骨架

```yaml
lynx:
  tracer:
    enable: true
    addr: "otel-collector:4317" # 只做传播不导出时用 "None"
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

旧的 `example_config.yml` 更适合作为“能力清单”，不要把它原样当成可直接复制的运行时配置。
