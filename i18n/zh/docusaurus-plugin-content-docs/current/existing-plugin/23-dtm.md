---
id: dtm
title: DTM 插件
---

# DTM 插件

`lynx-dtm` 是 Lynx 对 DTM 服务端的运行时封装。它负责暴露 HTTP 地址、可选的 gRPC 连接、构造辅助器和事务指标，但真正的分支接口与业务编排仍然在你的服务代码里。

## Runtime 事实

| 项目 | 值 |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-dtm` |
| 配置前缀 | `lynx.dtm` |
| Runtime 插件名 | `dtm.server` |
| 公开 API | `GetServerURL()`、`GetGRPCServer()`、`GetConfig()`、`NewSaga(gid)`、`NewMsg(gid)`、`NewTcc(gid)`、`NewXa(gid)`、`GenerateGid()`、`NewTransactionHelper(client)`、`GetDtmMetrics()` |

## 这份 YAML 实际控制什么

- 启用插件前，必须先有可达的 DTM 服务端。
- `server_url` 是所有模式的硬前提，因为 DTM 的 HTTP API 要负责 GID、查询、Saga / Msg 提交和 helper 入口。
- `grpc_server` 与 `grpc_tls_*` 只有在你的调用路径真的需要 DTM gRPC 时才有意义。
- 高层 `TransactionHelper.ExecuteSAGA()`、`ExecuteTCC()`、`ExecuteMsg()` 会自动读取的 YAML 字段，当前只有 `pass_through_headers`。
- YAML 里的超时字段会影响 `NewSaga()` / `NewMsg()` 这类低层对象，以及你后续显式传入的 `TransactionOptions`；它们不会自动灌进所有 `Execute*` helper 调用。

## YAML 模板

```yaml
lynx:
  dtm:
    enabled: true
    server_url: "http://localhost:36789/api/dtmsvr"
    grpc_server: "localhost:36790"
    timeout: 10
    retry_interval: 10
    transaction_timeout: 60
    branch_timeout: 30
    pass_through_headers:
      - "X-Request-ID"
      - "X-User-ID"
      - "X-Trace-ID"
    grpc_tls_enabled: false
    # grpc_cert_file: "/path/to/client.crt"
    # grpc_key_file: "/path/to/client.key"
    # grpc_ca_file: "/path/to/ca.crt"
    max_connection_retries: 3
