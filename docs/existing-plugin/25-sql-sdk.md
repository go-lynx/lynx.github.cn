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

## Complete YAML Example

`lynx-sql-sdk` has no standalone `conf/example_config.yml`. A "complete" example therefore means a complete concrete owner block such as `lynx.pgsql` or `lynx.mssql`, not a fake `lynx.sql` prefix.

```yaml
# lynx-sql-sdk has no standalone YAML prefix.
# Configure a concrete SQL plugin instead.
lynx:
  pgsql:
    driver: "pgx" # Concrete PostgreSQL plugin config owned by lynx.pgsql.
    source: "postgres://app_user:app_password@127.0.0.1:5432/orders?sslmode=disable&connect_timeout=10"
    min_conn: 10
    max_conn: 50
    max_idle_conn: 12
    max_idle_time: "30s"
    max_life_time: "300s"

# Or choose lynx.mssql instead of inventing lynx.sql:
# lynx:
#   mssql:
#     driver: "mssql"
#     source: ""
#     min_conn: 5
#     max_conn: 20
#     max_idle_conn: 10
#     max_idle_time: "300s"
#     max_life_time: "3600s"
#     server_config:
#       instance_name: "sqlserver.internal"
#       port: 1433
#       database: "orders"
#       username: "sa"
#       password: "change_me"
#       encrypt: true
#       trust_server_certificate: false
#       connection_timeout: 30
#       command_timeout: 30
#       application_name: "orders-api"
#       workstation_id: "orders-api-01"
#       connection_pooling: true
#       max_pool_size: 20
#       min_pool_size: 5
#       pool_blocking_timeout: 30
#       pool_lifetime_timeout: 3600
```

## Minimum Viable YAML Example

There is no `lynx.sql` or `lynx.sql-sdk` subtree. Even the minimum runnable config must stay under a concrete database plugin.

```yaml
# No lynx.sql or lynx.sql-sdk YAML prefix exists.
# Minimum viable config still belongs to a concrete plugin, for example:
lynx:
  pgsql:
    source: "postgres://app_user:app_password@127.0.0.1:5432/orders?sslmode=disable" # Concrete plugin ownership stays under lynx.pgsql.
```

## Related Pages

- [Database Plugin](/docs/existing-plugin/db)
- [Layout](/docs/existing-plugin/layout)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
