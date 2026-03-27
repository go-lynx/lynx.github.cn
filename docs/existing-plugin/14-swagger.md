---
id: swagger
title: Swagger Plugin
---

# Swagger Plugin

`lynx-swagger` is the documentation and Swagger UI plugin for Lynx HTTP services. The current implementation is more than a static `/swagger` page: it can scan Go annotations, merge external spec files, derive the API server address from `lynx.http`, persist merged output, and serve a standalone UI.

## Runtime facts

| Item | Value |
| --- | --- |
| Go module | `github.com/go-lynx/lynx-swagger` |
| Config prefix | `lynx.swagger` |
| Runtime plugin name | `swagger` |
| Main getter | `GetSwagger()` |

## What the implementation actually provides

- loads plugin configuration from `lynx.swagger`
- supports a generator section for annotation scanning, spec-file merging, file watching, and output persistence
- supports a UI section for exposing Swagger UI on a configurable port and path
- supports an `api_server` section so Swagger UI "Try it out" requests point to the real HTTP server
- if `api_server.host` is empty, the plugin tries to derive it from `lynx.http.addr`

## Configuration

```yaml
lynx:
  swagger:
    enabled: true
    generator:
      enabled: true
      scan_dirs:
        - "./"
      output_path: "./docs/openapi.yaml"
      watch_enabled: true
    ui:
      enabled: true
      port: 8080
      path: "/swagger"
      title: "API Documentation"
    api_server:
      host: "localhost:8080"
      base_path: "/api/v1"
    info:
      title: "User Service API"
      version: "1.0.0"
      description: "HTTP API documentation"
```

## Usage

```go
import swagger "github.com/go-lynx/lynx-swagger"
```

The plugin exposes the generated Swagger object through `GetSwagger()`:

```go
plugin := swagger.GetSwagger()
spec := plugin.GetSwagger()
_ = spec
```

After startup, visit the configured UI path such as `http://localhost:8080/swagger`.

## Practical guidance

- keep this enabled for development, testing, or explicitly controlled internal environments
- if you rely on external OpenAPI files, keep `generator.output_path` aligned so the merged artifact stays current
- do not assume Swagger UI is a security boundary; it is only a documentation surface

## Related pages

- Repo: [go-lynx/lynx-swagger](https://github.com/go-lynx/lynx-swagger)
- [HTTP](/docs/existing-plugin/http)
