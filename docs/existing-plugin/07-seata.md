---
id: seata
title: Distributed Transaction Plugin
---

# Seata Distributed Transaction Plugin

The Seata plugin brings distributed transaction capability into Lynx. It fits cases where you truly need transaction coordination across services or resources, but it should not be treated as a default choice for every workflow.

This kind of capability raises system complexity, so the important part of the documentation is not a giant config dump. It is understanding what problem the plugin is actually meant to solve.

## What it is for

- coordinating transactions across multiple services or resources
- providing a unified transaction entry when stronger consistency semantics are required
- moving Seata client initialization into the Lynx startup flow

## Basic integration

Enable Seata in Lynx configuration first:

```yaml
lynx:
  seata:
    enabled: true
    config_path: /path/to/seatago.yml
```

Here `config_path` points to the Seata client configuration file. Lynx is responsible for bringing the client-side capability into startup.

## Seata deployment itself

Seata server deployment, TC configuration, registry choices, and config-center strategy are still governed by Seata's own documentation:

- official site: [https://seata.apache.org/](https://seata.apache.org/)

At minimum you usually need to define:

- transaction groups and application identity
- TC address or registry information
- data source proxy mode
- undo log and rollback storage requirements

## How business code uses transactions

After integration, the transaction boundary is still declared explicitly in business code, for example:

```go
tm.WithGlobalTx(context.Background(), &tm.GtxConfig{
    Name:    "CreateOrderTx",
    Timeout: 30 * time.Second,
}, func(ctx context.Context) error {
    // execute business operations
    return nil
})
```

That means the Seata plugin handles client integration and lifecycle ownership. It does not automatically infer your business transaction boundaries.

## When to use it

- when local transactions are not enough for your cross-service consistency requirement
- when you accept the operational and debugging complexity of distributed transactions
- when your team can manage the Seata server side, data source proxying, and rollback chain correctly

If your case is closer to async consistency, compensation, or eventual consistency, Seata may not be the first tool to reach for.

## More

- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