```

## 字段说明

| 字段 | 作用 | 何时生效 | 默认值与交互影响 | 常见误配 |
| --- | --- | --- | --- | --- |
| `enabled` | 控制 DTM 插件是否启动并注册共享资源。 | 只有为 `true` 时。 | 默认 `false`。即使其他字段存在，只要没启用，启动阶段也会直接返回。 | 以为默认地址已经填好了，插件就会自己工作。 |
| `server_url` | 指向 DTM 的 HTTP API。 | 插件启用时实际必填。 | 省略时会默认补成 `http://localhost:36789/api/dtmsvr`。校验要求必须是 `http` 或 `https`。`GenerateGid()`、`NewSaga()`、`NewMsg()` 和 helper 入口都依赖它。 | 指到 gRPC 端口，或者漏掉 `/api/dtmsvr` 这段 HTTP 路径。 |
| `grpc_server` | 指向 DTM 的 gRPC 服务地址。 | 只有非空时。 | 可选。只要填写，启动阶段就会尝试拨号并注册 gRPC 连接。 | 在这里写成 `http://...` 这种 HTTP URL，而不是 `host:port`。 |
| `timeout` | 低层 Saga / Msg 对象的请求超时，单位秒。 | `NewSaga()` 和 `NewMsg()` 会使用。 | 为 `0` 时默认补成 `10`；负数会校验失败。当前 `TransactionHelper.Execute*` 不会自动继承它，除非你显式传匹配的 `TransactionOptions`。 | 改了 YAML 后，以为所有现有 helper 调用都自动变成新超时。 |
| `retry_interval` | 重试间隔，单位秒。 | `NewSaga()` / `NewMsg()` 会使用，你显式传入的 `TransactionOptions` 也可以单独覆盖。 | 为 `0` 时默认补成 `10`；负数会校验失败。helper 默认值仍然是独立硬编码的。 | 调了它，却期待 `ExecuteTCC()` / `ExecuteXA()` 不传 options 也会跟着变化。 |
| `transaction_timeout` | 全局事务超时，单位秒。 | `NewSaga()` / `NewMsg()` 会使用，你显式传入的事务选项也可以覆盖。 | 为 `0` 时默认补成 `60`；负数会校验失败。 | 误以为 `TransactionHelper.Execute*` 每次都会自动读取这里。 |
| `branch_timeout` | 描述期望的分支超时，单位秒。 | 当前并不会被插件启动逻辑或 helper 默认值直接消费。 | 为 `0` 时默认补成 `30`，但内置 helper 仍然使用自己那套 `TransactionOptions`，除非你显式传参。 | 改了它就期待 `ExecuteSAGA()` / `ExecuteTCC()` 自动跟着变。 |
| `pass_through_headers` | 指定哪些入站请求头需要透传到分支调用。 | `TransactionHelper.ExecuteSAGA()`、`ExecuteTCC()`、`ExecuteMsg()` 会使用。 | 默认空列表。若与 `TransactionOptions.CustomHeaders` 合并，后者同名 key 会覆盖前者。 | 以为只调用 `NewSaga()` / `NewMsg()` 就会自动透传这些 header。 |
| `grpc_tls_enabled` | 控制插件管理的 gRPC 连接是否启用 TLS。 | 只有 `grpc_server` 非空且你确实要走 TLS 时。 | 默认 `false`。一旦设成 `true`，校验就要求至少同时提供 `grpc_cert_file` 和 `grpc_key_file`。 | 开了 TLS 却没配证书，或者根本没填 `grpc_server`。 |
| `grpc_cert_file` | gRPC mTLS 客户端证书路径。 | 只有 `grpc_tls_enabled: true` 时。 | 必须和 `grpc_key_file` 配套。 | 只提供证书不提供私钥。 |
| `grpc_key_file` | gRPC mTLS 客户端私钥路径。 | 只有 `grpc_tls_enabled: true` 时。 | 必须和 `grpc_cert_file` 配套。 | 只提供私钥不提供证书。 |
| `grpc_ca_file` | 自定义服务端信任链的 CA 证书路径。 | 只有 `grpc_tls_enabled: true` 且服务端不走默认系统根证书时。 | 可选；不填就沿用系统默认根证书。 | 把它当成所有 TLS 场景都必填，或者私有 CA 场景里反而忘了填。 |
| `max_connection_retries` | 限制 gRPC 拨号的最大重试次数。 | 只有 `grpc_server` 非空时。 | 为 `0` 时默认补成 `3`；负数会校验失败。启动时还会把 `<1` 的值兜底成至少尝试一次。 | 以为它会影响 HTTP 路径上的 `GenerateGid()` 或健康探测。 |

## 当前 helper 边界

- `NewTcc(gid)` 和 `NewXa(gid)` 目前仍是占位方法，会直接返回 `nil`；实际应使用 `TransactionHelper.ExecuteTCC()`、`TransactionHelper.ExecuteXA()` 或底层 `dtmcli` 全局事务 helper。
- `TransactionHelper.ExecuteSAGA()`、`ExecuteTCC()`、`ExecuteXA()`、`ExecuteMsg()` 在你不传 options 时，使用的是各自独立的 `TransactionOptions` 默认值（`60/30/10`）。
- 当前 helper 路径里，YAML 会自动参与合并的只有 `pass_through_headers`；超时字段不会自动灌进这些 helper 默认值。

## 运行时接入

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("dtm.server")
dtmClient := plugin.(*dtm.DTMClient)
helper := dtm.NewTransactionHelper(dtmClient)

err := helper.ExecuteSAGA(ctx, gid, sagaBranches, nil)
err = helper.ExecuteTCC(ctx, gid, tccBranches, nil)
err = helper.ExecuteXA(ctx, gid, xaBranches, nil)
```

当你需要低层直接构造 Saga / Msg 对象时，用 `NewSaga(gid)` / `NewMsg(gid)`；当你需要统一走高层辅助流程时，用 `NewTransactionHelper()`，但如果要改默认超时，请记得显式传 `TransactionOptions`。

## 相关页面

- [Seata](/docs/existing-plugin/seata)
- [插件生态](/docs/existing-plugin/plugin-ecosystem)
