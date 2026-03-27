---
id: sql-sdk
title: SQL SDK
---

# SQL SDK

`lynx-sql-sdk` is the shared SQL capability layer used by concrete SQL plugins such as MySQL, PostgreSQL, and MSSQL. It is not a standalone plugin entry in `plugins.json`.

## What It Actually Is

The SDK provides:

- the shared `interfaces.SQLPlugin` contract
- a stable `DBProvider` abstraction
- common config fields for SQL plugins
- a reusable base plugin implementation in `base.SQLPlugin`

Concrete SQL plugins embed this base layer and then supply driver-specific behavior.

## Shared Runtime Capabilities

From the base implementation, concrete SQL plugins inherit support for:

- startup connection and validation
- retry on connect
- pool monitoring and alert thresholds
- health checks
- auto-reconnect
- connection warmup
- slow-query monitoring
- leak detection

Those are real runtime behaviors, not just helper types.

## Important Interfaces

`interfaces.SQLPlugin` is the contract for plugin-backed SQL access:

- `GetDB()`
- `GetDBWithContext(ctx)`
- `GetValidatedConn(ctx)`
- `GetDialect()`
- `IsConnected()`

`interfaces.DBProvider` is the safer abstraction when callers should resolve the current pool dynamically instead of caching an old `*sql.DB`.

## When To Read This Page

This page matters when:

- you are building or reviewing a concrete SQL plugin
- you need to understand what MySQL, PostgreSQL, and MSSQL plugins share
- you want to reason about reconnect and pool semantics in the SQL stack

For ordinary application integration, read the concrete plugin page first.

## Related Pages

- [Database Plugin](/docs/existing-plugin/db)
- [Layout](/docs/existing-plugin/layout)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
