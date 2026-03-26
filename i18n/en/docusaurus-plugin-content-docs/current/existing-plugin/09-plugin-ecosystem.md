---
id: plugin-ecosystem
title: Plugin Ecosystem
sidebar_label: Plugin Ecosystem
---

# Lynx Plugin Ecosystem

The Go-Lynx ecosystem is easiest to understand in two layers:

- **framework core**: plugin registration, dependency ordering, resource ownership, event flow, and runtime assembly
- **official module family**: independent modules for services, config, storage, messaging, governance, observability, and distributed capabilities

Today, the official repository family already covers 20+ modules, and this site documents the main modules and integration paths.

## How To Read The Ecosystem

In Go-Lynx, a plugin is not merely “an SDK you drop into a project”. More accurately:

- plugins are registered and initialized through one runtime
- plugins can collaborate through shared resources and the event system
- capabilities enter the application lifecycle through configuration and assembly order
- plugin docs describe how a module behaves **inside the Lynx runtime**, not only how the underlying client library works

## Main Modules Covered On This Site

### Service & Communication

| Module | Description | Doc |
|------|------|------|
| [HTTP](/docs/existing-plugin/http) | HTTP/HTTPS server, TLS, middleware, health checks, metrics | Yes |
| [gRPC](/docs/existing-plugin/grpc) | gRPC service integration, TLS, and service exposure | Yes |
| [Polaris](/docs/existing-plugin/polaris) | registration, discovery, governance, traffic management | Yes |

### Config & Discovery

| Module | Description | Doc |
|------|------|------|
| [Nacos](/docs/existing-plugin/nacos) | config center, discovery, naming | Yes |
| [Apollo](/docs/existing-plugin/apollo) | config center, multi-namespace, watch, local cache | Yes |
| [Etcd](/docs/existing-plugin/etcd) | config center and service registry/discovery backend | Yes |
| [Polaris](/docs/existing-plugin/polaris) | also reused for configuration / governance scenarios | Yes |

### Data & Storage

| Module | Description | Doc |
|------|------|------|
| [Database](/docs/existing-plugin/db) | relational database entry point for MySQL / PostgreSQL / SQL Server style integrations | Yes |
| [Redis](/docs/existing-plugin/redis) | Redis client, pool, metrics, health checks | Yes |
| [MongoDB](/docs/existing-plugin/mongodb) | MongoDB client, pool, TLS, health checks | Yes |
| [Elasticsearch](/docs/existing-plugin/elasticsearch) | search, indexing, aggregation, health, metrics | Yes |
| [SQL SDK](/docs/existing-plugin/sql-sdk) | shared SQL base, multi-datasource helpers, health/metrics adapters | Yes |

> The wider repository family also includes dedicated modules such as `lynx-mysql`, `lynx-pgsql`, and `lynx-mssql`.

### Messaging & Async

| Module | Description | Doc |
|------|------|------|
| [Kafka](/docs/existing-plugin/kafka) | producer/consumer, SASL, TLS, metrics | Yes |
| [RabbitMQ](/docs/existing-plugin/rabbitmq) | multi-instance producer/consumer, health, metrics | Yes |
| [RocketMQ](/docs/existing-plugin/rocketmq) | clustering/broadcasting, multi-topic workflows | Yes |
| [Pulsar](/docs/existing-plugin/pulsar) | batching, schema, multi-tenant, TLS | Yes |

### Observability & Security

| Module | Description | Doc |
|------|------|------|
| [Tracer](/docs/existing-plugin/tracer) | OpenTelemetry tracing | Yes |
| [Swagger](/docs/existing-plugin/swagger) | OpenAPI / Swagger UI, mainly for dev/test workflows | Yes |
| [Sentinel](/docs/existing-plugin/sentinel) | flow control, circuit breaking, system protection | Yes |
| [TLS Manager](/docs/existing-plugin/tls-manager) | TLS configuration and certificate management | Yes |

### Distributed Capabilities

| Module | Description | Doc |
|------|------|------|
| [Seata](/docs/existing-plugin/seata) | distributed transactions via Seata | Yes |
| [DTM](/docs/existing-plugin/dtm) | distributed transactions via SAGA / TCC / XA / 2PC | Yes |
| [Redis Lock](/docs/existing-plugin/redis-lock) | distributed lock on top of Redis | Yes |
| [Etcd Lock](/docs/existing-plugin/etcd-lock) | strongly consistent distributed lock on top of Etcd | Yes |

### Engineering & Templates

| Module | Description | Doc |
|------|------|------|
| [Layout](/docs/existing-plugin/layout) | official project template and service scaffold structure | Yes |

## Modules Present In The Repo Family But Not Fully Covered Yet

Beyond the modules already documented here, the current repository family also includes modules such as:

- `lynx-http`
- `lynx-eon-id`
- `lynx-mysql`
- `lynx-pgsql`
- `lynx-mssql`

This is a useful signal that the ecosystem is broader than a small demo set of plugins and is evolving into a more complete runtime-centered module family.

## Common Integration Path

Most plugins follow roughly the same path:

1. add the module dependency
2. add `lynx.<plugin>` configuration in bootstrap/config
3. import the module or consume its getter/builder as required
4. let the unified runtime initialize it, register resources, and manage lifecycle

If you want the surrounding concepts and ordering, continue with:

- [Quick Start](/docs/getting-started/quick-start)
- [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
- [Plugin Management](/docs/getting-started/plugin-manager)
- [Framework Architecture](/docs/intro/arch)
