---
id: plugin-ecosystem
title: Plugin Ecosystem
sidebar_label: Plugin Ecosystem
---

# Lynx Plugin Ecosystem

The Lynx repository family is not just a list of unrelated SDKs. The core `lynx` runtime loads plugins through one plugin factory, orders them by dependency and weight, exposes shared resources, and lets application code consume them through stable runtime names or getters.

## Read A Plugin Page The Right Way

For any Lynx plugin, the four facts that matter most are:

1. the Go module path
2. the configuration prefix
3. the runtime plugin name
4. the public API you use after startup

If a document does not state those four facts clearly, it is hard to integrate the plugin or debug startup.

## Runtime Model

Most official plugins follow the same path:

1. import the module so its `init()` registers the plugin in the global factory
2. add config under the plugin's prefix such as `lynx.http` or `lynx.apollo`
3. let the unified runtime initialize resources and run startup tasks
4. consume the capability through a getter or `GetPlugin("<runtime-name>")`

That is why the runtime plugin name is not trivia. It is the real lookup key inside the plugin manager.

## What The Official Template Actually Starts With

`lynx-layout` does not try to enable the whole plugin family at once. Today, the scaffold is easier to read if you group plugins into three buckets:

| Template status | What it means now | Current examples |
|------|------|------|
| Enabled in local bootstrap | part of the smallest runnable local service | `lynx.http`, `lynx.grpc.service`, `lynx.mysql`, `lynx.redis` |
| Used in governance bootstrap | enabled in the control-plane oriented config path | `lynx.application`, `lynx.polaris` |
| Not enabled by default | supported, but added only when the service actually needs it | `lynx.apollo`, `lynx.nacos`, `lynx.etcd`, `lynx.kafka`, `rabbitmq`, `rocketmq`, `lynx.pulsar`, `lynx.sentinel`, `lynx.swagger`, `lynx.tls` |

There is also one special case worth calling out: `lynx-tracer` is already imported by the template, but its config is not made explicit in the default local bootstrap. So it is better understood as a pre-wired observability hook rather than a fully enabled default feature.

## Core Examples

| Module | Go module | Config prefix | Runtime plugin name | Public API after startup |
|------|------|------|------|------|
| [HTTP](/docs/existing-plugin/http) | `github.com/go-lynx/lynx-http` | `lynx.http` | `http.server` | `http.GetHttpServer()` |
| [gRPC service](/docs/existing-plugin/grpc) | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.service` | `grpc.service` | `grpc.GetGrpcServer(nil)` |
| [gRPC client](/docs/existing-plugin/grpc) | `github.com/go-lynx/lynx-grpc` | `lynx.grpc.client` | `grpc.client` | `grpc.GetGrpcClientPlugin(nil)`, `grpc.GetGrpcClientConnection(...)` |
| [Kafka](/docs/existing-plugin/kafka) | `github.com/go-lynx/lynx-kafka` | `lynx.kafka` | `kafka.client` | plugin instance methods such as `ProduceWith`, `SubscribeWith` |
| [MongoDB](/docs/existing-plugin/mongodb) | `github.com/go-lynx/lynx-mongodb` | `lynx.mongodb` | `mongodb.client` | `GetMongoDB()`, `GetMongoDBDatabase()`, `GetMongoDBCollection()` |
| [Apollo](/docs/existing-plugin/apollo) | `github.com/go-lynx/lynx-apollo` | `lynx.apollo` | `apollo.config.center` | `GetConfigSources()`, `GetConfigValue()` |
| [Etcd](/docs/existing-plugin/etcd) | `github.com/go-lynx/lynx-etcd` | `lynx.etcd` | `etcd.config.center` | `GetClient()`, `GetConfigSources()`, `GetConfigValue()` |
| [Etcd Lock](/docs/existing-plugin/etcd-lock) | `github.com/go-lynx/lynx-etcd-lock` | `lynx.etcd-lock` | `etcd.distributed.lock` | `Lock`, `LockWithOptions`, `NewLockFromClient` |
| [DTM](/docs/existing-plugin/dtm) | `github.com/go-lynx/lynx-dtm` | `lynx.dtm` | `dtm.server` | `NewSaga`, `NewTransactionHelper`, `GetDtmMetrics()` |
| [Sentinel](/docs/existing-plugin/sentinel) | `github.com/go-lynx/lynx-sentinel` | `lynx.sentinel` | `sentinel.flow_control` | `GetSentinel()`, metrics APIs |
| [Tracer](/docs/existing-plugin/tracer) | `github.com/go-lynx/lynx-tracer` | `lynx.tracer` | `tracer.server` | tracer runtime entry |

## Repository Family Beyond The Sidebar

The repository family in `lynx/plugins.json` currently includes more modules than the sidebar fully explains, including:

- `lynx-mysql`
- `lynx-pgsql`
- `lynx-mssql`
- `lynx-eon-id`
- `lynx-layout`
- `lynx-sql-sdk`
- `lynx-redis-lock`
- `lynx-polaris`
- `lynx-pulsar`
- `lynx-rabbitmq`
- `lynx-rocketmq`

Some of these are application-facing plugins. Some are shared capability layers or service templates. The documentation should distinguish those roles instead of treating everything as the same kind of module.

## Common Consumption Patterns

Across the codebase, plugin access usually looks like one of these patterns:

- runtime-owned server getter: `http.GetHttpServer()`, `grpc.GetGrpcServer(nil)`
- client getter: `mongodb.GetMongoDB()`, `elasticsearch.GetElasticsearch()`
- plugin-manager lookup: `lynx.Lynx().GetPluginManager().GetPlugin("dtm.server")`
- plugin object API: `apolloPlugin.GetConfigValue(...)`, `etcdPlugin.GetClient()`

When reading docs, prefer examples that match one of these real patterns.

## Recommended Reading Order

1. [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
2. [Bootstrap Configuration](/docs/getting-started/bootstrap-config)
3. [Plugin Management](/docs/getting-started/plugin-manager)
4. the specific plugin page you are integrating
5. [Framework Architecture](/docs/intro/arch)
