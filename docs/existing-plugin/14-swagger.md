---
id: swagger
title: Swagger Plugin
slug: existing-plugin/swagger
---

# Swagger Plugin

The Swagger plugin provides **Swagger/OpenAPI** documentation and **Swagger UI** for Lynx HTTP services. It is intended for **development and testing only** and disables itself in production.

## Features

- **Auto-generated API docs** from Go annotations.
- **Swagger UI** for exploring and testing APIs.
- **File watching** for live doc updates.
- **Security**: Disabled in production; path traversal and XSS protections; secure headers and CORS.

## Configuration

Example under `lynx.swagger`:

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

1. Import the plugin: `import _ "github.com/go-lynx/lynx/plugins/swagger"`.
2. Add annotations to your HTTP API (e.g. comments or OpenAPI spec).
3. Run in development; open `http://localhost:<port>/swagger` for Swagger UI.

**Important**: Do not enable this plugin in production. It restricts allowed environments (e.g. `ENV`, `GO_ENV`, `APP_ENV`) and will not serve the UI when the app is in production mode.

## Installation

```bash
go get github.com/go-lynx/lynx/plugins/swagger
```

For annotation format and advanced options, see the plugin’s README on GitHub.
