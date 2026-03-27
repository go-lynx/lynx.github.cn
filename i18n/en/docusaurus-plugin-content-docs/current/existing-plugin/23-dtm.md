---
id: dtm
title: DTM Plugin
---

# DTM Plugin

The DTM module is a runtime-managed distributed transaction client. It is designed around orchestration patterns, not around a single transaction style.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-dtm` |
| Config prefix | `lynx.dtm` |
| Runtime plugin name | `dtm.server` |
| Public APIs | `GetServerURL()`, `GetGRPCServer()`, `GetConfig()`, `NewSaga()`, `NewTransactionHelper()`, `GetDtmMetrics()` |

## What The Code Supports

The implementation includes:

- HTTP server URL integration for DTM APIs
- optional gRPC connection with retry
- optional gRPC TLS certificates
- SAGA, TCC, XA, and two-phase message helper flows
- pass-through request headers for branch calls
- transaction and health metrics

This is much more concrete than "DTM is available". The plugin already exposes the transaction helper layer you are expected to build on.

## Configuration

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

The timeout values are seconds in the current protobuf config.

## How To Consume It

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("dtm.server")
dtmClient := plugin.(*dtm.DTMClient)
helper := dtm.NewTransactionHelper(dtmClient)

err := helper.ExecuteSAGA(ctx, gid, branches, nil)
```

## Practical Notes

- `NewSaga()` is useful when you want direct DTM saga construction.
- `NewTransactionHelper()` is the higher-level entry point for SAGA, TCC, XA, and MSG execution.
- `GetDtmMetrics()` exposes plugin metrics once the plugin is enabled and initialized.

## Related Pages

- [Seata](/docs/existing-plugin/seata)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
