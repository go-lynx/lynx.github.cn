---
id: dtm
title: DTM 分布式事务 Plugin
slug: existing-plugin/dtm
---

# DTM 分布式事务 Plugin

Go-Lynx 的 DTM 插件对接 [DTM](https://dtm.pub) 分布式事务管理器，支持 SAGA、TCC、二阶段消息、XA 等模式，并支持 HTTP 与 gRPC。

## 功能概览

- **SAGA**：长事务、多步骤与补偿
- **TCC**：Try-Confirm-Cancel，推荐使用 Helper 或全局事务 API
- **二阶段消息**：可靠消息最终一致
- **XA**：两阶段提交，推荐使用 Helper 或全局事务 API
- **超时与重试**：可配置事务与分支超时、重试
- **Header 透传**：如 `X-Request-ID`、`X-User-ID`

## 前置条件

需先部署 DTM Server，例如：

```bash
docker run -itd --name dtm -p 36789:36789 -p 36790:36790 yedf/dtm:latest
```

或从 [DTM 发布页](https://github.com/dtm-labs/dtm/releases) 下载二进制并配置运行。

## 配置说明

在 `config.yaml` 中增加 `lynx.dtm`：

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
```

## 如何使用

### 1. 引入依赖

```bash
go get github.com/go-lynx/lynx-dtm
```

### 2. 获取 DTM 客户端

```go
import (
    "github.com/go-lynx/lynx/app"
    "github.com/go-lynx/lynx/plugin/dtm/dtm"
)

dtmPlugin := app.GetPlugin("dtm.server").(*dtm.DTMClient)
```

### 3. SAGA 事务

```go
gid := dtmPlugin.GenerateGid()
saga := dtmPlugin.NewSaga(gid)
saga.Add(
    "http://localhost:8080/api/TransOut",
    "http://localhost:8080/api/TransOutRevert",
    map[string]interface{}{"amount": 100},
)
saga.Add(
    "http://localhost:8080/api/TransIn",
    "http://localhost:8080/api/TransInRevert",
    map[string]interface{}{"amount": 100},
)
err := saga.Submit()
```

### 4. TCC 事务（推荐 Helper）

```go
helper := dtm.NewTransactionHelper(dtmPlugin)
gid := helper.MustGenGid()
branches := []dtm.TCCBranch{
    {
        Try:     "http://localhost:8081/api/inventory/try",
        Confirm: "http://localhost:8081/api/inventory/confirm",
        Cancel:  "http://localhost:8081/api/inventory/cancel",
        Data:    map[string]any{"product_id": "sku-1", "quantity": 2},
    },
}
opts := &dtm.TransactionOptions{TimeoutToFail: 60, BranchTimeout: 10}
err := helper.ExecuteTCC(ctx, gid, branches, opts)
```

### 5. XA 事务（推荐 Helper）

```go
branches := []dtm.XABranch{
    {Action: "http://localhost:8080/api/TransOut", Data: `{"amount": 100}`},
}
err := helper.ExecuteXA(ctx, gid, branches, opts)
```

### 6. 二阶段消息

```go
msg := dtmPlugin.NewMsg(gid)
msg.Add("http://localhost:8080/api/TransOut", map[string]interface{}{"amount": 100})
msg.Add("http://localhost:8080/api/TransIn", map[string]interface{}{"amount": 100})
err := msg.Prepare("http://localhost:8080/api/QueryPrepared")
if err != nil {
    return
}
err = msg.Submit()
```

## 参考

- [DTM 官方文档](https://dtm.pub)
- [DTM GitHub](https://github.com/dtm-labs/dtm)
- [DTM Go SDK](https://github.com/dtm-labs/client)

## 相关链接

- 仓库：[go-lynx/lynx-dtm](https://github.com/go-lynx/lynx-dtm)
- [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
