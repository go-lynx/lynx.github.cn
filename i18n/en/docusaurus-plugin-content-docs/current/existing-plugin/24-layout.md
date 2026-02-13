---
id: layout
title: Lynx Project Template (Layout)
slug: existing-plugin/layout
---

# Lynx Project Template (Layout)

Lynx-Layout is the **official Go-Lynx microservice project template**, providing a standard directory layout, Polaris integration, and a local development mode without Polaris for quick project setup.

## Features

- **Standard layout** — api / biz / bo / code / conf / data / service / server layers
- **Polaris integration** — Service discovery, rate limiting, circuit breaking (optional)
- **Out of the box** — HTTP, gRPC, MySQL/PostgreSQL, Redis, Tracer, Token, etc., pluggable
- **CLI scaffold** — Generate a runnable project with `lynx new`

## Project structure

```
📦 Microservice template
 ┣ 📂 api     — Protobuf and generated Go code
 ┣ 📂 biz     — Business logic and flow
 ┣ 📂 bo      — Data objects between biz and data
 ┣ 📂 code    — Application and error codes
 ┣ 📂 conf    — Config files and mapping
 ┣ 📂 data    — Data access (DB, remote calls)
 ┣ 📂 service — Service declarations, validation, conversion
 ┗ 📂 server  — HTTP/gRPC configuration and registration
```

## How to use

### 1. Install Lynx CLI

```bash
go install github.com/go-lynx/lynx/cmd/lynx@latest
```

### 2. Create project from template

```bash
# Single service
lynx new demo1

# Multiple services
lynx new demo1 demo2 demo3
```

### 3. Run the app

```go
func main() {
    boot.LynxApplication(wireApp).Run()
}
```

By default this loads HTTP, gRPC (with TLS), MySQL/PostgreSQL, Redis, Tracer, Token, etc.; add or remove plugins in config and wire as needed.

## Local development (without Polaris)

To run and debug locally without Polaris:

1. **Go version** — Use Go 1.25.3 (or the version required by the project):
   ```bash
   go env -w GOTOOLCHAIN=go1.25.3
   ```

2. **Start local dependencies (e.g. PostgreSQL, Redis)**:
   ```bash
   docker compose -f deployments/docker-compose.local.yml up -d
   ```
   This typically provides `postgres://lynx:lynx@127.0.0.1:5432/lynx` and `redis://127.0.0.1:6379`.

3. **Run with local config** (no Polaris):
   ```bash
   go run ./cmd/user -conf ./configs/bootstrap.local.yaml
   ```
   Adjust `configs/bootstrap.local.yaml` for your DB and Redis if needed.

4. **Stop dependencies**:
   ```bash
   docker compose -f deployments/docker-compose.local.yml down
   ```

Use `configs/bootstrap.yaml` (or your main config) when you need Polaris or production settings.

## See also

- Repo: [go-lynx/lynx-layout](https://github.com/go-lynx/lynx-layout)
- [Quick Start](/docs/getting-started/quick-start) | [Plugin Ecosystem](/docs/existing-plugin/plugin-ecosystem)
