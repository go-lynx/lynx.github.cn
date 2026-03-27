---
id: grpc
title: gRPC 服务
---

# gRPC 服务

`lynx-grpc` 仓库里同时包含 gRPC 服务端插件和 gRPC 客户端插件。过去不少文档只写了服务端，这其实是不完整的。

## Runtime 事实

| 能力 | Go module | 配置前缀 | Runtime 插件名 | 公开 API |
|------|------|------|------|------|
| gRPC 服务端 | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.service` | `grpc.service` | `grpc.GetGrpcServer(nil)` |
| gRPC 客户端 | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.client` | `grpc.client` | `grpc.GetGrpcClientPlugin(nil)`、`grpc.GetGrpcClientConnection(...)` |

## 服务端行为

服务端插件会构建并持有 Kratos gRPC Server。从实现看，服务端路径包括：

- 配置校验和默认值补齐
- 可选 TLS 与证书提供者集成
- health service 注册与 readiness 轮询
- recovery、tracing、validate 中间件
- 可选限流
- 可选 unary 并发上限
- 可选服务端熔断

业务代码应该把 protobuf service 注册到这个受管 server 上，而不是重新创建一套 gRPC server。

## 服务端配置

```yaml
lynx:
  grpc:
    service:
      network: tcp
      addr: ":9090"
      timeout: 10s
      tls_enable: false
```

## 代码里的真实服务端配置骨架

`lynx.grpc.service` 的 protobuf 配置虽然没有 HTTP 那么多层，但也比旧文档写得更完整。除了基础传输字段，它还支持：

- `max_concurrent_streams`
- `max_recv_msg_size`
- `max_send_msg_size`

更接近实现的配置骨架大致是：

```yaml
lynx:
  grpc:
    service:
      network: tcp
      addr: ":9090"
      tls_enable: false
      tls_auth_type: 0
      timeout: 10s
      max_concurrent_streams: 1024
      max_recv_msg_size: 4194304
      max_send_msg_size: 4194304
```

所以当前服务端插件配置并不只是“地址 + 超时”。

## 官方模板实际怎么配

`lynx-layout/configs/bootstrap.local.yaml` 当前对服务端的配置是：

```yaml
lynx:
  grpc:
    service:
      network: tcp
      addr: 127.0.0.1:9000
      timeout: 5s
```

这是这页最重要的模板对齐点：官方项目模板并没有用扁平的 `lynx.grpc`，而是使用 `lynx.grpc.service`，这与真实服务端插件实现一致。

## 模板与插件实现如何对应

很多人对照 `lynx-layout` 看这页时，其实是在对两个不同层次的东西：

- 模板默认只启动服务端这一半：`lynx.grpc.service`
- 模块真实实现其实同时暴露了两个 runtime 插件：`grpc.service` 和 `grpc.client`

可以先按这张表理解：

| 配置域 | 模板默认情况 | 插件实现情况 |
| --- | --- | --- |
| 服务端监听 | `lynx.grpc.service.network`、`addr` | 同名字段 |
| 服务端超时 | `lynx.grpc.service.timeout` | 同名字段 |
| 服务端 TLS | 本地模板未展开 | `tls_enable`、`tls_auth_type` |
| 服务端流量/消息限制 | 本地模板未展开 | `max_concurrent_streams`、`max_recv_msg_size`、`max_send_msg_size` |
| 客户端插件 | 默认未启用 | `lynx.grpc.client` 已完整支持 |
| 客户端传输控制 | 默认未启用 | 超时、重试、连接池、健康检查、metrics、tracing、logging |
| 客户端服务订阅 | 默认未启用 | `subscribe_services[*]` 与旧 `services` |

所以之前真正的问题不是“模板配置写错了”，而是旧文档没有把“模板默认只用服务端”与“模块完整支持服务端 + 客户端”这两层拆清楚。

## 服务注册

```go
import (
    lynxgrpc "github.com/go-lynx/lynx-grpc"
    grpcgo "github.com/go-kratos/kratos/v2/transport/grpc"
)

func NewGRPCServer(login *service.LoginService) (*grpcgo.Server, error) {
    srv, err := lynxgrpc.GetGrpcServer(nil)
    if err != nil {
        return nil, err
    }
    v1.RegisterLoginServer(srv, login)
    return srv, nil
}
```

`lynx-layout/internal/server/grpc.go` 里也正是这样使用的。

## 客户端行为

同一个模块还会注册 `grpc.client`。这个插件负责管理出站连接，并支持：

- 静态服务端点和订阅式服务
- 重试与超时
- 可选 TLS
- 连接池
- 健康检查
- metrics 与 tracing 开关
- 按服务配置负载均衡策略

如果你把本页只理解成“怎么暴露 gRPC 服务”，其实漏掉了这个模块的一半能力。

## 客户端配置

```yaml
lynx:
  grpc:
    client:
      default_timeout: 10s
      connection_pooling: true
      pool_size: 8
      subscribe_services:
        - name: user-service
          required: true
```

## 代码里的真实客户端配置骨架

客户端侧的 protobuf 配置面要比上面的短示例宽得多。插件会同时读取顶层 client 配置和每个订阅服务项的细节配置。

顶层字段包括：

- `default_timeout`
- `default_keep_alive`
- `max_retries`
- `retry_backoff`
- `max_connections`
- `tls_enable`
- `tls_auth_type`
- `connection_pooling`
- `pool_size`
- `idle_timeout`
- `health_check_enabled`
- `health_check_interval`
- `metrics_enabled`
- `tracing_enabled`
- `logging_enabled`
- `max_message_size`
- `compression_enabled`
- `compression_type`
- `subscribe_services`
- 已废弃的旧 `services`

每个 `subscribe_services` 子项还支持：

- `name`
- `endpoint`
- `timeout`
- `tls_enable`
- `tls_auth_type`
- `max_retries`
- `required`
- `metadata`
- `load_balancer`
- `circuit_breaker_enabled`
- `circuit_breaker_threshold`

更接近实现的配置骨架大致是：

```yaml
lynx:
  grpc:
    client:
      default_timeout: 10s
      default_keep_alive: 30s
      max_retries: 3
      retry_backoff: 1s
      max_connections: 100
      tls_enable: false
      connection_pooling: true
      pool_size: 8
      idle_timeout: 60s
      health_check_enabled: true
      health_check_interval: 30s
      metrics_enabled: true
      tracing_enabled: true
      logging_enabled: true
      max_message_size: 4194304
      compression_enabled: false
      subscribe_services:
        - name: user-service
          required: true
          load_balancer: round_robin
          circuit_breaker_enabled: true
```

所以如果旧文档让你感觉客户端插件只是“订阅几个服务”，那和真实配置面差距确实很大。

模板默认并不会启用 client 插件。它先只走 gRPC 服务端路径，等服务真的需要对外建立 gRPC client 连接或订阅时，再补 `lynx.grpc.client`。

## 相关页面

- [HTTP](/docs/existing-plugin/http)
- [TLS Manager](/docs/existing-plugin/tls-manager)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
