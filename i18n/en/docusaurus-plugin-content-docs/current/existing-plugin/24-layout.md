---
id: layout
title: Lynx Project Template (Layout)
---

# Lynx Project Template (Layout)

`lynx-layout` is the official service template repository aligned with the current Lynx runtime and plugin model.

## What It Really Shows

`lynx-layout` is not itself a runtime plugin. It is an example application skeleton that demonstrates how current Lynx services are assembled.

## Code-Backed Facts

From the repository:

- startup entry uses `boot.NewApplication(wireApp).Run()`
- HTTP server wiring uses `github.com/go-lynx/lynx-http` and `GetHttpServer()`
- gRPC server wiring uses `github.com/go-lynx/lynx-grpc` and `GetGrpcServer(nil)`
- data wiring already depends on concrete plugins such as MySQL and Redis rather than abstract placeholder packages

That makes `lynx-layout` the most direct reference for how the current plugin family is meant to be consumed in a real service.

## Structure

```text
api      protocol definitions and generated code
biz      business flow and domain logic
bo       shared business objects
conf     configuration structs and mapping
data     repository and external dependency integration
service  service-layer logic
server   HTTP and gRPC registration
cmd      application entry and Wire assembly
```

## How To Use It

Install the Lynx CLI:

```bash
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

Generate a project:

```bash
lynx new demo
```

## Local Run Path

`lynx-layout` already includes a local bootstrap path and dependency compose file:

```bash
docker compose -f deployments/docker-compose.local.yml up -d
go run ./cmd/user -conf ./configs/bootstrap.local.yaml
```

The local config path is useful when you want to start from DB, Redis, HTTP, and gRPC first without introducing full governance dependencies immediately.

## Related Pages

- [Quick Start](/docs/getting-started/quick-start)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
