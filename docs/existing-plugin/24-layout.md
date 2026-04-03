---
id: layout
title: Lynx Project Template (Layout)
---

# Lynx Project Template (Layout)

`lynx-layout` is the official Lynx service template repository. It is not an independently configurable runtime plugin, and this page intentionally documents repository boundaries and real entry points instead of inventing a fake `layout` runtime schema.

## Repository Boundary

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-layout` |
| Nature | service template / scaffold repository |
| Own config prefix | none |
| Own runtime plugin name | none |
| Own plugin getter | none |
| What it actually provides | a runnable project skeleton that wires real Lynx plugins together |

## Relationship To Lynx Runtime

`lynx-layout` does not replace Lynx runtime plugins. It demonstrates how a real service composes them.

| Template file or path | Real runtime dependency it shows | Why it matters |
| --- | --- | --- |
| `cmd/user/wire_gen.go` | `lynx.GetServiceRegistry()` and generated app assembly | Shows that service registration comes from real Lynx runtime services, not from a `layout` plugin. |
| `internal/server/http.go` | `lynx-http.GetHttpServer()` | Confirms HTTP capability comes from `lynx-http`. |
| `internal/server/grpc.go` | `lynx-grpc.GetGrpcServer(nil)` | Confirms gRPC capability comes from `lynx-grpc`. |
| `internal/data/data.go` | `lynx-mysql.GetProvider()` | Confirms DB access comes from the MySQL plugin family. |
| `internal/data/data.go` | `lynx-redis.GetRedis()` | Confirms Redis access comes from the Redis plugin family. |
| `deployments/docker-compose.local.yml` plus `start.sh` | local dependency boot path | Shows how the template expects local runtime dependencies to be started around the service. |

The practical implication is simple: if you need HTTP, gRPC, MySQL, Redis, Polaris, Kafka, or any other runtime capability, configure the real plugin or runtime module directly. `lynx-layout` is only the place where those pieces are assembled into a service skeleton.

## Existing Configuration Entry Points

The repository already ships concrete configuration entry points. They belong to the scaffold and should be read as examples of how to compose real runtime modules.

| Entry point | Purpose | What it already configures | What not to assume |
| --- | --- | --- | --- |
| `configs/bootstrap.local.yaml` | local runnable bootstrap | `lynx.application`, `lynx.log`, `lynx.http`, `lynx.grpc.service`, `lynx.mysql`, `lynx.redis` | It is not a generic plugin catalog and it does not imply every plugin is enabled by default. |
| `configs/bootstrap.yaml` | governance-oriented bootstrap | `lynx.application` plus `lynx.polaris` settings such as `config_path`, `namespace`, `token`, `weight`, `ttl`, `timeout` | It is a template entry for Polaris-backed environments, not a separate `layout` runtime config namespace. |
| `README` optional auth example | optional external login-token issue path | `lynx.layout.auth.grpc.service`, `lynx.layout.auth.grpc.method`, `lynx.layout.auth.grpc.timeout` and matching env vars | This is an application-specific optional extension, not a general-purpose runtime plugin named `layout`. |

## Practical Reading Rules

- Read `lynx-layout` as a template repository boundary, not as a plugin boundary.
- Read `configs/bootstrap.local.yaml` and `configs/bootstrap.yaml` as example service bootstraps that compose real Lynx modules.
- Add or remove real plugins by editing the service bootstrap and code wiring, not by searching for a nonexistent `layout` runtime plugin schema.

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

The template already includes a local bootstrap path and dependency compose file:

```bash
docker compose -f deployments/docker-compose.local.yml up -d
go run ./cmd/user -conf ./configs/bootstrap.local.yaml
```

## Related Pages

- [Quick Start](/docs/getting-started/quick-start)
- [Plugin Usage Guide](/docs/getting-started/plugin-usage-guide)
- [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
