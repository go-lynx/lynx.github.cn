---
id: dtm
title: DTM 插件
---

# DTM 插件

DTM 模块是一个由 runtime 管理的分布式事务客户端，它围绕编排式事务模型设计，而不是只支持某一种事务风格。

## Runtime 事实

| 项目 | 值 |
|------|------|
| Go module | `github.com/go-lynx/lynx-dtm` |
| 配置前缀 | `lynx.dtm` |
| Runtime 插件名 | `dtm.server` |
| 公开 API | `GetServerURL()`、`GetGRPCServer()`、`GetConfig()`、`NewSaga()`、`NewTransactionHelper()`、`GetDtmMetrics()` |

## 代码实际支持什么

实现里包含：

- 面向 DTM API 的 HTTP server URL 集成
- 带重试的可选 gRPC 连接
- 可选 gRPC TLS 证书配置
- SAGA、TCC、XA、两阶段消息 helper 流程
- branch 调用的 pass-through headers
- 事务与健康检查指标

这比“支持 DTM”要具体得多。插件本身已经提供了你应该基于其上使用的事务辅助层。

## 配置

```yaml
lynx:
  dtm:
    enabled: true
    server_url: "http://127.0.0.1:36789/api/dtmsvr"
    grpc_server: "127.0.0.1:36790"
    timeout: 10
    retry_interval: 10
    transaction_timeout: 60
    branch_timeout: 30
    pass_through_headers:
      - x-request-id
```

当前 protobuf 配置里的这些 timeout 字段单位是秒。

## 如何使用

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("dtm.server")
dtmClient := plugin.(*dtm.DTMClient)
helper := dtm.NewTransactionHelper(dtmClient)

err := helper.ExecuteSAGA(ctx, gid, branches, nil)
```

## 实际注意点

- `NewSaga()` 适合你需要直接构造 DTM Saga 时使用。
- `NewTransactionHelper()` 是更高层的入口，覆盖 SAGA、TCC、XA、MSG 执行路径。
- `GetDtmMetrics()` 会在插件启用并初始化后暴露指标对象。

## 相关页面

- [Seata](/docs/existing-plugin/seata)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
