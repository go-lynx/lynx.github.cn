---
id: seata
title: Distributed Transaction Plugin
---

# Seata Distributed Transaction Plugin

The Seata module is a runtime-managed Seata client plugin. It does not infer transaction boundaries for you, but it does make Seata client initialization and global transaction entry part of the Lynx startup model.

## Runtime Facts

| Item | Value |
|------|------|
| Go module | `github.com/go-lynx/lynx-seata` |
| Config prefix | `lynx.seata` |
| Runtime plugin name | `seata.server` |
| Public APIs | `GetPlugin()`, `GetConfig()`, `GetConfigFilePath()`, `IsEnabled()`, `WithGlobalTx(...)`, `GetMetrics()` |

## What The Implementation Provides

The current implementation includes:

- config-driven Seata client initialization
- enable/disable switch
- explicit config file path handling
- a `WithGlobalTx(...)` helper around seata-go global transactions
- metrics exposure

This means the plugin already gives you a framework-owned transaction entry point instead of only saying "Seata is available".

## Configuration

```yaml
lynx:
  seata:
    enabled: true
    config_file_path: "./conf/seata.yml"
```

The plugin defaults to `./conf/seata.yml` when the path is omitted.

## How To Consume It

```go
plugin := seata.GetPlugin()

err := plugin.WithGlobalTx(ctx, "CreateOrderTx", 30*time.Second, func(ctx context.Context) error {
    return doBusiness(ctx)
})
```

## Practical Notes

- The plugin initializes the client through `client.InitPath(...)`.
- Current shutdown is lightweight because seata-go does not expose a rich public shutdown API.
- If your scenario is closer to orchestration-oriented distributed transactions, compare this page with [DTM](/docs/existing-plugin/dtm).

## Related Pages

- [DTM](/docs/existing-plugin/dtm)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
