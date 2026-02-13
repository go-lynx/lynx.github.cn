---
id: dtm
title: DTM Distributed Transaction Plugin
slug: existing-plugin/dtm
---

# DTM Distributed Transaction Plugin

The Go-Lynx DTM plugin integrates the [DTM](https://dtm.pub) distributed transaction manager, supporting SAGA, TCC, two-phase message, and XA over HTTP and gRPC.

## Features

- **SAGA** — Long-running transactions with compensation
- **TCC** — Try-Confirm-Cancel; use Helper or global transaction API
- **Two-phase message** — Reliable message eventual consistency
- **XA** — Two-phase commit; use Helper or global transaction API
- **Timeout & retry** — Configurable transaction and branch timeouts
- **Header passthrough** — e.g. `X-Request-ID`, `X-User-ID`

## Prerequisites

Run DTM server, for example:

```bash
docker run -itd --name dtm -p 36789:36789 -p 36790:36790 yedf/dtm:latest
```

Or download the binary from [DTM releases](https://github.com/dtm-labs/dtm/releases) and run with your config.

## Configuration

Add `lynx.dtm` in `config.yaml`:

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

## How to use

### 1. Add dependency

```bash
go get github.com/go-lynx/lynx-dtm
```

### 2. Get DTM client

```go
import (
    "github.com/go-lynx/lynx/app"
    "github.com/go-lynx/lynx/plugin/dtm/dtm"
)

dtmPlugin := app.GetPlugin("dtm.server").(*dtm.DTMClient)
```

### 3. SAGA transaction

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

### 4. TCC (recommended: Helper)

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

### 5. XA (recommended: Helper)

```go
branches := []dtm.XABranch{
    {Action: "http://localhost:8080/api/TransOut", Data: `{"amount": 100}`},
}
err := helper.ExecuteXA(ctx, gid, branches, opts)
```

### 6. Two-phase message

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

## References

- [DTM documentation](https://dtm.pub)
- [DTM GitHub](https://github.com/dtm-labs/dtm)
- [DTM Go SDK](https://github.com/dtm-labs/client)

## See also

- Repo: [go-lynx/lynx-dtm](https://github.com/go-lynx/lynx-dtm)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
