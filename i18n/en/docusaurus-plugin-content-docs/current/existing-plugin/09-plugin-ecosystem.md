---
id: plugin-ecosystem
title: Plugin Ecosystem
sidebar_label: Plugin Ecosystem
---

# Lynx Plugin Ecosystem

This page is a map, not a plugin config reference. Use it to decide which plugin page to read next and to understand where one plugin's responsibility ends and another system or dependency begins.

## How To Read A Plugin Page

For any Lynx plugin, the four facts that matter most are still:

1. the Go module path
2. the configuration prefix
3. the runtime plugin name
4. the public API you use after startup

That set tells you how the plugin is loaded, how it is looked up at runtime, and whether it is a good match for your integration point. This ecosystem page itself has no standalone YAML because it is not a runtime plugin.

## Navigation By Job To Be Done

| Goal | Start here | What you are really choosing |
|------|------|------|
| Expose service traffic | [HTTP](/docs/existing-plugin/http), [gRPC](/docs/existing-plugin/grpc), [TLS](/docs/existing-plugin/tls), [Swagger](/docs/existing-plugin/swagger) | Server entrypoints, ports, middleware/interceptor surfaces |
| Use data stores and locks | [Database Plugin](/docs/existing-plugin/db), [SQL SDK](/docs/existing-plugin/sql-sdk), [MongoDB](/docs/existing-plugin/mongodb), [Redis](/docs/existing-plugin/redis), [Redis Lock](/docs/existing-plugin/redis-lock), [Etcd Lock](/docs/existing-plugin/etcd-lock) | Shared clients, lock semantics, and storage-specific APIs |
| Consume config centers or governance control planes | [Apollo](/docs/existing-plugin/apollo), [Nacos](/docs/existing-plugin/nacos), [Etcd](/docs/existing-plugin/etcd), [Polaris](/docs/existing-plugin/polaris) | External control planes, not business-facing APIs |
| Add transaction or identity infrastructure | [Seata](/docs/existing-plugin/seata), [DTM](/docs/existing-plugin/dtm), [Eon ID](/docs/existing-plugin/eon-id) | External coordinators, ID layout, and operational ownership boundaries |
| Add traffic protection and observability hooks | [Sentinel](/docs/existing-plugin/sentinel), [Tracer](/docs/existing-plugin/tracer) | Resource naming, protection policy, and observability surfaces |
| Add asynchronous brokers | [Kafka](/docs/existing-plugin/kafka), [RabbitMQ](/docs/existing-plugin/rabbitmq), [RocketMQ](/docs/existing-plugin/rocketmq), [Pulsar](/docs/existing-plugin/pulsar) | Broker clients, delivery semantics, and topic ownership |
| Understand templates and lifecycle | [Layout](/docs/existing-plugin/layout), [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide), [Plugin Management](/docs/getting-started/plugin-manager) | What the scaffold imports, what runtime owns, and how plugins are ordered |

## Dependency Boundaries That Matter Most

| Page | What it depends on | What it does not own | Read together with |
|------|------|------|------|
| [Seata](/docs/existing-plugin/seata) | An external Seata coordinator plus the referenced Seata client YAML | Transaction boundary placement inside your business code | [DTM](/docs/existing-plugin/dtm) |
| [DTM](/docs/existing-plugin/dtm) | An external DTM server and, optionally, gRPC/TLS assets | Branch business endpoints and orchestration semantics | [Seata](/docs/existing-plugin/seata) |
| [Sentinel](/docs/existing-plugin/sentinel) | Stable resource names from HTTP, gRPC, or business wrappers | Dynamic config-center rule loading or automatic resource design | [HTTP](/docs/existing-plugin/http), [gRPC](/docs/existing-plugin/grpc) |
| [Eon ID](/docs/existing-plugin/eon-id) | Optional shared Redis when worker auto-registration is enabled | Redis provisioning and uniqueness guarantees after you disable auto-registration | [Redis](/docs/existing-plugin/redis) |
| [Redis Lock](/docs/existing-plugin/redis-lock) | A working Redis plugin and clear lock ownership rules | Redis deployment, connection bootstrap, or business retry policy | [Redis](/docs/existing-plugin/redis) |
| [Apollo](/docs/existing-plugin/apollo), [Nacos](/docs/existing-plugin/nacos), [Etcd](/docs/existing-plugin/etcd) | External config / service-discovery control planes | Application-local validation of every consumed key | [Bootstrap Configuration](/docs/getting-started/bootstrap-config) |

## One Repo Is Not Always One Page

- `lynx-mysql`, `lynx-pgsql`, and `lynx-mssql` are concrete SQL plugins that are easier to compare through [Database Plugin](/docs/existing-plugin/db) plus [SQL SDK](/docs/existing-plugin/sql-sdk).
- `lynx-layout` is a service template, not a runtime plugin, so it belongs with [Layout](/docs/existing-plugin/layout).
- `lynx-redis-lock` is a capability layer on top of Redis and should be read together with [Redis Lock](/docs/existing-plugin/redis-lock) and [Redis](/docs/existing-plugin/redis).
- `lynx-eon-id` used to live mostly as a side mention in the ecosystem page, but it now deserves its own page because its Redis dependency, fail-closed behavior, and bit-allocation limits are specific enough to document separately.

## Common Consumption Patterns

Across the codebase, plugin access usually looks like one of these patterns:

- runtime-owned server getter: `http.GetHttpServer()`, `grpc.GetGrpcServer(nil)`
- client getter: `mongodb.GetMongoDB()`, `elasticsearch.GetElasticsearch()`
- package-level runtime helper: `eonid.GenerateID()`, `eonid.ParseID(id)`
- plugin-manager lookup: `lynx.Lynx().GetPluginManager().GetPlugin("dtm.server")`
- plugin object API: `apolloPlugin.GetConfigValue(...)`, `etcdPlugin.GetClient()`

When reading docs, prefer examples that match one of these real lookup patterns. That is usually the fastest way to distinguish a runtime-owned server plugin from a client wrapper or a pure capability layer.

## Recommended Reading Order

1. [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
2. [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
3. [Plugin Management](/docs/getting-started/plugin-manager)
4. the specific plugin page you are integrating
5. [Framework Architecture](/docs/intro/arch)
