---
id: plugin-ecosystem
title: Plugin Ecosystem
sidebar_label: Plugin Ecosystem
slug: existing-plugin/plugin-ecosystem
---

# Go-Lynx Plugin Ecosystem

Go-Lynx provides a rich set of **production-ready plugins** that cover service communication, data storage, message queues, configuration, observability, and distributed capabilities. All plugins follow the same plug-and-play pattern: configure in YAML and inject via the framework.

## Plugin Categories

### Service & Communication

| Plugin | Description | Doc |
|--------|-------------|-----|
| [HTTP](/docs/existing-plugin/http) | HTTP/HTTPS server with TLS, middleware, metrics, health checks | Yes |
| [gRPC](/docs/existing-plugin/grpc) | gRPC server and client with discovery, TLS, circuit breaker | Yes |
| [Polaris](/docs/existing-plugin/polaris) | Service registration, discovery, and traffic management | Yes |
| [Nacos](/docs/existing-plugin/nacos) | Nacos registration, discovery, and configuration center | Yes |

### Database & Storage

| Plugin | Description | Doc |
|--------|-------------|-----|
| [Database](/docs/existing-plugin/db) | Generic DB plugin (MySQL/PostgreSQL/SQL Server via driver) | Yes |
| [Redis](/docs/existing-plugin/redis) | Redis client with connection pool and metrics | Yes |
| [MongoDB](/docs/existing-plugin/mongodb) | MongoDB client with pool, TLS, health checks | Yes |
| [Elasticsearch](https://github.com/go-lynx/lynx-elasticsearch) | Elasticsearch integration | GitHub |

### Message Queue

| Plugin | Description | Doc |
|--------|-------------|-----|
| [Kafka](/docs/existing-plugin/kafka) | Apache Kafka producer/consumer with SASL, TLS, metrics | Yes |
| [RabbitMQ](https://github.com/go-lynx/lynx-rabbitmq) | RabbitMQ producer/consumer | GitHub |
| [RocketMQ](https://github.com/go-lynx/lynx-rocketmq) | Apache RocketMQ | GitHub |
| [Pulsar](https://github.com/go-lynx/lynx-pulsar) | Apache Pulsar | GitHub |

### Configuration & Discovery

| Plugin | Description | Doc |
|--------|-------------|-----|
| [Polaris](/docs/existing-plugin/polaris) | Service discovery and config | Yes |
| [Nacos](/docs/existing-plugin/nacos) | Nacos config and naming | Yes |
| [Apollo](https://github.com/go-lynx/lynx-apollo) | Apollo configuration center | GitHub |
| [Etcd](https://github.com/go-lynx/lynx-etcd) | Etcd for config and discovery | GitHub |

### Observability & Security

| Plugin | Description | Doc |
|--------|-------------|-----|
| [Tracer](/docs/existing-plugin/tracer) | OpenTelemetry distributed tracing | Yes |
| [Swagger](/docs/existing-plugin/swagger) | Swagger/OpenAPI UI (dev/test only) | Yes |
| [Sentinel](/docs/existing-plugin/sentinel) | Flow control, circuit breaker, system protection | Yes |
| [TLS Manager](/docs/existing-plugin/tls-manager) | TLS configuration and certificate management | Yes |

### Distributed & Lock

| Plugin | Description | Doc |
|--------|-------------|-----|
| [Seata](/docs/existing-plugin/seata) | Distributed transactions (Seata) | Yes |
| [DTM](https://github.com/go-lynx/lynx-dtm) | Distributed transaction (DTM) | GitHub |
| [Redis Lock](https://github.com/go-lynx/lynx-redis-lock) | Distributed lock based on Redis | GitHub |
| [Etcd Lock](https://github.com/go-lynx/lynx-etcd-lock) | Distributed lock based on Etcd | GitHub |

### Other

| Plugin | Description | Doc |
|--------|-------------|-----|
| [Layout](https://github.com/go-lynx/lynx-layout) | Official project template and scaffolding | GitHub |
| [SQL SDK](https://github.com/go-lynx/lynx-sql-sdk) | SQL and multi-datasource utilities | GitHub |

Legend: Documented on this site | See GitHub repo

## Using Plugins

1. **Add dependency**: `go get github.com/go-lynx/lynx/plugins/<name>` (or the plugin's module path).
2. **Configure**: Add a `lynx.<plugin>` section in your `config.yaml`.
3. **Import**: `import _ "github.com/go-lynx/lynx/plugins/<name>"` in `main.go` (or as required by the plugin).
4. **Inject**: Use the plugin's getter (e.g. `db.GetDriver`, `lynxRedis.GetRedis`) in your wire sets.

For bootstrap and plugin order, see [Bootstrap & Config](/docs/getting-started/bootstrap-config) and [Plugin Manager](/docs/getting-started/plugin-manager).

**Related:** [Quick Start](/docs/getting-started/quick-start) | [Bootstrap Configuration](/docs/getting-started/bootstrap-config) | [Plugin Management](/docs/getting-started/plugin-manager) | [Framework Architecture](/docs/intro/arch)
