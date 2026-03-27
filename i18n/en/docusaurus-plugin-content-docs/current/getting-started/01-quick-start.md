---
id: quick-start
title: Quick Start
---

# Quick Start

The goal of this page is not to list every feature. It is to help you get a **running, extensible** Lynx service using the current workflow.

## Prerequisites

- Go 1.24+
- Git
- Network access for Go modules and the template repository

If you want to try databases, message queues, or config-center plugins immediately, prepare those services as needed. The CLI and project scaffold do not require you to wire the entire stack on day one.

## 1. Install the Lynx CLI

```bash
go install github.com/go-lynx/lynx/cmd/lynx@latest
lynx --version
```

Today, the Lynx CLI mainly helps with:

- project scaffolding via `lynx new`
- local development via `lynx run --watch`
- diagnostics and helper workflows such as `lynx doctor`

## 2. Create a project

```bash
# Create one service
lynx new my-service

# Create multiple services at once
lynx new user-service order-service payment-service
```

If you want more control at creation time, use flags such as module path, template reference, and plugin selection:

```bash
lynx new demo \
  --module github.com/acme/demo \
  --post-tidy \
  --plugins http,grpc,redis
```

The official template comes from [lynx-layout](https://github.com/go-lynx/lynx-layout), which is kept aligned with the current Lynx runtime model.

## 3. Start the service

In the official template, the entry point typically looks like this:

```go
package main

import "github.com/go-lynx/lynx/boot"

func main() {
	err := boot.NewApplication(wireApp).Run()
	if err != nil {
		panic(err)
	}
}
```

For local development, the common path is:

```bash
lynx run --watch
```

That is enough to validate the scaffold and the bootstrap path before you start layering in more capabilities.

If you want to run the generated binary directly, the common bootstrap entry is still:

```bash
./bin/server -conf ./configs
```

The point of this step is simple: confirm that `boot.NewApplication(wireApp).Run()` can read bootstrap config and bring the base runtime up before you add more plugins.

## 4. Understand the generated project

The official template follows a Kratos-style layered structure, adapted for Lynx. The most important parts to understand first are:

- `cmd/`: application entry point
- `configs/`: local bootstrap configuration
- `internal/server/`: HTTP / gRPC service exposure and registration
- `internal/service/`: interface layer
- `internal/biz/`: business orchestration
- `internal/data/`: storage and external integrations

The important idea is not the folder names by themselves. The important idea is that **Lynx owns runtime assembly, while your business code plugs into the agreed layers.**

## 5. How plugin integration works

The current Lynx module family already covers services, config, storage, messaging, governance, observability, and distributed capabilities. The common integration path is:

1. add the plugin module dependency
2. configure the real prefix used by that plugin
3. anonymous-import the module if it self-registers through `init()`
4. let `boot.NewApplication(wireApp).Run()` assemble the unified runtime
5. obtain the capability through a Getter or the plugin manager

For example, a realistic starter path looks like:

```bash
go get github.com/go-lynx/lynx-http
go get github.com/go-lynx/lynx-redis
```

```yaml
lynx:
  http:
    addr: 0.0.0.0:8000
  redis:
    addrs:
      - 127.0.0.1:6379
```

```go
import (
    _ "github.com/go-lynx/lynx-http"
    _ "github.com/go-lynx/lynx-redis"
)
```

That is the actual runtime path. Config alone is not enough, and import alone is not enough.

## 5.1 What the official template really configures

The most useful correction to keep in mind is this: plugin pages describe one capability at a time, but `lynx-layout` shows the combination that a real service actually boots with.

In `lynx-layout/configs/bootstrap.local.yaml`, the template currently wires:

```yaml
lynx:
  http:
    network: tcp
    addr: 127.0.0.1:8000
    timeout: 5s

  grpc:
    service:
      network: tcp
      addr: 127.0.0.1:9000
      timeout: 5s

  mysql:
    driver: mysql
    source: "lynx:lynx123456@tcp(127.0.0.1:3306)/lynx_test?charset=utf8mb4&parseTime=True&loc=Local"

  redis:
    addrs:
      - 127.0.0.1:6379
```

That means the template is currently teaching these concrete facts:

- HTTP uses `lynx.http`
- gRPC server uses `lynx.grpc.service`, not a flat `lynx.grpc`
- MySQL uses `lynx.mysql`
- Redis uses `lynx.redis`
- local template startup does not begin with every governance plugin enabled

The companion `configs/bootstrap.yaml` is narrower: it mainly shows application metadata plus `lynx.polaris` for governance-oriented startup.

If a plugin page looks more abstract than the template, trust the template's concrete shape first and then use the plugin page to understand the rest of that capability.

You can summarize the template's current startup model like this:

- local bootstrap defaults: HTTP, gRPC server, MySQL, Redis
- governance bootstrap defaults: application metadata plus Polaris
- later opt-in additions: most MQ, config-center, docs, protection, lock, and TLS plugins
- special case: tracer is already imported, but not made explicit in default local config

That simple split is usually enough to explain why a plugin page may be accurate even when the template does not show that plugin yet.

## 5.2 What the template actually calls in code

`lynx-layout` also shows the public API shape that business code really consumes:

- HTTP server: `lynx-http.GetHttpServer()`
- gRPC server: `lynx-grpc.GetGrpcServer(nil)`
- Redis client: `lynx-redis.GetRedis()`
- MySQL provider: `lynx-mysql.GetProvider()`
- service registry: `lynx.GetServiceRegistry()`

This is the missing link between "plugin configuration" and "how your app code obtains the runtime-owned object".

Official modules currently include:

- Service and governance: HTTP, gRPC, Polaris, Nacos, Etcd, Apollo, Sentinel, Swagger, Tracer
- Data and storage: Redis, MongoDB, Elasticsearch, MySQL, PostgreSQL, SQL Server, SQL SDK
- Messaging and async: Kafka, RabbitMQ, RocketMQ, Pulsar
- Distributed capabilities: Seata, DTM, Redis Lock, Etcd Lock, Eon ID

Each plugin page explains its own configuration, getters, usage pattern, and caveats.

If you are choosing modules for the first time, the safest order is:

1. HTTP or gRPC
2. one datastore such as Redis or MongoDB
3. one observability or governance module such as Tracer or Polaris

That keeps startup troubleshooting manageable.

## 6. Recommended next steps

Once your first service is running, this reading order works well:

- [Bootstrap Configuration](/docs/getting-started/bootstrap-config): understand local vs remote config entry points
- [Plugin Management](/docs/getting-started/plugin-manager): understand ordering, dependencies, and assembly
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide): use one consistent flow for any plugin
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem): browse modules by capability area
- [Framework Architecture](/docs/intro/arch): understand the runtime model and startup chain

## Common mistakes

- **Trying to wire every plugin before the project runs**
  
  A better path is: get the scaffold running first, then add capabilities incrementally.

- **Reading Lynx as only an HTTP framework**
  
  It is better understood as a microservice infrastructure orchestration layer; HTTP and gRPC are just two plugins in that system.

- **Treating plugins as unrelated SDKs**
  
  The value of Lynx is that they share one runtime model instead of becoming isolated integrations.
