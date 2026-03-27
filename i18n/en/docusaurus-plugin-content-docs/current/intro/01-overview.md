---
id: overview
title: Overview
---

# Overview

Lynx is a **plugin orchestration and runtime framework** for Go microservices.

Its center of gravity is not “yet another web layer”, but a unified runtime model for the infrastructure pieces that keep reappearing in service projects: plugin registration, dependency ordering, resource wiring, lifecycle control, event flow, and service-governance-facing integrations.

> The name “Lynx” is inspired by the lynx: flexible, agile, and good at adapting to different environments.

## How To Read Lynx Today

The most useful mental model for the current Lynx codebase is:

- **Core runtime first**: plugin registration, topology ordering, resource ownership, lifecycle, and event plumbing.
- **Application shell second**: `boot`, app startup wiring, and control-plane-facing helpers help you bring services up cleanly.
- **Plugin family around it**: HTTP, gRPC, config centers, service discovery, databases, queues, tracing, flow control, transactions, and distributed locks are integrated as separate modules.

In practice, Lynx should be read as a microservice infrastructure assembly layer rather than a thin wrapper around one specific protocol or middleware product.

That distinction matters because most real integrations in Lynx are runtime-managed:

- plugins register into a global typed factory
- the plugin manager prepares and orders them
- the unified runtime exposes shared resources
- application code consumes those resources through plugin getters or plugin-manager lookups

## What You Get

With Lynx, teams typically gain:

- **A more stable startup path**: plugin load order, dependencies, and resource registration are orchestrated consistently.
- **Less glue code**: databases, message queues, config centers, discovery, tracing, and similar capabilities follow one integration model.
- **Clearer runtime boundaries**: application, plugin, resource, and governance responsibilities are easier to reason about.
- **A more consistent team workflow**: CLI, layout template, configuration structure, docs, and plugin contracts stay aligned.

## Current Official Module Scope

The current repository family already covers the framework core and a broad set of official modules, including:

- Service and governance: HTTP, gRPC, Polaris, Nacos, Etcd, Apollo, Sentinel, Swagger, Tracer
- Data and storage: Redis, MongoDB, Elasticsearch, MySQL, PostgreSQL, SQL Server, SQL SDK
- Messaging and async: Kafka, RabbitMQ, RocketMQ, Pulsar
- Distributed capabilities: Seata, DTM, Redis Lock, Etcd Lock, Eon ID
- Engineering tooling: Layout template and the Lynx CLI

The site already documents the main modules and usage flow, and more module pages continue to be added.

The practical split is:

- `github.com/go-lynx/lynx`: runtime core, boot, plugin manager, TLS, shared abstractions
- standalone plugin modules such as `lynx-http`, `lynx-grpc`, `lynx-redis`, `lynx-tracer`, `lynx-sentinel`
- engineering tooling such as the Lynx CLI and `lynx-layout`

## What The Official Template Actually Starts With

If you are new to Lynx, one practical shortcut helps a lot: do not assume the official template enables the whole plugin family.

Today, `lynx-layout` is easier to understand if you read it in three buckets:

- local bootstrap defaults: `lynx.http`, `lynx.grpc.service`, `lynx.mysql`, `lynx.redis`
- governance bootstrap defaults: `lynx.application`, `lynx.polaris`
- not enabled by default: most MQ, config-center, lock, protection, docs, and TLS plugins

There is one useful special case: tracer is already imported by the template, but not made explicit in the default local config. So it behaves more like a pre-wired observability hook than a visibly enabled default feature.

That is why plugin pages now distinguish between:

- what the plugin supports in full
- what the official template actually enables
- what still requires one more explicit config step

## Suggested Reading Path

If you are new to Lynx, this order works well:

1. [Quick Start](/docs/getting-started/quick-start): get the CLI, template, and bootstrap flow running.
2. [Bootstrap Configuration](/docs/getting-started/bootstrap-config): understand local bootstrap config and remote config entry points.
3. [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide): understand the common integration path before diving into individual plugins.
4. [Plugin Management](/docs/getting-started/plugin-manager): understand ordering, dependency resolution, and assembly.
5. [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem): choose modules by capability area.
6. [Framework Architecture](/docs/intro/arch): understand the layered runtime model.

## Community

If you run into problems while using or extending Lynx, the community channels are the best next step:

- [Discord](https://discord.gg/2vq2Zsqq)
- DingTalk / WeChat groups (see below)

### Contributor List

<a href="https://github.com/go-lynx/lynx/graphs/contributors">
 <img src="https://contrib.rocks/image?repo=go-lynx/lynx" alt="Contributor List"/>
</a>

### DingTalk Group

<img alt="dingtalk" src="/img/dingtalk.png" width="400"/>
