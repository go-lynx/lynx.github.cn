---
id: quick-start
title: Quick Start
---

# Quick Start

The goal of this page is not to list every feature. It is to help you get a **running, extensible** Go-Lynx service using the current workflow.

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

## 4. Understand the generated project

The official template follows a Kratos-style layered structure, adapted for Go-Lynx. The most important parts to understand first are:

- `cmd/`: application entry point
- `configs/`: local bootstrap configuration
- `internal/server/`: HTTP / gRPC service exposure and registration
- `internal/service/`: interface layer
- `internal/biz/`: business orchestration
- `internal/data/`: storage and external integrations

The important idea is not the folder names by themselves. The important idea is that **Lynx owns runtime assembly, while your business code plugs into the agreed layers.**

## 5. How plugin integration works

The current Go-Lynx module family already covers services, config, storage, messaging, governance, observability, and distributed capabilities. The common integration path is:

1. add the plugin module dependency
2. configure `lynx.<plugin>` in bootstrap/config
3. import or consume the module as required by that plugin
4. let the unified runtime initialize and wire it

Official modules currently include:

- Service and governance: HTTP, gRPC, Polaris, Nacos, Etcd, Apollo, Sentinel, Swagger, Tracer
- Data and storage: Redis, MongoDB, Elasticsearch, MySQL, PostgreSQL, SQL Server, SQL SDK
- Messaging and async: Kafka, RabbitMQ, RocketMQ, Pulsar
- Distributed capabilities: Seata, DTM, Redis Lock, Etcd Lock, Eon ID

Each plugin page explains its own configuration, getters, usage pattern, and caveats.

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
