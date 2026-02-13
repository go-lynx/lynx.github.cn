---
id: sql-sdk
title: SQL SDK / Multi-datasource Plugin
slug: existing-plugin/sql-sdk
---

# SQL SDK / Multi-datasource Plugin

The Go-Lynx SQL Base / SQL SDK provides **shared functionality** for MySQL, PostgreSQL, MSSQL, and other SQL plugins: health checks, Prometheus metrics, connection pool, and error categorization, plus multi-datasource support.

## Features

- **Health checks** — Connection and query health, connection pool status
- **Metrics** — Prometheus metrics (connections, query duration, errors)
- **Connection management** — Shared pool and timeout config
- **Error categorization** — Connection failure, timeout, constraint violation, etc.
- **Multi-datasource** — Common base for different SQL plugins

## Relationship to database plugins

- Importing any SQL plugin (e.g. MySQL, PostgreSQL, MSSQL) brings in the SQL Base behavior.
- You do not install the SQL SDK separately; it is the shared foundation for the DB plugins.

## Configuration

You can set common options under `lynx.sql` in `config.yaml` (exact keys depend on each SQL plugin):

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

## How to use

### 1. Use via a concrete SQL plugin

```go
import _ "github.com/go-lynx/lynx/plugin/sql/mysql"
// or
import _ "github.com/go-lynx/lynx/plugin/sql/pgsql"
import _ "github.com/go-lynx/lynx/plugin/sql/mssql"
```

Business code uses each plugin’s `GetDriver()` or equivalent to get `*sql.DB` or the driver for your ORM; health and metrics are handled by the framework and SQL Base.

### 2. Health check (if plugin exposes HealthChecker)

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

### 3. Error categorization (if plugin exposes ErrorHandler)

```go
errorHandler := base.GetErrorHandler()
err := someDatabaseOperation()
if err != nil {
    errorType := errorHandler.CategorizeError(err)
    errorHandler.RecordError(errorType)
    // retry or alert based on errorType
}
```

### 4. Custom metrics (if plugin exposes MetricsCollector)

```go
metrics := base.GetMetricsCollector()
customCounter := prometheus.NewCounterVec(
    prometheus.CounterOpts{Name: "custom_sql_operations_total", Help: "..."},
    []string{"operation", "status"},
)
metrics.RegisterCustomMetric("custom_operations", customCounter)
```

Exact APIs depend on [go-lynx/lynx-sql-sdk](https://github.com/go-lynx/lynx-sql-sdk) or the main repo’s SQL plugin implementation.

## See also

- Repo: [go-lynx/lynx-sql-sdk](https://github.com/go-lynx/lynx-sql-sdk)
- [Database Plugin](/docs/existing-plugin/db) | [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
