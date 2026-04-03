---
id: sql-sdk
title: SQL SDK
---

# SQL SDK

`lynx-sql-sdk` is the shared SQL capability layer used by `lynx-mysql`, `lynx-pgsql`, and `lynx-mssql`. It is not an independently configured runtime plugin, and it does not own its own YAML block or `example_config.yml`.

## Boundary And Ownership

| Concern | Owner |
| --- | --- |
| YAML config prefix | Concrete plugin only: `lynx.mysql`, `lynx.pgsql`, or `lynx.mssql` |
| Runtime plugin name and package getters | Concrete plugin only |
| Repo example templates | `lynx-pgsql/conf/example_config.yml`, `lynx-mssql/conf/example_config.yml`; MySQL currently has no `lynx-mysql/conf/example_config.yml` |
| Shared interfaces, provider abstraction, reconnect / pool / health behavior | `lynx-sql-sdk` |

## What SQL SDK Actually Owns

- shared interfaces such as `interfaces.SQLPlugin` and `interfaces.DBProvider`
- the reusable base runtime in `base.SQLPlugin`
- common connection-pool, reconnect, health-check, slow-query, and leak-detection behavior reused by concrete SQL plugins

## What SQL SDK Does Not Own

- no `lynx.sql` config block
- no runtime plugin registration of its own
- no standalone `GetDB()` / `GetDriver()` entry point for applications
- no datasource selection outside the concrete MySQL / PostgreSQL / MSSQL plugins

## Configuration Ownership Rules

- If you are wiring MySQL, configure `lynx.mysql`. This repo currently has no dedicated MySQL `conf/example_config.yml`, so use the plugin README / proto and the runnable `lynx-layout` sample instead of inventing a fake SDK-level YAML tree.
- If you are wiring PostgreSQL, configure `lynx.pgsql`. The concrete template lives in `lynx-pgsql/conf/example_config.yml`.
- If you are wiring MSSQL, configure `lynx.mssql`. The concrete template lives in `lynx-mssql/conf/example_config.yml`.
- If your code imports `lynx-sql-sdk`, that is for interfaces and shared runtime semantics, not for separate config ownership.

## Related Pages

- [Database Plugin](/docs/existing-plugin/db)
- [Layout](/docs/existing-plugin/layout)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
