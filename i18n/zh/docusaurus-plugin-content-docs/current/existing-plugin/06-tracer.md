---
id: tracer
title: 链路跟踪插件
---

# 链路跟踪插件

Go-Lynx 为微服务之间的调度提供了链路追踪插件，以便于我们进行错误排查，性能排查，日志审计等工作，底层基于 OpenTelemetry 标准实现。

## 基础配置

在配置文件中添加以下内容即可启用链路追踪：

```yaml
lynx:
  tracer:
    enable: true
    addr: "127.0.0.1:4317"
    ratio: 1
```

| 配置项 | 说明 |
|--------|------|
| `enable` | 是否启用链路追踪（true/false） |
| `addr` | OTLP 采集器地址，格式为 `host:port`。gRPC 常用 4317，HTTP 常用 4318 |
| `ratio` | 采样率，取值范围 0-1。1 表示全量采样，建议测试环境用 1，生产环境可适当减小（如 0.1） |

配置完成后启动服务即可在对应的链路跟踪服务器的 Web-UI 上查看采集信息，无需编写额外代码。

## 高级配置（v2）

v2 版本支持模块化配置，可精细控制协议、TLS、重试、批处理、采样等：

```yaml
lynx:
  tracer:
    enable: true
    addr: "otel-collector:4317"
    config:
      protocol: PROTOCOL_OTLP_GRPC
      insecure: true
      batch:
        enabled: true
        max_queue_size: 2048
        max_batch_size: 512
      sampler:
        type: PARENT_BASED_TRACEID_RATIO
        ratio: 0.1
      propagators: [W3C_TRACE_CONTEXT, W3C_BAGGAGE]
```

### 特殊地址值 `None`

当 `addr` 设置为 `"None"`（区分大小写）时，插件会初始化 Trace 上下文传播（traceparent、baggage 等），但**不会**向任何采集器导出数据。适用于仅需日志关联、无需实际采集的场景（如本地开发、采集器不可用时）。

### 禁用采样

要完全禁用采样，请使用 `config.sampler.type: ALWAYS_OFF`，而不是 `ratio: 0`（`ratio: 0` 会被归一化为 1.0）。

## 更多配置

完整配置选项与示例请参见 [lynx-tracer README](https://github.com/go-lynx/lynx-tracer)。
