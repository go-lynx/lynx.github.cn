---
id: sql-sdk
title: SQL SDK
---

# SQL SDK

`lynx-sql-sdk` 是 `lynx-mysql`、`lynx-pgsql`、`lynx-mssql` 共同复用的 SQL 能力层。它不是一个可独立配置的 runtime 插件，也不拥有自己的 YAML 块或 `example_config.yml`。

## Boundary And Ownership（边界与归属）

| 关注点 | 归属方 |
| --- | --- |
| YAML 配置前缀 | 只能归属于具体插件：`lynx.mysql`、`lynx.pgsql`、`lynx.mssql` |
| Runtime 插件名和包级 getter | 只能归属于具体插件 |
| 仓库里的示例模板 | `lynx-pgsql/conf/example_config.yml`、`lynx-mssql/conf/example_config.yml`；MySQL 当前没有 `lynx-mysql/conf/example_config.yml` |
| 共享接口、provider 抽象、重连 / 连接池 / 健康检查行为 | `lynx-sql-sdk` |

## What SQL SDK Actually Owns（SQL SDK 真正拥有的内容）

- `interfaces.SQLPlugin`、`interfaces.DBProvider` 这类共享接口
- `base.SQLPlugin` 这层可复用 runtime 基础实现
- 被具体 SQL 插件复用的连接池、重连、健康检查、慢查询、连接泄漏检测等公共行为

## What SQL SDK Does Not Own（SQL SDK 不拥有的内容）

- 没有 `lynx.sql` 这类配置块
- 没有独立的 runtime 插件注册
- 没有给业务直接启用的 `GetDB()` / `GetDriver()` 入口
- 不负责在 MySQL / PostgreSQL / MSSQL 之外单独决定数据源

## Configuration Ownership Rules（配置归属规则）

- 如果你接入的是 MySQL，就配置 `lynx.mysql`。当前仓库没有专门的 MySQL `conf/example_config.yml`，因此应当以插件 README / proto 和可运行的 `lynx-layout` 示例为准，不要虚构一棵 SDK 级 YAML 树。
- 如果你接入的是 PostgreSQL，就配置 `lynx.pgsql`。对应模板在 `lynx-pgsql/conf/example_config.yml`。
- 如果你接入的是 MSSQL，就配置 `lynx.mssql`。对应模板在 `lynx-mssql/conf/example_config.yml`。
- 如果你的代码 import 了 `lynx-sql-sdk`，那是为了接口和共享 runtime 语义，不代表它自己要接管配置归属。

## Complete YAML Example（完整 YAML 示例）

`lynx-sql-sdk` 没有独立的 `conf/example_config.yml`。因此这里所谓“完整示例”，一定是完整的具体 owner 配置块，例如 `lynx.pgsql` 或 `lynx.mssql`，而不是虚构出来的 `lynx.sql` 前缀。

```yaml
# lynx-sql-sdk 没有独立 YAML 前缀。
# 你需要配置的是具体 SQL 插件。
lynx:
  pgsql:
    driver: "pgx" # 具体 PostgreSQL 插件配置，归属于 lynx.pgsql。
    source: "postgres://app_user:app_password@127.0.0.1:5432/orders?sslmode=disable&connect_timeout=10"
    min_conn: 10
    max_conn: 50
    max_idle_conn: 12
    max_idle_time: "30s"
    max_life_time: "300s"

# 或者改成 lynx.mssql，而不是发明 lynx.sql：
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

## Minimum Viable YAML Example（最小可用 YAML 示例）

这里不存在 `lynx.sql` 或 `lynx.sql-sdk` 子树。哪怕是最小可运行配置，也必须继续挂在具体数据库插件下面。

```yaml
# 不存在 lynx.sql 或 lynx.sql-sdk YAML 前缀。
# 最小可用配置仍然属于具体插件，例如：
lynx:
  pgsql:
    source: "postgres://app_user:app_password@127.0.0.1:5432/orders?sslmode=disable" # 配置归属始终在 lynx.pgsql 下。
```

## Related Pages（相关页面）

- [数据库插件](/docs/existing-plugin/db)
- [Layout](/docs/existing-plugin/layout)
- [插件使用指南](/docs/getting-started/plugin-usage-guide)
