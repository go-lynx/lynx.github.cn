---
id: swagger
title: Swagger Plugin
---

# Swagger Plugin

The Swagger plugin provides OpenAPI documentation and Swagger UI for Lynx HTTP services. It fits development and testing workflows and should not be treated as a default production capability.

## What it is mainly for

- exposing an API documentation entry automatically
- giving developers an interactive interface for browsing and testing APIs
- keeping the documentation endpoint inside the same startup path as the HTTP service

## Basic configuration

```yaml
lynx:
  swagger:
    enabled: true
    path: "/swagger"
    base_path: "/"
    doc_path: "./api"
    allowed_envs:
      - development
      - testing
```

## Usage

1. import the plugin module: `import _ "github.com/go-lynx/lynx-swagger"`
2. maintain annotations or OpenAPI descriptions at the API layer
3. visit `http://localhost:<port>/swagger` in an allowed environment

## Practical guidance

- do not enable Swagger UI by default in production
- documentation is not a substitute for real authentication and access control
- if the API changes frequently, annotations and spec descriptions must evolve with the code or the page becomes misleading quickly

## Related pages

- Repo: [go-lynx/lynx-swagger](https://github.com/go-lynx/lynx-swagger)
- [HTTP](/docs/existing-plugin/http)
