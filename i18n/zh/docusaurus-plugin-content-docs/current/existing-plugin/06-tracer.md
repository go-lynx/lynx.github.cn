---
id: tracer
title: Tracer 插件
---

# Tracer 插件

`lynx-tracer` 负责把 OpenTelemetry tracing 接到 Lynx 的启动阶段里。它并不只是简单包一层 exporter，而是在运行时初始化全局 tracer provider、安装 propagator 与采样策略，并在应用退出时完成 flush 和 shutdown。

## 运行时事实

| 项目 | 值 |
| --- | --- |
| Go 模块 | `github.com/go-lynx/lynx-tracer` |
| 配置前缀 | `lynx.tracer` |
| runtime 插件名 | `tracer.server` |
| 主要作用 | 注册全局 OpenTelemetry tracer provider 与 propagator |

## 实现里实际提供了什么

- 启动时读取 `lynx.tracer`，并校验地址、采样器与 exporter 配置
- 支持 OTLP gRPC / OTLP HTTP 导出，以及 batch、retry、compression、TLS、连接参数等能力
- 构建 OpenTelemetry resource 信息，包括 service name 和自定义 attributes
- 安装全局 propagator，让 HTTP / gRPC 链路继续透传 trace context
- 在 runtime 清理阶段 flush 并关闭 tracer provider

有一个实现细节需要明确写出来：当 `addr` 精确等于 `"None"` 时，插件会保留 trace context 传播，但不会把 span 导出到 collector。

## 配置示例

```yaml
lynx:
  tracer:
    enable: true
    addr: "otel-collector:4317"
    ratio: 1
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
      propagators:
        - W3C_TRACE_CONTEXT
        - W3C_BAGGAGE
      resource:
        service_name: "user-service"
        attributes:
          deployment.environment: "prod"
```

关键点：

- `ratio` 是兼容旧版本保留的顶层采样字段，未设置时会被归一化成全量采样
- 如果你要真正关闭采样，应使用 `config.sampler.type: ALWAYS_OFF`
- `config.protocol` 决定 OTLP gRPC 还是 OTLP HTTP
- `config.resource` 用来设置服务级的 OpenTelemetry resource 属性

## 使用方式

先导入插件模块，让 Lynx 完成注册：

```go
import _ "github.com/go-lynx/lynx-tracer"
```

## 官方模板实际怎么用

`lynx-layout` 已经在 `internal/data/data.go` 里匿名导入了 tracer：

```go
import _ "github.com/go-lynx/lynx-tracer"
```

但模板默认不会在 `bootstrap.local.yaml` 里放一个显式的 `lynx.tracer` 配置块。实际含义是：

- 脚手架已经为 tracing 上下文传播和相关中间件预留好了接入点
- 是否真正导出 span 仍然是后续显式配置动作
- 这页描述的是你补上 tracer 配置后会得到的 runtime 行为

启动后，业务代码直接使用标准 OpenTelemetry API 即可，因为全局 provider 已经由插件安装完成：

```go
import (
    "context"

    "go.opentelemetry.io/otel"
)

func Handle(ctx context.Context) {
    tracer := otel.Tracer("user-service")
    _, span := tracer.Start(ctx, "CreateUser")
    defer span.End()
}
```

## 实践建议

- 只有在你明确要“保留传播但不导出”时才使用 `addr: "None"`
- 新项目优先使用 `config.sampler`，不要只依赖旧的 `ratio`
- `service_name` 和 resource attributes 最好在各环境保持稳定，否则 trace 很难横向对比

## 相关页面

- 仓库: [go-lynx/lynx-tracer](https://github.com/go-lynx/lynx-tracer)
- [HTTP](/docs/existing-plugin/http)
- [gRPC](/docs/existing-plugin/grpc)
