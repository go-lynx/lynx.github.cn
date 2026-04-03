---
id: dtm
title: DTM Plugin
---

# DTM Plugin

`lynx-dtm` is Lynx's runtime wrapper around a DTM server. It exposes the HTTP endpoint, optional gRPC connection, helper constructors, and transaction metrics, but the actual branch APIs and business orchestration still belong to your service.

## Runtime Facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-dtm` |
| Config prefix | `lynx.dtm` |
| Runtime plugin name | `dtm.server` |
| Public APIs | `GetServerURL()`, `GetGRPCServer()`, `GetConfig()`, `NewSaga(gid)`, `NewMsg(gid)`, `NewTcc(gid)`, `NewXa(gid)`, `GenerateGid()`, `NewTransactionHelper(client)`, `GetDtmMetrics()` |

## What This YAML Actually Controls

- You need a reachable DTM server before enabling the plugin.
- `server_url` is the hard prerequisite for all modes because DTM's HTTP API is used for GID generation, query, Saga/Msg submission, and helper entry points.
- `grpc_server` plus `grpc_tls_*` matter only if your code path truly needs a DTM gRPC connection.
- `pass_through_headers` is the only YAML field that the high-level `TransactionHelper.ExecuteSAGA()`, `ExecuteTCC()`, and `ExecuteMsg()` path reads automatically.
- The timeout fields in YAML are used by `NewSaga()` / `NewMsg()` and by whatever explicit `TransactionOptions` you pass later. They are not automatically copied into every `Execute*` helper call.

## YAML Template

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

## Field Reference

| Field | Purpose | When it takes effect | Default and interactions | Common misconfig |
| --- | --- | --- | --- | --- |
| `enabled` | Gates DTM startup and shared-resource registration. | Only when `true`. | Default `false`. Startup returns early when disabled even though other fields may still be present in config. | Relying on default endpoint values and forgetting to enable the plugin. |
| `server_url` | Points at the DTM HTTP API. | Required in practice whenever the plugin is enabled. | Defaults to `http://localhost:36789/api/dtmsvr` when omitted. Validation requires `http` or `https`. This URL is used by `GenerateGid()`, `NewSaga()`, `NewMsg()`, and transaction helper entry points. | Pointing it at the gRPC port, or omitting the `/api/dtmsvr` HTTP path. |
| `grpc_server` | Points at the DTM gRPC server. | Only when non-empty. | Optional. When present, startup tries to dial it and register a shared gRPC connection. | Writing an HTTP URL here instead of a gRPC endpoint like `host:port`. |
| `timeout` | Sets request timeout in seconds for low-level Saga/Msg objects. | Used by `NewSaga()` and `NewMsg()`. | Defaults to `10` when `0`. Negative values are rejected. The current `TransactionHelper.Execute*` path does not automatically inherit this field unless your code passes matching `TransactionOptions`. | Changing YAML and assuming every existing helper call now uses the new timeout automatically. |
| `retry_interval` | Sets retry interval in seconds. | Used by `NewSaga()` / `NewMsg()` and by whatever explicit `TransactionOptions` you pass later. | Defaults to `10` when `0`. Negative values are rejected. The helper defaults are hardcoded separately. | Tuning this field and expecting `ExecuteTCC()` / `ExecuteXA()` defaults to change without passing options. |
| `transaction_timeout` | Sets global transaction timeout in seconds. | Used by `NewSaga()` / `NewMsg()` and by explicit transaction options you pass later. | Defaults to `60` when `0`. Negative values are rejected. | Assuming `TransactionHelper.Execute*` reads this YAML automatically for every call. |
| `branch_timeout` | Describes desired branch timeout in seconds. | Not consumed directly by current plugin startup or helper defaults. | Defaults to `30` when `0`, but the built-in helper path still uses its own `TransactionOptions` values unless you pass them explicitly. | Changing this field and expecting `ExecuteSAGA()` / `ExecuteTCC()` to pick it up automatically. |
| `pass_through_headers` | Declares which inbound headers should be forwarded into branch calls. | Used by `TransactionHelper.ExecuteSAGA()`, `ExecuteTCC()`, and `ExecuteMsg()`. | Defaults to empty. When combined with `TransactionOptions.CustomHeaders`, custom headers win on key conflicts. | Expecting `NewSaga()` or `NewMsg()` alone to propagate headers without helper-level branch submission. |
| `grpc_tls_enabled` | Turns on TLS for the plugin-managed gRPC connection. | Only when `grpc_server` is non-empty and you want TLS. | Defaults to `false`. When `true`, validation requires at least `grpc_cert_file` and `grpc_key_file`. | Turning TLS on without configuring certificates, or turning it on while leaving `grpc_server` empty. |
| `grpc_cert_file` | Client certificate path for mTLS gRPC connections. | Only when `grpc_tls_enabled: true`. | Must be paired with `grpc_key_file`. | Providing only a cert or only a key. |
| `grpc_key_file` | Client private key path for mTLS gRPC connections. | Only when `grpc_tls_enabled: true`. | Must be paired with `grpc_cert_file`. | Providing only one half of the key pair. |
| `grpc_ca_file` | Optional CA bundle for custom server trust. | Only when `grpc_tls_enabled: true` and the server is not trusted by the default root store. | Optional; omitted means standard root trust. | Treating it as mandatory in every TLS setup, or forgetting it when the server uses a private CA. |
| `max_connection_retries` | Caps how many times startup retries the gRPC dial. | Only when `grpc_server` is non-empty. | Defaults to `3` when `0`. Negative values are rejected. Startup also coerces values below `1` to at least one dial attempt. | Expecting it to affect HTTP APIs such as `GenerateGid()` or health probes. |

## Current Helper Boundary

- `NewTcc(gid)` and `NewXa(gid)` are currently placeholders that return `nil`; use `TransactionHelper.ExecuteTCC()`, `TransactionHelper.ExecuteXA()`, or the underlying `dtmcli` global transaction helpers instead.
- `TransactionHelper.ExecuteSAGA()`, `ExecuteTCC()`, `ExecuteXA()`, and `ExecuteMsg()` default to their own `TransactionOptions` (`60/30/10`) unless you pass options explicitly.
- `pass_through_headers` is merged into branch headers on the helper path, but the timeout fields are not auto-copied into those helper defaults.

## Runtime Usage

```go
plugin := lynx.Lynx().GetPluginManager().GetPlugin("dtm.server")
dtmClient := plugin.(*dtm.DTMClient)
helper := dtm.NewTransactionHelper(dtmClient)

err := helper.ExecuteSAGA(ctx, gid, sagaBranches, nil)
err = helper.ExecuteTCC(ctx, gid, tccBranches, nil)
err = helper.ExecuteXA(ctx, gid, xaBranches, nil)
```

Use `NewSaga(gid)` / `NewMsg(gid)` when you want direct low-level transaction objects. Use `NewTransactionHelper()` for the higher-level workflow helpers, but pass `TransactionOptions` explicitly if you want helper-level timeout changes to match your YAML tuning.

## Related Pages

- [Seata](/docs/existing-plugin/seata)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
