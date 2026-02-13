---
id: sql-sdk
title: SQL SDK / 多数据源 Plugin
slug: existing-plugin/sql-sdk
---

# SQL SDK / 多数据源 Plugin

Go-Lynx 的 SQL Base/SQL SDK 为 MySQL、PostgreSQL、MSSQL 等 SQL 插件提供**公共能力**：健康检查、Prometheus 指标、连接池与错误分类，并支持多数据源与自定义指标。

## 功能概览

- **健康检查**：连接与查询健康、连接池状态
- **指标**：Prometheus 指标（连接数、查询耗时、错误分类）
- **连接管理**：统一连接池与超时配置
- **错误分类**：连接失败、超时、约束冲突等标准化分类
- **多数据源**：为不同 SQL 插件提供统一基座

## 与具体数据库插件的关系

- 引入任一 SQL 插件（如 MySQL、PostgreSQL、MSSQL）时会自动带入 SQL Base 能力。
- 无需单独 “安装” SQL SDK；它是 MySQL/PGSQL/MSSQL 插件的共同依赖与行为基础。

## 配置说明

在 `config.yaml` 中可通过 `lynx.sql` 配置公共项（具体键名以各 SQL 插件为准）：

```yaml
lynx:
  sql:
    health_check:
      enabled: true
      interval: "30s"
      timeout: "5s"
    metrics:
      enabled: true
      namespace: "lynx_sql"
    connection_pool:
      max_open_conns: 100
      max_idle_conns: 10
      conn_max_lifetime: "1h"
      conn_max_idle_time: "30m"
```

## 如何使用

### 1. 通过具体 SQL 插件间接使用

```go
import _ "github.com/go-lynx/lynx/plugin/sql/mysql"
// 或
import _ "github.com/go-lynx/lynx/plugin/sql/pgsql"
import _ "github.com/go-lynx/lynx/plugin/sql/mssql"
```

业务代码主要使用各插件的 `GetDriver()` 或等价 API 获取 `*sql.DB` 或 ORM 所需驱动；健康检查与指标由框架与 SQL Base 在背后统一处理。

### 2. 健康检查（若插件暴露 HealthChecker）

```go
import "github.com/go-lynx/lynx/plugin/sql/base"

healthChecker := base.GetHealthChecker()
health, err := healthChecker.CheckHealth("mysql")
if err != nil {
    log.Errorf("health check failed: %v", err)
    return
}
if health.IsHealthy {
    log.Infof("database healthy: %s", health.Message)
}
```

### 3. 错误分类与统计（若插件暴露 ErrorHandler）

```go
errorHandler := base.GetErrorHandler()
err := someDatabaseOperation()
if err != nil {
    errorType := errorHandler.CategorizeError(err)
    errorHandler.RecordError(errorType)
    // 根据 errorType 做重试或告警
}
```

### 4. 自定义指标（若插件暴露 MetricsCollector）

```go
metrics := base.GetMetricsCollector()
customCounter := prometheus.NewCounterVec(
    prometheus.CounterOpts{Name: "custom_sql_operations_total", Help: "..."},
    []string{"operation", "status"},
)
metrics.RegisterCustomMetric("custom_operations", customCounter)
```

具体 API 以 [go-lynx/lynx-sql-sdk](https://github.com/go-lynx/lynx-sql-sdk) 或主仓库中 SQL 插件实现为准。

## 相关链接

- 仓库：[go-lynx/lynx-sql-sdk](https://github.com/go-lynx/lynx-sql-sdk)
- [Database Plugin](/docs/existing-plugin/db) | [插件生态概览](/docs/existing-plugin/plugin-ecosystem)
