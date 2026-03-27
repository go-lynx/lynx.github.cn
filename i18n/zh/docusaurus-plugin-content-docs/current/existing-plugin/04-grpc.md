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

## 相关页面

- [HTTP](/docs/existing-plugin/http)
- [TLS Manager](/docs/existing-plugin/tls-manager)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
