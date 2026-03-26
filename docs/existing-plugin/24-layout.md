---
id: layout
title: Lynx Project Template (Layout)
---

# Lynx Project Template (Layout)

`lynx-layout` is the official starter repository recommended for Lynx services. Its value is not just that it generates folders. It gives you a default engineering path already aligned with the Lynx runtime: **scaffolding, layering, config entry, Wire assembly, and plugin startup conventions** are all wired in the expected way.

If you want the fastest route to a service that already looks and behaves like a Lynx application, `lynx-layout` is the right starting point.

## What it provides

- a standard layered project structure so protocol, business, data, and server responsibilities stay separated
- a startup entry aligned with the current Lynx model, using `boot.NewApplication(wireApp).Run()`
- ready integration points for common microservice capabilities such as HTTP, gRPC, database access, cache, governance, and observability
- a local-development path and a production-facing config path that can evolve without changing the whole application shape

## How to read the structure

The important part of the repository structure is not the folder names themselves, but the responsibility split:

```text
api      protocol definitions and generated code
biz      business flow and domain logic
bo       data objects shared between biz and data
code     status codes and error codes
conf     configuration structs and mapping
data     data access and external dependency integration
service  service-layer validation and response assembly
server   HTTP, gRPC, and other server registration
```

This structure does not compete with Lynx's plugin runtime. Plugins handle infrastructure capabilities; your application directories hold the domain code.

## How to create a new project

Install the Lynx CLI first:

```bash
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

Then generate a project from the template:

```bash
# create one service
lynx new demo

# create several services at once
lynx new user-service order-service gateway
```

The generated project already contains the base layout and startup wiring, so you can move directly into business code and plugin configuration.

## Current recommended startup entry

The template follows the startup entry recommended by current Lynx:

```go
func main() {
    if err := boot.NewApplication(wireApp).Run(); err != nil {
        panic(err)
    }
}
```

Here `wireApp` assembles the Kratos app, while Lynx handles runtime ownership, plugin lifecycle, and configuration-driven infrastructure initialization.

That means the template does not hide startup from you. It narrows startup into one stable and explicit path.

## How to run locally

If you only want to develop locally and do not want to introduce governance dependencies such as Polaris first, you can use the local config path:

1. prepare the required Go version and local dependencies
2. start the PostgreSQL, Redis, and other services shipped with the template
3. run the service with the local bootstrap config

Example:

```bash
docker compose -f deployments/docker-compose.local.yml up -d
go run ./cmd/user -conf ./configs/bootstrap.local.yaml
```

The local config usually skips governance integration and keeps only what is necessary to start the service, such as database access, cache, and listen addresses. When you need Polaris, a config center, or production parameters, switch to the main bootstrap path.

## When to use it

- when you are creating a new Lynx service and do not want to hand-assemble the whole project skeleton
- when your team wants consistent structure, Wire assembly, and config entry across services
- when you want to validate a plugin combination quickly instead of first building an application shell from scratch

If you already have a mature project structure, you can still borrow the startup and configuration patterns without copying every folder literally.

## See also

- Repo: [go-lynx/lynx-layout](https://github.com/go-lynx/lynx-layout)
- [Quick Start](/docs/getting-started/quick-start)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
