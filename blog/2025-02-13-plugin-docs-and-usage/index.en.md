---
slug: plugin-docs-and-usage-guide
title: Go-Lynx Plugin Docs and Usage Guide
authors: [lynx-team]
tags: [docs, plugins, guide, elasticsearch, rabbitmq, rocketmq, pulsar, apollo, etcd, dtm, redis-lock, layout]
---

# Go-Lynx Plugin Docs and Usage Guide

**Published**: February 13, 2025

We’ve updated and expanded the **plugin documentation** on this site: added dedicated pages for more than ten plugins and a single **Plugin Usage Guide** so you can go from configuration to “how to use” in one place.

<!--truncate-->

## What’s New

### New plugin doc pages

These plugins previously had only GitHub links in the [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem). They now have their own pages with **configuration** and **how to use**:

- **[Elasticsearch](/docs/existing-plugin/elasticsearch)** — Full-text search, indexing, aggregation, health and metrics
- **[RabbitMQ](/docs/existing-plugin/rabbitmq)** — Multi-instance producers/consumers, exchange types, health and metrics
- **[RocketMQ](/docs/existing-plugin/rocketmq)** — Clustering/broadcasting, multi-topic subscription, health checks
- **[Pulsar](/docs/existing-plugin/pulsar)** — Produce/consume, batching, schema, multi-tenant, TLS
- **[Apollo](/docs/existing-plugin/apollo)** — Config center, multi-namespace, watch, circuit breaker
- **[Etcd](/docs/existing-plugin/etcd)** — Config center and service registry/discovery
- **[Redis distributed lock](/docs/existing-plugin/redis-lock)** — Redis-based lock, renewal, reentrant
- **[Etcd distributed lock](/docs/existing-plugin/etcd-lock)** — Strongly consistent lock based on Etcd
- **[DTM](/docs/existing-plugin/dtm)** — Distributed transactions (SAGA, TCC, XA, two-phase message)
- **[Layout](/docs/existing-plugin/layout)** — Official project template and local dev without Polaris
- **[SQL SDK](/docs/existing-plugin/sql-sdk)** — SQL base, health/metrics, multi-datasource

Each page includes: **overview**, **configuration**, **dependency and import**, **code samples** (client, send/consume, health and metrics), and **related links**.

### New Plugin Usage Guide

Under [Getting started](/docs/getting-started/quick-start), **[Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)** explains:

1. **Add dependency** — How to pull plugins with `go get`
2. **Declare in config** — `lynx.<plugin>` and dependencies
3. **Register plugin** — Anonymous import and load at startup
4. **Inject and use** — Getters and plugin manager

It also has a **scenario index** (HTTP/gRPC, DB, cache, MQ, config center, discovery, distributed transaction/lock, tracing, scaffold) so you can jump to the right plugin.

### Plugin Ecosystem page

The [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem) table is updated: plugins that only had GitHub links now link to their doc pages with short descriptions, so you can choose, configure, and use them without leaving the site.

## Quick start

- Open the **[Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)** and find the plugin by category.
- Read that plugin’s page (config + how to use).
- For the general flow, see the **[Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)** (four steps and scenario index).

## Next

- Add **best practices** and **FAQ** per plugin.
- More examples (e.g. multi-datasource, multi-instance MQ) based on feedback.
- Keep in sync with the main repo and plugin READMEs.

Thanks for using Go-Lynx. Suggestions and fixes are welcome via [lynx.github.cn](https://github.com/go-lynx/lynx.github.cn) (Issues or PRs).

## Links

- **Docs**: [go-lynx.cn](https://go-lynx.cn)
- **Plugin Ecosystem**: [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
- **Plugin Usage Guide**: [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
- **Quick Start**: [Quick Start](/docs/getting-started/quick-start)
